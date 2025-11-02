"""LienItNow Service"""
import os
from typing import Dict, Any


class LienItNowService:
    """Lien filing and deadline tracking service"""
    
    def __init__(self):
        self.api_key = os.getenv("LIENITNOW_API_KEY")
        self.enabled = bool(self.api_key)
        
        if self.enabled:
            print("✅ LienItNow service enabled")
        else:
            print("⚠️ LienItNow not configured - using mock lien data")
    
    async def get_deadline(self, state: str, trade: str) -> Dict[str, Any]:
        """Get lien deadline for state and trade"""
        if self.enabled:
            # TODO: Integrate with LienItNow API
            pass
        
        # Mock lien deadlines
        deadlines = {
            "FL": {"roofing": 90, "plumbing": 90, "electrical": 90},
            "TX": {"roofing": 60, "plumbing": 60, "electrical": 60},
            "CA": {"roofing": 90, "plumbing": 90, "electrical": 90}
        }
        
        days = deadlines.get(state, {}).get(trade, 90)
        
        return {
            "state": state,
            "trade": trade,
            "deadline_days": days,
            "requirements": f"{state} requires lien filing within {days} days of completion"
        }
