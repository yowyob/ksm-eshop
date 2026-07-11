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
  
  // Test with email
  const res1 = await fetch(`https://kernel-core.yowyob.com/api/administration/users?email=naomitsague@gmail.com`, {
    headers: {
      "Authorization": "Bearer " + token,
      "X-Client-Id": process.env.KERNEL_X_CLIENT_ID,
      "X-Api-Key": process.env.KERNEL_X_API_KEY,
      "X-Tenant-Id": process.env.KERNEL_X_TENANT_ID
    }
  });
  const data1 = await res1.json();
  console.log("With email=naomitsague@gmail.com found:", (data1.data?.content || data1.data || []).length);
  
  // Test with username
  const res2 = await fetch(`https://kernel-core.yowyob.com/api/administration/users?username=naomitsague@gmail.com`, {
    headers: {
      "Authorization": "Bearer " + token,
      "X-Client-Id": process.env.KERNEL_X_CLIENT_ID,
      "X-Api-Key": process.env.KERNEL_X_API_KEY,
      "X-Tenant-Id": process.env.KERNEL_X_TENANT_ID
    }
  });
  const data2 = await res2.json();
  console.log("With username=naomitsague@gmail.com found:", (data2.data?.content || data2.data || []).length);
}

test();
