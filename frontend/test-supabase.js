// Simple Node.js script to test Supabase connection for frontend
// Run with: node test-supabase.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env file');
  process.exit(1);
}

console.log('Testing Supabase connection for frontend...');
console.log(`URL: ${supabaseUrl}`);
console.log(`Key: ${supabaseKey.substring(0, 10)}...${supabaseKey.substring(supabaseKey.length - 5)}`);

async function testConnection() {
  try {
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test 1: Check connection by querying public tables
    console.log('\nTest 1: Querying public tables...');
    const { data: tablesData, error: tablesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (tablesError) {
      console.error(`❌ Error querying tables: ${tablesError.message}`);
    } else {
      console.log('✅ Successfully connected to Supabase!');
      console.log(`Retrieved data: ${JSON.stringify(tablesData, null, 2)}`);
    }
    
    // Test 2: Check authentication (anon access)
    console.log('\nTest 2: Checking auth status...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error(`❌ Auth error: ${authError.message}`);
    } else {
      console.log('✅ Auth service working');
      console.log(`Auth status: ${authData.session ? 'Logged in' : 'Not logged in'}`);
    }
    
    // Test 3: Check storage access by trying to access the bucket directly
    console.log('\nTest 3: Checking storage access...');
    try {
      // Try to access the bucket directly by listing files
      const { data: files, error: filesError } = await supabase.storage
        .from('transcriptpro-files')
        .list();
      
      if (filesError) {
        console.error(`❌ Error accessing storage bucket: ${filesError.message}`);
      } else {
        console.log('✅ Storage bucket "transcriptpro-files" is accessible');
        console.log(`Found ${files.length} files in the bucket (empty is normal)`);
      }
    } catch (e) {
      console.error(`❌ Storage error: ${e.message}`);
    }
    
    console.log('\nTest completed!');
    
  } catch (error) {
    console.error(`❌ Connection failed: ${error.message}`);
  }
}

testConnection(); 