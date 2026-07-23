"""
ARIA Core POC — isolated tests for the riskiest core workflows:
1. LLM SSE streaming via emergentintegrations (openai / gpt-5.4, EMERGENT_LLM_KEY)
2. Turkish natural-language intent extraction → structured task JSON (non-streaming LLM call)
3. Intent execution → real MongoDB task insert (user_id isolation, UUID ids, tz-aware dates, no _id leakage)

Run: cd /app/backend && python test_core.py
"""
import asyncio
import json
import os
import re
import uuid
from datetime import datetime, timezone, timedelta

from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")

from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone
from motor.motor_asyncio import AsyncIOMotorClient

AI_PROVIDER = os.environ.get("AI_PROVIDER", "openai")
AI_MODEL = os.environ.get("AI_MODEL", "gpt-5.4")
LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

RESULTS = {}


async def test_streaming():
    """Test 1: token-by-token streaming from GPT-5.4"""
    print("\n=== TEST 1: LLM SSE Streaming (gpt-5.4) ===")
    chat = LlmChat(
        api_key=LLM_KEY,
        session_id=f"poc-{uuid.uuid4().hex[:8]}",
        system_message="Sen ARIA'sın, Türkçe konuşan premium bir yapay zeka asistanısın. Kısa ve net cevap ver.",
    ).with_model(AI_PROVIDER, AI_MODEL)

    deltas = 0
    full_text = ""
    async for ev in chat.stream_message(UserMessage(text="Merhaba! Tek cümleyle kendini tanıt.")):
        if isinstance(ev, TextDelta):
            deltas += 1
            full_text += ev.content
        elif isinstance(ev, StreamDone):
            break

    print(f"Deltas received: {deltas}")
    print(f"Response: {full_text[:200]}")
    assert deltas >= 2, f"Expected multiple deltas, got {deltas}"
    assert len(full_text) > 5, "Response too short"
    RESULTS["streaming"] = "PASS"
    print("PASS: streaming works token-by-token")


INTENT_SYSTEM = """Sen bir komut ayrıştırıcısın. Kullanıcının Türkçe mesajını analiz et ve bir görev (task) oluşturma niyeti varsa JSON döndür.
Bugünün tarihi: {today} (timezone: Europe/Istanbul).

SADECE geçerli JSON döndür, başka hiçbir şey yazma. Format:
{{"action": "task_create", "title": "...", "priority": "low|medium|high|urgent", "due_at": "ISO8601 veya null"}}
Görev niyeti yoksa: {{"action": "none"}}

Örnekler:
- "Yarın Burak'ı ara" -> {{"action":"task_create","title":"Burak'ı ara","priority":"medium","due_at":"<yarın 09:00 ISO>"}}
- "Saat 18:00'de beni uyar" -> {{"action":"task_create","title":"Hatırlatma","priority":"high","due_at":"<bugün 18:00 ISO>"}}
- "Bugün hava nasıl?" -> {{"action":"none"}}"""


async def extract_intent(message: str) -> dict:
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d %A")
    chat = LlmChat(
        api_key=LLM_KEY,
        session_id=f"intent-{uuid.uuid4().hex[:8]}",
        system_message=INTENT_SYSTEM.format(today=today),
    ).with_model(AI_PROVIDER, AI_MODEL)
    resp = await chat.send_message(UserMessage(text=message))
    text = str(resp).strip()
    # strip possible code fences
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if not m:
        return {"action": "none"}
    try:
        return json.loads(m.group(0))
    except json.JSONDecodeError:
        return {"action": "none"}


async def test_intent_extraction():
    """Test 2: Turkish NL -> structured task intent"""
    print("\n=== TEST 2: Intent Extraction ===")
    cases = [
        ("Yarın Burak'ı ara", True),
        ("Saat 18:00'de beni uyar", True),
        ("Ahmet'e teklif gönder", True),
        ("Nasılsın bugün?", False),
    ]
    for msg, expect_task in cases:
        intent = await extract_intent(msg)
        print(f"  '{msg}' -> {json.dumps(intent, ensure_ascii=False)}")
        if expect_task:
            assert intent.get("action") == "task_create", f"Expected task_create for '{msg}'"
            assert intent.get("title"), "Missing title"
        else:
            assert intent.get("action") == "none", f"Expected none for '{msg}'"
    RESULTS["intent"] = "PASS"
    print("PASS: intent extraction works")


async def test_task_execution():
    """Test 3: intent -> real MongoDB task (isolation + no _id leakage)"""
    print("\n=== TEST 3: Task Execution in MongoDB ===")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    user_id = f"poc-user-{uuid.uuid4().hex[:8]}"

    intent = await extract_intent("Yarın Burak'ı ara")
    assert intent["action"] == "task_create"

    task = {
        "task_id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": intent["title"],
        "description": "",
        "priority": intent.get("priority", "medium"),
        "status": "todo",
        "due_at": intent.get("due_at"),
        "tags": [],
        "progress": 0,
        "parent_id": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.tasks.insert_one(dict(task))  # copy to avoid _id mutation

    fetched = await db.tasks.find_one({"user_id": user_id}, {"_id": 0})
    print(f"  Fetched: {json.dumps(fetched, ensure_ascii=False, default=str)[:200]}")
    assert fetched is not None
    assert "_id" not in fetched
    assert fetched["task_id"] == task["task_id"]

    # isolation: another user must see nothing
    other = await db.tasks.find_one({"user_id": "someone-else"}, {"_id": 0})
    assert other is None

    await db.tasks.delete_many({"user_id": user_id})
    client.close()
    RESULTS["task_execution"] = "PASS"
    print("PASS: task creation + isolation + no _id leakage")


async def main():
    print(f"Provider: {AI_PROVIDER} | Model: {AI_MODEL} | Key present: {bool(LLM_KEY)}")
    await test_streaming()
    await test_intent_extraction()
    await test_task_execution()
    print("\n" + "=" * 40)
    print("ALL CORE POC TESTS:", json.dumps(RESULTS))
    print("SUCCESS" if all(v == "PASS" for v in RESULTS.values()) else "FAILURE")


if __name__ == "__main__":
    asyncio.run(main())
