import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import OpenAI from 'openai';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function checkSupabase() {
    console.log('=== [1] Supabase Connection Check ===');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
        console.log('❌ Supabase keys missing in .env');
        return false;
    }
    console.log(`Connecting to: ${url}`);
    const supabase = createClient(url, key);
    try {
        const { data, error } = await supabase.from('patterns').select('id').limit(1);
        if (error) {
            console.log(`❌ Supabase Error: ${error.message} (Code: ${error.code})`);
            return false;
        } else {
            console.log('✅ Supabase connected successfully! "patterns" table is accessible.');
            return true;
        }
    } catch (e: any) {
        console.log(`❌ Supabase Uncaught Exception: ${e.message}`);
        return false;
    }
}

async function checkRavelry() {
    console.log('\n=== [2] Ravelry API Check ===');
    const username = process.env.RAVELRY_USERNAME;
    const password = process.env.RAVELRY_PASSWORD;
    if (!username || !password) {
        console.log('❌ Ravelry credentials missing in .env');
        return false;
    }
    console.log(`Using Ravelry username: ${username.substring(0, 10)}...`);
    const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
    try {
        const res = await axios.get('https://api.ravelry.com/patterns/search.json', {
            params: { page_size: 1, craft: 'knitting' },
            headers: { 'Authorization': authHeader }
        });
        if (res.status === 200 && res.data.patterns) {
            console.log(`✅ Ravelry API is working properly! Found patterns count: ${res.data.paginator.results || 'N/A'}`);
            return true;
        } else {
            console.log(`❌ Ravelry API returned status ${res.status}`);
            return false;
        }
    } catch (e: any) {
        console.log(`❌ Ravelry API Exception: ${e.response?.status || e.message} - ${e.response?.data?.message || ''}`);
        return false;
    }
}

async function checkGroqKeys() {
    console.log('\n=== [3] Groq API Key Check ===');
    const keysRaw = process.env.GROQ_API_KEY || '';
    const keys = keysRaw.split(',').map(k => k.trim()).filter(Boolean);
    if (keys.length === 0) {
        console.log('❌ No Groq API keys found in .env');
        return false;
    }
    console.log(`Found ${keys.length} Groq API keys to verify.`);
    let successCount = 0;
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const obfuscated = `${key.substring(0, 7)}...${key.substring(key.length - 4)}`;
        try {
            const client = new OpenAI({
                apiKey: key,
                baseURL: 'https://api.groq.com/openai/v1',
                timeout: 5000,
            });
            const completion = await client.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: 'Say OK' }],
                max_tokens: 5
            });
            const text = completion.choices[0]?.message?.content?.trim();
            console.log(`🔑 Key [${i}] (${obfuscated}): ✅ Working! Response: "${text}"`);
            successCount++;
        } catch (e: any) {
            console.log(`🔑 Key [${i}] (${obfuscated}): ❌ Failed: ${e.status || e.message}`);
            if (e.response?.data) {
                console.log('Error Data:', JSON.stringify(e.response.data));
            } else {
                console.log('Error Details:', e.message, e);
            }
        }
    }
    console.log(`\nGroq Summary: ${successCount}/${keys.length} keys are working.`);
    return successCount > 0;
}

async function main() {
    console.log(`Device checking initiated at ${new Date().toLocaleString()}`);
    await checkSupabase();
    await checkRavelry();
    await checkGroqKeys();
}

main();
