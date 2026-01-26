import { seedSamplePartners } from './src/lib/supabase/seed-data.js';

// Seed the data
seedSamplePartners()
  .then(result => {
    console.log('Seed result:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error seeding data:', error);
    process.exit(1);
  });
