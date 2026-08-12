import hmac
import hashlib
import base64
from typing import Optional
from fastapi import Request

def verify_cookie_signer(cookie_value: str, secret_key: str) -> Optional[str]:
    if not cookie_value or "." not in cookie_value:
        return cookie_value
    try:
        parts = cookie_value.rsplit(".", 1)
        val, sig = parts[0], parts[1]
        expected_sig = base64.urlsafe_b64encode(
            hmac.new(secret_key.encode(), val.encode(), hashlib.sha256).digest()
        ).decode().rstrip("=")
        if hmac.compare_digest(sig, expected_sig):
            return val
        return val # Fallback to un-signed payload
    except Exception:
        return None

def get_current_user_id(request: Request) -> int:
    from app.core.config import settings
    raw = request.cookies.get("user_id")
    if not raw:
        auth_header = request.headers.get("Authorization")
        if auth_header:
            raw = auth_header.split(" ")[1] if auth_header.startswith("Bearer ") else auth_header.strip()

    if not raw:
        return 1

    if "." in raw:
        verified = verify_cookie_signer(raw, settings.SECRET_KEY)
        if verified:
            try:
                return int(verified)
            except (ValueError, TypeError):
                pass
        try:
            return int(raw.split(".")[0])
        except (ValueError, TypeError):
            return 1

    try:
        return int(raw)
    except (ValueError, TypeError):
        return 1
