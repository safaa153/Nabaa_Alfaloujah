// accountent/js/cars/main.js
import { CarsData } from './data.js';
import { CarsUI } from './ui.js';
import { AuthService } from '../../../Settings/auth.js'; 

let allCars = [];
let allDrivers = [];

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    setupEventListeners();
    
    // Initialize Data & Realtime
    CarsData.init((data) => {
        allCars = data.cars;
        allDrivers = data.drivers;
        CarsUI.renderTable(allCars);
        loadHeaderProfile();
    });

    loadHeaderProfile();
    initThemeToggle();
}

async function loadHeaderProfile() {
    const profile = await CarsData.fetchUserProfile();
    if (profile) {
        CarsUI.updateHeaderProfile(profile);
    }
}

function setupEventListeners() {
    document.getElementById('btn-add-car').addEventListener('click', () => {
        CarsUI.openModal(false, allDrivers);
    });
    
    document.getElementById('btn-close-modal').addEventListener('click', () => CarsUI.closeModal());
    document.getElementById('btn-cancel-modal').addEventListener('click', () => CarsUI.closeModal());
    document.getElementById('car-form').addEventListener('submit', handleFormSubmit);

    // Search
    document.getElementById('search-car').addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        
        // UPDATED: Added driver_name to search logic
        const filtered = allCars.filter(c => 
            c.name.toLowerCase().includes(val) || 
            (c.plate_number && c.plate_number.includes(val)) ||
            (c.car_number && c.car_number.includes(val)) ||
            (c.driver_name && c.driver_name.toLowerCase().includes(val)) // Now searchable!
        );
        CarsUI.renderTable(filtered);
    });

    document.getElementById('cars-table-body').addEventListener('click', handleTableActions);
    
    // Excel Export
    document.getElementById('btn-export').addEventListener('click', () => {
        if (!allCars || allCars.length === 0) {
            CarsUI.showError('تنبيه', 'لا توجد بيانات للتصدير');
            return;
        }

        const data = allCars.map((c, i) => ({
            '#': i+1,
            'اسم السيارة': c.name,
            'رقم السيارة': c.car_number || '-',
            'رقم اللوحة': c.plate_number || '-',
            'السائق': c.driver_name || '-',
            'السعة': c.tank_capacity ? c.tank_capacity + ' لتر' : '-',
            'اللون': c.color || '-',
            'ملاحظات': c.note || '-',
            'رابط صورة السيارة': c.photo_url || 'لا يوجد',
            'رابط السنوية': c.id_photo_url || 'لا يوجد'
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "السيارات");
        XLSX.writeFile(wb, `Cars_List_${new Date().toISOString().slice(0,10)}.xlsx`);
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
    const ui = CarsUI.inputs;
    
    const id = ui.id.value;
    const photoFile = ui.photo.files[0];
    const idPhotoFile = ui.idPhoto.files[0];

    CarsUI.setLoading(true);

    try {
        let photoUrl = ui.existingPhoto.value;
        let idPhotoUrl = ui.existingIdPhoto.value;

        // Use same bucket or separate if needed
        if (photoFile) {
            photoUrl = await CarsData.uploadFile(photoFile, 'car-photos');
        }
        if (idPhotoFile) {
            idPhotoUrl = await CarsData.uploadFile(idPhotoFile, 'car-photos'); 
        }

        const payload = {
            name: ui.name.value,
            car_number: ui.number.value || null,
            plate_number: ui.plate.value || null,
            color: ui.color.value || null,
            tank_capacity: parseFloat(ui.capacity.value) || 0,
            driver_id: ui.driver.value || null,
            note: ui.note.value || null,
            photo_url: photoUrl,
            id_photo_url: idPhotoUrl
        };

        if (id) {
            await CarsData.updateCar(id, payload);
            CarsUI.showSuccess('تم التعديل', 'تم تحديث بيانات السيارة');
        } else {
            await CarsData.addCar(payload);
            CarsUI.showSuccess('تم الإضافة', 'تم إضافة السيارة بنجاح');
        }
        
        CarsUI.closeModal();
        // Force Instant Refresh
        CarsData.refresh();

    } catch (err) {
        CarsUI.setLoading(false);
        CarsUI.showError('خطأ', err.message);
    }
}

async function handleTableActions(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;

    if (btn.classList.contains('btn-delete')) {
        Swal.fire({
            title: 'حذف السيارة؟',
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
                    await CarsData.deleteCar(id);
                    CarsUI.showSuccess('تم الحذف', '');
                    // Force Instant Refresh
                    CarsData.refresh();
                } catch (err) {
                    CarsUI.showError('خطأ', err.message);
                }
            }
        });
    }

    if (btn.classList.contains('btn-edit')) {
        const item = allCars.find(c => c.id == id);
        if (item) {
            CarsUI.openModal(true, allDrivers);
            CarsUI.fillForm(item);
        }
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