// Settings/config.js
/**
 * config.js
 * Central configuration for the application (Nabaa Alfaloujah).
 * This file is shared across Accountant, Drivers, and Admin panels.
 */

export const Config = {
    // --- APP SETTINGS ---
    APP_NAME: 'نبع الفلوجة',
    CURRENCY: 'د.ع',
    
    // --- DATABASE CONFIGURATION ---
    // Firestore Root Path (Used in this testing environment)
    FIRESTORE_ROOT: (appId) => `artifacts/${appId}/public/data`,

    // Specific Collection Names (Used by all data modules)
    COLLECTIONS: {
        TANK_TYPES: 'tank_types',
        CUSTOMERS: 'customers',
        ORDERS: 'orders'
    },
    
    // Supabase Configuration
    // (For future local use when USE_SUPABASE is true)
    SUPABASE_URL: 'https://dmnqahnmhcbgnosubyxs.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtbnFhaG5taGNiZ25vc3VieXhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMzI0MjIsImV4cCI6MjA3ODgwODQyMn0.-lFj-uIby8fawkZLwDo2kc5s-yIwGXIvdYY6vhI9q94',

    // Toggle this if you switch logic in data.js later
    USE_SUPABASE: false 
};