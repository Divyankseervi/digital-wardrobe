import { supabase } from "./supabase.js";

/**
 * auth.js — Shared authentication helper for Digital Wardrobe
 * Provides login, signup, logout, getCurrentUser, and requireAuth.
 */

// ── Get current logged-in user ──
export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// ── Require auth — redirect to login if not logged in ──
export async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = "login.html";
        return null;
    }
    return user;
}

// ── Sign up with email/password ──
export async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { data, error };
}

// ── Log in with email/password ──
export async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
}

// ── Log out ──
export async function logout() {
    await supabase.auth.signOut();
    window.location.href = "login.html";
}

// ── Attach logout handler to navbar button ──
export function setupLogoutButton() {
    const btn = document.getElementById("logoutBtn");
    if (btn) {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            logout();
        });
    }
}
