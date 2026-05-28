const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Anon Key in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Adding INSERT policy for credit_transactions via exec_sql...');

    const sql = `
        DO $$
        BEGIN
            -- Check if policy exists, if not, create it
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE tablename = 'credit_transactions' AND policyname = 'Users can insert own transactions.'
            ) THEN
                CREATE POLICY "Users can insert own transactions." ON public.credit_transactions 
                FOR INSERT WITH CHECK (auth.uid() = user_id);
                RAISE NOTICE 'Policy created successfully';
            ELSE
                RAISE NOTICE 'Policy already exists';
            END IF;
        END
        $$;
    `;

    const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: sql
    });

    if (error) {
        console.error('Migration failed:', error.message);
    } else {
        console.log('Migration successfully applied!', data);
    }
}

run();
