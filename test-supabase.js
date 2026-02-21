import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('app_data').select('data').eq('collection', 'teamMembers');
  if (error) console.error(error);
  else {
    const members = data.map(d => d.data);
    console.log("Team members count:", members.length);
    if(members.length > 0) {
      console.log("First member:", members[0].employeeId, members[0].name, members[0].id);
    }
  }
}
check();
