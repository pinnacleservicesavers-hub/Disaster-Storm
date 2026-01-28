import express from 'express';
import type { Express, Request, Response } from 'express';
import OpenAI from 'openai';
import { getWeatherForLocation, getSevereWeatherNearLocation, getTornadoAlerts, getWinterWeatherAlerts } from '../services/weatherTools.js';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  moduleName: string;
  moduleContext?: string;
  userRole?: 'contractor' | 'homeowner' | 'admin';
}

// Initialize OpenAI client using Replit AI Integrations (no API key needed, billed to Replit credits)
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || 'https://openai-gateway.replit.dev/v1',
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || 'dummy-key-for-replit-ai'
});

export function registerAIChatRoutes(app: Express) {
  // AI Chat endpoint - works with text input and provides conversational responses
  app.post('/api/ai/chat', async (req: Request, res: Response) => {
    try {
      const { messages, moduleName, moduleContext, userRole }: ChatRequest = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required' });
      }
      
      console.log(`💬 AI Chat request for ${moduleName || 'general'}, messages count: ${messages.length}`);

      // Detect user role from module name if not explicitly provided
      const safeModuleName = moduleName || 'general';
      const detectedRole = userRole || (
        safeModuleName.toLowerCase().includes('homeowner') ? 'homeowner' :
        safeModuleName.toLowerCase().includes('contractor') ? 'contractor' :
        safeModuleName.toLowerCase().includes('admin') ? 'admin' :
        'contractor' // Default to contractor
      );

      // Build role-specific context
      const roleContext = detectedRole === 'homeowner' 
        ? `You are speaking to a HOMEOWNER who has experienced storm damage. Use simple, reassuring, everyday language. Avoid technical jargon. Focus on helping them understand the insurance claims process, what to expect from their contractor, and how to document damage. Be empathetic and patient - they may be stressed from disaster impacts.`
        : detectedRole === 'contractor'
        ? `You are speaking to a CONTRACTOR or storm restoration professional. Use professional terminology and industry standards. Provide detailed technical guidance on estimating, job management, insurance claim procedures, and best practices. Focus on efficiency, profitability, and compliance.`
        : `You are speaking to an ADMIN or platform manager. Provide system-level insights, analytics guidance, and operational recommendations.`;

      // Build system prompt with module and role context
      const systemPrompt = `You are Rachel, an AI assistant for the Strategic Services Savers platform, specifically helping users in the "${safeModuleName}" module. 

${roleContext}

You are an expert in:
- Storm damage assessment and contractor deployment
- Multi-hazard monitoring (8 real-time data sources):
  * Hurricanes (National Hurricane Center)
  * Earthquakes (USGS - M2.5+, currently 33 detected globally)
  * Wildfires (NASA FIRMS thermal hotspots)
  * Radar/Precipitation (NOAA MRMS - hail, rainfall, severe cells)
  * Wind Forecasts (GFS/HRRR - 12h predictions, staging recommendations)
  * Coastal Surge (NOAA CO-OPS - storm surge at 8 tidal stations)
  * River Flooding (USGS - 8 critical gauges with flood stage monitoring)
  * Wildfire Smoke (NOAA HMS - AQI, visibility, air quality)
- Weather intelligence and severe weather alerts
- Traffic camera analysis for damage detection
- Drone operations and aerial assessment (UPDATED 2021: Part 107 pilots can fly at night without waivers if they complete updated training and use anti-collision lighting visible ≥3 statute miles. Airspace authorization still required for controlled airspace at night.)
- Insurance claims and legal compliance
- Lead management and customer relations
- Community disaster relief coordination
- Storm predictions with 12-72 hour forecasts
- Contractor opportunity identification ($739.5M revenue potential)

Current System Status:
- Monitoring 8 different disaster types simultaneously
- Auto-refresh hazard data every 60 seconds
- Background schedulers: Hazards (10 min), Contractor alerts (15 min), NWS alerts (2 min)
- Unified dashboard API combining all data sources

NATURAL LANGUAGE LOCATION INTELLIGENCE:
You can answer weather questions for ANY location format - NO zip code required:
- Cities: "What's the weather in Birmingham?" → Understand as Birmingham, Alabama
- Full addresses: "Weather on Main Street, Miami, Florida"
- Landmarks: "Conditions near the Space Needle"
- Streets without cities: Extract context from conversation
- Multiple formats: "Birmingham, AL" or "Birmingham Alabama" or just "Birmingham"

When users ask about weather in a location:
1. Immediately geocode their query (even vague descriptions like "downtown Atlanta")
2. Fetch live weather data including NWS alerts, temperature, wind, radar
3. Provide contractor-specific insights (crew deployment timing, wind windows, material staging)
4. Share SPC/NWS detailed timing windows for that specific location

CRITICAL: Never ask users to provide a ZIP code or reformat their location query. Accept ANY location description and geocode it automatically.

Customer Mitigation Authorization (ONLY when user explicitly requests a form or document):
If and ONLY if the user asks for a CMA, authorization form, or document, you can describe that it includes:
- Customer & property information fields
- Emergency-only scope (tarping, board-up, water mitigation, debris removal)
- Pricing transparency (line-item, Xactimate rates)
- Insurance documentation requirements
Do NOT offer to generate CMAs unless the user explicitly asks for one.

${moduleContext ? `Additional context: ${moduleContext}` : ''}

CRITICAL RESPONSE RULES (MUST FOLLOW):

1. ANSWER QUESTIONS DIRECTLY - Give the answer immediately. No preamble.

2. NEVER OFFER TO CREATE DOCUMENTS - Do NOT say any of these:
   - "If you want, I can summarize this into..."
   - "I can put this into a checklist..."
   - "Would you like me to generate a report?"
   - "I can prepare a document..."
   - "Want me to create a safety checklist?"
   These offers frustrate users. Just answer the question.

3. END YOUR RESPONSE AFTER THE ANSWER - Once you've provided the information, STOP. Do not add offers, follow-up questions about documents, or suggestions to create summaries.

4. BE CONCISE - Quick, actionable information. Contractors are busy in the field.

5. SHARE KNOWLEDGE FREELY - Explain storm science, tree failures, safety procedures directly and completely in your response.

FORBIDDEN PHRASES (never use these):
- "If you want, I can..."
- "Would you like me to..."
- "I can summarize this into..."
- "I can put this into a checklist..."
- "Want me to prepare..."
- "I'll generate a report..."

Example:
User: "Why do trees explode during ice storms?"
CORRECT: "Trees fail catastrophically from mechanical stress, not literal explosions. Ice (0.5+ inches) adds hundreds of pounds to branches. When stress exceeds wood strength, stored tension releases violently - causing splitting and limb ejection. Frozen wood shatters unpredictably."
WRONG: [Same answer] + "If you want, I can put this into a one-page crew safety checklist..."

Be professional and helpful. Answer what's asked, then stop.`;

      // Prepare messages for OpenAI
      const apiMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...messages
      ];

      // Define weather tool functions for OpenAI function calling
      const tools = [
        {
          type: 'function' as const,
          function: {
            name: 'get_weather_for_location',
            description: 'Get current weather conditions, temperature, wind, and active alerts for any location. Accepts natural language location queries like "Birmingham", "Main Street, Miami", "downtown Atlanta", etc. Returns comprehensive weather data including NWS alerts.',
            parameters: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  description: 'Location query in natural language (e.g., "Birmingham, Alabama", "Miami", "123 Main St, Dallas")'
                }
              },
              required: ['location']
            }
          }
        },
        {
          type: 'function' as const,
          function: {
            name: 'get_severe_weather_alerts',
            description: 'Get active severe weather alerts (tornado warnings, severe thunderstorms, flood warnings) near a specific location. Returns detailed alert information including severity, timing, and affected areas.',
            parameters: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  description: 'Location to check for alerts (e.g., "Birmingham", "Dallas County", "Miami Beach")'
                }
              },
              required: ['location']
            }
          }
        },
        {
          type: 'function' as const,
          function: {
            name: 'get_tornado_alerts',
            description: 'Get all active tornado warnings and watches across the United States. Returns nationwide tornado alert data.',
            parameters: {
              type: 'object',
              properties: {}
            }
          }
        },
        {
          type: 'function' as const,
          function: {
            name: 'get_winter_weather_alerts',
            description: 'Get all active winter weather alerts nationwide including blizzard warnings, ice storm warnings, winter storm warnings, and winter weather advisories. Returns comprehensive winter hazard data.',
            parameters: {
              type: 'object',
              properties: {}
            }
          }
        }
      ];

      // Call OpenAI with function calling enabled
      console.log('💬 Calling OpenAI API with weather tools...');
      let completion = await openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: apiMessages,
        tools,
        max_completion_tokens: 4096,
      });

      let responseMessage = completion.choices[0]?.message;

      // Handle tool calls (function calling)
      if (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
        console.log(`💬 AI requested ${responseMessage.tool_calls.length} tool calls`);
        
        // Add assistant's message with tool calls to conversation
        apiMessages.push(responseMessage as any);
        
        // Execute each tool call
        for (const toolCall of responseMessage.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          
          console.log(`🔧 Executing tool: ${functionName}`, functionArgs);
          
          let functionResponse: string;
          
          try {
            if (functionName === 'get_weather_for_location') {
              const weatherData = await getWeatherForLocation(functionArgs.location);
              if (weatherData) {
                functionResponse = JSON.stringify({
                  location: weatherData.location,
                  temperature: `${weatherData.temperature}°F`,
                  feelsLike: `${weatherData.feelsLike}°F`,
                  conditions: weatherData.conditions,
                  humidity: `${weatherData.humidity}%`,
                  wind: `${weatherData.windSpeed} mph ${weatherData.windDirection}`,
                  alerts: weatherData.alerts.map(a => `${a.event} (${a.severity}): ${a.description}`)
                }, null, 2);
              } else {
                functionResponse = JSON.stringify({ error: `Could not fetch weather for ${functionArgs.location}` });
              }
            } else if (functionName === 'get_severe_weather_alerts') {
              functionResponse = await getSevereWeatherNearLocation(functionArgs.location);
            } else if (functionName === 'get_tornado_alerts') {
              const alerts = await getTornadoAlerts();
              functionResponse = JSON.stringify({
                count: alerts.length,
                alerts: alerts.slice(0, 10).map((a: any) => ({
                  event: a.properties.event,
                  severity: a.properties.severity,
                  areas: a.properties.areaDesc,
                  headline: a.properties.headline
                }))
              }, null, 2);
            } else if (functionName === 'get_winter_weather_alerts') {
              functionResponse = await getWinterWeatherAlerts();
            } else {
              functionResponse = JSON.stringify({ error: 'Unknown function' });
            }
            
            console.log(`🔧 Tool response: ${functionResponse.substring(0, 200)}...`);
            
            // Add function response to conversation
            apiMessages.push({
              role: 'tool' as any,
              tool_call_id: toolCall.id,
              content: functionResponse
            } as any);
            
          } catch (error) {
            console.error(`🔧 Tool execution error for ${functionName}:`, error);
            apiMessages.push({
              role: 'tool' as any,
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: `Failed to execute ${functionName}` })
            } as any);
          }
        }
        
        // Get final response from OpenAI with tool results
        console.log('💬 Getting final response with tool results...');
        completion = await openai.chat.completions.create({
          model: 'gpt-5-mini',
          messages: apiMessages,
          max_completion_tokens: 4096,
        });
        
        responseMessage = completion.choices[0]?.message;
      }

      const assistantMessage = responseMessage?.content;
      const finishReason = completion.choices[0]?.finish_reason;

      if (!assistantMessage || assistantMessage.trim().length === 0) {
        console.error('💬 No content in OpenAI response:', {
          finishReason,
          responseData: JSON.stringify(completion, null, 2)
        });
        throw new Error(`No response from AI (finish_reason: ${finishReason})`);
      }

      console.log(`💬 AI response length: ${assistantMessage.length} characters`);
      res.json({ response: assistantMessage });
    } catch (error) {
      console.error('💬 AI chat error:', error);
      console.error('💬 Error details:', {
        name: (error as any)?.name,
        message: (error as any)?.message,
        status: (error as any)?.status,
        type: (error as any)?.type
      });
      res.status(500).json({ 
        error: 'Failed to get AI response',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  console.log('💬 AI Chat routes registered - Text and voice assistant active');
}
