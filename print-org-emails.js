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
  
  const tenantId = "fac51104-41e7-4760-bdf4-4abd8f0ea059";
  const res = await fetch(`https://kernel-core.yowyob.com/api/administration/users`, {
    headers: {
      "Authorization": "Bearer " + token,
      "X-Client-Id": process.env.KERNEL_X_CLIENT_ID,
      "X-Api-Key": process.env.KERNEL_X_API_KEY,
      "X-Tenant-Id": tenantId
    }
  });
  const text = await res.text();
  console.log(`Status: ${res.status}`);
  console.log(`Text: ${text.slice(0, 500)}`);
}

test();
