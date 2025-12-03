// accountent/js/tanks/main.js
import { TanksData } from './data.js';
import { TanksUI } from './ui.js';
import { AuthService } from '../../../Settings/auth.js'; 

let currentTanks = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    setupEventListeners();
    refreshTableData();
    // NEW: Load Header Profile
    loadHeaderProfile();
}

async function loadHeaderProfile() {
    const profile = await TanksData.fetchUserProfile();
    if (profile) {
        TanksUI.updateHeaderProfile(profile);
    }
}

function refreshTableData() {
    TanksData.fetchTanks((tanks) => {
        currentTanks = tanks;
        applyFilterAndRender();
    });
}

function applyFilterAndRender() {
    let filtered = currentTanks;
    if (currentFilter === 'active') {
        filtered = currentTanks.filter(t => t.is_active !== false);
    } else if (currentFilter === 'inactive') {
        filtered = currentTanks.filter(t => t.is_active === false);
    }
    TanksUI.renderTable(filtered);
}

function setupEventListeners() {
    // Buttons & Forms
    const btnAdd = document.getElementById('btn-add-tank');
    if (btnAdd) btnAdd.addEventListener('click', () => TanksUI.openModal(false));
    
    const btnClose = document.getElementById('btn-close-modal');
    if (btnClose) btnClose.addEventListener('click', () => TanksUI.closeModal());
    
    const btnCancel = document.getElementById('btn-cancel-modal');
    if (btnCancel) btnCancel.addEventListener('click', () => TanksUI.closeModal());
    
    const form = document.getElementById('tank-form');
    if (form) form.addEventListener('submit', handleFormSubmit);

    // Sidebar Toggle
    const toggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('main-sidebar');
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('w-64');
            sidebar.classList.toggle('w-20');
            sidebar.classList.toggle('collapsed-mode');
        });
    }

    // Filter
    const filter = document.getElementById('filter-status');
    if (filter) {
        filter.addEventListener('change', (e) => {
            currentFilter = e.target.value;
            applyFilterAndRender();
        });
    }

    // Logout
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            Swal.fire({
                title: 'تسجيل الخروج؟',
                text: "هل أنت متأكد من المغادرة؟",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                confirmButtonText: 'خروج',
                cancelButtonText: 'إلغاء',
                customClass: { popup: 'rounded-2xl' }
            }).then(async (result) => {
                if (result.isConfirmed) {
                    await AuthService.logout();
                    window.location.replace('../../index.html');
                }
            });
        });
    }

    // Action Delegation (Edit / Delete / Customers)
    const grid = document.getElementById('tanks-grid-container');
    if (grid) {
        grid.addEventListener('click', handleGridActions);
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const ui = TanksUI.inputs;
    const id = ui.id.value;

    const payload = {
        name: ui.name.value,
        price: parseFloat(ui.price.value),
        filling_days: parseInt(ui.days.value),
        is_active: ui.status.value === "true"
    };

    try {
        if (id) {
            await TanksData.updateTank(id, payload);
            TanksUI.showSuccess('تم التعديل', 'تم تحديث بيانات الخزان');
        } else {
            await TanksData.addTank(payload);
            TanksUI.showSuccess('تم الإضافة', 'تم إضافة خزان جديد');
        }
        TanksUI.closeModal();
        refreshTableData();
    } catch (error) {
        TanksUI.showError('خطأ', error.message);
    }
}

function handleGridActions(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;

    // 1. Delete
    if (btn.classList.contains('btn-delete')) {
        Swal.fire({
            title: 'هل أنت متأكد؟',
            text: "سيتم حذف هذا السجل نهائياً",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'حذف',
            cancelButtonText: 'إلغاء',
            customClass: { popup: 'rounded-2xl' }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await TanksData.deleteTank(id);
                    TanksUI.showSuccess('تم الحذف', 'تم الحذف بنجاح');
                    refreshTableData();
                } catch (error) {
                    TanksUI.showError('خطأ', error.message);
                }
            }
        });
    }

    // 2. Edit
    if (btn.classList.contains('btn-edit')) {
        const tank = currentTanks.find(t => t.id == id);
        if (tank) {
            TanksUI.fillForm(tank);
            TanksUI.openModal(true);
        }
    }

    // 3. View Customers (NEW)
    if (btn.classList.contains('btn-customers')) {
        Swal.fire({
            icon: 'info',
            title: 'تنبيه',
            text: 'سيتم إتاحة عرض المشتركين وتحديد مواقعهم في التحديث القادم',
            confirmButtonText: 'حسناً',
            confirmButtonColor: '#3b82f6', 
            customClass: { popup: 'rounded-2xl' }
        });
    }
}