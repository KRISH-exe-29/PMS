const fs = require('fs'); 
const env = fs.readFileSync('../server/.env', 'utf8'); 
const urlMatch = env.match(/SUPABASE_URL=(.*)/); 
const keyMatch = env.match(/SUPABASE_SERVICE_KEY=(.*)/); 
if(urlMatch && keyMatch) { 
  const url = urlMatch[1].replace(/['"\r]/g, '');
  const key = keyMatch[1].replace(/['"\r]/g, '');
  fetch(url + '/rest/v1/tasks?select=*', { 
    headers: { 'apikey': key, 'Authorization': 'Bearer ' + key } 
  })
  .then(r => r.json())
  .then(d => console.log(JSON.stringify(d, null, 2)))
  .catch(console.error); 
} else { 
  console.log('Env match failed'); 
}
