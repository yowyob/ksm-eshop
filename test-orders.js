const { getKernelToken } = require('./src/lib/kernel');

async function test() {
  const token = await getKernelToken();
  const res = await fetch('https://kernel-core.yowyob.com/api/sales/orders?organizationId=d9d6a900-a3a6-4572-8349-415ad008b976', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

test();
