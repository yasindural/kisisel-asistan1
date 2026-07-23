"""ARIA — AI Executive Assistant Backend (FastAPI + MongoDB + emergentintegrations)"""
import asyncio
import hashlib
import hmac
import json
import logging
import os
import re
import secrets
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import List, Optional

import httpx
import jwt
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'dev-secret-change-me')
JWT_ALG = 'HS256'
SESSION_DAYS = 7

AI_PROVIDER = os.environ.get('AI_PROVIDER', 'openai')
AI_MODEL = os.environ.get('AI_MODEL', 'gpt-5.4')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
EMERGENT_SESSION_DATA_URL = 'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data'

from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

app = FastAPI(title='ARIA API')
api_router = APIRouter(prefix='/api')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('aria')


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def now_iso() -> str:
    return now_utc().isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 260000)
    return f'pbkdf2_sha256$260000${salt}${dk.hex()}'


def verify_password(password: str, stored: str) -> bool:
    try:
        _, iterations, salt, hexhash = stored.split('$')
        dk = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), int(iterations))
        return hmac.compare_digest(dk.hex(), hexhash)
    except Exception:
        return False


def create_jwt(user_id: str, role: str, sid: str) -> str:
    payload = {
        'sub': user_id,
        'role': role,
        'sid': sid,
        'exp': now_utc() + timedelta(days=SESSION_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def ensure_aware(dt) -> Optional[datetime]:
    if dt is None:
        return None
    if isinstance(dt, str):
        try:
            dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
        except ValueError:
            return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


async def create_session(user_id: str, session_token: Optional[str] = None) -> dict:
    sid = new_id()
    doc = {
        'sid': sid,
        'user_id': user_id,
        'session_token': session_token or f'st_{secrets.token_urlsafe(32)}',
        'revoked': False,
        'created_at': now_iso(),
        'expires_at': (now_utc() + timedelta(days=SESSION_DAYS)).isoformat(),
    }
    await db.auth_sessions.insert_one(dict(doc))
    return doc


def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key='session_token', value=token, httponly=True, secure=True,
        samesite='none', path='/', max_age=SESSION_DAYS * 24 * 3600,
    )


async def _load_user(user_id: str) -> Optional[dict]:
    return await db.users.find_one({'user_id': user_id}, {'_id': 0, 'password_hash': 0})


async def get_current_user(request: Request) -> dict:
    token = None
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header[7:].strip()
    if not token:
        token = request.cookies.get('session_token') or request.cookies.get('access_token')
    if not token:
        raise HTTPException(status_code=401, detail='Oturum bulunamadı')

    # 1) Try JWT
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        session = await db.auth_sessions.find_one({'sid': payload.get('sid')}, {'_id': 0})
        if not session or session.get('revoked'):
            raise HTTPException(status_code=401, detail='Oturum geçersiz')
        exp = ensure_aware(session.get('expires_at'))
        if exp and exp < now_utc():
            raise HTTPException(status_code=401, detail='Oturum süresi doldu')
        user = await _load_user(payload['sub'])
        if not user:
            raise HTTPException(status_code=401, detail='Kullanıcı bulunamadı')
        return user
    except jwt.InvalidTokenError:
        pass

    # 2) Raw session_token (Emergent Google auth / test sessions)
    session = await db.auth_sessions.find_one({'session_token': token, 'revoked': {'$ne': True}}, {'_id': 0})
    if not session:
        raise HTTPException(status_code=401, detail='Oturum geçersiz')
    exp = ensure_aware(session.get('expires_at'))
    if exp and exp < now_utc():
        raise HTTPException(status_code=401, detail='Oturum süresi doldu')
    user = await _load_user(session['user_id'])
    if not user:
        raise HTTPException(status_code=401, detail='Kullanıcı bulunamadı')
    return user


# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------

class RegisterInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1)


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class GoogleSessionInput(BaseModel):
    session_id: str


class OnboardingInput(BaseModel):
    model_config = ConfigDict(extra='ignore')
    profile: Optional[dict] = None
    ai_preferences: Optional[dict] = None
    integration_interests: Optional[List[str]] = None
    initial_memory: Optional[str] = None
    step: Optional[int] = None
    complete: Optional[bool] = None


