const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function test() {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  console.log('Key present:', !!key);
  if (!key) return;
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  try {
    const result = await model.generateContent("Say hello");
    console.log('Gemini 2.0 Response:', result.response.text());
  } catch (e) {
    console.error('Gemini 2.0 Error:', e.message);
  }
}
test();
