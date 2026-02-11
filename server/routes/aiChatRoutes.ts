import express from 'express';
import type { Express, Request, Response } from 'express';
import OpenAI from 'openai';
import fetch from 'node-fetch';
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

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || 'https://openai-gateway.replit.dev/v1',
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || 'dummy-key-for-replit-ai'
});

async function searchDisasterNews(query: string): Promise<string> {
  try {
    const xaiKey = process.env.XAI_API_KEY;
    if (!xaiKey) {
      return JSON.stringify({ error: 'Search not available - XAI_API_KEY not configured' });
    }

    console.log(`🔍 Searching disaster news with Grok web_search: "${query}"`);

    const response = await fetch('https://api.x.ai/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${xaiKey}`
      },
      body: JSON.stringify({
        model: 'grok-4-1-fast-non-reasoning',
        tools: [{ type: 'web_search' }],
        input: `Search the web for current, specific factual details about this disaster/emergency situation. Include named storms, dates, areas affected, cause, current status, and restoration progress. Cite sources: ${query}`,
        temperature: 0.3,
        max_output_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`🔍 Grok web search API error: ${response.status}`, errorText);
      return JSON.stringify({ error: `Search API returned ${response.status}`, details: errorText.substring(0, 500) });
    }

    const data = await response.json() as any;
    let textContent = '';
    const outputItems = data.output || [];
    for (const item of outputItems) {
      if (item.type === 'message' && item.content) {
        for (const part of item.content) {
          if (part.type === 'output_text' && part.text) {
            textContent += part.text + '\n';
          }
        }
      }
    }

    if (textContent.trim()) {
      console.log(`🔍 Grok web search returned ${textContent.length} chars`);
      return textContent.trim();
    }
    
    return JSON.stringify({ error: 'No web search results found' });
  } catch (error) {
    console.error('🔍 Disaster news search error:', error);
    return JSON.stringify({ error: 'Search failed', message: (error as Error).message });
  }
}

async function getUtilityOutageInfo(location: string): Promise<string> {
  try {
    const xaiKey = process.env.XAI_API_KEY;
    if (!xaiKey) {
      return JSON.stringify({ error: 'Outage lookup not available - XAI_API_KEY not configured' });
    }

    console.log(`⚡ Looking up utility outage info for: "${location}"`);

    const response = await fetch('https://api.x.ai/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${xaiKey}`
      },
      body: JSON.stringify({
        model: 'grok-4-1-fast-non-reasoning',
        tools: [{ type: 'web_search' }],
        input: `Search the web for current power outage information in ${location}. How many customers are affected, what caused the outages (name specific storms/events), what is the utility company doing, and what is the restoration status and timeline? Cite sources.`,
        temperature: 0.3,
        max_output_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`⚡ Grok outage search API error: ${response.status}`, errorText);
      return JSON.stringify({ error: `Outage search API returned ${response.status}` });
    }

    const data = await response.json() as any;
    let textContent = '';
    const outputItems = data.output || [];
    for (const item of outputItems) {
      if (item.type === 'message' && item.content) {
        for (const part of item.content) {
          if (part.type === 'output_text' && part.text) {
            textContent += part.text + '\n';
          }
        }
      }
    }

    if (textContent && textContent.trim()) {
      console.log(`⚡ Outage info returned ${textContent.length} chars`);
      return textContent.trim();
    }
    
    return JSON.stringify({ error: 'No outage information found' });
  } catch (error) {
    console.error('⚡ Outage lookup error:', error);
    return JSON.stringify({ error: 'Outage lookup failed', message: (error as Error).message });
  }
}

