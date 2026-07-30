"""
validators.py
Server-side validation. This MUST exist even though the frontend already
validates — frontend checks can always be bypassed (Postman, curl, disabled
JS), so the backend is the real gatekeeper.

The messages/rules here intentionally mirror RegisterForm.tsx / LoginForm.tsx
so the same error text can be shown to the user either way.
"""

import re

EMAIL_CHAR_PATTERN = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")

PASSWORD_MIN_LENGTH = 8


def validate_email(email: str) -> str | None:
    """Returns an error message, or None if valid."""
    if not email or not email.strip():
        return "Email is required."

    if re.search(r"\s", email):
        return "Email addresses cannot contain spaces.\nPlease remove all spaces and try again."

    at_count = email.count("@")
    if at_count == 0:
        return "Please enter a valid email address.\nThe email must contain an '@' symbol.\n\nExample: habiba@example.com"
    if at_count > 1:
        return "Please enter a valid email address.\nAn email address can contain only one '@' symbol."

    local, domain = email.split("@")

    if not local:
        return "Please enter a valid email address.\nThe part before '@' cannot be empty.\n\nExample: habiba@gmail.com"
    if not domain:
        return "Please enter a valid email address.\nPlease enter the domain name after '@'.\n\nExample: habiba@gmail.com"
    if ".." in email:
        return "Please enter a valid email address.\nConsecutive dots are not allowed."
    if "." not in domain:
        return "Please enter a valid email address.\nThe domain is incomplete.\n\nExample: habiba@gmail.com"
    if domain.endswith("."):
        return "Please enter a valid email address.\nThe domain extension is missing.\n\nExample: habiba@gmail.com"
    if not EMAIL_CHAR_PATTERN.match(email):
        return "Please enter a valid email address.\nThe email contains invalid characters."

    return None


def validate_password(password: str) -> str | None:
    """Returns an error message, or None if valid."""
    if not password or not password.strip():
        return "Please enter a password."

    errors = []
    if len(password) < PASSWORD_MIN_LENGTH:
        errors.append(f"• Minimum {PASSWORD_MIN_LENGTH} characters")
    if not re.search(r"[A-Z]", password):
        errors.append("• At least one uppercase letter")
    if not re.search(r"[a-z]", password):
        errors.append("• At least one lowercase letter")
    if not re.search(r"\d", password):
        errors.append("• At least one number")
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append("• At least one special character")

    if errors:
        return "Password must contain:\n" + "\n".join(errors)

    return None


def validate_name(name: str) -> str | None:
    if not name or not name.strip():
        return "Please enter your name."
    return None
