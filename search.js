// --- Realtime.js for inventory system ---

// --- Supabase client ---
const supabase = supabase.createClient(
  'https://iwwopytnacebtffzcnmq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3d29weXRuYWNlYnRmZnpjbm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNTY5OTUsImV4cCI6MjA3OTgzMjk5NX0.kPBBZaw-vfxBkYfYPJOIQFUU3q2vuaIAmfXlAEI-NEM'
);

// --- Ensure loadAssets function exists ---
if (typeof loadAssets !== "function") {
  console.error("loadAssets() function not found. Please make sure this script is loaded after main.js.");
}

// --- Real-time subscription ---
supabase
  .channel('public:inventory')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'inventory' },
    payload => {
      console.log('Realtime update received:', payload);

      // Refresh assets table
      if (typeof loadAssets === "function") {
        loadAssets();
      }
    }
  )
  .subscribe();

// --- Search input is already handled in main.js via loadAssets() ---
