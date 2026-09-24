import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Clean up any accidental whitespace or quotes from the input
const supabaseUrl = rawUrl.trim().replace(/^['"]|['"]$/g, '');
const supabaseAnonKey = rawKey.trim().replace(/^['"]|['"]$/g, '');

const isValidUrl = supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://');

export const supabaseDebugInfo = {
  urlDefined: !!rawUrl && rawUrl.trim() !== '',
  urlLength: supabaseUrl.length,
  keyDefined: !!rawKey && rawKey.trim() !== '',
  keyLength: supabaseAnonKey.length,
  isValidUrl,
};

console.log('Supabase initialization debug info:', {
  urlDefined: supabaseDebugInfo.urlDefined,
  urlLength: supabaseDebugInfo.urlLength,
  keyDefined: supabaseDebugInfo.keyDefined,
  keyLength: supabaseDebugInfo.keyLength,
  isValidUrl: supabaseDebugInfo.isValidUrl,
});

// Use a safe fallback URL to prevent createClient from throwing a fatal runtime crash on load
const safeUrl = isValidUrl ? supabaseUrl : 'https://placeholder-project.supabase.co';
const safeKey = supabaseAnonKey || 'placeholder-anon-key';

export const supabase = createClient(safeUrl, safeKey);

