const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://utqcgethipyrnmmicdbb.supabase.co'
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0cWNnZXRoaXB5cm5tbWljZGJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQ2Njk0MSwiZXhwIjoyMTAwMDQyOTQxfQ.iv7eIOrfXKvZlalH1s5GWWDKlNMrsm8Wmh5goWBk1Uw'

const supabase = createClient(supabaseUrl, serviceKey)

async function testConnection() {
  const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('data-imports')
  if (bucketError && bucketError.message.includes('not found')) {
    console.log('Creating data-imports bucket...')
    const { data: newBucket, error: createError } = await supabase.storage.createBucket('data-imports', {
      public: false,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: [
        'text/csv',
        'application/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
    })
    console.log('Created bucket:', newBucket, 'Error:', createError)
  } else {
    console.log('Bucket status:', bucketData ? 'Exists' : 'Not found', bucketError)
  }

  const { data: batchData, error: batchError } = await supabase.from('data_import_batches').select('id').limit(1)
  console.log('data_import_batches query error:', batchError)

  const { data: snapshotData, error: snapshotError } = await supabase.from('analytics_snapshots').select('data_source, source_priority').limit(1)
  console.log('analytics_snapshots query error:', snapshotError)
}

testConnection().catch(console.error)
