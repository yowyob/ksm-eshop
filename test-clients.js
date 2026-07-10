const https = require('https');
const data = JSON.stringify({
  principal: process.env.KERNEL_USERNAME,
  password: process.env.KERNEL_PASSWORD
});

const req = https.request({
  hostname: 'kernel-core.yowyob.com',
  port: 443,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'X-Client-Id': process.env.KERNEL_X_CLIENT_ID,
    'X-Api-Key': process.env.KERNEL_X_API_KEY,
    'X-Tenant-Id': process.env.KERNEL_X_TENANT_ID,
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', (d) => body += d);
  res.on('end', () => {
    const json = JSON.parse(body);
    const token = json.data.accessToken || json.data.sessionToken;
    
    // Fetch third-parties
    const getReq = https.request({
      hostname: 'kernel-core.yowyob.com',
      port: 443,
      path: '/api/third-parties?organizationId=0a019fd3-dc61-4ed1-bc84-ed75bdaa7009&size=2',
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'Authorization': 'Bearer ' + token,
        'X-Client-Id': process.env.KERNEL_X_CLIENT_ID,
        'X-Api-Key': process.env.KERNEL_X_API_KEY,
        'X-Tenant-Id': process.env.KERNEL_X_TENANT_ID
      }
    }, (res2) => {
      let body2 = '';
      res2.on('data', (d) => body2 += d);
      res2.on('end', () => {
        console.log("Status:", res2.statusCode);
        console.log("Body:", body2);
      });
    });
    getReq.end();
  });
});
req.write(data);
req.end();
