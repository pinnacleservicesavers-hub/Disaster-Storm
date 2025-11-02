# Orchestration System - Quick Start Examples

## Basic Usage

### 1. Weather Analysis (Single Agent)

Analyze weather conditions for contractor deployment:

```bash
curl -X POST http://localhost:5000/api/orchestration/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "weather_analysis",
    "data": {
      "state": "FL",
      "city": "Miami"
    },
    "priority": "high"
  }'
```

**Expected Response:**
```json
{
  "taskId": "task-xyz",
  "success": true,
  "result": {
    "alerts": [
      {
        "type": "Hurricane Warning",
        "severity": "extreme",
        "description": "Hurricane conditions expected within 36 hours"
      }
    ],
    "forecast": {
      "temperature": 82,
      "windSpeed": 45,
      "conditions": "Deteriorating"
    },
    "recommendations": [
      "Deploy contractors immediately",
      "Stock emergency supplies",
      "Prepare for power outages"
    ]
  },
  "metadata": {
    "handledBy": "WeatherAgent",
    "toolsUsed": ["weather_data"]
  }
}
```

---

### 2. Contractor Dispatch (Single Agent)

Send emergency job notification to contractor:

```bash
curl -X POST http://localhost:5000/api/orchestration/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "dispatch_contractor",
    "data": {
      "contractorPhone": "+15551234567",
      "contractorId": "contractor-123",
      "jobId": "job-456",
      "jobDescription": "Emergency roof repair",
      "address": "123 Storm Ave, Miami FL",
      "priority": "urgent"
    },
    "priority": "urgent"
  }'
```

**Expected Response:**
```json
{
  "taskId": "task-abc",
  "success": true,
  "result": {
    "dispatched": true,
    "contractorId": "contractor-123",
    "jobId": "job-456",
    "notified": {
      "mock": true,
      "to": "+15551234567",
      "messageId": "mock-12345",
      "status": "sent"
    },
    "estimatedArrival": "15 minutes"
  },
  "metadata": {
    "handledBy": "DispatchAgent",
    "toolsUsed": ["twilio_sms"]
  }
}
```

---

### 3. Image Damage Analysis (Single Agent)

Analyze damage photos using AI vision:

```bash
curl -X POST http://localhost:5000/api/orchestration/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "analyze_image",
    "data": {
      "imageUrl": "https://storage.example.com/damage-photo.jpg",
      "jobId": "job-789"
    },
    "priority": "high"
  }'
```

**Expected Response:**
```json
{
  "taskId": "task-def",
  "success": true,
  "result": {
    "imageUrl": "https://storage.example.com/damage-photo.jpg",
    "damageDetected": true,
    "damageTypes": ["roof_damage", "siding_damage", "window_damage"],
    "severity": "severe",
    "confidence": 0.92,
    "boundingBoxes": [
      {
        "x": 120,
        "y": 45,
        "width": 200,
        "height": 150,
        "label": "roof_damage",
        "confidence": 0.95
      }
    ],
    "estimatedCost": 18500,
    "recommendations": [
      "Immediate tarp installation required",
      "Replace entire roof section",
      "Check for structural damage"
    ]
  },
  "metadata": {
    "handledBy": "VisionAgent",
    "toolsUsed": ["storage"]
  }
}
```

---

### 4. Insurance Claim Negotiation (Single Agent)

Analyze insurer offer and generate counter-offer:

```bash
curl -X POST http://localhost:5000/api/orchestration/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "negotiate_claim",
    "data": {
      "claimId": "CLM-2024-001",
      "requestedAmount": 18500,
      "offeredAmount": 12000,
      "damageType": "roof_damage"
    },
    "priority": "medium"
  }'
```

**Expected Response:**
```json
{
  "taskId": "task-ghi",
  "success": true,
  "result": {
    "analysis": {
      "percentage": 64.9,
      "gap": 6500,
      "acceptability": "unacceptable"
    },
    "counterOffer": 17205,
    "justification": "Based on market comparables and documented damage, the requested amount of $18,500 is justified. The insurer's offer of $12,000 (64.9%) does not adequately cover restoration costs. We counter with $17,205.",
    "strategy": "escalate_with_formal_rebuttal",
    "nextSteps": [
      "Submit formal counter-offer with documentation",
      "Provide independent contractor estimates",
      "Request adjuster re-inspection",
      "Cite policy coverage clauses"
    ]
  },
  "metadata": {
    "handledBy": "NegotiatorAgent"
  }
}
```

