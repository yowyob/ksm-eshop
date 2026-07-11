const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

async function test() {
  const loginRes = await fetch("https://kernel-core.yowyob.com/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Client-Id": process.env.KERNEL_X_CLIENT_ID,
      "X-Api-Key": process.env.KERNEL_X_API_KEY,
      "X-Tenant-Id": process.env.KERNEL_X_TENANT_ID,
      "X-Organization-Id": process.env.KERNEL_X_TENANT_ID
    },
    body: JSON.stringify({
      principal: process.env.KERNEL_USERNAME,
      password: process.env.KERNEL_PASSWORD
    })
  });
  
  const loginData = await loginRes.json();
  const token = loginData.data.accessToken || loginData.data.sessionToken;
  
  for (const endpoint of ['/api/actors', '/api/parties', '/api/users']) {
    const res = await fetch(`https://kernel-core.yowyob.com${endpoint}`, {
      headers: {
        "Authorization": "Bearer " + token,
        "X-Client-Id": process.env.KERNEL_X_CLIENT_ID,
        "X-Api-Key": process.env.KERNEL_X_API_KEY,
        "X-Tenant-Id": process.env.KERNEL_X_TENANT_ID
      }
    });
    console.log(`[${endpoint}] Status:`, res.status);
    if (res.ok) {
      const data = await res.json();
      console.log(`[${endpoint}] Total:`, data.data?.content?.length || data.data?.length || 0);
    }
  }
}

test();
