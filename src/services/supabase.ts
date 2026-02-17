import { createClient } from '@supabase/supabase-js';
import type { TeacherProfile } from '../types';

const SUPABASE_URL = localStorage.getItem('supabase_url') || import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = localStorage.getItem('supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helpers
export const setSupabaseConfig = (url: string, key: string) => {
    localStorage.setItem('supabase_url', url);
    localStorage.setItem('supabase_anon_key', key);
    window.location.reload(); // Simple reload to re-init client
};

export const getTeacherProfile = (): TeacherProfile | null => {
    const stored = localStorage.getItem('teacher_profile');
    return stored ? JSON.parse(stored) : null;
};

export const saveTeacherProfile = (profile: TeacherProfile) => {
    localStorage.setItem('teacher_profile', JSON.stringify(profile));
    // Also save to Supabase if connected
    // supabase.from('teachers').upsert(profile)...
};
