import fs from "fs";
import path from "path";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateVoice() {
  const speechFile = path.resolve("./public/voice-guide.mp3");

  const mp3 = await openai.audio.speech.create({
    model: "tts-1-hd", // High-definition model for broadcast-quality audio
    voice: "alloy", // Premium professional voice - clearest, most polished sound
    input: `Welcome to Disaster Direct, the premier platform for professional disaster response operations. This comprehensive command center integrates real-time weather intelligence, AI-powered damage detection, advanced drone capabilities, and automated lead generation to deliver unparalleled operational efficiency. From initial storm prediction through final payment processing, every aspect of your disaster response workflow has been optimized for maximum effectiveness. Experience the future of disaster management.`,
    response_format: "mp3",
    speed: 0.95 // Measured, authoritative pace for broadcast-quality delivery
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  await fs.promises.writeFile(speechFile, buffer);
  console.log("✅ Voice narration saved as public/voice-guide.mp3");
  console.log("📍 File location:", speechFile);
}

generateVoice().catch(console.error);
