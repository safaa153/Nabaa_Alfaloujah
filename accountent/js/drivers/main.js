// accountent/js/drivers/main.js
import { DriversData } from './data.js';
import { DriversUI } from './ui.js';
import { AuthService } from '../../../Settings/auth.js'; 

let allStaff = [];
let tankTypes = [];
let allCars = []; 
let currentView = 'driver'; 

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    setupEventListeners();
    
    DriversData.init((data) => {
        allStaff = data.drivers;
        tankTypes = data.tanks;
        allCars = data.cars;
        
        renderCurrentView();
        loadHeaderProfile();
    });

    loadHeaderProfile();
    initThemeToggle();
}

async function loadHeaderProfile() {
    const profile = await DriversData.fetchUserProfile();
    if (profile) {
        DriversUI.updateHeaderProfile(profile);
    }
}

function renderCurrentView() {
    const filtered = allStaff.filter(item => item.role === currentView);
    DriversUI.renderTable(filtered, allStaff, currentView); 
    
    updateToggleStyles('view-drivers', currentView === 'driver');
    updateToggleStyles('view-assistants', currentView === 'assistant');
    updateToggleStyles('view-employees', currentView === 'employee');
}

function updateToggleStyles(btnId, isActive) {
    const btn = document.getElementById(btnId);
    if (isActive) {
        btn.className = "px-4 py-1.5 rounded-md text-sm font-bold transition-all shadow-sm bg-blue-50 text-blue-600";
    } else {
        btn.className = "px-4 py-1.5 rounded-md text-sm font-bold transition-all text-gray-500 hover:text-gray-700 hover:bg-gray-50";
    }
}

function setupEventListeners() {
    document.getElementById('view-drivers').addEventListener('click', () => { currentView = 'driver'; renderCurrentView(); });
    document.getElementById('view-assistants').addEventListener('click', () => { currentView = 'assistant'; renderCurrentView(); });
    document.getElementById('view-employees').addEventListener('click', () => { currentView = 'employee'; renderCurrentView(); });

    document.getElementById('btn-add-driver').addEventListener('click', () => {
        DriversUI.openModal(false, currentView, tankTypes, allStaff, allCars);
    });

    document.getElementById('btn-close-modal').addEventListener('click', () => DriversUI.closeModal());
    document.getElementById('btn-cancel-modal').addEventListener('click', () => DriversUI.closeModal());
    document.getElementById('driver-form').addEventListener('submit', handleFormSubmit);

    const btnExport = document.getElementById('btn-export');
    if (btnExport) {
        btnExport.addEventListener('click', exportToExcel);
    }

    document.getElementById('search-driver').addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        const filtered = allStaff.filter(d => 
            d.role === currentView && 
            (d.name.toLowerCase().includes(val) || (d.phone && d.phone.includes(val)))
        );
        DriversUI.renderTable(filtered, allStaff, currentView);
    });

    document.getElementById('drivers-table-body').addEventListener('click', handleTableActions);
}

function exportToExcel() {
    if (!allStaff || allStaff.length === 0) {
        DriversUI.showError('تنبيه', 'لا توجد بيانات للتصدير');
        return;
    }

    const dataToExport = allStaff
        .filter(item => item.role === currentView)
        .map(item => {
            const baseData = {
                "الاسم": item.name,
                "الهاتف": item.phone,
                "الحالة": item.is_active ? 'نشط' : 'متوقف',
                "تاريخ الإضافة": new Date(item.created_at).toLocaleDateString('ar-EG'),
                "أضيف بواسطة": item.created_by_name || '-'
            };

            if (currentView === 'driver') {
                return {
                    ...baseData,
                    "السيارة": item.car_name || '-',
                    "عدد المناطق": item.area_count || 0
                };
            } else if (currentView === 'assistant') {
                const boss = allStaff.find(d => d.id === item.linked_driver_id);
                return {
                    ...baseData,
                    "يعمل مع": boss ? boss.name : '-'
                };
            } else {
                return {
                    ...baseData,
                    "الوظيفة": item.job_title || '-',
                    "الراتب": item.salary || 0
                };
            }
        });

    if (dataToExport.length === 0) {
        DriversUI.showError('تنبيه', 'لا توجد بيانات في القائمة الحالية');
        return;
    }

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Staff_Data");

    const viewNames = { 'driver': 'السائقين', 'assistant': 'المساعدين', 'employee': 'الموظفين' };
    const fileName = `Kader_${viewNames[currentView]}_${new Date().toISOString().slice(0,10)}.xlsx`;

    XLSX.writeFile(wb, fileName);
}

