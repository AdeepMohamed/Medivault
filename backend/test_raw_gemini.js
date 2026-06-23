require('dotenv').config();
const token = process.env.GEMINI_API_KEY;
const urlKey = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${token}`;
const urlNoKey = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;

const body = {
  contents: [{ parts: [{ text: 'Hello, respond with success' }] }]
};

async function testAuth() {
  console.log('🧪 Diagnostic test of AQ. token authentication methods...');

  // Method 1: Query param ?key=...
  console.log('\nMethod 1: Query parameter ?key=...');
  try {
    const res = await fetch(urlKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    console.log(`   Status: ${res.status}`);
    console.log(`   Response:`, JSON.stringify(data).substring(0, 300));
  } catch (err) {
    console.error(`   Error:`, err.message);
  }

  // Method 2: Header x-goog-api-key
  console.log('\nMethod 2: Header x-goog-api-key');
  try {
    const res = await fetch(urlNoKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': token,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    console.log(`   Status: ${res.status}`);
    console.log(`   Response:`, JSON.stringify(data).substring(0, 300));
  } catch (err) {
    console.error(`   Error:`, err.message);
  }

  // Method 3: Header Authorization: Bearer
  console.log('\nMethod 3: Header Authorization: Bearer');
  try {
    const res = await fetch(urlNoKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    console.log(`   Status: ${res.status}`);
    console.log(`   Response:`, JSON.stringify(data).substring(0, 300));
  } catch (err) {
    console.error(`   Error:`, err.message);
  }
}

testAuth().catch(console.error);
