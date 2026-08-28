# Implementation Guide

## What's Included

### Frontend Files (copy to frontend/src/)
| File | Location | Purpose |
|------|----------|---------|
| app/page.tsx | src/app/page.tsx | Root "/" → redirects to /login |
| app/not-found.tsx | src/app/not-found.tsx | Any unknown URL → redirects to /login |
| src/middleware.ts | src/middleware.ts | Protects /dashboard, redirects logged-in users away from /login |
| app/login/page.tsx | src/app/login/page.tsx | Login page |
| app/forgotpassword/page.tsx | src/app/forgotpassword/page.tsx | Forgot password page |
| app/verify-code/page.tsx | src/app/verify-code/page.tsx | 6-digit PIN entry page |
| app/update-password/page.tsx | src/app/update-password/page.tsx | New password entry page |
| components/forms/ForgotPasswordForm.tsx | src/components/forms/ | Updated forgot password form |
| components/forms/VerifyCodeForm.tsx | src/components/forms/ | NEW: PIN verification form |
| components/forms/UpdatePasswordForm.tsx | src/components/forms/ | NEW: Update password form |

### Backend Files (copy to backend/)
| File | Purpose |
|------|---------|
| main.py | All API endpoints including new forgot-password flow |
| schemas.py | Updated with VerifyCodeRequest + UpdatePasswordRequest |
| migration_add_reset_pin.sql | Adds reset_pin + reset_pin_expires columns to users table |

---

## Setup Steps

### Step 1: Run Database Migration
Open MySQL Workbench → File → Open SQL Script → select `migration_add_reset_pin.sql` → Execute

### Step 2: Copy Backend Files
Replace your existing `backend/main.py` and `backend/schemas.py` with the ones in this zip.

### Step 3: Copy Frontend Files
Copy all files from `frontend/` folder into your `frontend/src/` directory following the paths in the table above.
Create new folders as needed:
- src/app/verify-code/
- src/app/update-password/

### Step 4: Restart Backend
```
cd backend
uvicorn main:app --reload --port 5000
```

### Step 5: Restart Frontend
```
cd frontend
Ctrl+C
Remove-Item -Recurse -Force .next
npm run dev
```

---

## Complete Flow

```
/ → /login                          (root redirect)
/xyz → /login                       (wildcard redirect)
/login (already logged in) → /dashboard   (middleware)
/dashboard (not logged in) → /login       (middleware)

Forgot Password Flow:
/forgotpassword → submit email
  → Backend generates 6-digit PIN, saves in DB with 10min expiry
  → Frontend stores email in sessionStorage
  → Redirect to /verify-code

/verify-code → submit PIN
  → Backend checks PIN against DB + expiry
  → If correct: frontend sets reset_verified in sessionStorage
  → Redirect to /update-password

/update-password → submit new password
  → Backend validates, hashes new password
  → CRITICAL: clears reset_pin + reset_pin_expires from DB (PIN cannot be reused)
  → Redirect to /login with success message
```

---


