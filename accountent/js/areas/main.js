// accountent/js/areas/main.js
import { AreasData } from './data.js';
import { AreasUI } from './ui.js';
import { AuthService } from '../../../Settings/auth.js'; 

let allAreas = [];
let driversList = [];

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    setupEventListeners();
    refreshData();
}

function refreshData() {
    Promise.all([
        AreasData.fetchAreas(),
        AreasData.fetchDrivers()
    ]).then(([areas, drivers]) => {
        allAreas = areas;
        driversList = drivers;
        AreasUI.renderTable(allAreas);
    });
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
        const filtered = allAreas.filter(a => a.name.toLowerCase().includes(val));
        AreasUI.renderTable(filtered);
    });

    // Table Actions
    document.getElementById('areas-table-body').addEventListener('click', handleTableActions);
    
    // Export
    document.getElementById('btn-export').addEventListener('click', () => {
        const data = allAreas.map((a, i) => ({
            '#': i+1, 'المنطقة': a.name, 'السائق': a.driver_name, 'الزبائن': a.customer_count, 'الحالة': a.is_active ? 'فعال' : 'مغلق'
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "المناطق");
        XLSX.writeFile(wb, "Areas.xlsx");
    });

    // Logout Button Logic
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            
            Swal.fire({
                title: 'تسجيل الخروج؟',
                text: "هل أنت متأكد من المغادرة؟",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444', // Red for Confirm
                cancelButtonColor: '#3b82f6',  // Blue for Cancel
                confirmButtonText: 'خروج',
                cancelButtonText: 'إلغاء',
                customClass: {
                    popup: 'rounded-3xl font-sans',
                    title: 'text-xl font-bold text-gray-800',
                    htmlContainer: 'text-gray-500'
                }
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        // 1. Attempt standard logout
                        await AuthService.logout();
                    } catch (error) {
                        console.error("Logout error:", error);
                    } finally {
                        // 2. Force clear storage to ensure Login page doesn't bounce us back
                        localStorage.clear();
                        sessionStorage.clear();
                        
                        // 3. Redirect to login.html (sibling file)
                        window.location.replace('login.html'); 
                    }
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
        refreshData();
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
            customClass: { popup: 'rounded-3xl' }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await AreasData.deleteArea(id);
                    AreasUI.showSuccess('تم الحذف', '');
                    refreshData();
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
        AreasUI.showSuccess('تنبيه', 'عرض الزبائن قريباً');
    }
}