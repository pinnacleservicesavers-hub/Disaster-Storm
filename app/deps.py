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
        
        # Core services
        self.llm = self._init_llm()
        self.doc_store = self._init_doc_store()
        self.msg = self._init_messaging()
        self.db = self._init_database_service()
        
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
    
    def _init_messaging(self):
        """Initialize messaging service (Twilio SMS, email, etc.)"""
        class MessagingService:
            def __init__(self, deps_ref):
                self.deps = deps_ref
                self.twilio_client = None
                
                # Initialize Twilio if credentials available
                if deps_ref.twilio_account_sid and deps_ref.twilio_auth_token:
                    from twilio.rest import Client
                    self.twilio_client = Client(
                        deps_ref.twilio_account_sid,
                        deps_ref.twilio_auth_token
                    )
                    print("✅ Twilio messaging enabled")
                else:
                    print("⚠️ Twilio not configured - using mock messaging")
            
            async def notify(self, contractor, template: str, context: Dict[str, Any]):
                """Send notification to contractor via SMS"""
                phone = getattr(contractor, 'phone', None) or contractor.get('phone')
                
                # Template-based message generation
                message = self._build_message(template, context)
                
                if self.twilio_client and phone:
                    try:
                        msg = self.twilio_client.messages.create(
                            to=phone,
                            from_=self.deps.twilio_phone,
                            body=message
                        )
                        return {"success": True, "message_id": msg.sid}
                    except Exception as e:
                        print(f"❌ Twilio error: {e}")
                        return {"success": False, "error": str(e)}
                else:
                    # Mock mode
                    print(f"📱 [MOCK SMS] To: {phone}")
                    print(f"   Template: {template}")
                    print(f"   Message: {message}")
                    return {"success": True, "mock": True}
            
            def _build_message(self, template: str, context: Dict[str, Any]) -> str:
                """Build message from template"""
                templates = {
                    "storm_lead": (
                        f"🚨 Storm Alert: {context.get('region', 'Unknown')} "
                        f"- {len(context.get('parcels', []))} affected properties. "
                        f"Reply YES for leads."
                    ),
                    "job_opportunity": (
                        f"New Job: {context.get('description', 'Job available')} "
                        f"at {context.get('address', 'location TBD')}. Reply YES to accept."
                    ),
                    "job_assigned": (
                        f"Job #{context.get('job_id')} assigned. "
                        f"Address: {context.get('address')}. Contact homeowner ASAP."
                    )
                }
                
                return templates.get(template, f"Notification: {context}")
        
        return MessagingService(self)
    
    def _init_database_service(self):
        """Initialize database service for agent queries"""
        class DatabaseService:
            async def find_contractors_for_region(self, region: str, scopes: list) -> list:
                """Find contractors serving a region with specific scopes"""
                # TODO: Real database query
                # Example: SELECT * FROM contractors WHERE region = ? AND scopes @> ?
                
                # Mock contractors for now
                class MockContractor:
                    def __init__(self, id, name, phone, consent):
                        self.id = id
                        self.name = name
                        self.phone = phone
                        self.consent_comm = consent
                
                return [
                    MockContractor(1, "ProStorm Contractors", "+15551234567", True),
                    MockContractor(2, "Emergency Repairs Inc", "+15551234568", True),
                    MockContractor(3, "RapidResponse Roofing", "+15551234569", True),
                    MockContractor(4, "AllWeather Restoration", "+15551234570", False),  # No consent
                    MockContractor(5, "Storm Solutions LLC", "+15551234571", True),
                ]
            
            async def get_contractor(self, contractor_id: int):
                """Get contractor by ID"""
                # TODO: Real database query
                class MockContractor:
                    def __init__(self, id, name, phone, consent):
                        self.id = id
                        self.name = name
                        self.phone = phone
                        self.consent_comm = consent
                
                return MockContractor(contractor_id, "Sample Contractor", "+15551234567", True)
        
        return DatabaseService()
    
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
