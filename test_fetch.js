require('dotenv').config({ path: '.env.local' });
const https = require('https');

async function test() {
  const KERNEL_API_URL = process.env.KERNEL_API_URL;
  const username = process.env.KERNEL_USERNAME;
  const password = process.env.KERNEL_PASSWORD;
  
  console.log('Testing login...', KERNEL_API_URL);
  
  // 1. Get token
  const loginRes = await fetch(`${KERNEL_API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: username, password })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token || loginData.token;
  console.log('Token:', token ? 'Success' : 'Failed');
  
  // 2. Fetch orgs
  const orgsRes = await fetch(`${KERNEL_API_URL}/api/organizations`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const orgsData = await orgsRes.json();
  console.log('Orgs Data:', JSON.stringify(orgsData, null, 2).substring(0, 500));
}
test();
