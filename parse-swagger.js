const fs = require('fs');
const swagger = JSON.parse(fs.readFileSync('swagger.json', 'utf8'));

const usersEndpoint = swagger.paths['/api/administration/users'];
if (usersEndpoint && usersEndpoint.get) {
  console.log("GET /api/administration/users parameters:");
  console.log(JSON.stringify(usersEndpoint.get.parameters, null, 2));
} else {
  console.log("Endpoint not found or GET not defined.");
}
