"""
Example usage of the Event Bus and Agent Orchestration system
"""
import asyncio
from app.utils.events import EventBus
from app.agents.supervisor import Supervisor
from app.deps import build_dependencies


async def example_weather_impact():
    """Example: Weather event triggers contractor deployment"""
    
    # Initialize
    deps = build_dependencies()
    bus = EventBus()
    supervisor = Supervisor(deps)
    
    # Subscribe supervisor to event bus
    bus.subscribe(supervisor.handle_event)
    
    # Publish WEATHER_IMPACT event
    event = {
        "type": "WEATHER_IMPACT",
        "data": {
            "state": "FL",
            "severity": "extreme",
            "storm_name": "Hurricane Milton"
        }
    }
    
    print("📡 Publishing WEATHER_IMPACT event...")
    await bus.publish(event)
    
    print(f"✅ Event published to {len(bus.handlers)} handler(s)")
    # → DispatchAgent broadcasts leads to contractors


async def example_media_uploaded():
    """Example: Photo upload triggers damage analysis"""
    
    deps = build_dependencies()
    bus = EventBus()
    supervisor = Supervisor(deps)
    bus.subscribe(supervisor.handle_event)
    
    # Publish MEDIA_UPLOADED event
    event = {
        "type": "MEDIA_UPLOADED",
        "data": {
            "job_id": 123,
            "media_url": "https://storage.example.com/damage-photo.jpg"
        }
    }
    
    print("📡 Publishing MEDIA_UPLOADED event...")
    await bus.publish(event)
    
    print(f"✅ Event published to {len(bus.handlers)} handler(s)")
    # → ClaimAgent analyzes damage and updates claim


async def example_invoice_disputed():
    """Example: Disputed invoice triggers negotiation"""
    
    deps = build_dependencies()
    bus = EventBus()
    supervisor = Supervisor(deps)
    bus.subscribe(supervisor.handle_event)
    
    # Publish INVOICE_DISPUTED event
    event = {
        "type": "INVOICE_DISPUTED",
        "data": {
            "requested_amount": 15000,
            "offered_amount": 10500
        }
    }
    
    print("📡 Publishing INVOICE_DISPUTED event...")
    await bus.publish(event)
    
    print(f"✅ Event published to {len(bus.handlers)} handler(s)")
    # → NegotiatorAgent prepares counter-offer rebuttal


async def example_direct_task():
    """Example: Direct task execution (not via event bus)"""
    
    deps = build_dependencies()
    supervisor = Supervisor(deps)
    
    # Call supervisor directly (task-based, not event-driven)
    task = {
        "type": "weather_analysis",
        "data": {
            "state": "FL",
            "city": "Miami"
        }
    }
    
    print("🎯 Executing direct task...")
    result = await supervisor.handle_event(task)
    
    print(f"✅ Result: {result}")


async def example_complete_workflow():
    """Example: Complete insurance claim workflow"""
    
    deps = build_dependencies()
    bus = EventBus()
    supervisor = Supervisor(deps)
    bus.subscribe(supervisor.handle_event)
    
    print("\n🚀 Starting complete insurance claim workflow...\n")
    
    # Step 1: Media uploaded
    print("1️⃣ Step 1: Homeowner uploads damage photos")
    await bus.publish({
        "type": "MEDIA_UPLOADED",
        "data": {
            "job_id": 456,
            "media_url": "https://storage.example.com/roof-damage.jpg"
        }
    })
    
    # Step 2: Create claim
    print("\n2️⃣ Step 2: Create insurance claim")
    claim_result = await supervisor.handle_event({
        "type": "create_claim",
        "data": {
            "address": "123 Storm Dr, Miami FL",
            "damage_type": "roof_damage",
            "estimated_cost": 15000
        }
    })
    print(f"   Claim created: {claim_result.get('claim_id')}")
    
    # Step 3: Insurer makes low offer
    print("\n3️⃣ Step 3: Insurer offers $10,500 (70% of requested $15,000)")
    
    # Step 4: Negotiate
    print("\n4️⃣ Step 4: AI negotiates counter-offer")
    await bus.publish({
        "type": "INVOICE_DISPUTED",
        "data": {
            "requested_amount": 15000,
            "offered_amount": 10500
        }
    })
    
    print("\n✅ Workflow complete! Claim submitted with AI-generated rebuttal.\n")


if __name__ == "__main__":
    print("=" * 60)
    print("Event Bus & Agent Orchestration Examples")
    print("=" * 60)
    
    # Run examples
    asyncio.run(example_weather_impact())
    print("\n" + "-" * 60 + "\n")
    
    asyncio.run(example_media_uploaded())
    print("\n" + "-" * 60 + "\n")
    
    asyncio.run(example_invoice_disputed())
    print("\n" + "-" * 60 + "\n")
    
    asyncio.run(example_direct_task())
    print("\n" + "-" * 60 + "\n")
    
    asyncio.run(example_complete_workflow())
