// accountent/js/overview/main.js
import { OverviewData } from './data.js';
import { OverviewUI } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // Initialize Data & Realtime Listener
    OverviewData.init((data) => {
        // This callback runs immediately on load, AND whenever data changes
        updateView(data);
    });

    // NEW: Load Header Profile
    loadHeaderProfile();
});

function updateView(data) {
    // Render Stats Cards
    OverviewUI.renderStats('quick-stats-container', data.stats);

    // Render Tank Groups Box
    OverviewUI.renderTanks('tanks-container', data.tanks);

    // Render Alerts (Empty for now)
    OverviewUI.renderAlerts('alerts-container', data.alerts);
}

// UPDATED: Function to load and update profile (Name, Role, Photo)
async function loadHeaderProfile() {
    const profile = await OverviewData.fetchUserProfile();
    if (profile) {
        OverviewUI.updateHeaderProfile(profile);
    }
}