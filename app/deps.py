"""
Dependency Injection Container
Provides shared services, tools, and configurations to agents and routers
"""
import os
from typing import Dict, Any


class Dependencies:
    """
    Central dependency container for the application
    Provides services, tools, and configurations to agents
    """
    
    def __init__(self):
        self.env = os.getenv("ENV", "development")
        self.database_url = os.getenv("DATABASE_URL")
        
        # Service configurations
        self.twilio_account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.twilio_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.twilio_phone = os.getenv("TWILIO_PHONE_NUMBER")
        
        self.stripe_secret_key = os.getenv("STRIPE_SECRET_KEY")
        self.stripe_webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
        
        self.docusign_api_key = os.getenv("DOCUSIGN_API_KEY")
        self.lienitnow_api_key = os.getenv("LIENITNOW_API_KEY")
        
        # Weather services
        self.nws_api_url = "https://api.weather.gov"
        self.ambee_api_key = os.getenv("GETAMBEE_API_KEY")
        self.xweather_client_id = os.getenv("XWEATHER_CLIENT_ID")
        self.xweather_client_secret = os.getenv("XWEATHER_CLIENT_SECRET")
        
        # Property data services
        self.smarty_auth_id = os.getenv("SMARTY_AUTH_ID")
        self.smarty_auth_token = os.getenv("SMARTY_AUTH_TOKEN")
        
        # Storage
        self.storage_bucket = os.getenv("STORAGE_BUCKET")
        
        # Xactimate
        self.xactimate_api_url = os.getenv("XACTIMATE_API_URL")
        self.xactimate_api_key = os.getenv("XACTIMATE_API_KEY")
        
        # AI services
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        self.xai_api_key = os.getenv("XAI_API_KEY")
    
    def is_production(self) -> bool:
        """Check if running in production"""
        return self.env == "production"
    
    def is_development(self) -> bool:
        """Check if running in development"""
        return self.env == "development"
    
    def to_dict(self) -> Dict[str, Any]:
        """Export as dictionary (excluding secrets)"""
        return {
            "env": self.env,
            "services": {
                "twilio": bool(self.twilio_account_sid),
                "stripe": bool(self.stripe_secret_key),
                "docusign": bool(self.docusign_api_key),
                "lienitnow": bool(self.lienitnow_api_key),
                "weather": bool(self.ambee_api_key),
                "xactimate": bool(self.xactimate_api_key),
                "ai": {
                    "openai": bool(self.openai_api_key),
                    "anthropic": bool(self.anthropic_api_key),
                    "xai": bool(self.xai_api_key)
                }
            }
        }


# Global dependencies instance
_deps: Dependencies | None = None


async def get_deps() -> Dependencies:
    """
    Get or initialize global dependencies
    Used in agent constructors and router dependencies
    """
    global _deps
    if _deps is None:
        _deps = Dependencies()
        print("✅ Dependencies initialized")
    return _deps


def get_sync_deps() -> Dependencies:
    """Synchronous version for non-async contexts"""
    global _deps
    if _deps is None:
        _deps = Dependencies()
    return _deps
