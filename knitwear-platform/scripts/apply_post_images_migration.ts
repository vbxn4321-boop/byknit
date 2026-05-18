import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Anon Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Applying post images migration via exec_sql...');

    const sql = `
        ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS images text[];
    `;

    const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: sql
    });

    if (error) {
        console.error('Migration failed:', error.message);
        console.log('You will need to manually execute the SQL in your Supabase SQL Editor:');
        console.log('ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS images text[];');
    } else {
        console.log('Migration successfully applied!', data);
    }
}

run();
