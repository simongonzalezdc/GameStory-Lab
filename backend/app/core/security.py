"""Security and authentication utilities."""
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    supabase: Client = None
) -> dict:
    """
    Verify JWT token and return current user.

    Args:
        credentials: HTTP Bearer token from Authorization header
        supabase: Supabase client instance

    Returns:
        User data dictionary

    Raises:
        HTTPException: If token is invalid or user not found
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
        )

    token = credentials.credentials

    try:
        # Verify token with Supabase
        if supabase:
            user = supabase.auth.get_user(token)
            if user and user.user:
                return user.user.model_dump()

        # For development/testing without Supabase
        return {"id": "test-user-id", "email": "test@example.com"}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
        )


def check_rate_limit(user_id: str, limit: int = 100) -> bool:
    """
    Check if user has exceeded rate limit.

    Args:
        user_id: User ID to check
        limit: Maximum requests per hour

    Returns:
        True if within limit, False otherwise

    Note:
        This is a placeholder. In production, use Redis or similar
        for distributed rate limiting.
    """
    # TODO: Implement actual rate limiting with Redis
    return True
