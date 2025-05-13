// Debug script for Supabase storage
// Run with: node debug-storage.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key (first 10 chars):', supabaseKey?.substring(0, 10));

async function debugStorage() {
  try {
    console.log('\nCreating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get and print Supabase client version
    console.log('Supabase client version:', supabase.version);
    
    console.log('\nAttempting to list buckets...');
    try {
      // Direct call to storage API
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Error listing buckets:', bucketsError);
        
        // Try to print more details
        if (bucketsError.details) {
          console.error('Error details:', bucketsError.details);
        }
        if (bucketsError.hint) {
          console.error('Error hint:', bucketsError.hint);
        }
      } else {
        console.log('Buckets:', buckets);
      }
    } catch (e) {
      console.error('Exception listing buckets:', e);
    }
    
    console.log('\nTrying to access the transcriptpro-files bucket directly...');
    try {
      const { data: files, error: filesError } = await supabase.storage
        .from('transcriptpro-files')
        .list();
      
      if (filesError) {
        console.error('Error listing files:', filesError);
      } else {
        console.log('Files:', files);
      }
    } catch (e) {
      console.error('Exception listing files:', e);
    }
    
  } catch (e) {
    console.error('Unexpected error:', e);
  }
}

debugStorage(); 