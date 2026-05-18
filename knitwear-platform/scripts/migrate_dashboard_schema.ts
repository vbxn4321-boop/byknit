
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function runMigration() {
    console.log('Running migration...');

    // Adding phone to profiles
    const { error: error1 } = await supabase.rpc('exec_sql', {
        sql_query: "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;"
    });
    if (error1) console.error('Error adding phone to profiles:', error1.message);

    // Adding discount fields to patterns
    const { error: error2 } = await supabase.rpc('exec_sql', {
        sql_query: "ALTER TABLE public.patterns ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0; ALTER TABLE public.patterns ADD COLUMN IF NOT EXISTS is_on_sale BOOLEAN DEFAULT false;"
    });
    if (error2) console.error('Error adding discount fields to patterns:', error2.message);

    console.log('Migration attempted.');
}

runMigration();
