import fs from "fs";
import path from "path";
import { elevenlabsVoice } from "../server/services/elevenlabsVoice";

async function cloneAndGenerateVoice() {
  try {
    // Path to your uploaded audio file
    const audioFile = path.resolve("./attached_assets/Fortson Rd_1759296310533.m4a");
    
    if (!fs.existsSync(audioFile)) {
      console.error("❌ Audio file not found:", audioFile);
      return;
    }

    console.log("🎤 Starting voice cloning process...");
    
    // Step 1: Clone the voice from your audio
    const voiceId = await elevenlabsVoice.cloneVoice(
      audioFile, 
      "Disaster Direct Professional Voice"
    );
    
    console.log(`✅ Voice cloned successfully! Voice ID: ${voiceId}`);
    
    // Step 2: Generate speech with your cloned voice
    const text = `Welcome to Disaster Direct, the premier platform for professional disaster response operations. This comprehensive command center integrates real-time weather intelligence, AI-powered damage detection, advanced drone capabilities, and automated lead generation to deliver unparalleled operational efficiency. From initial storm prediction through final payment processing, every aspect of your disaster response workflow has been optimized for maximum effectiveness. Let's explore the platform's capabilities.`;
    
    console.log("🔊 Generating speech with your cloned voice...");
    
    const audioBuffer = await elevenlabsVoice.generateSpeech(text, voiceId);
    
    // Step 3: Save the generated audio
    const outputPath = path.resolve("./public/voice-guide-custom.mp3");
    await fs.promises.writeFile(outputPath, audioBuffer);
    
    console.log("✅ Voice narration saved as public/voice-guide-custom.mp3");
    console.log("📍 Your cloned voice ID (save this):", voiceId);
    console.log("\n💡 To use this voice in your app, set ELEVENLABS_VOICE_ID=" + voiceId);
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

cloneAndGenerateVoice();
