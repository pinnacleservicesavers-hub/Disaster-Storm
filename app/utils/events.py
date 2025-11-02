"""Event Bus - Pub/Sub for agent orchestration"""
from typing import Callable, Dict, Any, List


class EventBus:
    """
    Simple pub/sub event bus
    
    Usage:
        bus = EventBus()
        bus.subscribe(supervisor.handle_event)
        await bus.publish({"type": "WEATHER_IMPACT", ...})
    """
    
    def __init__(self):
        self.handlers: List[Callable] = []
    
    def subscribe(self, handler: Callable):
        """Subscribe handler to all events"""
        self.handlers.append(handler)
    
    async def publish(self, event: Dict[str, Any]) -> List[Any]:
        """Publish event to all handlers, return results"""
        results = []
        for h in self.handlers:
            result = await h(event)
            results.append(result)
        return results