---

## Multi-Agent Workflows

### 5. Complete Insurance Claim Workflow

**Agents Involved:** ClaimAgent → NegotiatorAgent

```bash
curl -X POST http://localhost:5000/api/orchestration/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "insurance_claim",
    "data": {
      "address": "789 Storm Dr, Miami FL",
      "damageType": "roof_damage",
      "estimatedCost": 15000,
      "insurerOffer": 10500
    }
  }'
```

**Expected Response:**
```json
{
  "scenario": "insurance_claim",
  "results": [
    {
      "step": "create_claim",
      "result": {
        "claimId": "CLM-2024-12345",
        "property": {
          "address": "789 Storm Dr, Miami FL",
          "coordinates": {
            "lat": 25.7617,
            "lon": -80.1918
          },
          "propertyType": "Single Family Residential",
          "yearBuilt": 1985,
          "squareFeet": 2100,
          "bedrooms": 3,
          "bathrooms": 2
        },
        "valuation": {
          "estimatedValue": 385000,
          "taxAssessedValue": 350000
        },
        "damageType": "roof_damage",
        "estimatedCost": 15000,
        "status": "draft"
      }
    },
    {
      "step": "negotiate_claim",
      "result": {
        "counterOffer": 13950,
        "justification": "Based on property value ($385k) and market data...",
        "strategy": "escalate_with_formal_rebuttal"
      }
    }
  ],
  "success": true,
  "timestamp": "2025-11-02T15:30:09.898Z"
}
```

**What Happens:**
1. **ClaimAgent** uses PropertyDataTool to fetch property details
2. **ClaimAgent** creates claim with complete property information
3. **NegotiatorAgent** analyzes $10.5k offer vs $15k request (70%)
4. **NegotiatorAgent** generates $13,950 counter-offer (93% of requested)

---

### 6. Storm Response Workflow

**Agents Involved:** WeatherAgent → DispatchAgent

```bash
curl -X POST http://localhost:5000/api/orchestration/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "storm_response",
    "data": {
      "state": "FL",
      "city": "Tampa",
      "contractorPhone": "+15559876543",
      "contractorId": "contractor-789",
      "address": "456 Hurricane Blvd, Tampa FL"
    }
  }'
```

**Expected Response:**
```json
{
  "scenario": "storm_response",
  "results": [
    {
      "step": "analyze_weather",
      "result": {
        "alerts": [...],
        "severity": "extreme",
        "deploymentRecommended": true
      }
    },
    {
      "step": "dispatch_contractor",
      "result": {
        "dispatched": true,
        "notified": {
          "to": "+15559876543",
          "status": "sent"
        },
        "estimatedArrival": "20 minutes"
      }
    }
  ],
  "success": true
}
```

---

### 7. Complete Damage Assessment Workflow

**Agents Involved:** VisionAgent → ClaimAgent → NegotiatorAgent

```bash
curl -X POST http://localhost:5000/api/orchestration/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "damage_assessment",
    "data": {
      "imageUrl": "https://storage.example.com/damage.jpg",
      "address": "123 Main St, Miami FL",
      "insurerOffer": 8000
    }
  }'
```

**Expected Flow:**
1. **VisionAgent** analyzes image → detects $15k in damages
2. **ClaimAgent** creates claim with property data
3. **NegotiatorAgent** compares $8k offer vs $15k estimate → counters with $13,950

---

## Event Tracking

### 8. View Recent Events

```bash
curl http://localhost:5000/api/orchestration/events?limit=20
```

