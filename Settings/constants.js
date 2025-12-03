// Nabaa_Alfaloujah/settings/constants.js

/**
 * Centralized Application Constants
 */
const APP_CONSTANTS = {
    // Database Table Names
    TABLES: {
        REQUESTS: 'requests',
        DRIVERS: 'drivers',
        CUSTOMERS: 'customers',
        TANK_TYPES: 'tank_types', // <-- CORRECTED TABLE NAME
        AREAS: 'areas',
        EXPENSES: 'expenses',
        OWNER_PAYMENTS: 'owner_payments', // Consistent naming
        DELETED_REQUESTS: 'deleted_requests',
        BLOCKED_CUSTOMERS: 'blocked_customers',
        TANK_HISTORY: 'tank_history',
        TRACKING_LOGS: 'tracking_logs',
        EMPLOYEES: 'employees'
    },

    // User Roles
    ROLES: {
        ADMIN: 'admin',
        MANAGER: 'manager',
        ACCOUNTANT: 'accountant',
        OWNER: 'owner',
        DRIVER: 'driver',
        HELPER: 'helper'
    },

    // Request Types
    REQUEST_TYPES: {
        FILLING: 'filling',
        WITHDRAWAL: 'withdrawal',
        EXCHANGE: 'exchange'
    },

    // Statuses
    STATUS: {
        PENDING: 'pending',
        DELIVERED: 'delivered',
        COMPLETED: 'completed',
        ACTIVE: 'active',
        INACTIVE: 'inactive',
        ACTIVE_AR: 'فعال',
        INACTIVE_AR: 'غير فعال',
        PAID: 'paid',
        LATER: 'later',
        CONFIRMED: 'confirmed'
    },

    // Expense Categories
    EXPENSE_CATS: {
        SALARY_ADVANCE: 'salary_advance',
        REWARD: 'reward',
        OWNER_WITHDRAW: 'owner_withdraw',
        DEDUCTION: 'deduction',
        FUEL: 'fuel',
        MAINTENANCE: 'maintenance'
    },

    // *** NEW: Dynamic Tank Configuration ***
    // This maps the Tank Capacity (Key) to the Driver Database Columns (Values)
    TANK_CONFIG: {
        250:  { label: '250 لتر',  rateCol: 'rate_250',  bonusCol: 'bonus_250' },
        500:  { label: '500 لتر',  rateCol: 'rate_500',  bonusCol: 'bonus_500' },
        1000: { label: '1000 لتر', rateCol: 'rate_1000', bonusCol: 'bonus_1000' }
        // Future Example: 
        // 2000: { label: '2000 لتر', rateCol: 'rate_2000', bonusCol: 'bonus_2000' }
    },

    // System Defaults
    DEFAULTS: {
        CURRENCY: 'IQD',
        DEFAULT_TANK_DAYS: 30,
        DEFAULT_COMMISSION: 350
    },

    // Date Options
    DATE_OPTS: {
        ARABIC_MONTHS: [
            "كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران", 
            "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"
        ]
    },

    // Translations
    TRANSLATIONS: {
        CATEGORIES: {
            'fuel': 'وقود',
            'oil': 'زيوت',
            'maintenance': 'صيانة',
            'salary_advance': 'سلفة راتب',
            'owner_withdraw': 'سحب مالك',
            'rent': 'إيجار',
            'electricity': 'كهرباء',
            'tools': 'مواد',
            'reward': 'مكافأة',
            'deduction': 'خصم',
            'other': 'أخرى'
        },
        ROLES: {
            'operator': 'مشغل محطة',
            'accountant': 'محاسب',
            'worker': 'عامل',
            'guard': 'حارس',
            'driver': 'سائق',
            'helper': 'مساعد',
            'other': 'موظف آخر'
        }
    },

    // UI Messages
    MESSAGES: {
        CONFIRM_DELETE: 'هل أنت متأكد من الحذف؟',
        SUCCESS_SAVE: 'تم الحفظ بنجاح',
        ERROR_GENERIC: 'حدث خطأ غير متوقع',
        NO_DATA: 'لا يوجد بيانات لعرضها',
        LOADING: 'جاري التحميل...'
    }
};

Object.freeze(APP_CONSTANTS);