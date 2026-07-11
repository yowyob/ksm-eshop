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
  
  console.log("Searching third-parties in", orgs.length, "organizations...");
  
  for (const org of orgs) {
    const res = await fetch(`https://kernel-core.yowyob.com/api/clients/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
        "X-Client-Id": process.env.KERNEL_X_CLIENT_ID,
        "X-Api-Key": process.env.KERNEL_X_API_KEY,
        "X-Tenant-Id": process.env.KERNEL_X_TENANT_ID,
        "X-Organization-Id": org.id
      },
      body: JSON.stringify({
        search: "naomitsague",
        page: 0,
        size: 50
      })
    });
    
    if (res.ok) {
      const data = await res.json();
      const clients = data.data?.content || data.data || [];
      if (clients.length > 0) {
        console.log(`FOUND in org ${org.id}:`, clients.map(c => c.name || c.email || c.id));
      }
    }
    
    const res2 = await fetch(`https://kernel-core.yowyob.com/api/third-parties/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
        "X-Client-Id": process.env.KERNEL_X_CLIENT_ID,
        "X-Api-Key": process.env.KERNEL_X_API_KEY,
        "X-Tenant-Id": process.env.KERNEL_X_TENANT_ID,
        "X-Organization-Id": org.id
      },
      body: JSON.stringify({
        search: "naomitsague",
        page: 0,
        size: 50
      })
    });
    
    if (res2.ok) {
      const data2 = await res2.json();
      const thirdParties = data2.data?.content || data2.data || [];
      if (thirdParties.length > 0) {
        console.log(`FOUND third-party in org ${org.id}:`, thirdParties.map(c => c.name || c.email || c.id));
      }
    }
  }
  
  console.log("Done searching third-parties.");
}

test();