**Response:**
```json
{
  "events": [
    {
      "event": "task.routed",
      "data": {
        "task": "claim-123",
        "specialist": "ClaimAgent",
        "timestamp": "2025-11-02T15:30:09.341Z"
      },
      "timestamp": "2025-11-02T15:30:09.341Z"
    },
    {
      "event": "tool.used",
      "data": {
        "agent": "ClaimAgent",
        "tool": "property_data",
        "success": true
      },
      "timestamp": "2025-11-02T15:30:09.897Z"
    },
    {
      "event": "task.completed",
      "data": {
        "task": "claim-123",
        "specialist": "ClaimAgent",
        "success": true
      },
      "timestamp": "2025-11-02T15:30:10.123Z"
    }
  ],
  "total": 56
}
```

---

## Advanced Examples

### 9. Legal Contract Validation

```bash
curl -X POST http://localhost:5000/api/orchestration/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "validate_contract",
    "data": {
      "state": "FL",
      "contractType": "AOB",
      "propertyType": "residential"
    }
  }'
```

### 10. Payment Processing

```bash
curl -X POST http://localhost:5000/api/orchestration/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "process_payment",
    "data": {
      "amount": 12500,
      "currency": "USD",
      "customerId": "cus_123",
      "jobId": "job-456"
    }
  }'
```

### 11. Financial Invoice Creation

```bash
curl -X POST http://localhost:5000/api/orchestration/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "create_invoice",
    "data": {
      "jobId": "job-789",
      "lineItems": [
        {
          "description": "Emergency roof repair",
          "quantity": 1,
          "unitPrice": 8500
        },
        {
          "description": "Materials",
          "quantity": 1,
          "unitPrice": 4000
        }
      ],
      "customerId": "customer-123"
    }
  }'
```

---

## Testing Scenarios

### Complete End-to-End Test

```bash
# 1. Check available specialists
curl http://localhost:5000/api/orchestration/specialists

# 2. Analyze weather
curl -X POST http://localhost:5000/api/orchestration/orchestrate \
  -H "Content-Type: application/json" \
  -d '{"type":"weather_analysis","data":{"state":"FL"}}'

# 3. Dispatch contractor
curl -X POST http://localhost:5000/api/orchestration/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "type":"dispatch_contractor",
    "data":{
      "contractorPhone":"+15551234567",
      "contractorId":"contractor-123",
      "jobId":"job-456"
    }
  }'

# 4. Analyze damage image
curl -X POST http://localhost:5000/api/orchestration/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "type":"analyze_image",
    "data":{"imageUrl":"https://example.com/damage.jpg"}
  }'

# 5. Run insurance claim workflow
curl -X POST http://localhost:5000/api/orchestration/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "scenario":"insurance_claim",
    "data":{
      "address":"123 Main St, Miami FL",
      "damageType":"roof_damage",
      "estimatedCost":15000,
      "insurerOffer":10500
    }
  }'

# 6. Check event logs
curl http://localhost:5000/api/orchestration/events?limit=50
```

---

## Error Handling

### Invalid Task Type
```bash
curl -X POST http://localhost:5000/api/orchestration/orchestrate \
  -H "Content-Type: application/json" \
  -d '{"type":"invalid_task","data":{}}'
```

**Response:**
```json
{
  "taskId": "task-xyz",
  "success": false,
  "error": "No suitable agent found for task type: invalid_task"
}
```

### Missing Required Data
```bash
curl -X POST http://localhost:5000/api/orchestration/orchestrate \
  -H "Content-Type: application/json" \
  -d '{"type":"dispatch_contractor"}'
```

**Response:**
```json
{
  "error": "Validation failed",
  "issues": ["type is required"]
}
```

---

## Performance Benchmarks

Based on testing with mock data:

| Operation | Avg Time | Notes |
|-----------|----------|-------|
| Single agent task | 150-300ms | Includes routing + execution |
| 2-agent workflow | 400-600ms | Sequential execution |
| 3-agent workflow | 650-900ms | With property lookups |
| Event logging | <5ms | Per event |
| Tool execution | 50-200ms | Depends on tool type |

---

## Next Steps

1. **Integrate Real APIs**: Replace mock tools with production integrations
2. **Add Authentication**: Secure endpoints with JWT/sessions
3. **Enable WebSocket Events**: Real-time event streaming
4. **Create UI Dashboard**: Visual workflow builder
5. **Add Agent Learning**: Store successful strategies for future use

---

For complete documentation, see `ORCHESTRATION.md`
