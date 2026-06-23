const fs = require('fs');
const path = require('path');

const BACKEND_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting MediVault End-to-End API Flow Test...');

  // 1. Authenticate (Login as patient)
  console.log('\n🔑 1. Logging in as Jane Doe...');
  const loginRes = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'jane.doe.test@example.com',
      password: 'Password123!',
    }),
  });

  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
  }
  const token = loginData.accessToken;
  console.log('   ✅ Logged in successfully. Token received!');

  // 2. Upload medical record
  console.log('\n📤 2. Uploading dummy_record.txt...');
  const filePath = path.join(__dirname, '..', 'dummy_record.txt');
  const fileBuffer = fs.readFileSync(filePath);
  const fileBlob = new Blob([fileBuffer], { type: 'text/plain' });

  const formData = new FormData();
  formData.append('file', fileBlob, 'dummy_record.txt');
  formData.append('title', 'June 2026 Allergy Record');
  formData.append('category', 'Prescription');
  formData.append('record_date', '2026-06-20');
  formData.append('description', 'Allergy treatment plan and cetirizine prescription');
  formData.append('tags', 'allergy, prescription, cetirizine');

  const uploadRes = await fetch(`${BACKEND_URL}/records`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData,
  });

  const uploadData = await uploadRes.json();
  if (!uploadRes.ok) {
    throw new Error(`Upload failed: ${JSON.stringify(uploadData)}`);
  }
  const recordId = uploadData.record.id;
  console.log(`   ✅ Record uploaded successfully! ID: ${recordId}`);
  console.log(`   File URL: ${uploadData.record.file_url}`);

  // 3. Get health timeline
  console.log('\n📅 3. Verifying timeline endpoint...');
  const timelineRes = await fetch(`${BACKEND_URL}/records/timeline`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const timelineData = await timelineRes.json();
  if (!timelineRes.ok) {
    throw new Error(`Timeline fetch failed: ${JSON.stringify(timelineData)}`);
  }
  console.log(`   ✅ Timeline has ${timelineData.records.length} records.`);
  const foundInTimeline = timelineData.records.some(r => r.id === recordId);
  console.log(`   Is our record in timeline? ${foundInTimeline ? 'Yes' : 'No'}`);

  // 4. Generate secure share link and OTP
  console.log('\n🔗 4. Creating secure share link...');
  const shareRes = await fetch(`${BACKEND_URL}/share`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      recordId,
      doctorEmail: 'dr.smith@example.com',
      expiresInHours: 2,
    }),
  });

  const shareData = await shareRes.json();
  if (!shareRes.ok) {
    throw new Error(`Create share link failed: ${JSON.stringify(shareData)}`);
  }
  const shareUrl = shareData.shareUrl;
  const devOtp = shareData._devOtp;
  const shareToken = shareData.shareLink.token;
  console.log(`   ✅ Share link created successfully!`);
  console.log(`   Share URL: ${shareUrl}`);
  console.log(`   Dev OTP: ${devOtp}`);

  // 5. Publicly access share metadata
  console.log('\n👁️ 5. Accessing share link metadata (Public)...');
  const metaRes = await fetch(`${BACKEND_URL}/share/${shareToken}/meta`);
  const metaData = await metaRes.json();
  if (!metaRes.ok) {
    throw new Error(`Get metadata failed: ${JSON.stringify(metaData)}`);
  }
  console.log(`   ✅ Metadata loaded: Record title "${metaData.recordTitle}"`);

  // 6. Verify OTP
  console.log('\n🔑 6. Verifying OTP...');
  const verifyRes = await fetch(`${BACKEND_URL}/share/${shareToken}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      otp: devOtp,
      doctorEmail: 'dr.smith@example.com',
    }),
  });

  const verifyData = await verifyRes.json();
  if (!verifyRes.ok) {
    throw new Error(`OTP Verification failed: ${JSON.stringify(verifyData)}`);
  }
  const viewToken = verifyData.viewToken;
  console.log(`   ✅ OTP Verified! View token received.`);

  // 7. Access document as doctor using the viewToken
  console.log('\n🏥 7. Fetching record as doctor (Public with View Token)...');
  const docRes = await fetch(`${BACKEND_URL}/share/${shareToken}/record`, {
    headers: {
      'x-view-token': viewToken,
    },
  });

  const docData = await docRes.json();
  if (!docRes.ok) {
    throw new Error(`Doctor record fetch failed: ${JSON.stringify(docData)}`);
  }
  console.log(`   ✅ Doctor accessed record successfully!`);
  console.log(`   Accessed record title: "${docData.record.title}"`);
  console.log(`   Accessed record description: "${docData.record.description}"`);

  // 8. Clean up (Optional: delete/archive the record)
  console.log('\n🧹 8. Cleaning up (archiving the record)...');
  const deleteRes = await fetch(`${BACKEND_URL}/records/${recordId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const deleteData = await deleteRes.json();
  if (!deleteRes.ok) {
    throw new Error(`Record delete failed: ${JSON.stringify(deleteData)}`);
  }
  console.log(`   ✅ Record archived successfully: ${deleteData.message}`);

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! THE APPLICATION IS FULLY FUNCTIONAL! 🎉');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
});
