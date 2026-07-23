# Auth-Gated App Testing Playbook (Emergent Auth)

NOTE: Do not be satisfied until you've tested the app completely, especially the auth gated pages.

## Step 1: Create Test User & Session
```bash
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date()
});
db.auth_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Step 2: Test Backend API
```bash
curl -X GET "https://<app>/api/auth/me" -H "Authorization: Bearer YOUR_SESSION_TOKEN"
curl -X GET "https://<app>/api/tasks" -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

## Step 3: Browser Testing
```python
await page.context.add_cookies([{
    "name": "session_token",
    "value": "YOUR_SESSION_TOKEN",
    "domain": "<app-domain>",
    "path": "/",
    "httpOnly": True,
    "secure": True,
    "sameSite": "None"
}])
await page.goto("https://<app>")
```

## Alternative: Email/Password Test Login
The app also supports email/password auth. See /app/memory/test_credentials.md for seeded test credentials. Login via POST /api/auth/login {"email": "...", "password": "..."} which returns access_token — use as Authorization: Bearer token.

## Checklist
- User document has user_id field (custom UUID)
- Session user_id matches user's user_id exactly
- All queries use {"_id": 0} projection
- Backend queries use user_id (not _id)
- /api/auth/me returns user data (not 401/404)
- Dashboard loads without redirect to login

## Success Indicators
- /api/auth/me returns user data
- Dashboard loads without redirect
- CRUD operations work
