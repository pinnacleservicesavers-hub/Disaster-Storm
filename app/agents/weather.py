"""Weather Agent - Weather analysis for contractor deployment"""
from typing import Dict, Any


class WeatherAgent:
    """Analyzes weather patterns for contractor deployment decisions"""
    
    def __init__(self, deps):
        self.llm = deps.llm
        self.weather_api = deps.weather_api
    
    async def analyze(self, evt: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze weather for deployment decisions
        evt: {state, city, radius_mi}
        """
        state = evt.get("state")
        city = evt.get("city")
        
        # Fetch current alerts
        alerts = await self.weather_api.get_alerts(state, city)
        
        # LLM analysis for deployment recommendation
        recommendation = await self.llm(
            f"Weather alerts for {city}, {state}: {alerts}. "
            f"Should contractors deploy? Consider severity, timing, opportunity. "
            f"Return JSON: {{deploy:bool, severity:str, reason:str}}"
        )
        
        return {
            "alerts": alerts,
            "recommendation": recommendation
        }
