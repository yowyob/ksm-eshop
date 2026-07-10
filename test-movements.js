const { backendFetch } = require('./src/lib/api-client');

async function test() {
  const result = await backendFetch('/api/inventory/movements', {
    method: 'GET',
    params: { organizationId: 'fac51104-41e7-4760-bdf4-4abd8f0ea059' }
  });
  console.log(JSON.stringify(result, null, 2));
}

test();
