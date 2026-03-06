/**
 * Fitness Journey MED - Supabase Connection
 * Imports Supabase via CDN and configures the client.
 */

const SUPABASE_URL = 'https://ieprakamqaldoyaacvcy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_pZ7GiKEeSxKQ4-uoOxhVEQ_889pcaFl';

window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Supabase client initialized.');
