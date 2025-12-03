// Settings/auth.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// --- CONFIGURATION ---
const SUPABASE_URL = 'https://dmnqahnmhcbgnosubyxs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtbnFhaG5taGNiZ25vc3VieXhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMzI0MjIsImV4cCI6MjA3ODgwODQyMn0.-lFj-uIby8fawkZLwDo2kc5s-yIwGXIvdYY6vhI9q94';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- AUTH GUARD LOGIC ---
(async function initAuthProtection() {
    
    const path = window.location.pathname;
    const page = path.split("/").pop(); // e.g., "login.html"
    const isLoginPage = page === 'login.html' || page === '';

    // Check Session
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        // --- USER IS LOGGED IN ---
        
        if (isLoginPage) {
            // If on login page, kick them to dashboard immediately
            window.location.replace('overview.html');
            return;
        }
        
        // Load User Info for sidebar/header
        loadUserProfile(session.user.id);

    } else {
        // --- USER IS NOT LOGGED IN ---
        
        if (!isLoginPage) {
            // If on dashboard, kick them back to login
            window.location.replace('login.html');
        }
    }
})();

async function loadUserProfile(userId) {
    const { data } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', userId)
        .single();

    if (data) {
        localStorage.setItem('user_role', data.role);
        localStorage.setItem('user_name', data.full_name || 'المسؤول');
    }
}

// --- GLOBAL LOGOUT HANDLER ---
// Waits for DOM to load, then attaches click event to any button with class 'btn-logout'
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtns = document.querySelectorAll('.btn-logout');
    
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            Swal.fire({
                title: 'تسجيل الخروج؟',
                text: "هل أنت متأكد من المغادرة؟",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'خروج',
                cancelButtonText: 'إلغاء',
                customClass: { popup: 'rounded-2xl' }
            }).then(async (result) => {
                if (result.isConfirmed) {
                    await supabase.auth.signOut();
                    localStorage.clear();
                    window.location.href = 'login.html';
                }
            });
        });
    });
});

export const AuthService = {
    db: supabase,
    auth: supabase.auth,
    login: async (email, password) => supabase.auth.signInWithPassword({ email, password })
};