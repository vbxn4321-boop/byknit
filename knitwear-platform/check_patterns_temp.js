const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const envVars = {};
env.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    envVars[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
  }
});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['SUPABASE_SERVICE_ROLE_KEY'] || envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('patterns').select('*').limit(10);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Patterns count:', data.length);
    data.forEach((p, idx) => {
      console.log(`Pattern ${idx + 1}:`, {
        id: p.id,
        title: p.title,
        category: p.category,
        subcategory: p.subcategory,
        difficulty: p.difficulty,
        thumbnail_url: p.thumbnail_url
      });
    });
  }
}

main();
