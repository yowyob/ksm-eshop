const { getKernelHeaders } = require('./src/lib/kernel-auth.js');
const fetch = require('node-fetch');

(async () => {
  const headers = await getKernelHeaders();
  const url = 'https://kernel-core.yowyob.com/api/customers/search?q=mbooatena%40gmail.com&organizationId=fac51104-41e7-4760-bdf4-4abd8f0ea059';
  const res = await fetch(url, { headers });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
})();
