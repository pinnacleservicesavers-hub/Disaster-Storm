"""
Event Bus - Pub/Sub system for agent orchestration
"""
import asyncio
from typing import Callable, Awaitable, Dict, Any, List


class EventBus:
    """
    Central event bus for publishing and subscribing to business events
    
    Usage:
        bus = EventBus()
        bus.subscribe(supervisor.handle_event)
        await bus.publish({"type": "WEATHER_IMPACT", "data": {...}})
    """
    
    def __init__(self):
        self.handlers: List[Callable[[Dict[str, Any]], Awaitable]] = []
    
    def subscribe(self, handler: Callable[[Dict[str, Any]], Awaitable]):
        """Subscribe an event handler to receive all events"""
        self.handlers.append(handler)
    
    async def publish(self, event: Dict[str, Any]):
        """Publish event to all subscribers in parallel"""
        await asyncio.gather(*(h(event) for h in self.handlers))
