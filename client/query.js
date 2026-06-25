import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dhgsjalujpfmsranwdqy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZ3NqYWx1anBmbXNyYW53ZHF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MTY5ODUsImV4cCI6MjA5NzA5Mjk4NX0.4eoWIBVHn87zSHYd5Op9qUvlQoiJk-d79LwL9TNo2PM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    // If we can't query triggers directly via API without service_role key,
    // let's just do a test update to see if it resets the budget.
    const { data: p } = await supabase.from('projects').select('*').limit(1).single();
    if (p) {
        console.log('Before update:', p.budget);
        await supabase.from('projects').update({ budget: 50000 }).eq('id', p.id);
        const { data: p2 } = await supabase.from('projects').select('*').eq('id', p.id).single();
        console.log('After update budget=50000:', p2.budget);
        
        // now update something else
        await supabase.from('projects').update({ description: 'test' }).eq('id', p.id);
        const { data: p3 } = await supabase.from('projects').select('*').eq('id', p.id).single();
        console.log('After update description:', p3.budget);
    }
}
run();