class TaskCreate(BaseModel):
    title: str = Field(min_length=1)
    description: str = ''
    priority: str = 'medium'
    status: str = 'todo'
    due_at: Optional[str] = None
    tags: List[str] = []
    progress: int = 0
    parent_id: Optional[str] = None


class TaskPatch(BaseModel):
    model_config = ConfigDict(extra='ignore')
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_at: Optional[str] = None
    tags: Optional[List[str]] = None
    progress: Optional[int] = None


class EventCreate(BaseModel):
    title: str = Field(min_length=1)
    start_at: str
    end_at: Optional[str] = None
    location: str = ''
    description: str = ''


class EventPatch(BaseModel):
    model_config = ConfigDict(extra='ignore')
    title: Optional[str] = None
    start_at: Optional[str] = None
    end_at: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None


class ContactCreate(BaseModel):
    name: str = Field(min_length=1)
    email: str = ''
    phone: str = ''
    company: str = ''
    notes: str = ''


class InteractionCreate(BaseModel):
    type: str = 'note'  # note | call | email | meeting | message
    content: str = Field(min_length=1)


class MemoryCreate(BaseModel):
    content: str = Field(min_length=1)
    category: str = 'genel'
    importance: int = 3


class MemoryPatch(BaseModel):
    model_config = ConfigDict(extra='ignore')
    content: Optional[str] = None
    category: Optional[str] = None
    importance: Optional[int] = None
    approved: Optional[bool] = None


class ChatStreamInput(BaseModel):
    message: str = Field(min_length=1)
    thread_id: Optional[str] = None


# ---------------------------------------------------------------------------
# Auth Endpoints
# ---------------------------------------------------------------------------

@api_router.post('/auth/register')
async def register(input: RegisterInput, response: Response):
    email = input.email.lower().strip()
    existing = await db.users.find_one({'email': email}, {'_id': 0})
    if existing:
        raise HTTPException(status_code=409, detail='Bu e-posta zaten kayıtlı')
    user_id = f'user_{uuid.uuid4().hex[:12]}'
    parts = input.name.strip().split(' ', 1)
    user_doc = {
        'user_id': user_id,
        'email': email,
        'name': input.name.strip(),
        'first_name': parts[0],
        'last_name': parts[1] if len(parts) > 1 else '',
        'picture': '',
        'role': 'user',
        'auth_provider': 'password',
        'password_hash': hash_password(input.password),
        'onboarding_complete': False,
        'created_at': now_iso(),
    }
    await db.users.insert_one(dict(user_doc))
    session = await create_session(user_id)
    token = create_jwt(user_id, 'user', session['sid'])
    set_auth_cookie(response, token)
    user = await _load_user(user_id)
    return {'access_token': token, 'user': user}


@api_router.post('/auth/login')
async def login(input: LoginInput, response: Response):
    email = input.email.lower().strip()
    user_doc = await db.users.find_one({'email': email}, {'_id': 0})
    if not user_doc or not user_doc.get('password_hash'):
        raise HTTPException(status_code=401, detail='E-posta veya şifre hatalı')
    if not verify_password(input.password, user_doc['password_hash']):
        raise HTTPException(status_code=401, detail='E-posta veya şifre hatalı')
    session = await create_session(user_doc['user_id'])
    token = create_jwt(user_doc['user_id'], user_doc.get('role', 'user'), session['sid'])
    set_auth_cookie(response, token)
    user = await _load_user(user_doc['user_id'])
    return {'access_token': token, 'user': user}


@api_router.post('/auth/google/session')
async def google_session(input: GoogleSessionInput, response: Response):
    # Exchange Emergent Auth session_id for user data (backend-only call)
    async with httpx.AsyncClient(timeout=15) as http:
        resp = await http.get(EMERGENT_SESSION_DATA_URL, headers={'X-Session-ID': input.session_id})
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail='Google oturumu doğrulanamadı')
    data = resp.json()
    email = data['email'].lower().strip()
    user_doc = await db.users.find_one({'email': email}, {'_id': 0})
    if user_doc:
        user_id = user_doc['user_id']
        await db.users.update_one({'user_id': user_id}, {'$set': {
            'name': data.get('name') or user_doc.get('name', ''),
            'picture': data.get('picture') or user_doc.get('picture', ''),
        }})
    else:
        user_id = f'user_{uuid.uuid4().hex[:12]}'
        name = data.get('name', '') or email.split('@')[0]
        parts = name.strip().split(' ', 1)
        await db.users.insert_one({
            'user_id': user_id,
            'email': email,
            'name': name,
            'first_name': parts[0],
            'last_name': parts[1] if len(parts) > 1 else '',
            'picture': data.get('picture', ''),
            'role': 'user',
            'auth_provider': 'google',
            'onboarding_complete': False,
            'created_at': now_iso(),
        })
    session = await create_session(user_id, session_token=data.get('session_token'))
    token = create_jwt(user_id, 'user', session['sid'])
    set_auth_cookie(response, token)
    user = await _load_user(user_id)
    return {'access_token': token, 'user': user}


