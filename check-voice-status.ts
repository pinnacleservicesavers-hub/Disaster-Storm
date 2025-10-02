import { elevenLabsVoice } from './server/services/elevenLabsVoice.js';

async function checkVoiceStatus() {
  const voiceId = 'E8qtV3izSOr5vmxy1BHV';
  
  console.log('🔍 Checking your cloned voice status on ElevenLabs...\n');
  
  try {
    const voices = await elevenLabsVoice.listVoices();
    const myVoice = voices.find(v => v.voiceId === voiceId);
    
    if (!myVoice) {
      console.log('❌ Voice not found!');
      return;
    }
    
    console.log('📣 Voice Name:', myVoice.name);
    console.log('🆔 Voice ID:', myVoice.voiceId);
    console.log('📂 Category:', myVoice.category);
    console.log('\n🔧 Fine-Tuning Status:');
    console.log(JSON.stringify(myVoice.fineTuning, null, 2));
    
    // Try to actually use it
    console.log('\n🎤 Testing if voice can generate audio...\n');
    try {
      const audio = await elevenLabsVoice.generateSpeech({
        text: 'This is a test.',
        voiceId,
        settings: { stability: 0.5, similarityBoost: 0.75 }
      });
      console.log('✅ SUCCESS! Voice is ready and working!');
      console.log('   Generated audio:', audio.length, 'bytes');
    } catch (err: any) {
      console.log('❌ Cannot use voice yet:');
      console.log('   Status:', err.body?.detail?.status || 'unknown');
      console.log('   Message:', err.body?.detail?.message || err.message);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkVoiceStatus();
