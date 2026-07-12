const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

async function test() {
  const KERNEL_CLIENT_ID = process.env.KERNEL_X_CLIENT_ID;
  const KERNEL_API_KEY = process.env.KERNEL_X_API_KEY;
  const KERNEL_TENANT_ID = process.env.KERNEL_X_TENANT_ID;
  const ORG_ID = "fac51104-41e7-4760-bdf4-4abd8f0ea059";
  const USERNAME = process.env.KERNEL_USERNAME;
  const PASSWORD = process.env.KERNEL_PASSWORD;

  // 1. Login
  let res = await fetch("https://kernel-core.yowyob.com/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Client-Id": KERNEL_CLIENT_ID,
      "X-Api-Key": KERNEL_API_KEY,
      "X-Tenant-Id": KERNEL_TENANT_ID
    },
    body: JSON.stringify({ principal: USERNAME, password: PASSWORD })
  });
  let data = await res.json();
  if (!res.ok) { console.log("Login failed", data); return; }
  const token = data.accessToken;
  console.log("Got token!");

  // 2. Get wallet
  res = await fetch("https://payment-dev.yowyob.com/api/v1/wallets/me", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "X-Client-Id": KERNEL_CLIENT_ID,
      "X-Api-Key": KERNEL_API_KEY,
      "X-Tenant-Id": KERNEL_TENANT_ID,
      "X-Organization-Id": ORG_ID
    }
  });
  data = await res.json();
  if (!res.ok) { console.log("Wallet failed", data); return; }
  const walletId = data.id;
  console.log("Got wallet:", walletId);

  // 3. Create transaction
  res = await fetch("https://payment-dev.yowyob.com/api/v1/transactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "X-Client-Id": KERNEL_CLIENT_ID,
      "X-Api-Key": KERNEL_API_KEY,
      "X-Tenant-Id": KERNEL_TENANT_ID,
      "X-Organization-Id": ORG_ID
    },
    body: JSON.stringify({
      type: "RECHARGE",
      walletId: walletId,
      amount: 1000,
      method: "STRIPE",
      callbackUrl: "https://strike-agreeably-semicolon.ngrok-free.dev/api/webhooks/payment"
    })
  });
  data = await res.json();
  console.log("Transaction:", res.status, data);
}

test();
