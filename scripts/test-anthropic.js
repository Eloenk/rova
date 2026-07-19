const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

async function test() {
  const key = process.env.ANTHROPIC_API_KEY;
  console.log('Key present:', !!key);
  if (!key) return;
  
  const anthropic = new Anthropic({ apiKey: key });
  
  try {
    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1024,
      messages: [{ role: "user", content: "Say hello" }],
    });
    console.log('Claude 3.5 Response:', msg.content[0].text);
  } catch (e) {
    console.error('Claude 3.5 Error:', e.message);
  }
}
test();
