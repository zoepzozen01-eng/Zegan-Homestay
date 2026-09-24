import { supabase } from '../lib/supabase';

export interface StaffUser {
  name: string;
  username: string; // This will hold the email or username
  role: 'Owner' | 'Receptionist' | 'Admin';
}

/**
 * Normalizes email by converting usernames (no '@' symbol) to custom fake emails.
 * E.g., 'triyanto' becomes 'triyanto@zegan.com'. Real emails remain as is.
 */
export function normalizeEmail(input: string): string {
  const trimmed = input.trim();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  return `${trimmed.toLowerCase()}@zegan.com`;
}

/**
 * Authenticates staff credentials against Supabase Auth.
 */
export async function authenticateStaff(usernameOrEmail: string, passwordInput: string): Promise<StaffUser | null> {
  const email = normalizeEmail(usernameOrEmail);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: passwordInput,
    });

    if (error || !data.user) {
      console.warn('Supabase Auth error:', error);
      return null;
    }

    const user = data.user;
    return {
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Staff',
      username: user.email || '',
      role: (user.user_metadata?.role as any) || 'Receptionist'
    };
  } catch (err) {
    console.error('Authentication exception:', err);
    return null;
  }
}

/**
 * Registers a new staff account in Supabase Auth.
 */
export async function signUpStaff(
  name: string,
  usernameOrEmail: string,
  passwordInput: string,
  role: 'Owner' | 'Receptionist' | 'Admin'
): Promise<StaffUser | null> {
  const email = normalizeEmail(usernameOrEmail);

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: passwordInput,
      options: {
        data: {
          name,
          role
        }
      }
    });

    if (error || !data.user) {
      console.error('Supabase Auth Sign Up error:', error);
      throw new Error(error?.message || 'Failed to sign up');
    }

    const user = data.user;
    return {
      name: user.user_metadata?.name || name,
      username: user.email || email,
      role: (user.user_metadata?.role as any) || role
    };
  } catch (err: any) {
    console.error('Sign up exception:', err);
    throw err;
  }
}

/**
 * Log out from Supabase Auth session.
 */
export async function signOutStaff(): Promise<void> {
  await supabase.auth.signOut();
}
