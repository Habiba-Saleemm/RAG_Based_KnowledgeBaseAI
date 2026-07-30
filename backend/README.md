# Backend Setup (FastAPI) — Step by Step

## 1. Install Python packages
```bash
cd backend_fastapi
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## 2. Set up MySQL
```bash
mysql -u root -p < schema.sql
```
Creates the `authdb` database, the `users` table, and a least-privilege
DB user `authapp` (edit the password inside `schema.sql` first).

## 3. Configure environment variables
```bash
cp .env.example .env
```
Edit `.env` with your real MySQL password + DB name.

## 4. Run the backend
```bash
uvicorn main:app --reload --port 5000
```
Server runs at **http://localhost:5000**.
Interactive API docs (auto-generated): **http://localhost:5000/docs**

## 5. Connect the frontend
In your Next.js project root, create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```
No changes needed in RegisterForm.tsx / LoginForm.tsx — they already call
`/api/register` and `/api/login`, and this FastAPI backend returns the
exact same JSON shape (`{ success, errors }`) that Flask did.

## 6. Set up free email sending (Gmail SMTP) — for Forgot Password

1. Go to your Google Account: https://myaccount.google.com/security
2. Turn on **2-Step Verification** (required for App Passwords).
3. Go to https://myaccount.google.com/apppasswords
4. Create an App Password (name it e.g. "login-intership"). Google gives
   you a 16-character password like `abcd efgh ijkl mnop`.
5. In `.env`, set:
   ```
   SMTP_USER=youraddress@gmail.com
   SMTP_PASSWORD=abcdefghijklmnop
   ```
   (remove the spaces from the 16-char password)

This is completely free — Gmail allows ~500 emails/day on a normal
account, far more than a student project needs.

**How the flow works:**
- User submits their email on `/forgotpassword`
- Backend generates a random token, stores its **hash** (not the raw
  token) in the DB with a 30-minute expiry, and emails a link like
  `http://localhost:3000/reset-password?token=xxxxx`
- User clicks it, lands on `/reset-password`, sets a new password
- Backend verifies the token hash + expiry, updates `password_hash`,
  and invalidates the token so it can't be reused
- The same generic response is shown whether or not the email exists,
  so this endpoint can't be used to check who has an account.

## Password security — what's implemented
- Passwords are **never stored in plain text**. `bcrypt.hashpw()` generates
  a unique random salt per password and produces a 60-char hash.
- Login compares with `bcrypt.checkpw()`.
- `email` has a `UNIQUE` constraint at the DB level.
- Login uses one **generic** "Invalid email or password" message so
  attackers can't tell whether an email is registered.
- **Account lockout**: 5 failed logins locks the account for 15 minutes.
- Connects as a **least-privilege MySQL user** (`authapp`), not root.

## Test it without the frontend (optional)
```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Habiba","email":"habiba@gmail.com","password":"Test@1234","confirmPassword":"Test@1234"}'
```

Or just open **http://localhost:5000/docs** and try it in the browser —
FastAPI gives you this Swagger UI for free.
