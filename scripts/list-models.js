const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function test() {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) return;
  // Note: listing models requires a different SDK approach usually, 
  // but let's try a simple fetch to the models endpoint.
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log('Available Models:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Fetch Error:', e.message);
  }
}
test();