@api_router.get('/auth/me')
async def auth_me(user: dict = Depends(get_current_user)):
    return user


@api_router.post('/auth/logout')
async def logout(request: Request, response: Response, user: dict = Depends(get_current_user)):
    token = None
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header[7:].strip()
    if not token:
        token = request.cookies.get('session_token')
    if token:
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
            await db.auth_sessions.update_one({'sid': payload.get('sid')}, {'$set': {'revoked': True}})
        except jwt.InvalidTokenError:
            await db.auth_sessions.update_one({'session_token': token}, {'$set': {'revoked': True}})
    response.delete_cookie('session_token', path='/')
    return {'ok': True}


# ---------------------------------------------------------------------------
# Onboarding
# ---------------------------------------------------------------------------

@api_router.get('/onboarding')
async def get_onboarding(user: dict = Depends(get_current_user)):
    doc = await db.onboarding.find_one({'user_id': user['user_id']}, {'_id': 0})
    if not doc:
        doc = {
            'user_id': user['user_id'], 'step': 1,
            'profile': {}, 'ai_preferences': {}, 'integration_interests': [],
            'initial_memory': '', 'complete': False,
        }
    doc['onboarding_complete'] = user.get('onboarding_complete', False)
    return doc


@api_router.put('/onboarding')
async def put_onboarding(input: OnboardingInput, user: dict = Depends(get_current_user)):
    update = {'user_id': user['user_id'], 'updated_at': now_iso()}
    if input.profile is not None:
        update['profile'] = input.profile
    if input.ai_preferences is not None:
        update['ai_preferences'] = input.ai_preferences
    if input.integration_interests is not None:
        update['integration_interests'] = input.integration_interests
    if input.initial_memory is not None:
        update['initial_memory'] = input.initial_memory
    if input.step is not None:
        update['step'] = input.step
    if input.complete is not None:
        update['complete'] = input.complete
    await db.onboarding.update_one({'user_id': user['user_id']}, {'$set': update}, upsert=True)

    if input.complete:
        set_fields = {'onboarding_complete': True}
        if input.profile:
            p = input.profile
            if p.get('first_name'):
                set_fields['first_name'] = p['first_name']
                set_fields['name'] = f"{p.get('first_name','')} {p.get('last_name','')}".strip()
            if p.get('last_name'):
                set_fields['last_name'] = p['last_name']
        await db.users.update_one({'user_id': user['user_id']}, {'$set': set_fields})
        # Initial memory -> AI memory record
        if input.initial_memory and input.initial_memory.strip():
            await db.memories.insert_one({
                'memory_id': new_id(),
                'user_id': user['user_id'],
                'content': input.initial_memory.strip(),
                'category': 'hedefler',
                'importance': 4,
                'approved': True,
                'source': 'onboarding',
                'created_at': now_iso(),
            })
    doc = await db.onboarding.find_one({'user_id': user['user_id']}, {'_id': 0})
    return doc


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

