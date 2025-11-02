"""
Event Bus - Pub/Sub system for agent orchestration
"""
from typing import Callable, Awaitable, List, Dict, Any
import asyncio
from datetime import datetime


EventHandler = Callable[[Dict[str, Any]], Awaitable[Any]]


class EventBus:
    """
    Central event bus for publishing and subscribing to business events
    
    Usage:
        bus = EventBus()
        bus.subscribe(supervisor.handle_event)
        await bus.publish({"type": "WEATHER_IMPACT", "data": {...}})
    """
    
    def __init__(self):
        self._subscribers: List[EventHandler] = []
        self._event_log: List[Dict[str, Any]] = []
        self._max_log_size = 1000
    
    def subscribe(self, handler: EventHandler) -> None:
        """
        Subscribe an event handler to receive all events
        
        Args:
            handler: Async function that receives event dict
        """
        if handler not in self._subscribers:
            self._subscribers.append(handler)
            print(f"📡 Event handler subscribed ({len(self._subscribers)} total)")
    
    def unsubscribe(self, handler: EventHandler) -> None:
        """Remove event handler from subscriptions"""
        if handler in self._subscribers:
            self._subscribers.remove(handler)
            print(f"📡 Event handler unsubscribed ({len(self._subscribers)} remaining)")
    
    async def publish(self, event: Dict[str, Any]) -> List[Any]:
        """
        Publish event to all subscribers
        
        Args:
            event: Event dictionary with 'type' and 'data' fields
            
        Returns:
            List of results from all handlers
        """
        # Add timestamp if not present
        if "timestamp" not in event:
            event["timestamp"] = datetime.utcnow().isoformat()
        
        # Log event
        self._log_event(event)
        
        # Notify all subscribers in parallel
        if not self._subscribers:
            print(f"⚠️ Event published but no subscribers: {event.get('type')}")
            return []
        
        tasks = [handler(event) for handler in self._subscribers]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Log any errors
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                print(f"❌ Event handler {i} failed: {result}")
        
        return results
    
    def _log_event(self, event: Dict[str, Any]) -> None:
        """Store event in circular log buffer"""
        self._event_log.append({
            "event": event,
            "logged_at": datetime.utcnow().isoformat()
        })
        
        # Keep log size bounded
        if len(self._event_log) > self._max_log_size:
            self._event_log = self._event_log[-self._max_log_size:]
    
    def get_recent_events(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent events from log"""
        return self._event_log[-limit:]
    
    def get_event_count(self) -> int:
        """Get total events logged"""
        return len(self._event_log)
    
    def clear_log(self) -> None:
        """Clear event log (use for testing)"""
        self._event_log.clear()
        print("🧹 Event log cleared")
