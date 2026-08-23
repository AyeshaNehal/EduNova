import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://irfsphocdqiksdaekxfj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZnNwaG9jZHFpa3NkYWVreGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NjA3NTgsImV4cCI6MjEwMjEzNjc1OH0.P4RHSrb7o2jbgPWcx9Glh6oaPAWJ4qHEZlxcXOEszpE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
