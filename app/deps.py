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
        
        # LLM and document storage
        self.llm = self._init_llm()
        self.doc_store = self._init_doc_store()
        
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
    
    def _init_llm(self):
        """Initialize LLM client (OpenAI, Anthropic, or xAI)"""
        # Prefer OpenAI, fallback to Anthropic, then xAI
        if self.openai_api_key:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=self.openai_api_key)
            
            async def llm_call(prompt: str, model: str = "gpt-4o-mini") -> str:
                """Call OpenAI API"""
                response = await client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.7
                )
                return response.choices[0].message.content
            
            return llm_call
        
        elif self.anthropic_api_key:
            from anthropic import AsyncAnthropic
            client = AsyncAnthropic(api_key=self.anthropic_api_key)
            
            async def llm_call(prompt: str, model: str = "claude-3-5-sonnet-20241022") -> str:
                """Call Anthropic API"""
                response = await client.messages.create(
                    model=model,
                    max_tokens=4096,
                    messages=[{"role": "user", "content": prompt}]
                )
                return response.content[0].text
            
            return llm_call
        
        elif self.xai_api_key:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(
                api_key=self.xai_api_key,
                base_url="https://api.x.ai/v1"
            )
            
            async def llm_call(prompt: str, model: str = "grok-2-1212") -> str:
                """Call xAI Grok API"""
                response = await client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.7
                )
                return response.choices[0].message.content
            
            return llm_call
        
        else:
            # Mock LLM for development
            async def mock_llm(prompt: str, model: str = "mock") -> str:
                """Mock LLM for development/testing"""
                return '{"is_legal": true, "issues": [], "suggestions": [], "aob_included": false}'
            
            print("⚠️ No LLM API key found - using mock LLM")
            return mock_llm
    
    def _init_doc_store(self):
        """Initialize document storage"""
        # TODO: Implement real document storage (S3, Google Cloud Storage, etc.)
        class MockDocStore:
            async def save(self, key: str, content: str) -> str:
                """Save document and return URL"""
                return f"https://storage.example.com/{key}"
            
            async def load(self, key: str) -> str:
                """Load document by key"""
                return "Mock document content"
        
        return MockDocStore()
    
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


def build_dependencies() -> Dependencies:
    """
    Build and return dependencies singleton
    Called once at application startup
    """
    global _deps
    if _deps is None:
        _deps = Dependencies()
        print("✅ Dependencies initialized")
    return _deps


async def get_deps() -> Dependencies:
    """
    FastAPI dependency injection for routes
    
    Usage:
        @router.get("/endpoint")
        async def endpoint(deps: Dependencies = Depends(get_deps)):
            ...
    """
    global _deps
    if _deps is None:
        _deps = Dependencies()
    return _deps


def get_sync_deps() -> Dependencies:
    """Synchronous version for non-async contexts"""
    global _deps
    if _deps is None:
        _deps = Dependencies()
    return _deps
