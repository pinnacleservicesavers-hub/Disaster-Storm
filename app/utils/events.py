"""Event Bus - Pub/Sub for agent orchestration"""
import asyncio
from typing import Callable, Awaitable, Dict, Any, List


class EventBus:
    """
    Simple pub/sub event bus with parallel handler execution
    
    Usage:
        bus = EventBus()
        bus.subscribe(supervisor.handle_event)
        await bus.publish({"type": "WEATHER_IMPACT", ...})
    """
    
    def __init__(self):
        self.handlers: List[Callable[[Dict[str, Any]], Awaitable]] = []
    
    def subscribe(self, handler: Callable[[Dict[str, Any]], Awaitable]):
        """Subscribe handler to all events"""
        self.handlers.append(handler)
    
    async def publish(self, event: Dict[str, Any]):
        """Publish event to all handlers in parallel"""
        await asyncio.gather(*(h(event) for h in self.handlers))
