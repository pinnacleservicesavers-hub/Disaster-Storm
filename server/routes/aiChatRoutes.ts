import express from 'express';
import type { Express, Request, Response } from 'express';

const OPENAI_BASE_URL = 'https://openrouter.ai.replit.dev/v1';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  moduleName: string;
  moduleContext?: string;
}

export function registerAIChatRoutes(app: Express) {
  // AI Chat endpoint - works with text input and provides conversational responses
  app.post('/api/ai/chat', async (req: Request, res: Response) => {
    try {
      const { messages, moduleName, moduleContext }: ChatRequest = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required' });
      }

      // Build system prompt with module context
      const systemPrompt = `You are an AI assistant for the Disaster Direct storm operations platform, specifically helping users in the "${moduleName}" module. 

You are an expert in:
- Storm damage assessment and contractor deployment
- Weather monitoring and severe weather alerts
- Traffic camera analysis for damage detection
- Drone operations and aerial assessment
- Insurance claims and legal compliance
- Lead management and customer relations
- Community disaster relief coordination

${moduleContext ? `Additional context: ${moduleContext}` : ''}

Provide concise, actionable answers. Be professional but friendly. Focus on helping contractors, victims, and emergency responders make informed decisions during and after storms.`;

      // Prepare messages for OpenAI
      const apiMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...messages
      ];

      // Call OpenAI via Replit AI Integrations (no API key needed)
      const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-mini',
          messages: apiMessages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', errorText);
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices[0]?.message?.content;

      if (!assistantMessage) {
        throw new Error('No response from AI');
      }

      res.json({ response: assistantMessage });
    } catch (error) {
      console.error('AI chat error:', error);
      res.status(500).json({ 
        error: 'Failed to get AI response',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  console.log('💬 AI Chat routes registered - Text and voice assistant active');
}
