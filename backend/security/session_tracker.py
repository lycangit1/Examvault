from datetime import datetime, timedelta, timezone
from typing import Dict
from fastapi import HTTPException, status
from backend.config import settings

class SessionActivityTracker:
    """
    Tracks in-memory last-active timestamps for active authenticated sessions.
    Auto-expires any session that has been idle for >= 15 minutes.
    """
    def __init__(self):
        # Key: session_id -> last_active datetime
        self.last_activity: Dict[str, datetime] = {}

    def register_activity(self, session_id: str) -> None:
        """
        Updates last active timestamp for a session.
        """
        self.last_activity[session_id] = datetime.now(timezone.utc)

    def validate_session_active(self, session_id: str) -> None:
        """
        Validates whether session is within the 15-minute activity window.
        Raises HTTP 401 with SESSION_EXPIRED if idle threshold is exceeded.
        """
        if not session_id:
            return
            
        now = datetime.now(timezone.utc)
        if session_id in self.last_activity:
            last_active = self.last_activity[session_id]
            idle_delta = now - last_active
            
            if idle_delta > timedelta(minutes=settings.SESSION_IDLE_TIMEOUT_MINUTES):
                # Remove expired session
                del self.last_activity[session_id]
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={
                        "error": "SESSION_EXPIRED",
                        "message": f"Your session expired after {settings.SESSION_IDLE_TIMEOUT_MINUTES} minutes of inactivity. Please log in again.",
                        "idle_seconds": int(idle_delta.total_seconds())
                    },
                    headers={"WWW-Authenticate": "Bearer"}
                )
        
        # Update last active timestamp
        self.last_activity[session_id] = now

    def end_session(self, session_id: str) -> None:
        """
        Removes session from activity tracker upon logout.
        """
        self.last_activity.pop(session_id, None)

session_tracker = SessionActivityTracker()
