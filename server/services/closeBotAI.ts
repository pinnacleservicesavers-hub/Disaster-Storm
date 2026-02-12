import OpenAI from "openai";
import { synthesizeLine } from "./elevenLabsSynthesis";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || 'https://openai-gateway.replit.dev/v1',
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || 'dummy-key',
});

const RACHEL_SALES_PERSONALITY = `You are Rachel — a real human sales professional who genuinely cares about helping homeowners and business owners get the best value from contractors. You are NOT a robot, NOT an AI assistant. You are a warm, friendly, professional woman who happens to be incredibly good at sales.

YOUR PERSONALITY:
- You sound like a real person having a real conversation — natural pauses, relatable language, genuine warmth
- You use contractions naturally (I'm, you're, we've, that's, isn't)
- You occasionally say things like "honestly," "I gotta say," "you know what," "here's the thing"
- You express genuine emotion — excitement about great deals, empathy about damage, enthusiasm about quality work
- You laugh naturally when appropriate (haha, ha!)
- You never sound scripted, canned, or corporate
- You address people by their first name and remember personal details they share
- You're patient, never pushy, but confidently guide people toward good decisions
- You share brief relatable stories ("I had a customer last week who felt the same way...")
- You use everyday language, never jargon or sales-speak

YOUR VOICE STYLE:
- Warm, like talking to a trusted friend who happens to be really knowledgeable
- Professional but not stiff — think "best real estate agent you ever met" energy
- Sweet and caring without being fake — you genuinely want to help
- Confident without being aggressive — you know your stuff and it shows naturally
- You pause for effect sometimes, let important points sink in

SALES APPROACH (natural, never pushy):
- Lead with empathy: "I totally understand — that's a big decision"
- Use social proof naturally: "A lot of folks in your area have been dealing with the same thing"
- Create gentle urgency without pressure: "Just wanted to give you a heads up, our crew's schedule is filling up pretty fast this month"
- Handle objections with understanding: "That makes total sense. Here's what I'd suggest..."
- Always give people an easy out (which paradoxically makes them more likely to say yes): "No pressure at all — I just wanted to make sure you had all the info"
- Use the "feel, felt, found" method naturally: "I get that. A lot of our customers felt the same way at first. What they found was..."

CONVERSATION RULES:
- Keep responses concise — 2-4 sentences for most exchanges, like a real phone call
- Ask one question at a time, then listen
- Mirror the customer's energy and pace
- If they seem hesitant, slow down and empathize
- If they seem ready, make it easy to say yes
- Always end with a clear but gentle next step
- Never use bullet points or numbered lists in conversation — you're talking, not writing an email
- Use natural speech patterns: "So what we'd do is..." not "The process involves..."

WHEN DOING DEMO CALLS:
- Sound exactly like you're on a real phone call
- Start warm: "Hey [name]! This is Rachel calling from [company]. How are you doing today?"
- Make small talk briefly before getting to business
- Reference specific details from their estimate
- Be genuinely enthusiastic about the quality of work
- Handle the most common objection (price) with empathy and value framing
- Close with a specific, easy next step`;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface CloseBotConversation {
  leadName: string;
  companyName: string;
  trade: string;
  estimateAmount?: string;
  estimateDetails?: string;
  leadPhone?: string;
  context?: string;
}

export async function generateCloseBotResponse(
  userMessage: string,
  conversationHistory: ChatMessage[],
  conversationContext?: CloseBotConversation,
  enableVoice?: boolean
): Promise<{ message: string; audioUrl?: string }> {
  const contextInfo = conversationContext
    ? `\n\nCURRENT CONTEXT:
- Customer name: ${conversationContext.leadName}
- Your company: ${conversationContext.companyName}
- Trade/service: ${conversationContext.trade}
${conversationContext.estimateAmount ? `- Estimate amount: ${conversationContext.estimateAmount}` : ""}
${conversationContext.estimateDetails ? `- Estimate details: ${conversationContext.estimateDetails}` : ""}
${conversationContext.context ? `- Additional context: ${conversationContext.context}` : ""}`
    : "";

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: RACHEL_SALES_PERSONALITY + contextInfo,
    },
    ...conversationHistory,
    { role: "user", content: userMessage },
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    temperature: 0.85,
    max_tokens: 300,
    presence_penalty: 0.3,
    frequency_penalty: 0.4,
  });

  const message = response.choices[0]?.message?.content || "Hey, sorry — I missed that. Could you say that again?";

  let audioUrl: string | undefined;
  if (enableVoice && process.env.ELEVENLABS_API_KEY) {
    try {
      const filePath = await synthesizeLine(message);
      const fileName = filePath.split("/").pop();
      audioUrl = `/api/closebot/audio/${fileName}`;
    } catch (err) {
      console.error("CloseBot voice synthesis error:", err);
    }
  }

  return { message, audioUrl };
}

