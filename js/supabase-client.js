/**
 * Fitness Journey MED - Supabase Connection
 * Imports Supabase via CDN and configures the client.
 */

const SUPABASE_URL = 'COLE_AQUI_A_URL_DO_PROJETO';
const SUPABASE_ANON_KEY = 'COLE_AQUI_A_CHAVE_ANON_PUBLICA';

window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Supabase client initialized.');
