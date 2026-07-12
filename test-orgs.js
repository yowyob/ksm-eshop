require('dotenv').config({ path: '.env.local' });
fetch('http://localhost:3000/api/organizations/my')
  .then(r => r.json())
  .then(d => console.log(JSON.stringify(d).substring(0, 500)));