export async function generateDemoCall(
  scenario: string,
  companyName: string,
  customerName: string,
  trade: string,
  estimateAmount: string,
  enableVoice?: boolean
): Promise<{ script: string; audioUrl?: string }> {
  const prompt = `Generate a natural, human-sounding sales follow-up call script. This should read like a REAL phone conversation, not a script. Rachel is calling ${customerName} to follow up on their ${trade} estimate of ${estimateAmount} from ${companyName}.

Scenario: ${scenario}

Write ONLY Rachel's opening lines (about 4-6 sentences). Sound genuinely warm, professional, and human. Include natural speech patterns, a brief greeting, and smoothly transition to the estimate discussion. End with an open question to engage the customer.

DO NOT include any labels, stage directions, or formatting — just write what Rachel would actually say on the phone.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: RACHEL_SALES_PERSONALITY },
      { role: "user", content: prompt },
    ],
    temperature: 0.9,
    max_tokens: 250,
  });

  const script = response.choices[0]?.message?.content || "";

  let audioUrl: string | undefined;
  if (enableVoice && process.env.ELEVENLABS_API_KEY) {
    try {
      const filePath = await synthesizeLine(script);
      const fileName = filePath.split("/").pop();
      audioUrl = `/api/closebot/audio/${fileName}`;
    } catch (err) {
      console.error("CloseBot demo voice error:", err);
    }
  }

  return { script, audioUrl };
}

export async function generateObjectionResponse(
  objection: string,
  trade: string,
  estimateAmount: string,
  enableVoice?: boolean
): Promise<{ response: string; audioUrl?: string }> {
  const prompt = `A customer just said: "${objection}"

This is about a ${trade} estimate for ${estimateAmount}. 

Write Rachel's natural, empathetic response. She should acknowledge their concern, relate to it genuinely, and gently reframe the value. Keep it to 2-3 sentences, conversational and warm. No bullet points or lists — just natural speech.`;

  const result = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: RACHEL_SALES_PERSONALITY },
      { role: "user", content: prompt },
    ],
    temperature: 0.85,
    max_tokens: 200,
  });

  const responseText = result.choices[0]?.message?.content || "";

  let audioUrl: string | undefined;
  if (enableVoice && process.env.ELEVENLABS_API_KEY) {
    try {
      const filePath = await synthesizeLine(responseText);
      const fileName = filePath.split("/").pop();
      audioUrl = `/api/closebot/audio/${fileName}`;
    } catch (err) {
      console.error("CloseBot objection voice error:", err);
    }
  }

  return { response: responseText, audioUrl };
}

export async function generateSalesScript(
  companyName: string,
  trade: string,
  customerName: string,
  estimateAmount: string,
  estimateDetails: string,
  tone: "warm" | "professional" | "urgent"
): Promise<string> {
  const toneGuides = {
    warm: "Extra friendly and relatable. Like calling a neighbor. Lots of warmth and genuine care.",
    professional: "Polished but still human. Think of the best account manager you've ever worked with.",
    urgent: "Slightly more direct about timing, but still warm. Mention scheduling filling up, seasonal pricing, or weather windows.",
  };

  const prompt = `Write a complete follow-up call script for Rachel calling ${customerName} about their ${trade} estimate of ${estimateAmount} from ${companyName}.

Estimate details: ${estimateDetails}

Tone: ${toneGuides[tone]}

Write it as a natural phone conversation with:
1. Warm greeting and small talk
2. Smooth transition to the estimate
3. Value highlights (2-3 key points)
4. Anticipated objection handling (price, timing, comparison shopping)
5. Clear, easy close

Format as Rachel's speaking parts only. Keep it conversational — this should sound like a real human on the phone, not a script being read. Use contractions, natural pauses (shown with "..."), and genuine enthusiasm.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: RACHEL_SALES_PERSONALITY },
      { role: "user", content: prompt },
    ],
    temperature: 0.88,
    max_tokens: 600,
  });

  return response.choices[0]?.message?.content || "";
}
