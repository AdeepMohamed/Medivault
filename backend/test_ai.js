require('dotenv').config();
const { summarizeRecord, chatWithAssistant } = require('./src/services/aiService');

async function testAI() {
  console.log('🤖 Testing Groq AI integration...');

  const mockText = `
Patient: John Doe
Date of Visit: June 20, 2026
Diagnosis: Mild seasonal allergies
Plan: Take Cetirizine 10mg once daily.
Lab values: Eosinophils: 8% (High, normal range: 1-4%)
  `;

  console.log('\n📄 1. Testing document summarization...');
  try {
    const summary = await summarizeRecord(mockText, 'Allergy Report', 'Report');
    console.log('   ✅ Summarization succeeded!');
    console.log('   AI Output Summary:', summary.summary);
    console.log('   Key Findings:', summary.keyFindings);
    console.log('   Abnormal Values:', summary.abnormalValues);
  } catch (err) {
    console.error('   ❌ Summarization failed:', err.message);
  }

  console.log('\n💬 2. Testing Chatbot with medical query...');
  try {
    const chatResult = await chatWithAssistant('What does it mean if my eosinophils are high?', [], mockText);
    console.log('   ✅ Chat succeeded!');
    console.log('   Is Emergency?', chatResult.isEmergency);
    console.log('   AI Output Chat:\n', chatResult.response);
  } catch (err) {
    console.error('   ❌ Chat failed:', err.message);
  }
}

testAI().catch(console.error);
