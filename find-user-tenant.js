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
  
  // 1. Get all orgs
  const orgsRes = await fetch(`https://kernel-core.yowyob.com/api/organizations`, {
    headers: {
      "Authorization": "Bearer " + token,
      "X-Client-Id": process.env.KERNEL_X_CLIENT_ID,
      "X-Api-Key": process.env.KERNEL_X_API_KEY,
      "X-Tenant-Id": process.env.KERNEL_X_TENANT_ID
    }
  });
  const orgsData = await orgsRes.json();
  const orgs = orgsData.data?.content || orgsData.data || [];
  
  const allTenants = [process.env.KERNEL_X_TENANT_ID, ...orgs.map(o => o.id)];
  
  console.log("Searching in", allTenants.length, "tenants...");
  for (const tenantId of allTenants) {
    const res = await fetch(`https://kernel-core.yowyob.com/api/administration/users?search=naomitsague@gmail.com`, {
      headers: {
        "Authorization": "Bearer " + token,
        "X-Client-Id": process.env.KERNEL_X_CLIENT_ID,
        "X-Api-Key": process.env.KERNEL_X_API_KEY,
        "X-Tenant-Id": tenantId
      }
    });
    
    if (res.ok) {
      const data = await res.json();
      const users = data.data?.content || data.data || [];
      const user = users.find(u => u.email === 'naomitsague@gmail.com' || u.username === 'naomitsague@gmail.com');
      if (user) {
        console.log(`FOUND! naomitsague@gmail.com is in tenant: ${tenantId}`);
        return;
      }
    }
  }
  
  console.log("Not found anywhere.");
}

test();
