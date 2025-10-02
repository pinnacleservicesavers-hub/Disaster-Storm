import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

async function checkStatus() {
  try {
    // Get all voices to see the status
    const allVoices = await client.voices.getAll();
    
    const myVoice = allVoices.voices.find((v: any) => v.voice_id === 'E8qtV3izSOr5vmxy1BHV');
    
    if (!myVoice) {
      console.log('❌ Voice not found in account');
      return;
    }
    
    console.log('\n🎤 Voice Full Details:');
    console.log(JSON.stringify(myVoice, null, 2));
    
    // Check if it's a PVC voice that needs training
    console.log('\n🔍 Analysis:');
    console.log('   Category:', myVoice.category);
    console.log('   Fine-tuning allowed:', myVoice.fine_tuning?.is_allowed_to_fine_tune);
    console.log('   Fine-tuning state:', myVoice.fine_tuning?.fine_tuning_state);
    
    // Check samples
    if (myVoice.samples && myVoice.samples.length > 0) {
      console.log('   Audio samples:', myVoice.samples.length);
    }
    
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

checkStatus();
