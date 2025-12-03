// accountent/js/overview/main.js
import { OverviewData } from './data.js';
import { OverviewUI } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // Initialize Data & Realtime Listener
    OverviewData.init((data) => {
        updateView(data);
    });

    // Load Header Profile
    loadHeaderProfile();

    // NEW: Initialize Dark Mode Toggle
    initThemeToggle();
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

// NEW: Theme Toggle Logic
function initThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const body = document.body;

    // 1. Check local storage
    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-mode');
        themeIcon.classList.replace('ph-moon', 'ph-sun');
    }

    // 2. Toggle Event
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            
            const isDark = body.classList.contains('dark-mode');
            
            // Switch Icon
            if (isDark) {
                themeIcon.classList.replace('ph-moon', 'ph-sun');
                localStorage.setItem('theme', 'dark');
            } else {
                themeIcon.classList.replace('ph-sun', 'ph-moon');
                localStorage.setItem('theme', 'light');
            }
        });
    }
}