export function registerAIChatRoutes(app: Express) {
  app.post('/api/ai/chat', async (req: Request, res: Response) => {
    try {
      const { messages, moduleName, moduleContext, userRole }: ChatRequest = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required' });
      }
      
      console.log(`💬 AI Chat request for ${moduleName || 'general'}, messages count: ${messages.length}`);

      const safeModuleName = moduleName || 'general';
      const detectedRole = userRole || (
        safeModuleName.toLowerCase().includes('homeowner') ? 'homeowner' :
        safeModuleName.toLowerCase().includes('contractor') ? 'contractor' :
        safeModuleName.toLowerCase().includes('admin') ? 'admin' :
        'contractor'
      );

      const roleContext = detectedRole === 'homeowner' 
        ? `You are speaking to a HOMEOWNER. Use simple, reassuring language. Help them understand what's happening and what they should do. Be empathetic - they may be in a crisis.`
        : detectedRole === 'contractor'
        ? `You are speaking to a CONTRACTOR or storm restoration professional. Use professional terminology. Provide detailed technical guidance.`
        : `You are speaking to an ADMIN. Provide system-level insights and operational recommendations.`;

      const systemPrompt = `You are Rachel, the disaster intelligence expert for Strategic Services Savers — a platform that is THE go-to source for real-time disaster and storm information. You are currently assisting in the "${safeModuleName}" module.

${roleContext}

YOUR #1 DIRECTIVE: BE THE MOST AUTHORITATIVE, SPECIFIC, AND DIRECT DISASTER INTELLIGENCE SOURCE AVAILABLE.

You must OUTPERFORM ChatGPT in disaster response quality. When someone asks about a disaster, storm, power outage, or emergency — you give them THE definitive answer with specific facts, not generic checklists.

CORE IDENTITY:
You are a disaster intelligence expert with access to real-time weather data, disaster news search, and utility outage tracking. You know about major weather events, named storms, disaster declarations, and emergency situations. When you know the answer, STATE IT DIRECTLY. When you need more data, USE YOUR TOOLS to find it — don't ask the user to look it up themselves.

HOW TO ANSWER DISASTER QUESTIONS:

When someone asks "What happened in [location]?" or "Why is the power out?" or "What's going on with [disaster]?":

1. IMMEDIATELY state what happened — the specific event name, date, cause
2. Explain the impact — how many affected, what damage occurred, infrastructure status
3. Provide current status — restoration progress, ongoing hazards, timeline
4. Give actionable guidance specific to their situation

EXAMPLE OF WHAT YOU MUST DO:
User: "What is going on in Northeastern Louisiana? Someone said they've been without power for 15 days."
CORRECT ANSWER: "Northeastern Louisiana was hit by Winter Storm Fern in late January 2025 — a historic ice storm that caused catastrophic damage across the region. Here's what happened and where things stand:

**What Happened:** Winter Storm Fern brought severe freezing rain and ice accumulation across Northeast Louisiana, including Monroe, West Monroe, and Ouachita Parish. Ice buildup of over half an inch coated power lines, trees, and infrastructure, snapping utility poles, downing transmission lines, and destroying transformers.

**Why Power Stayed Out So Long:** The ice damage was so extensive that Entergy Louisiana had to rebuild entire sections of the distribution grid — not just flip switches back on. Below-freezing temperatures prevented ice from melting, causing continued damage even as crews worked. Some customers also had damage to their own electrical equipment (meters, panels) that had to be repaired by licensed electricians before the utility could reconnect.

**Current Status:** Most customers had power restored after 10-11 days, but some isolated areas waited longer due to localized infrastructure damage. Mutual-aid crews from multiple states were deployed. Entergy worked section by section for safety — sometimes restoring power temporarily, then shutting it down again to complete permanent repairs.

**If You're Still Without Power:** Contact Entergy Louisiana directly. If your meter or panel was damaged, you'll need a licensed electrician to make repairs before the utility can reconnect. Check your parish emergency management office for shelter and supply locations."

WHAT YOU MUST NEVER DO:
- NEVER say "most likely caused by..." when you can determine the actual cause — USE YOUR SEARCH TOOLS
- NEVER give a generic checklist of "possible causes" when a specific event occurred
- NEVER repeatedly ask the user for more location details when you can search for the answer yourself
- NEVER say "I could not pull live feeds" — use your tools to find the information
- NEVER respond with bullet-point checklists when a narrative explanation is clearer
- NEVER say "if you give me the town I can look it up" — LOOK IT UP YOURSELF using the search tools

RESPONSE FORMAT:
- Write in clear, informative NARRATIVE paragraphs — like a knowledgeable expert briefing someone
- Use bold headers to organize sections when the answer is detailed
- Include specific names, dates, numbers, and facts
- Be direct and authoritative — you ARE the expert
- After giving the complete answer, STOP. Don't offer to create documents or ask unnecessary follow-up questions.

TOOLS AVAILABLE:
- search_disaster_news: Search for specific disaster events, storms, emergencies, outage causes, and current status. USE THIS when users ask about what happened somewhere.
- get_utility_outage_info: Get current power outage status, restoration progress, and utility response for a specific area. USE THIS for power outage questions.
- get_weather_for_location: Get current weather conditions and NWS alerts for any location.
- get_severe_weather_alerts: Get active severe weather alerts near a location.
- get_tornado_alerts: Get nationwide tornado warnings and watches.
- get_winter_weather_alerts: Get nationwide winter weather alerts.

TOOL USAGE RULES:
- When someone asks about a disaster or emergency, ALWAYS use search_disaster_news FIRST to get specific facts
- When someone asks about power outages, use BOTH search_disaster_news AND get_utility_outage_info
- When someone asks about current weather, use the weather tools
- COMBINE information from multiple tools to give a comprehensive answer
- NEVER tell the user you couldn't find information without first trying ALL relevant tools

NATURAL LANGUAGE LOCATION INTELLIGENCE:
Accept ANY location format — cities, regions, states, landmarks, addresses. Never ask for ZIP codes. If someone says "Northeastern Louisiana," search for that exact phrase. If someone says "downtown Atlanta," geocode it automatically.

${moduleContext ? `Additional module context: ${moduleContext}` : ''}

DATA INTEGRITY RULES:
- When your search tools return specific facts (storm names, dates, numbers, sources), USE those facts in your answer
- When search results include source URLs or news outlet names, mention them so users know where the information comes from
- If your search tools cannot find information about a specific event, say "Based on available information..." rather than fabricating details
- NEVER invent specific numbers, dates, or statistics — only state facts that came from your tool results or that you are highly confident about
- If you're uncertain about specifics, say so honestly, but still provide whatever verified information you found

FORBIDDEN BEHAVIORS:
- Giving vague "most likely" answers when you can search for the real answer
- Asking users to check websites themselves (YOU check for them using tools)
- Responding with generic safety checklists instead of specific disaster intelligence
- Saying "I don't have access to live data" — you DO have tools, USE THEM
- Offering to create documents, reports, or checklists unless explicitly asked
- Adding "Would you like me to..." or "If you want, I can..." at the end of responses
- Repeating "give me your specific location" multiple times — search broadly first, then narrow down
- Fabricating specific casualty numbers, dollar amounts, or restoration percentages that weren't in your search results

You are the disaster intelligence expert. Act like one. Be authoritative when you have facts. Be specific. Be direct.`;

      const apiMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...messages
      ];

      const tools = [
        {
          type: 'function' as const,
          function: {
            name: 'search_disaster_news',
            description: 'Search for specific information about disaster events, storms, emergencies, power outages, and their causes. Use this whenever a user asks about what happened in a location, why power is out, what storm hit an area, or any disaster-related question. This searches real-time news and information sources. Always search broadly first (e.g., "Northeastern Louisiana power outage winter storm 2025") before asking the user for more details.',
            parameters: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Detailed search query about the disaster event (e.g., "Winter storm power outage Northeast Louisiana January 2025", "earthquake damage Southern California", "hurricane Florida current status")'
                }
              },
              required: ['query']
            }
          }
        },
        {
          type: 'function' as const,
          function: {
            name: 'get_utility_outage_info',
            description: 'Get current power outage information for a specific area including number of customers affected, cause, utility company response, restoration timeline, and mutual aid deployment. Use this whenever users ask about power outages.',
            parameters: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  description: 'Location to check for outages (e.g., "Northeast Louisiana", "Monroe Louisiana", "Ouachita Parish")'
                }
              },
              required: ['location']
            }
          }
        },
        {
          type: 'function' as const,
          function: {
            name: 'get_weather_for_location',
            description: 'Get current weather conditions, temperature, wind, and active NWS alerts for any location.',
            parameters: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  description: 'Location in natural language (e.g., "Birmingham, Alabama", "Miami", "Northeast Louisiana")'
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
            description: 'Get active severe weather alerts near a specific location including tornado warnings, severe thunderstorms, flood warnings.',
            parameters: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  description: 'Location to check for alerts'
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
            description: 'Get all active tornado warnings and watches across the United States.',
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
            description: 'Get all active winter weather alerts nationwide.',
            parameters: {
              type: 'object',
              properties: {}
            }
          }
        }
      ];

      console.log('💬 Calling OpenAI API with enhanced disaster intelligence tools...');
      let completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: apiMessages,
        tools,
        max_completion_tokens: 4096,
      });

      let responseMessage = completion.choices[0]?.message;
      let toolCallRound = 0;
      const maxToolRounds = 1;

      while (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0 && toolCallRound < maxToolRounds) {
        toolCallRound++;
        console.log(`💬 Tool call round ${toolCallRound}: ${responseMessage.tool_calls.length} calls`);
        
        apiMessages.push(responseMessage as any);
        
        const toolPromises = responseMessage.tool_calls.map(async (toolCall: any) => {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          
          console.log(`🔧 Executing tool: ${functionName}`, functionArgs);
          
          let functionResponse: string;
          
          try {
            if (functionName === 'search_disaster_news') {
              functionResponse = await searchDisasterNews(functionArgs.query);
            } else if (functionName === 'get_utility_outage_info') {
              functionResponse = await getUtilityOutageInfo(functionArgs.location);
            } else if (functionName === 'get_weather_for_location') {
              const weatherData = await getWeatherForLocation(functionArgs.location);
              if (weatherData) {
                functionResponse = JSON.stringify({
                  location: weatherData.location,
                  temperature: `${weatherData.temperature}°F`,
                  feelsLike: `${weatherData.feelsLike}°F`,
                  conditions: weatherData.conditions,
                  humidity: `${weatherData.humidity}%`,
                  wind: `${weatherData.windSpeed} mph ${weatherData.windDirection}`,
                  alerts: weatherData.alerts.map((a: any) => `${a.event} (${a.severity}): ${a.description}`)
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
            
            console.log(`🔧 Tool response (${functionName}): ${functionResponse.substring(0, 300)}...`);
          } catch (error) {
            console.error(`🔧 Tool execution error for ${functionName}:`, error);
            functionResponse = JSON.stringify({ error: `Failed to execute ${functionName}` });
          }
          
          return {
            role: 'tool' as any,
            tool_call_id: toolCall.id,
            content: functionResponse
          };
        });
        
        const toolResults = await Promise.all(toolPromises);
        apiMessages.push(...toolResults as any[]);
        
        console.log(`💬 Getting response after tool round ${toolCallRound}...`);
        completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: apiMessages,
          max_completion_tokens: 4096,
        });
        
        responseMessage = completion.choices[0]?.message;
      }

      let assistantMessage = responseMessage?.content;
      const finishReason = completion.choices[0]?.finish_reason;

      if ((!assistantMessage || assistantMessage.trim().length === 0) && finishReason === 'tool_calls') {
        console.log('💬 Tool rounds exhausted, forcing final answer without tools...');
        apiMessages.push({
          role: 'user' as any,
          content: 'The search tools were unable to return results. Please provide the best answer you can based on your own knowledge about this topic. Be direct and specific. If you are not certain about specific details, say so, but still give the most helpful answer possible.'
        });
        
        completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: apiMessages,
          max_completion_tokens: 4096,
        });
        
        assistantMessage = completion.choices[0]?.message?.content;
      }

      if (!assistantMessage || assistantMessage.trim().length === 0) {
        console.error('💬 No content in response:', { finishReason });
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

  console.log('💬 AI Chat routes registered - Enhanced disaster intelligence active');
}
