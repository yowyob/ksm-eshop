const fs = require('fs');
const token = fs.readFileSync('.data/admin_token.txt', 'utf8').trim();
fetch('https://kernel-core.yowyob.com/api/warehouses?organizationId=d9d6a900-a3a6-4572-8349-415ad008b976', {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json()).then(d => console.log(JSON.stringify(d, null, 2)));
