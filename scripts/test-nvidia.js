require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

async function testNvidia() {
  const apiKey = process.env.NVIDIA_API_KEY;
  const baseUrl = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1/chat/completions';
  const model = process.env.NVIDIA_MODEL || 'z-ai/glm-5.2';

  console.log('\n===================================================');
  console.log('       Rova — NVIDIA NIM API Key Test              ');
  console.log('===================================================');
  console.log(`• Model:      ${model}`);
  console.log(`• Endpoint:   ${baseUrl}`);
  console.log(`• API Key:    ${apiKey ? apiKey.substring(0, 12) + '...' : 'MISSING ❌'}`);
  console.log('---------------------------------------------------\n');

  if (!apiKey) {
    console.error('❌ Error: NVIDIA_API_KEY is not set in .env or .env.local');
    process.exit(1);
  }

  console.log('⏳ Sending test request to NVIDIA NIM API...\n');

  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are Rova AI, an autonomous financial agent on Arc Testnet. Return minified JSON with action and reasoning.',
          },
          {
            role: 'user',
            content: 'User Intent: send 25 USDC to 0x33c50a793fd2fa02ed0b54196ab4f1faf7bad046',
          },
        ],
        temperature: 0.1,
        max_tokens: 1024,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`❌ HTTP Error ${response.status}: ${errText}`);
      process.exit(1);
    }

    const data = await response.json();
    console.log('✅ NVIDIA NIM API Response Received Successfully!\n');
    console.log('Response Content:');
    console.log(data.choices?.[0]?.message?.content || JSON.stringify(data, null, 2));

    if (data.usage) {
      console.log('\nTokens Used:', data.usage);
    }
  } catch (error) {
    console.error('❌ Request Failed:', error.message);
    process.exit(1);
  }
}

testNvidia();
