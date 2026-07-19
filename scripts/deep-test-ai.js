const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function test() {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) return;
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  
  for (let i = 1; i <= 3; i++) {
    console.log(`\nAttempt ${i}...`);
    try {
      const result = await model.generateContent("Respond with exactly 'OK'");
      console.log('Success:', result.response.text().trim());
    } catch (e) {
      console.error('Error:', e.message);
    }
    if (i < 3) {
      console.log('Waiting 15s...');
      await new Promise(r => setTimeout(r, 15000));
    }
  }
}
test();
