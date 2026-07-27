const fs = require('fs')
const path = require('path')

async function runMigration() {
  const sql = fs.readFileSync(path.join(__dirname, '../supabase/migrations/20260727120000_stage45_manual_import.sql'), 'utf8')
  
  const response = await fetch('https://utqcgethipyrnmmicdbb.supabase.co/rest/v1/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0cWNnZXRoaXB5cm5tbWljZGJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQ2Njk0MSwiZXhwIjoyMTAwMDQyOTQxfQ.iv7eIOrfXKvZlalH1s5GWWDKlNMrsm8Wmh5goWBk1Uw',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0cWNnZXRoaXB5cm5tbWljZGJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQ2Njk0MSwiZXhwIjoyMTAwMDQyOTQxfQ.iv7eIOrfXKvZlalH1s5GWWDKlNMrsm8Wmh5goWBk1Uw'
    },
    body: JSON.stringify({ query: sql })
  })

  console.log('Status:', response.status)
  const text = await response.text()
  console.log('Response:', text)
}

runMigration().catch(console.error)
