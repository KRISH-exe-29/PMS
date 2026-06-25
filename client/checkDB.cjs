const fs = require('fs');
const env = fs.readFileSync('../server/.env', 'utf8');
const urlMatch = env.match(/SUPABASE_URL=(.*)/);
const keyMatch = env.match(/SUPABASE_SERVICE_KEY=(.*)/);

if(urlMatch && keyMatch) {
  const url = urlMatch[1].trim().replace(/['"]/g, '');
  const key = keyMatch[1].trim().replace(/['"]/g, '');
  
  async function run() {
    try {
      const res1 = await fetch(url + '/rest/v1/milestones?select=id,name,project_id', {
        headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
      });
      const milestones = await res1.json();
      console.log('--- MILESTONES ---');
      console.log(milestones.filter(m => m.name.includes('Requirement') || m.name.includes('Scope')));
      
      const res2 = await fetch(url + '/rest/v1/tasks?select=id,title,milestone_id,project_id,type', {
        headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
      });
      const tasks = await res2.json();
      console.log('--- TASKS ---');
      console.log(tasks.filter(t => t.title.includes('discussion') || t.title.includes('req') || t.title.includes('identification')));
    } catch(e) {
      console.error(e);
    }
  }
  run();
} else {
  console.log('Env match failed');
}
