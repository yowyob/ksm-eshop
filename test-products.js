const http = require('http');

http.get('http://localhost:3000/api/products?organizationId=ALL', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    console.log(JSON.stringify(json.data[0], null, 2));
  });
});
