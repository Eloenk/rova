const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function test() {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) return;
  const genAI = new GoogleGenerativeAI(key);
  try {
    // Attempt with a known working model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("Say hello");
    console.log('Gemini Pro Response:', result.response.text());
  } catch (e) {
    console.error('Gemini Pro Error:', e.message);
  }
}
test();
