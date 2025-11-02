import os


class Deps:
    def __init__(self):
        self.llm = self._llm_client()
        self.vision = self._vision_client()
        self.db = self._db()
        self.msg = self._msg()
        self.storage = self._storage()
        self.xact = self._xact()
        self.payment = self._stripe()
        self.weather_api = self._weather()
        self.property_api = self._property()
        self.doc_store = self._docusign()
        self.lien = self._lien()
        self.compliance = self._compliance()
    
    def _llm_client(self):
        if os.getenv("OPENAI_API_KEY"):
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            
            async def openai_call(prompt: str):
                response = await client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}]
                )
                return response.choices[0].message.content
            
            print("✅ LLM: OpenAI")
            return openai_call
        
        elif os.getenv("ANTHROPIC_API_KEY"):
            from anthropic import AsyncAnthropic
            client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
            
            async def anthropic_call(prompt: str):
                response = await client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=4096,
                    messages=[{"role": "user", "content": prompt}]
                )
                # Extract text from TextBlock content
                from anthropic.types import TextBlock
                text = ""
                for block in response.content:
                    if isinstance(block, TextBlock):
                        text += block.text
                return text
            
            print("✅ LLM: Anthropic")
            return anthropic_call
        
        elif os.getenv("XAI_API_KEY"):
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=os.getenv("XAI_API_KEY"), base_url="https://api.x.ai/v1")
            
            async def xai_call(prompt: str):
                response = await client.chat.completions.create(
                    model="grok-2-1212",
                    messages=[{"role": "user", "content": prompt}]
                )
                return response.choices[0].message.content
            
            print("✅ LLM: xAI")
            return xai_call
        
        else:
            async def mock_call(prompt: str):
                return f"[MOCK] {prompt[:50]}..."
            print("⚠️ LLM: Mock mode")
            return mock_call
    
    def _vision_client(self):
        class Vision:
            async def analyze(self, image_url: str):
                return {"damage_types": ["roof"], "severity": "moderate", "cost": 12500}
        return Vision()
    
    def _db(self):
        class DB:
            async def find_contractors_for_region(self, region, scopes):
                class C:
                    def __init__(self, i, n, p, consent):
                        self.id = i
                        self.name = n
                        self.phone = p
                        self.consent_comm = consent
                
                return [
                    C(1, "ProStorm", "+15551234567", True),
                    C(2, "Emergency Repairs", "+15551234568", True),
                    C(3, "RapidResponse", "+15551234569", True),
                    C(4, "AllWeather", "+15551234570", False),
                ]
        return DB()
    
    def _msg(self):
        from app.services.twilio_svc import TwilioService
        return TwilioService()
    
    def _storage(self):
        class Store:
            async def save(self, key, content):
                return f"https://storage/{key}"
        return Store()
    
    def _xact(self):
        class Xact:
            async def estimate(self, breakdown):
                return {"total": 10500, "labor": 6000, "materials": 4500}
        return Xact()
    
    def _stripe(self):
        class Stripe:
            async def charge(self, amount, token):
                return {"success": True, "charge_id": "ch_mock"}
        return Stripe()
    
    def _weather(self):
        class Weather:
            async def get_forecast(self, lat, lon):
                return {"temp": 72, "conditions": "clear"}
        return Weather()
    
    def _property(self):
        class Property:
            async def lookup(self, address):
                return {"owner": "John Doe", "value": 350000}
        return Property()
    
    def _docusign(self):
        class DocuSign:
            async def send_for_signature(self, contract, email):
                return {"envelope_id": "env_mock", "status": "sent"}
        return DocuSign()
    
    def _lien(self):
        class Lien:
            async def calculate_deadline(self, state, trade, completion_date):
                return {"deadline": "2025-12-31", "days_remaining": 90}
        return Lien()
    
    def _compliance(self):
        from app.services.compliance_svc import ComplianceService
        return ComplianceService()


def build_dependencies():
    return Deps()
