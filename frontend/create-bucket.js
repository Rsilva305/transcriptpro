// Script to create the storage bucket
// Run with: node create-bucket.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env file');
  process.exit(1);
}

async function createBucket() {
  try {
    console.log('Creating storage bucket...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Try to create the bucket with a smaller file size limit
    const { data, error } = await supabase.storage.createBucket('transcriptpro-files', {
      public: false, // Private bucket
      fileSizeLimit: 52428800, // 50MB in bytes
    });
    
    if (error) {
      console.error(`❌ Error creating bucket: ${error.message}`);
      
      // If bucket already exists, this is fine
      if (error.message.includes('already exists')) {
        console.log('✅ Bucket already exists, which is fine');
      }
    } else {
      console.log('✅ Bucket created successfully!');
      console.log(data);
    }
    
    // List all buckets to verify
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error(`❌ Error listing buckets: ${listError.message}`);
    } else {
      console.log(`\nFound ${buckets.length} storage buckets:`);
      buckets.forEach(bucket => {
        console.log(`- ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });
    }
  } catch (e) {
    console.error(`❌ Unexpected error: ${e.message}`);
  }
}

createBucket(); 