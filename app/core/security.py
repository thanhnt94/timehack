from typing import Optional
from fastapi import Request
from app.core.config import settings
from app.modules.sso_module.cookie_signer import verify_cookie

def get_current_user_id(request: Request) -> Optional[int]:
    """
    Extracts and validates the authenticated user ID from signed cookie or Authorization header.
    Returns None if unauthenticated or signature is invalid.
    """
    raw = request.cookies.get("user_id")
    if not raw:
        auth_header = request.headers.get("Authorization")
        if auth_header:
            raw = auth_header.split(" ")[1] if auth_header.startswith("Bearer ") else auth_header.strip()

    if not raw:
        return None

    if "." in raw:
        verified = verify_cookie(raw, settings.SECRET_KEY)
        if verified:
            try:
                return int(verified)
            except (ValueError, TypeError):
                return None
        return None

    # Only accept raw numeric user_id if cleaned by clean_user_id_cookie middleware
    try:
        return int(raw)
    except (ValueError, TypeError):
        return None
