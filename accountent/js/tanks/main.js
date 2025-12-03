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

    const filterSelect = document.getElementById('filter-status');
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            currentFilter = e.target.value;
            applyFilterAndRender();
        });
    }

    const btnExport = document.getElementById('btn-export');
    if (btnExport) btnExport.addEventListener('click', exportToExcel);

    // Logout Button with Confirmation Popup
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

    // GRID ACTIONS (Delegation)
    const gridContainer = document.getElementById('tanks-grid-container');
    if (gridContainer) {
        gridContainer.addEventListener('click', handleGridActions);
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const id = TanksUI.inputs.id.value;
    const name = TanksUI.inputs.name.value.trim();
    const price = parseFloat(TanksUI.inputs.price.value);
    const days = parseInt(TanksUI.inputs.days.value);
    
    // Validate that 'name' is just digits
    if (!/^\d+$/.test(name)) {
        TanksUI.showError('خطأ', 'يرجى إدخال أرقام فقط في حقل السعة (مثال: 1000)');
        return;
    }

    let isActive = true;
    if (TanksUI.inputs.status) isActive = TanksUI.inputs.status.value === "true";

    const tankData = { name: name, price: price, filling_days: days, is_active: isActive };

    try {
        if (id) {
            await TanksData.updateTank(id, tankData);
            TanksUI.showSuccess('تم بنجاح', 'تم التعديل');
        } else {
            await TanksData.addTank(tankData);
            TanksUI.showSuccess('تم بنجاح', 'تم الإضافة');
        }
        TanksUI.closeModal();
        refreshTableData();
    } catch (error) {
        TanksUI.showError('خطأ', error.message);
    }
}

async function handleGridActions(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    if (!id) return;

    // 1. Show Customers
    if (btn.classList.contains('btn-view-customers')) {
        try {
            const customers = await TanksData.getCustomersByTankId(id);
            if (customers.length === 0) {
                Swal.fire({
                    icon: 'info',
                    title: 'لا يوجد زبائن',
                    text: 'لم يتم ربط أي زبون بهذا الخزان بعد.',
                    confirmButtonText: 'حسناً',
                    customClass: { popup: 'rounded-2xl' }
                });
                return;
            }

            // Create HTML Table for SweetAlert
            const tableHtml = `
                <div class="overflow-x-auto text-right dir-rtl">
                    <table class="w-full text-sm text-gray-600">
                        <thead class="bg-gray-100 text-xs uppercase font-bold text-gray-500">
                            <tr>
                                <th class="px-4 py-2">الاسم</th>
                                <th class="px-4 py-2">الهاتف</th>
                                <th class="px-4 py-2">العنوان</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${customers.map(c => `
                                <tr class="border-b border-gray-50">
                                    <td class="px-4 py-2 font-bold text-gray-800">${c.name}</td>
                                    <td class="px-4 py-2 font-mono">${c.phone || '-'}</td>
                                    <td class="px-4 py-2 text-xs">${c.address || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            Swal.fire({
                title: 'قائمة الزبائن',
                html: tableHtml,
                width: '600px',
                showConfirmButton: false,
                showCloseButton: true,
                customClass: { popup: 'rounded-3xl' }
            });

        } catch (err) {
            console.error(err);
            TanksUI.showError('خطأ', 'فشل جلب بيانات الزبائن');
        }
    }

    // 2. Delete
    if (btn.classList.contains('btn-delete')) {
        Swal.fire({
            title: 'هل أنت متأكد؟',
            text: "سيتم حذف هذا الخزان نهائياً!",
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

    // 3. Edit
    if (btn.classList.contains('btn-edit')) {
        const tank = TanksData.getTankById(id);
        if (tank) {
            TanksUI.fillForm(tank);
            TanksUI.openModal(true);
        }
    }
}

function exportToExcel() {
    if (!currentTanks || currentTanks.length === 0) {
        TanksUI.showError('تنبيه', 'لا توجد بيانات للتصدير');
        return;
    }
    const dataToExport = currentTanks.map((t, index) => ({
        'التسلسل': index + 1,
        'اسم الخزان': t.name,
        'السعر': t.price,
        'أيام التعبئة': t.filling_days,
        'عدد الزبائن': t.customer_count || 0,
        'الحالة': (t.is_active !== false) ? 'فعال' : 'غير فعال',
        'تاريخ الإنشاء': t.created_at ? new Date(t.created_at).toLocaleDateString('ar-EG') : '-'
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الخزانات");
    XLSX.writeFile(wb, "تقرير_الخزانات.xlsx");
}