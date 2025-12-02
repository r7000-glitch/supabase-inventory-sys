// auth.js
import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

// Initialize Supabase
export const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_KEY);

/**
 * Login a user with email and password
 * @param {string} email 
 * @param {string} password 
 * @returns {object} user
 */
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const user = data.user;
  if (!user) throw new Error("No user returned from Supabase Auth.");

  return user;
}

/**
 * Logout the current user
 */
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get the currently logged-in user
 * @returns {object|null} user
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

/**
 * Redirect user based on role stored in metadata
 * @param {object} user 
 */
export function redirectByRole(user) {
  const role = user.user_metadata.role || 'viewer'; // default to viewer

  switch (role) {
    case 'admin':
      window.location.href = '/admin.html';
      break;
    case 'user':
      window.location.href = '/user.html';
      break;
    case 'viewer':
    default:
      window.location.href = '/viewer.html';
      break;
  }
}
