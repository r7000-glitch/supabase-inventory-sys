
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_KEY,
  users: [
    { username: "admin", password: "@dmin2026", role: "admin" },
    { username: "user", password: "user@cf", role: "user" },
    { username: "viewer", password: "vieweronly", role: "viewer" }
  ]
};
