const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

async function test() {
  const res = await fetch("https://kernel-core.yowyob.com/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Client-Id": process.env.KERNEL_X_CLIENT_ID,
      "X-Api-Key": process.env.KERNEL_X_API_KEY
    },
    body: JSON.stringify({
      principal: "naomitsague@gmail.com",
      password: "password123" // we don't know the password
    })
  });
  
  console.log("Status:", res.status);
  const data = await res.text();
  console.log("Response:", data.substring(0, 500));
}

test();
