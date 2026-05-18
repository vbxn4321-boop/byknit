const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function checkSchema() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Checking grid_projects table structure...');

    // Try to select exactly like getMyProjects
    const { data: userData, error: userError } = await supabase.auth.getSession();
    const userId = userData?.session?.user?.id;

    console.log('User ID from session:', userId);

    const { data, error } = await supabase
        .from('grid_projects')
        .select('*')
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error selecting projects:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
        });
        if (error.message.includes('column "width" does not exist') || error.message.includes('column "height" does not exist')) {
            console.log('CONFIRMED: Columns are missing from the table.');
        } else if (error.message.includes('schema cache')) {
            console.log('CONFIRMED: Columns might exist but schema cache is STALE.');
        }
    } else {
        console.log('SUCCESS: Columns "width" and "height" exist and are accessible!');
    }
}

checkSchema();
