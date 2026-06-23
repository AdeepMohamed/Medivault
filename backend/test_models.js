require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function checkModels() {
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
  for (const modelName of models) {
    console.log(`Testing model: ${modelName}...`);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Hello, say test');
      console.log(`   ✅ Success! Response: ${result.response.text().trim()}`);
    } catch (err) {
      console.error(`   ❌ Failed:`, err.message);
    }
  }
}

checkModels().catch(console.error);
