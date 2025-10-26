/**
 * Test: OpenAI Connection
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

async function main() {
  console.log('Testing OpenAI Connection...');
  console.log('Base URL:', process.env.AI_INTEGRATIONS_OPENAI_BASE_URL);
  console.log('API Key:', process.env.AI_INTEGRATIONS_OPENAI_API_KEY ? 'SET' : 'NOT SET');
  
  try {
    console.log('\n🎨 Generating test image...');
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: 'A simple red circle',
      n: 1,
      size: '1024x1024',
      quality: 'high'
    });
    
    console.log('\n✅ Success!');
    console.log('Response:', JSON.stringify(response, null, 2));
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error('Status:', error.status);
    console.error('Error details:', JSON.stringify(error.error || error, null, 2));
  }
}

main();
