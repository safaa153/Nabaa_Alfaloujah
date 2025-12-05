// accountent/js/overview/main.js
import { OverviewData } from './data.js';
import { OverviewUI } from './ui.js';
import { AuthService } from '../../../Settings/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // Initialize Data & Realtime Listener
    OverviewData.init((data) => {
        updateView(data);
    });

    // Load Header Profile
    loadHeaderProfile();

    // NEW: Initialize Dark Mode Toggle
    initThemeToggle();
    
    // Logout Handler
    document.getElementById('btn-logout').addEventListener('click', async () => {
        const { isConfirmed } = await Swal.fire({
            title: 'تسجيل الخروج؟',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'خروج',
            cancelButtonText: 'إلغاء',
            customClass: { popup: 'rounded-2xl' }
        });
        if(isConfirmed) {
            await AuthService.auth.signOut();
            // FIXED: Redirect to login.html
            window.location.replace('login.html');
        }
    });
});

function updateView(data) {
    OverviewUI.renderStats('quick-stats-container', data.stats);
    OverviewUI.renderTanks('tanks-container', data.tanks);
    OverviewUI.renderAlerts('alerts-container', data.alerts);
}

async function loadHeaderProfile() {
    const profile = await OverviewData.fetchUserProfile();
    if (profile) {
        OverviewUI.updateHeaderProfile(profile);
    }
}

function initThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const body = document.body;

    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-mode');
        if(themeIcon) themeIcon.classList.replace('ph-moon', 'ph-sun');
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            const isDark = body.classList.contains('dark-mode');
            if (isDark) {
                if(themeIcon) themeIcon.classList.replace('ph-moon', 'ph-sun');
                localStorage.setItem('theme', 'dark');
            } else {
                if(themeIcon) themeIcon.classList.replace('ph-sun', 'ph-moon');
                localStorage.setItem('theme', 'light');
            }
        });
    }
}