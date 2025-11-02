"""
Dependency Injection Container
Provides shared services, tools, and configurations to agents and routers
"""
import os
from typing import Dict, Any

# Import service layer
from app.services import (
    TwilioService,
    StripeService,
    WeatherService,
    PropertyService,
    StorageService,
    XactimateService,
    DocuSignService,
    LienItNowService
)


class Dependencies:
    """
    Central dependency container for the application
    Provides services, tools, and configurations to agents
    """
    
    def __init__(self):
        self.env = os.getenv("ENV", "development")
        self.database_url = os.getenv("DATABASE_URL")
        
        # API Keys
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        self.xai_api_key = os.getenv("XAI_API_KEY")
        
        # Core AI services
        self.llm = self._init_llm()
        self.vision = self._init_vision()
        
        # External services (from service layer)
        self.msg = TwilioService()
        self.payment = StripeService()
        self.weather_api = WeatherService()
        self.property_api = PropertyService()
        self.storage = StorageService()
        self.xact = XactimateService()
        self.docusign = DocuSignService()
        self.lien = LienItNowService()
        
        # Database service (inline for now)
        self.db = self._init_database_service()
        
        # Document storage (inline for now)
        self.doc_store = self._init_doc_store()
    
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
            
            print("✅ LLM: OpenAI (gpt-4o-mini)")
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
            
            print("✅ LLM: Anthropic (claude-3-5-sonnet)")
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
            
            print("✅ LLM: xAI (grok-2-1212)")
            return llm_call
        
        else:
            # Mock LLM for development
            async def mock_llm(prompt: str, model: str = "mock") -> str:
                """Mock LLM for development/testing"""
                return f"[MOCK LLM] Response to: {prompt[:50]}..."
            
            print("⚠️ LLM: Mock mode (no API key found)")
            return mock_llm
    
    def _init_vision(self):
        """Initialize AI vision service for damage detection"""
        class VisionService:
            def __init__(self, deps_ref):
                self.deps = deps_ref
            
            async def analyze(self, image_url: str) -> Dict[str, Any]:
                """Analyze image for damage using AI vision"""
                # Use Claude or GPT-4V for vision analysis
                if self.deps.anthropic_api_key:
                    from anthropic import AsyncAnthropic
                    client = AsyncAnthropic(api_key=self.deps.anthropic_api_key)
                    
                    response = await client.messages.create(
                        model="claude-3-5-sonnet-20241022",
                        max_tokens=1024,
                        messages=[{
                            "role": "user",
                            "content": [
                                {
                                    "type": "image",
                                    "source": {
                                        "type": "url",
                                        "url": image_url
                                    }
                                },
                                {
                                    "type": "text",
                                    "text": (
                                        "Analyze this property damage photo. Return JSON with:\n"
                                        "- damage_types: array of damage categories (roof, siding, window, etc)\n"
                                        "- severity: low/moderate/severe\n"
                                        "- estimated_cost: repair cost estimate in USD\n"
                                        "- notes: brief description of visible damage"
                                    )
                                }
                            ]
                        }]
                    )
                    
                    # Parse JSON from response
                    import json
                    result = json.loads(response.content[0].text)
                    return result
                
                elif self.deps.openai_api_key:
                    from openai import AsyncOpenAI
                    client = AsyncOpenAI(api_key=self.deps.openai_api_key)
                    
                    response = await client.chat.completions.create(
                        model="gpt-4o",
                        messages=[{
                            "role": "user",
                            "content": [
                                {
                                    "type": "image_url",
                                    "image_url": {"url": image_url}
                                },
                                {
                                    "type": "text",
                                    "text": (
                                        "Analyze this property damage photo. Return JSON with:\n"
                                        "- damage_types: array of damage categories\n"
                                        "- severity: low/moderate/severe\n"
                                        "- estimated_cost: repair cost estimate in USD\n"
                                        "- notes: brief description"
                                    )
                                }
                            ]
                        }],
                        response_format={"type": "json_object"}
                    )
                    
                    import json
                    return json.loads(response.choices[0].message.content)
                
                else:
                    # Mock vision for development
                    return {
                        "damage_types": ["roof_damage", "siding_damage"],
                        "severity": "moderate",
                        "estimated_cost": 12500,
                        "notes": "Visible roof shingle damage and siding impact. Water intrusion likely."
                    }
        
        return VisionService(self)
    
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
            
            async def create_claim(self, **kwargs):
                """Create insurance claim"""
                # TODO: Real database insert
                class MockClaim:
                    def __init__(self, **data):
                        self.id = f"CLM-{hash(str(data))}"
                        for k, v in data.items():
                            setattr(self, k, v)
                
                return MockClaim(**kwargs)
            
            async def update_claim_for_job(self, job_id: int, **updates):
                """Update claim with damage analysis"""
                # TODO: Real database update
                class MockClaim:
                    def __init__(self, job_id, **data):
                        self.id = f"CLM-{job_id}"
                        self.job_id = job_id
                        for k, v in data.items():
                            setattr(self, k, v)
                
                return MockClaim(job_id, **updates)
        
        return DatabaseService()
    
    def _init_doc_store(self):
        """Initialize document storage"""
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
                "llm": "configured" if self.llm else "not configured",
                "messaging": "configured" if hasattr(self.msg, 'client') and self.msg.client else "mock",
                "payment": "configured" if hasattr(self.payment, 'stripe') and self.payment.stripe else "mock",
                "weather": "configured",
                "property": "configured",
                "storage": "configured",
                "xactimate": "configured",
                "vision": "configured"
            }
        }


def build_dependencies() -> Dependencies:
    """Factory function to build dependencies"""
    deps = Dependencies()
    print("\n🔧 Dependencies Initialized")
    print(f"   Environment: {deps.env}")
    print(f"   Services: {len(deps.to_dict()['services'])} configured")
    return deps
