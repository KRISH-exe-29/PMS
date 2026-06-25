import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhgsjalujpfmsranwdqy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZ3NqYWx1anBmbXNyYW53ZHF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MTY5ODUsImV4cCI6MjA5NzA5Mjk4NX0.4eoWIBVHn87zSHYd5Op9qUvlQoiJk-d79LwL9TNo2PM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Fetching project p004...');
  const { data: p004, error: err1 } = await supabase.from('projects').select('*').eq('code', 'p004').single();
  if (err1) {
    console.error('Fetch error:', err1);
    return;
  }
  console.log('p004 before:', p004.budget);

  console.log('Updating p004 budget to 9999...');
  const { error } = await supabase.from('projects').update({ budget: 9999 }).eq('id', p004.id);
  if (error) console.error('Update error:', error);

  const { data: p004After } = await supabase.from('projects').select('*').eq('code', 'p004').single();
  console.log('p004 after:', p004After.budget);
}

test();
