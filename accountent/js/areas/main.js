// accountent/js/areas/main.js
import { AreasData } from './data.js';
import { AreasUI } from './ui.js';
import { AuthService } from '../../../Settings/auth.js'; 

let allAreas = [];
let driversList = [];

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    setupEventListeners();
    
    // Initialize Data & Realtime
    AreasData.init((data) => {
        allAreas = data.areas;
        driversList = data.drivers;
        AreasUI.renderTable(allAreas);
        loadHeaderProfile();
    });

    loadHeaderProfile();
    initThemeToggle();
}

async function loadHeaderProfile() {
    const profile = await AreasData.fetchUserProfile();
    if (profile) {
        AreasUI.updateHeaderProfile(profile);
    }
}

function setupEventListeners() {
    document.getElementById('btn-add-area').addEventListener('click', () => {
        AreasUI.openModal(false, driversList);
    });
    
    document.getElementById('btn-close-modal').addEventListener('click', () => AreasUI.closeModal());
    document.getElementById('btn-cancel-modal').addEventListener('click', () => AreasUI.closeModal());
    document.getElementById('area-form').addEventListener('submit', handleFormSubmit);

    // Search
    document.getElementById('search-area').addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        const filtered = allAreas.filter(a => 
            a.name.toLowerCase().includes(val) ||
            (a.driver_name && a.driver_name.toLowerCase().includes(val)) // Added driver search
        );
        AreasUI.renderTable(filtered);
    });

    // Table Actions
    document.getElementById('areas-table-body').addEventListener('click', handleTableActions);
    
    // Export
    document.getElementById('btn-export').addEventListener('click', () => {
        if (!allAreas || allAreas.length === 0) {
            AreasUI.showError('تنبيه', 'لا توجد بيانات للتصدير');
            return;
        }
        const data = allAreas.map((a, i) => ({
            '#': i+1, 
            'المنطقة': a.name, 
            'السائق': a.driver_name, 
            'الزبائن': a.customer_count, 
            'الحالة': (a.is_active !== false) ? 'فعال' : 'غير فعال',
            'تاريخ الإنشاء': new Date(a.created_at).toLocaleDateString('ar-EG')
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "المناطق");
        XLSX.writeFile(wb, `Areas_List_${new Date().toISOString().slice(0,10)}.xlsx`);
    });

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
                cancelButtonColor: '#3b82f6',  
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
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const ui = AreasUI.inputs;
    
    const id = ui.id.value;
    const payload = {
        name: ui.name.value,
        driver_id: ui.driver.value || null,
        is_active: ui.status.value === "true"
    };

    try {
        if (id) {
            await AreasData.updateArea(id, payload);
            AreasUI.showSuccess('تم التعديل', 'تم تحديث المنطقة بنجاح');
        } else {
            await AreasData.addArea(payload);
            AreasUI.showSuccess('تم الإضافة', 'تم إضافة المنطقة بنجاح');
        }
        
        AreasUI.closeModal();
        // Force Instant Refresh
        AreasData.refresh();

    } catch (err) {
        AreasUI.showError('خطأ', err.message);
    }
}

async function handleTableActions(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;

    if (btn.classList.contains('btn-delete')) {
        Swal.fire({
            title: 'حذف المنطقة؟',
            text: "لا يمكن التراجع عن هذا الإجراء",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'حذف',
            cancelButtonText: 'إلغاء',
            confirmButtonColor: '#d33',
            customClass: { popup: 'rounded-2xl' }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await AreasData.deleteArea(id);
                    AreasUI.showSuccess('تم الحذف', '');
                    // Force Instant Refresh
                    AreasData.refresh();
                } catch (err) {
                    AreasUI.showError('خطأ', err.message);
                }
            }
        });
    }

    if (btn.classList.contains('btn-edit')) {
        const item = allAreas.find(a => a.id == id);
        if (item) {
            AreasUI.openModal(true, driversList);
            AreasUI.fillForm(item);
        }
    }
    
    if (btn.classList.contains('btn-customers')) {
        AreasUI.showSuccess('تنبيه', 'سيتم إتاحة عرض الزبائن في التحديث القادم');
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