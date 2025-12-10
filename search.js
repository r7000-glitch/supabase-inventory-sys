// --- Realtime.js for inventory system ---
import { supabase } from "./supabase.js";

// --- Wait for loadAssets function to be available, then set up real-time subscription ---
function setupRealtimeSubscription() {
  if (typeof loadAssets !== "function") {
    // Retry in 100ms
    setTimeout(setupRealtimeSubscription, 100);
    return;
  }

  // --- Real-time subscription ---
  supabase
    .channel('public:assets')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'assets' },
      payload => {
        console.log('Realtime update received:', payload);

        // Refresh assets table
        if (typeof loadAssets === "function") {
          loadAssets();
        }
      }
    )
    .subscribe();
}

// Start checking for loadAssets
setupRealtimeSubscription();

// --- Search input is already handled in main.js via loadAssets() ---
