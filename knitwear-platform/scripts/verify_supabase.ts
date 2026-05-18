
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import * as fs from 'fs';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function log(msg: string) {
    console.log(msg);
    try {
        fs.appendFileSync('verify_log.txt', msg + '\n');
    } catch (e) {
        // ignore write error
    }
}

async function verify() {
    if (!supabaseUrl || !supabaseKey) {
        log('Error: Missing Supabase URL or Key in .env');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    log('Testing connection to: ' + supabaseUrl);

    // Try to select from patterns table
    const { data, error } = await supabase.from('patterns').select('id').limit(1);

    if (error) {
        if (error.code === 'PGRST204' || error.message.includes('relation "patterns" does not exist')) {
            log('Result: Connection Successful, but "patterns" table does NOT exist.');
            log('Action Required: Need to create tables.');
        } else {
            log('Result: Connection Failed or Query Error: ' + error.message + ' (Code: ' + error.code + ')');
        }
    } else {
        log('Result: Connection Successful, "patterns" table exists.');

        // Check for new columns
        const { error: colError } = await supabase.from('patterns').select('subcategory').limit(1);
        if (colError) {
            log('Result: "patterns" table exists but missing new columns (subcategory, etc).');
        } else {
            log('Result: Schema seems up to date.');
        }
    }
}

verify();
