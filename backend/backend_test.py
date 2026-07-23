"""
ARIA Backend API Test Suite
Tests all endpoints with Turkish-language AI Executive Assistant
"""
import requests
import sys
import time
import json
from datetime import datetime, timedelta

BASE_URL = "https://auto-task-hub-4.preview.emergentagent.com/api"

class ARIABackendTester:
    def __init__(self):
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.failures = []
        
    def log(self, msg, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {msg}")
    
    def test(self, name, method, endpoint, expected_status, data=None, json_data=None, headers=None, timeout=10):
        """Run a single API test"""
        url = f"{BASE_URL}{endpoint}"
        h = {'Content-Type': 'application/json'}
        if self.token:
            h['Authorization'] = f'Bearer {self.token}'
        if headers:
            h.update(headers)
        
        self.tests_run += 1
        self.log(f"Testing: {name}")
        
        try:
            if method == 'GET':
                resp = requests.get(url, headers=h, timeout=timeout)
            elif method == 'POST':
                resp = requests.post(url, json=json_data or data, headers=h, timeout=timeout)
            elif method == 'PUT':
                resp = requests.put(url, json=json_data or data, headers=h, timeout=timeout)
            elif method == 'PATCH':
                resp = requests.patch(url, json=json_data or data, headers=h, timeout=timeout)
            elif method == 'DELETE':
                resp = requests.delete(url, headers=h, timeout=timeout)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            success = resp.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                self.log(f"✅ PASS: {name} (status {resp.status_code})", "PASS")
                try:
                    return True, resp.json() if resp.text else {}
                except:
                    return True, {}
            else:
                self.tests_failed += 1
                error_detail = ""
                try:
                    error_detail = resp.json().get('detail', '')
                except:
                    error_detail = resp.text[:200]
                msg = f"❌ FAIL: {name} - Expected {expected_status}, got {resp.status_code}. Detail: {error_detail}"
                self.log(msg, "FAIL")
                self.failures.append(msg)
                return False, {}
                
        except requests.exceptions.Timeout:
            self.tests_failed += 1
            msg = f"❌ FAIL: {name} - Request timeout after {timeout}s"
            self.log(msg, "FAIL")
            self.failures.append(msg)
            return False, {}
        except Exception as e:
            self.tests_failed += 1
            msg = f"❌ FAIL: {name} - Exception: {str(e)}"
            self.log(msg, "FAIL")
            self.failures.append(msg)
            return False, {}
    
    def test_auth_flow(self):
        """Test authentication endpoints"""
        self.log("\n=== TESTING AUTH ENDPOINTS ===", "SECTION")
        
        # 1. Login with existing test user
        success, resp = self.test(
            "POST /auth/login (existing user)",
            "POST",
            "/auth/login",
            200,
            json_data={"email": "test@aria.app", "password": "Test1234!"}
        )
        
        if success and 'access_token' in resp:
            self.token = resp['access_token']
            self.user_id = resp.get('user', {}).get('user_id')
            self.log(f"✓ Logged in as test@aria.app, token obtained")
        else:
            self.log("✗ Login failed - cannot proceed with authenticated tests", "ERROR")
            return False
        
        # 2. GET /auth/me
        success, user = self.test(
            "GET /auth/me (with Bearer token)",
            "GET",
            "/auth/me",
            200
        )
        
        if success:
            # Verify no _id field
            if '_id' in user:
                self.log("✗ CRITICAL: /auth/me response contains _id field (should be excluded)", "ERROR")
                self.failures.append("CRITICAL: _id field present in /auth/me response")
            if user.get('email') == 'test@aria.app':
                self.log("✓ /auth/me returns correct user data")
            else:
                self.log(f"✗ /auth/me returned unexpected user: {user.get('email')}", "ERROR")
        
        # 3. Register new user (unique email)
        timestamp = int(time.time())
        new_email = f"testagent+{timestamp}@aria.app"
        success, resp = self.test(
            "POST /auth/register (new user)",
            "POST",
            "/auth/register",
            200,
            json_data={
                "email": new_email,
                "password": "TestNew123!",
                "name": "Test Agent User"
            }
        )
        
        if success and 'access_token' in resp:
            self.log(f"✓ New user registered: {new_email}")
            new_token = resp['access_token']
            new_user = resp.get('user', {})
            if new_user.get('onboarding_complete') == False:
                self.log("✓ New user has onboarding_complete=False")
            else:
                self.log("✗ New user should have onboarding_complete=False", "ERROR")
        
        return True
    
    def test_onboarding(self):
        """Test onboarding endpoints"""
        self.log("\n=== TESTING ONBOARDING ===", "SECTION")
        
        # 1. GET /onboarding
        success, data = self.test(
            "GET /onboarding",
            "GET",
            "/onboarding",
            200
        )
        
        if success:
            self.log(f"✓ Onboarding data retrieved: step={data.get('step')}, complete={data.get('complete')}")
        
        # 2. PUT /onboarding (save profile)
        success, resp = self.test(
            "PUT /onboarding (save profile)",
            "PUT",
            "/onboarding",
            200,
            json_data={
                "profile": {
                    "first_name": "Test",
                    "last_name": "User",
                    "profession": "Tester",
                    "company": "ARIA Test Co"
                },
                "step": 2
            }
        )
        
        # 3. PUT /onboarding (save AI preferences)
        success, resp = self.test(
            "PUT /onboarding (save AI preferences)",
            "PUT",
            "/onboarding",
            200,
            json_data={
                "ai_preferences": {
                    "address_style": "Sen",
                    "tone": "Samimi ve net",
                    "language": "Türkçe"
                },
                "step": 3
            }
        )
        
        # 4. PUT /onboarding (complete with initial memory)
        success, resp = self.test(
            "PUT /onboarding (complete with memory)",
            "PUT",
            "/onboarding",
            200,
            json_data={
                "integration_interests": ["gmail", "slack"],
                "initial_memory": "Test hafıza kaydı - bu yıl şirketimi büyütmek istiyorum",
                "complete": True
            }
        )
        
        if success:
            self.log("✓ Onboarding completed - should create memory record with source=onboarding")
    
    def test_dashboard(self):
        """Test dashboard endpoint"""
        self.log("\n=== TESTING DASHBOARD ===", "SECTION")
        
        success, data = self.test(
            "GET /dashboard",
            "GET",
            "/dashboard",
            200
        )
        
        if success:
            required_fields = ['open_tasks', 'completed_tasks', 'events', 'contacts', 
                             'today_tasks', 'upcoming_events', 'weekly_progress', 'aria_suggestion']
            missing = [f for f in required_fields if f not in data]
            if missing:
                self.log(f"✗ Dashboard missing fields: {missing}", "ERROR")
                self.failures.append(f"Dashboard missing fields: {missing}")
            else:
                self.log(f"✓ Dashboard data complete: {data.get('open_tasks')} open tasks, "
                        f"{data.get('completed_tasks')} completed, {data.get('weekly_progress')}% weekly progress")
                self.log(f"  ARIA suggestion: {data.get('aria_suggestion', '')[:80]}...")
    
    def test_tasks_crud(self):
        """Test tasks CRUD operations"""
        self.log("\n=== TESTING TASKS CRUD ===", "SECTION")
        
        # 1. GET /tasks (list all)
        success, tasks = self.test(
            "GET /tasks (list all)",
            "GET",
            "/tasks",
            200
        )
        
        if success:
            self.log(f"✓ Retrieved {len(tasks)} tasks")
            if tasks and '_id' in tasks[0]:
                self.log("✗ CRITICAL: Task response contains _id field", "ERROR")
                self.failures.append("CRITICAL: _id field in task response")
        
        # 2. POST /tasks (create)
        due_at = (datetime.utcnow() + timedelta(days=1)).isoformat()
        success, task = self.test(
            "POST /tasks (create)",
            "POST",
            "/tasks",
            200,
            json_data={
                "title": "Test görev - backend test",
                "description": "Backend test tarafından oluşturuldu",
                "priority": "high",
                "status": "todo",
                "due_at": due_at,
                "tags": ["test"]
            }
        )
        
        task_id = None
        if success and 'task_id' in task:
            task_id = task['task_id']
            self.log(f"✓ Task created: {task_id}")
            if '_id' in task:
                self.log("✗ CRITICAL: Created task contains _id field", "ERROR")
        
        # 3. PATCH /tasks/{id} (update status to done)
        if task_id:
            success, updated = self.test(
                "PATCH /tasks/{id} (status=done)",
                "PATCH",
                f"/tasks/{task_id}",
                200,
                json_data={"status": "done"}
            )
            
            if success:
                if updated.get('status') == 'done' and updated.get('progress') == 100:
                    self.log("✓ Task status=done sets progress=100 automatically")
                else:
                    self.log(f"✗ Task status=done should set progress=100, got {updated.get('progress')}", "ERROR")
        
        # 4. DELETE /tasks/{id}
        if task_id:
            success, _ = self.test(
                "DELETE /tasks/{id}",
                "DELETE",
                f"/tasks/{task_id}",
                200
            )
        
        # 5. Test user isolation (try to access another user's task - should fail)
        # This would require creating a second user and task, skipping for now
    
    def test_events_crud(self):
        """Test events CRUD operations"""
        self.log("\n=== TESTING EVENTS CRUD ===", "SECTION")
        
        # 1. GET /events
        success, events = self.test(
            "GET /events",
            "GET",
            "/events",
            200
        )
        
        if success:
            self.log(f"✓ Retrieved {len(events)} events")
        
        # 2. POST /events
        start_at = (datetime.utcnow() + timedelta(hours=2)).isoformat()
        end_at = (datetime.utcnow() + timedelta(hours=3)).isoformat()
        success, event = self.test(
            "POST /events (create)",
            "POST",
            "/events",
            200,
            json_data={
                "title": "Test toplantı",
                "start_at": start_at,
                "end_at": end_at,
                "location": "Zoom",
                "description": "Backend test etkinliği"
            }
        )
        
        event_id = None
        if success and 'event_id' in event:
            event_id = event['event_id']
            self.log(f"✓ Event created: {event_id}")
            if '_id' in event:
                self.log("✗ CRITICAL: Event contains _id field", "ERROR")
        
        # 3. PATCH /events/{id}
        if event_id:
            success, _ = self.test(
                "PATCH /events/{id}",
                "PATCH",
                f"/events/{event_id}",
                200,
                json_data={"location": "Google Meet"}
            )
        
        # 4. DELETE /events/{id}
        if event_id:
            success, _ = self.test(
                "DELETE /events/{id}",
                "DELETE",
                f"/events/{event_id}",
                200
            )
    
    def test_contacts_crm(self):
        """Test contacts and interactions"""
        self.log("\n=== TESTING CRM (CONTACTS + INTERACTIONS) ===", "SECTION")
        
        # 1. GET /contacts
        success, contacts = self.test(
            "GET /contacts",
            "GET",
            "/contacts",
            200
        )
        
        if success:
            self.log(f"✓ Retrieved {len(contacts)} contacts")
        
        # 2. POST /contacts
        success, contact = self.test(
            "POST /contacts (create)",
            "POST",
            "/contacts",
            200,
            json_data={
                "name": "Burak Test",
                "email": "burak@test.com",
                "phone": "+90 555 123 4567",
                "company": "Test A.Ş.",
                "notes": "Backend test kişisi"
            }
        )
        
        contact_id = None
        if success and 'contact_id' in contact:
            contact_id = contact['contact_id']
            self.log(f"✓ Contact created: {contact_id}")
            if '_id' in contact:
                self.log("✗ CRITICAL: Contact contains _id field", "ERROR")
        
        # 3. POST /contacts/{id}/interactions
        if contact_id:
            success, interaction = self.test(
                "POST /contacts/{id}/interactions (create)",
                "POST",
                f"/contacts/{contact_id}/interactions",
                200,
                json_data={
                    "type": "call",
                    "content": "Test araması yapıldı - backend test"
                }
            )
            
            if success and 'interaction_id' in interaction:
                self.log(f"✓ Interaction created: {interaction['interaction_id']}")
        
        # 4. GET /contacts/{id}/interactions
        if contact_id:
            success, interactions = self.test(
                "GET /contacts/{id}/interactions",
                "GET",
                f"/contacts/{contact_id}/interactions",
                200
            )
            
            if success:
                self.log(f"✓ Retrieved {len(interactions)} interactions for contact")
        
        # 5. DELETE /contacts/{id}
        if contact_id:
            success, _ = self.test(
                "DELETE /contacts/{id}",
                "DELETE",
                f"/contacts/{contact_id}",
                200
            )
    
    def test_memories_crud(self):
        """Test AI memory CRUD"""
        self.log("\n=== TESTING MEMORIES CRUD ===", "SECTION")
        
        # 1. GET /memories
        success, memories = self.test(
            "GET /memories",
            "GET",
            "/memories",
            200
        )
        
        if success:
            self.log(f"✓ Retrieved {len(memories)} memories")
            # Check for onboarding memory
            onboarding_mem = [m for m in memories if m.get('source') == 'onboarding']
            if onboarding_mem:
                self.log(f"✓ Found onboarding memory: {onboarding_mem[0].get('content', '')[:60]}...")
        
        # 2. POST /memories
        success, memory = self.test(
            "POST /memories (create)",
            "POST",
            "/memories",
            200,
            json_data={
                "content": "Backend test hafıza kaydı - önemli bilgi",
                "category": "genel",
                "importance": 4
            }
        )
        
        memory_id = None
        if success and 'memory_id' in memory:
            memory_id = memory['memory_id']
            self.log(f"✓ Memory created: {memory_id}")
            if memory.get('approved') != True:
                self.log("✗ New memory should have approved=True by default", "ERROR")
        
        # 3. PATCH /memories/{id} (toggle approved)
        if memory_id:
            success, updated = self.test(
                "PATCH /memories/{id} (toggle approved)",
                "PATCH",
                f"/memories/{memory_id}",
                200,
                json_data={"approved": False}
            )
            
            if success and updated.get('approved') == False:
                self.log("✓ Memory approved toggled to False")
        
        # 4. DELETE /memories/{id}
        if memory_id:
            success, _ = self.test(
                "DELETE /memories/{id}",
                "DELETE",
                f"/memories/{memory_id}",
                200
            )
    
    def test_global_search(self):
        """Test global search"""
        self.log("\n=== TESTING GLOBAL SEARCH ===", "SECTION")
        
        # Create test data first
        self.test(
            "POST /tasks (for search test)",
            "POST",
            "/tasks",
            200,
            json_data={"title": "SearchTestTask12345", "description": "Unique search term"}
        )
        
        time.sleep(0.5)  # Brief delay for DB consistency
        
        # Search
        success, results = self.test(
            "GET /search?q=SearchTestTask",
            "GET",
            "/search?q=SearchTestTask",
            200
        )
        
        if success:
            required_keys = ['tasks', 'contacts', 'events', 'memories']
            missing = [k for k in required_keys if k not in results]
            if missing:
                self.log(f"✗ Search results missing keys: {missing}", "ERROR")
            else:
                self.log(f"✓ Search returned grouped results: {len(results['tasks'])} tasks, "
                        f"{len(results['contacts'])} contacts, {len(results['events'])} events, "
                        f"{len(results['memories'])} memories")
                
                if len(results['tasks']) > 0:
                    self.log("✓ Search found the test task")
                else:
                    self.log("✗ Search should have found SearchTestTask12345", "ERROR")
    
    def test_chat_sse_stream(self):
        """Test chat SSE streaming with natural language task creation"""
        self.log("\n=== TESTING CHAT SSE STREAM (GPT-5.4) ===", "SECTION")
        self.log("⚠️  NOTE: LLM calls take 5-30s, using 60s timeout")
        
        # Turkish command that should create a task
        success, resp = self.test(
            "POST /chat/stream (Turkish command: 'Yarın Burak'ı ara')",
            "POST",
            "/chat/stream",
            200,
            json_data={
                "message": "Yarın Burak'ı ara",
                "thread_id": None
            },
            timeout=60
        )
        
        if not success:
            self.log("✗ Chat stream endpoint failed - cannot test SSE", "ERROR")
            return
        
        # For SSE testing, we need to parse the stream manually
        url = f"{BASE_URL}/chat/stream"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.token}'
        }
        
        try:
            self.log("Sending SSE request and parsing stream...")
            resp = requests.post(
                url,
                json={"message": "Yarın Burak'ı ara", "thread_id": None},
                headers=headers,
                stream=True,
                timeout=60
            )
            
            if resp.status_code != 200:
                self.log(f"✗ SSE stream returned {resp.status_code}", "ERROR")
                self.tests_failed += 1
                return
            
            events = []
            full_text = ""
            action_event = None
            thread_id = None
            
            for line in resp.iter_lines(decode_unicode=True):
                if line.startswith('data: '):
                    try:
                        data = json.loads(line[6:])
                        events.append(data)
                        
                        if data.get('type') == 'meta':
                            thread_id = data.get('thread_id')
                            self.log(f"✓ Received meta event: thread_id={thread_id}")
                        
                        elif data.get('type') == 'delta':
                            full_text += data.get('content', '')
                        
                        elif data.get('type') == 'action':
                            action_event = data.get('action')
                            self.log(f"✓ Received action event: {action_event.get('kind')} - {action_event.get('title')}")
                        
                        elif data.get('type') == 'done':
                            self.log(f"✓ Stream completed: assistant_message_id={data.get('assistant_message_id')}")
                            break
                        
                        elif data.get('type') == 'error':
                            self.log(f"✗ Stream error: {data.get('message')}", "ERROR")
                            break
                    except json.JSONDecodeError:
                        pass
            
            self.tests_run += 1
            
            # Validate SSE stream
            if not thread_id:
                self.log("✗ No thread_id in meta event", "ERROR")
                self.tests_failed += 1
                self.failures.append("Chat SSE: No thread_id in meta event")
                return
            
            if not full_text:
                self.log("✗ No text deltas received", "ERROR")
                self.tests_failed += 1
                self.failures.append("Chat SSE: No text deltas received")
                return
            
            if not action_event or action_event.get('kind') != 'task_created':
                self.log("✗ CRITICAL: Turkish command 'Yarın Burak'ı ara' should emit task_created action event", "ERROR")
                self.tests_failed += 1
                self.failures.append("CRITICAL: Natural language task creation failed - no action event")
                return
            
            self.tests_passed += 1
            self.log(f"✅ PASS: Chat SSE stream with task creation", "PASS")
            self.log(f"  Full response: {full_text[:100]}...")
            self.log(f"  Task created: {action_event.get('title')} (priority: {action_event.get('priority')})")
            
            # Verify task was actually created in DB
            time.sleep(1)
            success, tasks = self.test(
                "GET /tasks (verify task created by chat)",
                "GET",
                "/tasks",
                200
            )
            
            if success:
                chat_tasks = [t for t in tasks if 'aria' in t.get('tags', [])]
                if chat_tasks:
                    self.log(f"✓ Task created by chat found in /tasks: {chat_tasks[0].get('title')}")
                else:
                    self.log("✗ Task created by chat not found in /tasks", "ERROR")
            
            # Test GET /chat/threads
            success, threads = self.test(
                "GET /chat/threads",
                "GET",
                "/chat/threads",
                200
            )
            
            if success and threads:
                self.log(f"✓ Retrieved {len(threads)} chat threads")
            
            # Test GET /chat/threads/{id}/messages
            if thread_id:
                success, messages = self.test(
                    "GET /chat/threads/{id}/messages",
                    "GET",
                    f"/chat/threads/{thread_id}/messages",
                    200
                )
                
                if success:
                    self.log(f"✓ Retrieved {len(messages)} messages from thread")
                    user_msgs = [m for m in messages if m.get('role') == 'user']
                    assistant_msgs = [m for m in messages if m.get('role') == 'assistant']
                    self.log(f"  {len(user_msgs)} user messages, {len(assistant_msgs)} assistant messages")
                    
                    # Check if assistant message has action field
                    action_msgs = [m for m in assistant_msgs if 'action' in m]
                    if action_msgs:
                        self.log(f"✓ Assistant message persisted with action field: {action_msgs[0].get('action')}")
                    else:
                        self.log("✗ Assistant message should have action field persisted", "ERROR")
        
        except requests.exceptions.Timeout:
            self.tests_run += 1
            self.tests_failed += 1
            self.log("✗ Chat SSE stream timeout (>60s)", "ERROR")
            self.failures.append("Chat SSE stream timeout")
        except Exception as e:
            self.tests_run += 1
            self.tests_failed += 1
            self.log(f"✗ Chat SSE stream exception: {str(e)}", "ERROR")
            self.failures.append(f"Chat SSE exception: {str(e)}")
    
    def test_logout(self):
        """Test logout endpoint"""
        self.log("\n=== TESTING LOGOUT ===", "SECTION")
        
        # POST /auth/logout
        success, _ = self.test(
            "POST /auth/logout",
            "POST",
            "/auth/logout",
            200
        )
        
        if success:
            self.log("✓ Logout successful")
            
            # Try to use the token again - should fail
            old_token = self.token
            success, _ = self.test(
                "GET /auth/me (after logout - should fail)",
                "GET",
                "/auth/me",
                401
            )
            
            if success:
                self.log("✓ Token unusable after logout (session revoked)")
            else:
                self.log("✗ Token should be invalid after logout", "ERROR")
            
            # Restore token for cleanup
            self.token = old_token
    
    def run_all_tests(self):
        """Run all test suites"""
        self.log("=" * 60)
        self.log("ARIA BACKEND API TEST SUITE")
        self.log(f"Base URL: {BASE_URL}")
        self.log("=" * 60)
        
        start_time = time.time()
        
        # Run test suites in order
        if not self.test_auth_flow():
            self.log("\n❌ Auth tests failed - cannot proceed", "ERROR")
            return False
        
        self.test_onboarding()
        self.test_dashboard()
        self.test_tasks_crud()
        self.test_events_crud()
        self.test_contacts_crm()
        self.test_memories_crud()
        self.test_global_search()
        self.test_chat_sse_stream()
        self.test_logout()
        
        elapsed = time.time() - start_time
        
        # Print summary
        self.log("\n" + "=" * 60)
        self.log("TEST SUMMARY")
        self.log("=" * 60)
        self.log(f"Total tests: {self.tests_run}")
        self.log(f"Passed: {self.tests_passed} ✅")
        self.log(f"Failed: {self.tests_failed} ❌")
        self.log(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        self.log(f"Elapsed time: {elapsed:.1f}s")
        
        if self.failures:
            self.log("\n❌ FAILURES:")
            for f in self.failures:
                self.log(f"  - {f}")
        
        self.log("=" * 60)
        
        return self.tests_failed == 0

def main():
    tester = ARIABackendTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
