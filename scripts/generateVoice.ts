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
    voice: "nova", // Professional female voice (options: alloy, echo, fable, onyx, nova, shimmer)
    input: `Welcome to Disaster Direct, the future of disaster response. Our platform is more than software—it's your complete storm operations command center. With real-time weather intelligence, AI-powered damage detection, drone integration, and automated lead generation, you'll be first on the scene and first to close deals. From prediction to payment, we've revolutionized every step of the disaster response workflow. Let's get started.`,
    response_format: "mp3",
    speed: 1.0
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  await fs.promises.writeFile(speechFile, buffer);
  console.log("✅ Voice narration saved as public/voice-guide.mp3");
  console.log("📍 File location:", speechFile);
}

generateVoice().catch(console.error);
