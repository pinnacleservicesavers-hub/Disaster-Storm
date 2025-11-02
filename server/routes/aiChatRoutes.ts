import express from 'express';
import type { Express, Request, Response } from 'express';
import OpenAI from 'openai';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  moduleName: string;
  moduleContext?: string;
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
      const { messages, moduleName, moduleContext }: ChatRequest = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required' });
      }
      
      console.log(`💬 AI Chat request for ${moduleName}, messages count: ${messages.length}`);

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

      // Call OpenAI via Replit AI Integrations
      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      console.log('💬 Calling OpenAI API...');
      const completion = await openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: apiMessages,
        max_completion_tokens: 500,
      });

      console.log('💬 OpenAI API response received');
      const assistantMessage = completion.choices[0]?.message?.content;

      if (!assistantMessage) {
        console.error('💬 No content in OpenAI response:', JSON.stringify(completion, null, 2));
        throw new Error('No response from AI');
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
