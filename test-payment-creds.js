const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

async function test() {
  const KERNEL_CLIENT_ID = process.env.PAYMENT_X_CLIENT_ID;
  const KERNEL_API_KEY = process.env.PAYMENT_X_API_KEY;
  const KERNEL_TENANT_ID = process.env.KERNEL_X_TENANT_ID;
  const ORG_ID = "fac51104-41e7-4760-bdf4-4abd8f0ea059";

  console.log("Using credentials:", KERNEL_CLIENT_ID, KERNEL_TENANT_ID);

  const res = await fetch("https://payment-dev.yowyob.com/api/v1/transactions/direct", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Client-Id": KERNEL_CLIENT_ID,
      "X-Api-Key": KERNEL_API_KEY,
      "X-Tenant-Id": KERNEL_TENANT_ID,
      "X-Organization-Id": ORG_ID
    },
    body: JSON.stringify({
      amount: 1000,
      method: "STRIPE",
      userId: "00000000-0000-0000-0000-000000000000",
      organizationId: ORG_ID
    })
  });
  
  const text = await res.text();
  console.log("Response:", res.status, text);
}

test();
