import fs from "fs";
import path from "path";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateVoice() {
  const speechFile = path.resolve("./public/voice-guide.mp3");

  const mp3 = await openai.audio.speech.create({
    model: "tts-1-hd", // High-definition model for best quality
    voice: "shimmer", // Most natural-sounding female voice with warm tone
    input: `Hey there, welcome to Disaster Direct. You're looking at the future of disaster response, and it's pretty incredible. This isn't just another app... it's your complete command center for storm operations. Here's what we've built for you. Real-time weather intelligence that keeps you ahead of the storm. AI-powered damage detection that finds opportunities before your competition. Drone integration for professional aerial assessments. And automated lead generation that brings clients right to you. From the moment a storm's predicted to the final payment, we've streamlined every single step. Ready to see what this can do? Let's dive in.`,
    response_format: "mp3",
    speed: 1.0 // Natural speaking pace
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  await fs.promises.writeFile(speechFile, buffer);
  console.log("✅ Voice narration saved as public/voice-guide.mp3");
  console.log("📍 File location:", speechFile);
}

generateVoice().catch(console.error);
