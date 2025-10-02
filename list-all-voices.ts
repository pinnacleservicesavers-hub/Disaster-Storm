import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

async function listAll() {
  try {
    const result = await client.voices.getAll();
    
    console.log('\n📋 All voices in your account:\n');
    
    result.voices.forEach((voice: any) => {
      console.log(`📣 ${voice.name}`);
      console.log(`   ID: ${voice.voice_id}`);
      console.log(`   Category: ${voice.category}`);
      if (voice.category === 'professional' || voice.category === 'cloned') {
        console.log(`   ⭐ CUSTOM VOICE`);
      }
      console.log('');
    });
    
    const customVoices = result.voices.filter((v: any) => 
      v.category === 'professional' || v.category === 'cloned'
    );
    
    console.log(`\n📊 Total voices: ${result.voices.length}`);
    console.log(`🎤 Custom voices: ${customVoices.length}`);
    
    if (customVoices.length > 0) {
      console.log('\n✨ Your custom voices:');
      customVoices.forEach((v: any) => {
        console.log(`   - ${v.name} (ID: ${v.voice_id})`);
      });
    }
    
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

listAll();
