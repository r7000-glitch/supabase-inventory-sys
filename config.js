// config.js - Environment configuration
// DO NOT commit this file to version control!

export const config = {
  SUPABASE_URL: "https://iwwopytnacebtffzcnmq.supabase.co",
  SUPABASE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3d29weXRuYWNlYnRmZnpjbm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNTY5OTUsImV4cCI6MjA3OTgzMjk5NX0.kPBBZaw-vfxBkYfYPJOIQFUU3q2vuaIAmfXlAEI-NEM",

  // User accounts
  users: [
    { username: "admin", password: "@dmin2026", role: "admin" },
    { username: "user", password: "user@cf", role: "user" },
    { username: "viewer", password: "vieweronly", role: "viewer" }
  ]
};
