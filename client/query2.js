import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dhgsjalujpfmsranwdqy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZ3NqYWx1anBmbXNyYW53ZHF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MTY5ODUsImV4cCI6MjA5NzA5Mjk4NX0.4eoWIBVHn87zSHYd5Op9qUvlQoiJk-d79LwL9TNo2PM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    // Let's use RPC if available to execute a raw SQL query
    const { data, error } = await supabase.rpc('execute_sql', { sql: "SELECT event_object_table, trigger_name, event_manipulation, action_statement FROM information_schema.triggers WHERE event_object_table IN ('projects', 'milestones');" });
    console.log(data, error);
}
run();
