import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('Reading migration SQL...');
    const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', '20260626_add_admin_marketplace_columns.sql');
    
    if (!fs.existsSync(sqlPath)) {
        console.error(`Migration SQL file not found at: ${sqlPath}`);
        process.exit(1);
    }
    
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Executing migration SQL via exec_sql...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: sql
    });
    
    if (error) {
        console.error('Migration failed:', error.message);
        console.error('Full error:', error);
    } else {
        console.log('Migration successfully applied!', data);
    }
}

runMigration();
