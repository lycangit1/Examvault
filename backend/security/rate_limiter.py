from datetime import datetime, timedelta, timezone
from typing import Dict, List, Tuple
from fastapi import HTTPException, status
from backend.config import settings

class SlidingWindowRateLimiter:
    """
    Sliding-window rate limiter that locks an account / IP for 5 minutes
    after 5 failed attempts within a 10-minute window.
    """
    def __init__(self):
        # Key: identifier (e.g. email or IP) -> List of failure timestamps
        self.failures: Dict[str, List[datetime]] = {}
        # Key: identifier -> lockout expiry datetime
        self.lockouts: Dict[str, datetime] = {}
        
    def check_rate_limit(self, identifier: str) -> None:
        """
        Checks if identifier is currently locked out.
        Raises HTTPException 429 if rate limit is active.
        """
        now = datetime.now(timezone.utc)
        
        # 1. Check if locked out
        if identifier in self.lockouts:
            lockout_until = self.lockouts[identifier]
            if now < lockout_until:
                remaining_seconds = int((lockout_until - now).total_seconds())
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "error": "RATE_LIMIT_TRIGGERED",
                        "message": f"Account temporarily locked due to repeated failed authentication attempts. Please retry in {remaining_seconds} seconds.",
                        "retry_after_seconds": remaining_seconds,
                        "locked_until": lockout_until.isoformat()
                    }
                )
            else:
                # Lockout expired, clear lockout state
                del self.lockouts[identifier]
                self.failures.pop(identifier, None)

    def record_failure(self, identifier: str) -> Tuple[bool, int]:
        """
        Records a failed attempt.
        If failures >= 5 in 10 minutes, triggers a 5-minute lockout.
        Returns (is_locked_now, attempts_in_window).
        """
        now = datetime.now(timezone.utc)
        window_start = now - timedelta(minutes=settings.RATE_LIMIT_WINDOW_MINUTES)
        
        # Clean older failures outside window
        recent_failures = [t for t in self.failures.get(identifier, []) if t > window_start]
        recent_failures.append(now)
        self.failures[identifier] = recent_failures
        
        # Check threshold (5 attempts in 10 mins)
        if len(recent_failures) >= settings.RATE_LIMIT_MAX_ATTEMPTS:
            lockout_until = now + timedelta(minutes=settings.RATE_LIMIT_LOCKOUT_MINUTES)
            self.lockouts[identifier] = lockout_until
            return True, len(recent_failures)
        
        return False, len(recent_failures)

    def record_success(self, identifier: str) -> None:
        """
        Clears failure counter upon successful authentication.
        """
        self.failures.pop(identifier, None)
        self.lockouts.pop(identifier, None)

auth_rate_limiter = SlidingWindowRateLimiter()