function isValidPhone(phone) {
    return /^\d{11}$/.test(phone);
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const ui = DriversUI.inputs;
    const id = ui.id.value;
    const role = ui.role.value;

    if (!isValidPhone(ui.phone1.value)) {
        DriversUI.showError('خطأ', 'رقم الهاتف الأساسي يجب أن يكون 11 رقم');
        return;
    }

    try {
        let photoUrl = ui.existingPhotoUrl.value;
        const photoFile = ui.photo.files[0];
        
        if (photoFile) {
            Swal.fire({ title: 'جاري رفع الصورة...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            photoUrl = await DriversData.uploadProfileImage(photoFile);
            Swal.close();
        }

        const payload = {
            role: role,
            name: ui.name.value,
            username: ui.username.value || null,
            phone: ui.phone1.value,
            phone2: ui.phone2.value || null,
            phone3: ui.phone3.value || null,
            is_active: ui.status.value === "true",
            photo_url: photoUrl
        };

        if (!id) {
            const currentUser = await DriversData.fetchUserProfile();
            if (currentUser && currentUser.name) {
                payload.created_by_name = currentUser.name;
            }
        }

        if (role === 'driver') {
            payload.car_name = ui.carName.value || null;
            payload.commission_rules = getCommissionRules();
        } else if (role === 'assistant') {
            payload.linked_driver_id = ui.linkedDriver.value || null;
            payload.commission_rules = getCommissionRules();
        } else if (role === 'employee') {
            payload.job_title = ui.jobTitle.value;
            payload.salary = parseInt(ui.salary.value) || 0;
            payload.job_description = ui.jobDesc.value || '';
        }

        if (id) {
            await DriversData.updateDriver(id, payload);
            DriversUI.showSuccess('تم التعديل', 'تم تحديث البيانات بنجاح');
        } else {
            await DriversData.addDriver(payload);
            DriversUI.showSuccess('تم الإضافة', 'تم إضافة السجل بنجاح');
        }
        
        DriversUI.closeModal();
        // UPDATED: Force Instant Refresh
        DriversData.refresh();
        
    } catch (err) {
        DriversUI.showError('خطأ', err.message);
    }
}

function getCommissionRules() {
    const commissionRules = {};
    const groups = document.querySelectorAll('.commission-group');
    groups.forEach(group => {
        const tankId = group.dataset.tankId;
        const threshold = parseInt(group.querySelector('.comm-threshold').value) || 0;
        const base = parseInt(group.querySelector('.comm-base').value) || 0;
        const bonus = parseInt(group.querySelector('.comm-bonus').value) || 0;
        commissionRules[tankId] = { threshold, base, bonus };
    });
    return commissionRules;
}

async function handleTableActions(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;

    if (btn.classList.contains('btn-delete')) {
        Swal.fire({
            title: 'حذف السجل؟',
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
                    await DriversData.deleteDriver(id);
                    DriversUI.showSuccess('تم الحذف', '');
                    // UPDATED: Force Instant Refresh
                    DriversData.refresh();
                } catch (err) {
                    DriversUI.showError('خطأ', err.message);
                }
            }
        });
    }

    if (btn.classList.contains('btn-edit')) {
        const item = allStaff.find(d => d.id == id);
        if (item) {
            DriversUI.openModal(true, item.role, tankTypes, allStaff, allCars);
            DriversUI.fillForm(item);
        }
    }

    if (btn.classList.contains('btn-customers')) {
        Swal.fire({
            icon: 'info',
            title: 'تنبيه',
            text: 'سيتم إتاحة عرض الزبائن وتحديد مواقعهم في التحديث القادم',
            confirmButtonText: 'حسناً',
            confirmButtonColor: '#3b82f6',
            customClass: { popup: 'rounded-2xl' }
        });
    }

    if (btn.classList.contains('btn-phones')) {
        const item = allStaff.find(d => d.id == id);
        if (!item) return;

        let phoneHtml = `<div class="space-y-3 text-right dir-rtl">`;
        const addPhoneRow = (num, label, color) => `
            <div class="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div class="flex flex-col">
                    <span class="font-bold text-gray-800 font-mono text-lg">${num}</span>
                    <span class="text-[10px] text-${color}-500 font-bold">${label}</span>
                </div>
                <a href="tel:${num}" class="w-10 h-10 flex items-center justify-center bg-green-500 text-white rounded-full hover:bg-green-600 transition shadow-md shadow-green-500/20">
                    <i class="ph-fill ph-phone text-xl"></i>
                </a>
            </div>`;

        if (item.phone) phoneHtml += addPhoneRow(item.phone, 'رقم أساسي', 'blue');
        if (item.phone2) phoneHtml += addPhoneRow(item.phone2, 'رقم ثانوي', 'gray');
        if (item.phone3) phoneHtml += addPhoneRow(item.phone3, 'رقم إضافي', 'gray');

        phoneHtml += `</div>`;
        Swal.fire({ title: `أرقام تواصل: ${item.name}`, html: phoneHtml, showConfirmButton: false, showCloseButton: true, customClass: { popup: 'rounded-3xl' } });
    }

    if (btn.classList.contains('btn-commission')) {
        const item = allStaff.find(d => d.id == id);
        if (!item) return;
        const rules = item.commission_rules || {};
        let htmlContent = '<div class="space-y-3 text-right dir-rtl">';
        if (Object.keys(rules).length === 0) {
            htmlContent += '<p class="text-gray-500 text-center py-4">لم يتم تحديد عمولة بعد.</p>';
        } else {
            tankTypes.forEach(tank => {
                if (rules[tank.id]) {
                    const r = rules[tank.id];
                    htmlContent += `
                        <div class="bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <h4 class="font-bold text-blue-600 text-sm mb-2 flex items-center gap-2"><i class="ph-fill ph-cylinder"></i>${tank.name}</h4>
                            <div class="grid grid-cols-3 gap-2 text-center">
                                <div class="bg-white p-2 rounded-lg border border-gray-100"><span class="text-[10px] text-gray-400 block">الهدف</span><span class="font-bold text-gray-800">${r.threshold}</span></div>
                                <div class="bg-white p-2 rounded-lg border border-gray-100"><span class="text-[10px] text-gray-400 block">الأساسي</span><span class="font-bold text-green-600">${r.base}</span></div>
                                <div class="bg-white p-2 rounded-lg border border-gray-100"><span class="text-[10px] text-gray-400 block">الإضافي</span><span class="font-bold text-amber-500">${r.bonus}</span></div>
                            </div>
                        </div>`;
                }
            });
        }
        htmlContent += '</div>';
        Swal.fire({ title: `عمولة: ${item.name}`, html: htmlContent, confirmButtonText: 'إغلاق', customClass: { popup: 'rounded-2xl' } });
    }
}

function initThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const body = document.body;
    if (localStorage.getItem('theme') === 'dark') { body.classList.add('dark-mode'); if(themeIcon) themeIcon.classList.replace('ph-moon', 'ph-sun'); }
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            const isDark = body.classList.contains('dark-mode');
            if (isDark) { if(themeIcon) themeIcon.classList.replace('ph-moon', 'ph-sun'); localStorage.setItem('theme', 'dark'); } 
            else { if(themeIcon) themeIcon.classList.replace('ph-sun', 'ph-moon'); localStorage.setItem('theme', 'light'); }
        });
    }
}