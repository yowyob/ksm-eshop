const https = require('https');

async function run() {
  const loginRes = await fetch('https://kernel-core.yowyob.com/api/auth/login', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      'X-Tenant-ID': '11111111-1111-1111-1111-111111111111',
      'X-Client-Id': 'prod-platform-backend',
      'X-Api-Key': 'VbWi225xzYPoD8rQ2FRniTAqkylh34XYeWxa9HCU'
    },
    body: JSON.stringify({ principal: "atenaornella@gmail.com", password: "Secret123@!" })
  });
  
  const data = await loginRes.json();
  const token = data.data.accessToken || data.data.sessionToken;
  
  const res = await fetch('https://kernel-core.yowyob.com/api/warehouses?organizationId=fac51104-41e7-4760-bdf4-4abd8f0ea059', {
    headers: { 
      'Authorization': `Bearer ${token}`, 
      'X-Tenant-ID': '11111111-1111-1111-1111-111111111111',
      'X-Client-Id': 'prod-platform-backend',
      'X-Api-Key': 'VbWi225xzYPoD8rQ2FRniTAqkylh34XYeWxa9HCU'
    }
  });
  console.log("Warehouses:", await res.text());
}

run();