@api_router.get('/dashboard')
async def get_dashboard(user: dict = Depends(get_current_user)):
    uid = user['user_id']
    open_count = await db.tasks.count_documents({'user_id': uid, 'status': {'$ne': 'done'}})
    done_count = await db.tasks.count_documents({'user_id': uid, 'status': 'done'})
    event_count = await db.events.count_documents({'user_id': uid})
    contact_count = await db.contacts.count_documents({'user_id': uid})

    today = now_utc().date()
    tasks = await db.tasks.find({'user_id': uid, 'status': {'$ne': 'done'}}, {'_id': 0}).sort('created_at', -1).to_list(200)

    def is_today_or_priority(t):
        due = ensure_aware(t.get('due_at'))
        if due and due.date() <= today:
            return True
        return t.get('priority') in ('high', 'urgent')

    today_tasks = [t for t in tasks if is_today_or_priority(t)][:6]
    if not today_tasks:
        today_tasks = tasks[:4]

    upcoming = await db.events.find({'user_id': uid}, {'_id': 0}).to_list(500)
    upcoming = [e for e in upcoming if (ensure_aware(e.get('start_at')) or now_utc()) >= now_utc() - timedelta(hours=1)]
    upcoming.sort(key=lambda e: e.get('start_at') or '')
    upcoming = upcoming[:5]

    week_start = now_utc() - timedelta(days=now_utc().weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    week_tasks = await db.tasks.find({'user_id': uid, 'created_at': {'$gte': week_start.isoformat()}}, {'_id': 0}).to_list(500)
    week_done = len([t for t in week_tasks if t.get('status') == 'done'])
    weekly_progress = round(week_done / len(week_tasks) * 100) if week_tasks else 0

    # Heuristic ARIA suggestion (fast, no LLM call)
    first_name = user.get('first_name') or user.get('name', '').split(' ')[0] or 'Merhaba'
    urgent = [t for t in tasks if t.get('priority') == 'urgent']
    overdue = [t for t in tasks if (d := ensure_aware(t.get('due_at'))) and d < now_utc()]
    if overdue:
        suggestion = f"{first_name}, gecikmiş {len(overdue)} göreviniz var. İlk olarak '{overdue[0]['title']}' ile başlamanızı öneririm."
    elif urgent:
        suggestion = f"{first_name}, '{urgent[0]['title']}' acil öncelikli. Bugün buna odaklanmanızı öneririm."
    elif upcoming:
        suggestion = f"{first_name}, sıradaki etkinliğiniz: '{upcoming[0]['title']}'. Öncesinde hazırlık için 15 dakika ayırın."
    elif open_count > 0:
        suggestion = f"{first_name}, bugün {open_count} açık göreviniz var. Küçük olanlardan başlayarak momentum kazanabilirsiniz."
    else:
        suggestion = f"{first_name}, bugün gündem temiz görünüyor. ARIA'ya yeni bir hedef söyleyerek gününüzü planlayabilirsiniz."

    return {
        'open_tasks': open_count,
        'completed_tasks': done_count,
        'events': event_count,
        'contacts': contact_count,
        'today_tasks': today_tasks,
        'upcoming_events': upcoming,
        'weekly_progress': weekly_progress,
        'aria_suggestion': suggestion,
    }


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------

@api_router.get('/tasks')
async def list_tasks(status: Optional[str] = None, user: dict = Depends(get_current_user)):
    q = {'user_id': user['user_id']}
    if status:
        q['status'] = status
    tasks = await db.tasks.find(q, {'_id': 0}).sort('created_at', -1).to_list(1000)
    return tasks


@api_router.post('/tasks')
async def create_task(input: TaskCreate, user: dict = Depends(get_current_user)):
    doc = {
        'task_id': new_id(),
        'user_id': user['user_id'],
        'title': input.title.strip(),
        'description': input.description,
        'priority': input.priority if input.priority in ('low', 'medium', 'high', 'urgent') else 'medium',
        'status': input.status if input.status in ('todo', 'in_progress', 'done') else 'todo',
        'due_at': input.due_at,
        'tags': input.tags,
        'progress': max(0, min(100, input.progress)),
        'parent_id': input.parent_id,
        'created_at': now_iso(),
        'updated_at': now_iso(),
    }
    await db.tasks.insert_one(dict(doc))
    return doc


@api_router.patch('/tasks/{task_id}')
async def patch_task(task_id: str, input: TaskPatch, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in input.model_dump(exclude_unset=True).items()}
    if 'progress' in updates and updates['progress'] is not None:
        updates['progress'] = max(0, min(100, updates['progress']))
    if updates.get('status') == 'done':
        updates['progress'] = 100
    updates['updated_at'] = now_iso()
    result = await db.tasks.update_one({'task_id': task_id, 'user_id': user['user_id']}, {'$set': updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Görev bulunamadı')
    doc = await db.tasks.find_one({'task_id': task_id, 'user_id': user['user_id']}, {'_id': 0})
    return doc


@api_router.delete('/tasks/{task_id}')
async def delete_task(task_id: str, user: dict = Depends(get_current_user)):
    result = await db.tasks.delete_one({'task_id': task_id, 'user_id': user['user_id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Görev bulunamadı')
    return {'ok': True}


# ---------------------------------------------------------------------------
# Calendar Events
# ---------------------------------------------------------------------------

@api_router.get('/events')
async def list_events(user: dict = Depends(get_current_user)):
    events = await db.events.find({'user_id': user['user_id']}, {'_id': 0}).sort('start_at', 1).to_list(1000)
    return events


@api_router.post('/events')
async def create_event(input: EventCreate, user: dict = Depends(get_current_user)):
    doc = {
        'event_id': new_id(),
        'user_id': user['user_id'],
        'title': input.title.strip(),
        'start_at': input.start_at,
        'end_at': input.end_at,
        'location': input.location,
        'description': input.description,
        'created_at': now_iso(),
        'updated_at': now_iso(),
    }
    await db.events.insert_one(dict(doc))
    return doc


@api_router.patch('/events/{event_id}')
async def patch_event(event_id: str, input: EventPatch, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in input.model_dump(exclude_unset=True).items()}
    updates['updated_at'] = now_iso()
    result = await db.events.update_one({'event_id': event_id, 'user_id': user['user_id']}, {'$set': updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Etkinlik bulunamadı')
    doc = await db.events.find_one({'event_id': event_id, 'user_id': user['user_id']}, {'_id': 0})
    return doc


@api_router.delete('/events/{event_id}')
async def delete_event(event_id: str, user: dict = Depends(get_current_user)):
    result = await db.events.delete_one({'event_id': event_id, 'user_id': user['user_id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Etkinlik bulunamadı')
    return {'ok': True}


# ---------------------------------------------------------------------------
# CRM
# ---------------------------------------------------------------------------

@api_router.get('/contacts')
async def list_contacts(user: dict = Depends(get_current_user)):
    contacts = await db.contacts.find({'user_id': user['user_id']}, {'_id': 0}).sort('created_at', -1).to_list(1000)
    return contacts


@api_router.post('/contacts')
async def create_contact(input: ContactCreate, user: dict = Depends(get_current_user)):
    doc = {
        'contact_id': new_id(),
        'user_id': user['user_id'],
        'name': input.name.strip(),
        'email': input.email,
        'phone': input.phone,
        'company': input.company,
        'notes': input.notes,
        'last_contact': None,
        'ai_summary': '',
        'created_at': now_iso(),
        'updated_at': now_iso(),
    }
    await db.contacts.insert_one(dict(doc))
    return doc


@api_router.delete('/contacts/{contact_id}')
async def delete_contact(contact_id: str, user: dict = Depends(get_current_user)):
    result = await db.contacts.delete_one({'contact_id': contact_id, 'user_id': user['user_id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Kişi bulunamadı')
    await db.interactions.delete_many({'contact_id': contact_id, 'user_id': user['user_id']})
    return {'ok': True}


@api_router.post('/contacts/{contact_id}/interactions')
async def create_interaction(contact_id: str, input: InteractionCreate, user: dict = Depends(get_current_user)):
    contact = await db.contacts.find_one({'contact_id': contact_id, 'user_id': user['user_id']}, {'_id': 0})
    if not contact:
        raise HTTPException(status_code=404, detail='Kişi bulunamadı')
    itype = input.type if input.type in ('note', 'call', 'email', 'meeting', 'message') else 'note'
    doc = {
        'interaction_id': new_id(),
        'contact_id': contact_id,
        'user_id': user['user_id'],
        'type': itype,
        'content': input.content.strip(),
        'created_at': now_iso(),
    }
    await db.interactions.insert_one(dict(doc))
    await db.contacts.update_one(
        {'contact_id': contact_id, 'user_id': user['user_id']},
        {'$set': {'last_contact': now_iso(), 'updated_at': now_iso()}},
    )
    return doc


@api_router.get('/contacts/{contact_id}/interactions')
async def list_interactions(contact_id: str, user: dict = Depends(get_current_user)):
    items = await db.interactions.find(
        {'contact_id': contact_id, 'user_id': user['user_id']}, {'_id': 0}
    ).sort('created_at', -1).to_list(500)
    return items


# ---------------------------------------------------------------------------
# AI Memory
# ---------------------------------------------------------------------------

@api_router.get('/memories')
async def list_memories(user: dict = Depends(get_current_user)):
    items = await db.memories.find({'user_id': user['user_id']}, {'_id': 0}).sort('created_at', -1).to_list(1000)
    return items


@api_router.post('/memories')
async def create_memory(input: MemoryCreate, user: dict = Depends(get_current_user)):
    doc = {
        'memory_id': new_id(),
        'user_id': user['user_id'],
        'content': input.content.strip(),
        'category': input.category,
        'importance': max(1, min(5, input.importance)),
        'approved': True,
        'source': 'manual',
        'created_at': now_iso(),
    }
    await db.memories.insert_one(dict(doc))
    return doc


@api_router.patch('/memories/{memory_id}')
async def patch_memory(memory_id: str, input: MemoryPatch, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in input.model_dump(exclude_unset=True).items()}
    if 'importance' in updates and updates['importance'] is not None:
        updates['importance'] = max(1, min(5, updates['importance']))
    result = await db.memories.update_one({'memory_id': memory_id, 'user_id': user['user_id']}, {'$set': updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Hafıza kaydı bulunamadı')
    doc = await db.memories.find_one({'memory_id': memory_id, 'user_id': user['user_id']}, {'_id': 0})
    return doc


@api_router.delete('/memories/{memory_id}')
async def delete_memory(memory_id: str, user: dict = Depends(get_current_user)):
    result = await db.memories.delete_one({'memory_id': memory_id, 'user_id': user['user_id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Hafıza kaydı bulunamadı')
    return {'ok': True}


# ---------------------------------------------------------------------------
# Global Search
# ---------------------------------------------------------------------------

@api_router.get('/search')
async def global_search(q: str = '', user: dict = Depends(get_current_user)):
    if not q or len(q.strip()) < 2:
        return {'tasks': [], 'contacts': [], 'events': [], 'memories': []}
    uid = user['user_id']
    rx = {'$regex': re.escape(q.strip()), '$options': 'i'}
    tasks = await db.tasks.find({'user_id': uid, '$or': [{'title': rx}, {'description': rx}]}, {'_id': 0}).to_list(10)
    contacts = await db.contacts.find({'user_id': uid, '$or': [{'name': rx}, {'company': rx}, {'email': rx}]}, {'_id': 0}).to_list(10)
    events = await db.events.find({'user_id': uid, '$or': [{'title': rx}, {'location': rx}]}, {'_id': 0}).to_list(10)
    memories = await db.memories.find({'user_id': uid, 'content': rx}, {'_id': 0}).to_list(10)
    return {'tasks': tasks, 'contacts': contacts, 'events': events, 'memories': memories}


# ---------------------------------------------------------------------------
# AI Chat
# ---------------------------------------------------------------------------

INTENT_SYSTEM = """Sen bir komut ayrıştırıcısın. Kullanıcının Türkçe mesajını analiz et ve bir görev (task) oluşturma niyeti varsa JSON döndür.
Bugünün tarihi: {today} (timezone: Europe/Istanbul).

SADECE geçerli JSON döndür, başka hiçbir şey yazma. Format:
{{"action": "task_create", "title": "...", "priority": "low|medium|high|urgent", "due_at": "ISO8601 veya null"}}
Görev niyeti yoksa: {{"action": "none"}}

Görev niyeti örnekleri: birini aramak, hatırlatma kurmak, bir şey göndermek, yapılacak iş belirtmek.
Soru sormak, sohbet etmek, özet istemek görev niyeti DEĞİLDİR.

Örnekler:
- "Yarın Burak'ı ara" -> {{"action":"task_create","title":"Burak'ı ara","priority":"medium","due_at":"<yarın 09:00 ISO>"}}
- "Saat 18:00'de beni uyar" -> {{"action":"task_create","title":"Hatırlatma","priority":"high","due_at":"<bugün 18:00 ISO>"}}
- "Bugünkü işlerimi özetle" -> {{"action":"none"}}"""


async def extract_intent(message: str) -> dict:
    try:
        today = now_utc().strftime('%Y-%m-%d %A')
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f'intent-{uuid.uuid4().hex[:8]}',
            system_message=INTENT_SYSTEM.format(today=today),
        ).with_model(AI_PROVIDER, AI_MODEL)
        resp = await chat.send_message(UserMessage(text=message))
        text = str(resp).strip()
        m = re.search(r'\{.*\}', text, re.DOTALL)
        if not m:
            return {'action': 'none'}
        return json.loads(m.group(0))
    except Exception as e:
        logger.warning(f'Intent extraction failed: {e}')
        return {'action': 'none'}


async def build_chat_context(user: dict, thread_id: str) -> str:
    uid = user['user_id']
    onboarding = await db.onboarding.find_one({'user_id': uid}, {'_id': 0}) or {}
    profile = onboarding.get('profile', {})
    prefs = onboarding.get('ai_preferences', {})
    memories = await db.memories.find({'user_id': uid, 'approved': True}, {'_id': 0}).sort('importance', -1).to_list(20)
    open_tasks = await db.tasks.find({'user_id': uid, 'status': {'$ne': 'done'}}, {'_id': 0}).sort('created_at', -1).to_list(15)
    history = await db.chat_messages.find({'thread_id': thread_id, 'user_id': uid}, {'_id': 0}).sort('created_at', -1).to_list(12)
    history.reverse()

    parts = [
        "Sen ARIA'sın — kullanıcının işini ve günlük hayatını yöneten premium bir yapay zeka yönetici asistanısın.",
        'Türkçe, kısa, net ve eylem odaklı konuş. Somut öneriler sun. Gereksiz uzatma.',
        f"Bugünün tarihi ve saati (UTC): {now_iso()}",
    ]
    if profile:
        p_str = ', '.join(f'{k}: {v}' for k, v in profile.items() if v)
        if p_str:
            parts.append(f'KULLANICI PROFİLİ: {p_str}')
    if prefs:
        pr_str = ', '.join(f'{k}: {v}' for k, v in prefs.items() if v)
        if pr_str:
            parts.append(f'KULLANICI TERCİHLERİ: {pr_str}')
    if memories:
        mem_str = '\n'.join(f'- [{m.get("category","genel")}] {m["content"]}' for m in memories)
        parts.append(f'KULLANICI HAFIZASI (onaylı):\n{mem_str}')
    if open_tasks:
        task_str = '\n'.join(
            f'- {t["title"]} (öncelik: {t.get("priority","medium")}, durum: {t.get("status","todo")}'
            + (f', bitiş: {t["due_at"]}' if t.get('due_at') else '') + ')'
            for t in open_tasks
        )
        parts.append(f'AÇIK GÖREVLER:\n{task_str}')
    if history:
        conv = '\n'.join(f'{"Kullanıcı" if m["role"] == "user" else "ARIA"}: {m["content"][:400]}' for m in history)
        parts.append(f'SON KONUŞMA GEÇMİŞİ:\n{conv}')
    return '\n\n'.join(parts)


def sse(data: dict) -> str:
    return f'data: {json.dumps(data, ensure_ascii=False)}\n\n'


@api_router.post('/chat/stream')
async def chat_stream(input: ChatStreamInput, user: dict = Depends(get_current_user)):
    uid = user['user_id']
    message = input.message.strip()

    # Thread handling
    thread_id = input.thread_id
    if thread_id:
        thread = await db.chat_threads.find_one({'thread_id': thread_id, 'user_id': uid}, {'_id': 0})
        if not thread:
            raise HTTPException(status_code=404, detail='Konuşma bulunamadı')
    else:
        thread_id = new_id()
        title = message[:60] + ('…' if len(message) > 60 else '')
        await db.chat_threads.insert_one({
            'thread_id': thread_id, 'user_id': uid, 'title': title,
            'created_at': now_iso(), 'updated_at': now_iso(),
        })

    user_msg_id = new_id()

    async def generator():
        try:
            # Build context BEFORE saving the new user message (history excludes it)
            context = await build_chat_context(user, thread_id)

            await db.chat_messages.insert_one({
                'message_id': user_msg_id, 'thread_id': thread_id, 'user_id': uid,
                'role': 'user', 'content': message, 'created_at': now_iso(),
            })
            yield sse({'type': 'meta', 'thread_id': thread_id, 'user_message_id': user_msg_id})

            # Intent extraction -> real action
            action_data = None
            intent = await extract_intent(message)
            if intent.get('action') == 'task_create' and intent.get('title'):
                task_doc = {
                    'task_id': new_id(), 'user_id': uid,
                    'title': str(intent['title'])[:200],
                    'description': 'ARIA sohbetinden oluşturuldu',
                    'priority': intent.get('priority') if intent.get('priority') in ('low', 'medium', 'high', 'urgent') else 'medium',
                    'status': 'todo',
                    'due_at': intent.get('due_at'),
                    'tags': ['aria'],
                    'progress': 0, 'parent_id': None,
                    'created_at': now_iso(), 'updated_at': now_iso(),
                }
                await db.tasks.insert_one(dict(task_doc))
                action_data = {
                    'kind': 'task_created',
                    'task_id': task_doc['task_id'],
                    'title': task_doc['title'],
                    'priority': task_doc['priority'],
                    'due_at': task_doc['due_at'],
                }
                yield sse({'type': 'action', 'action': action_data})
                context += (
                    f"\n\nAZ ÖNCE GERÇEKLEŞEN AKSİYON: Kullanıcının isteği üzerine '{task_doc['title']}' "
                    f"başlıklı görev oluşturuldu (öncelik: {task_doc['priority']}"
                    + (f", bitiş: {task_doc['due_at']}" if task_doc['due_at'] else '') + '). '
                    'Cevabında bu görevin oluşturulduğunu kısaca onayla.'
                )

            # Stream assistant response
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f'{thread_id}-{uuid.uuid4().hex[:6]}',
                system_message=context,
            ).with_model(AI_PROVIDER, AI_MODEL)

            full_text = ''
            async for ev in chat.stream_message(UserMessage(text=message)):
                if isinstance(ev, TextDelta):
                    full_text += ev.content
                    yield sse({'type': 'delta', 'content': ev.content})
                elif isinstance(ev, StreamDone):
                    break

            assistant_msg_id = new_id()
            msg_doc = {
                'message_id': assistant_msg_id, 'thread_id': thread_id, 'user_id': uid,
                'role': 'assistant', 'content': full_text, 'created_at': now_iso(),
            }
            if action_data:
                msg_doc['action'] = action_data
            await db.chat_messages.insert_one(dict(msg_doc))
            await db.chat_threads.update_one(
                {'thread_id': thread_id, 'user_id': uid}, {'$set': {'updated_at': now_iso()}}
            )
            yield sse({'type': 'done', 'assistant_message_id': assistant_msg_id, 'thread_id': thread_id})
        except Exception as e:
            logger.error(f'Chat stream error: {e}')
            yield sse({'type': 'error', 'message': 'Yanıt oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.'})

    return StreamingResponse(
        generator(),
        media_type='text/event-stream',
        headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no', 'Connection': 'keep-alive'},
    )


@api_router.get('/chat/threads')
async def list_threads(user: dict = Depends(get_current_user)):
    threads = await db.chat_threads.find({'user_id': user['user_id']}, {'_id': 0}).sort('updated_at', -1).to_list(200)
    return threads


@api_router.get('/chat/threads/{thread_id}/messages')
async def list_messages(thread_id: str, user: dict = Depends(get_current_user)):
    thread = await db.chat_threads.find_one({'thread_id': thread_id, 'user_id': user['user_id']}, {'_id': 0})
    if not thread:
        raise HTTPException(status_code=404, detail='Konuşma bulunamadı')
    messages = await db.chat_messages.find(
        {'thread_id': thread_id, 'user_id': user['user_id']}, {'_id': 0}
    ).sort('created_at', 1).to_list(1000)
    return messages


@api_router.delete('/chat/threads/{thread_id}')
async def delete_thread(thread_id: str, user: dict = Depends(get_current_user)):
    result = await db.chat_threads.delete_one({'thread_id': thread_id, 'user_id': user['user_id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Konuşma bulunamadı')
    await db.chat_messages.delete_many({'thread_id': thread_id, 'user_id': user['user_id']})
    return {'ok': True}


# ---------------------------------------------------------------------------
# Root + wiring
# ---------------------------------------------------------------------------

@api_router.get('/')
async def root():
    return {'message': 'ARIA API çalışıyor', 'version': '1.0'}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.on_event('shutdown')
async def shutdown_db_client():
    client.close()
