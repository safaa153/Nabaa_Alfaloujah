// accountent/js/cars/main.js
import { CarsData } from './data.js';
import { CarsUI } from './ui.js';
import { AuthService } from '../../../Settings/auth.js'; 

let allCars = [];
let allDrivers = [];

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    setupEventListeners();
    refreshData();
    setupRealtimeSubscription();
    // NEW: Load Header Profile
    loadHeaderProfile();
}

// UPDATED: Function to load and update profile (Name, Role, Photo)
async function loadHeaderProfile() {
    const profile = await CarsData.fetchUserProfile();
    if (profile) {
        CarsUI.updateHeaderProfile(profile);
    }
}

function setupRealtimeSubscription() {
    const supabase = AuthService.db;
    if (!supabase) return;

    supabase.channel('cars-page-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cars' }, () => refreshData())
        .subscribe();
}

function refreshData() {
    Promise.all([
        CarsData.fetchCars(),
        CarsData.fetchDrivers()
    ]).then(([cars, drivers]) => {
        allCars = cars;
        allDrivers = drivers;
        CarsUI.renderTable(allCars);
    });
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
        const filtered = allCars.filter(c => 
            c.name.toLowerCase().includes(val) || 
            (c.plate_number && c.plate_number.includes(val)) ||
            (c.car_number && c.car_number.includes(val))
        );
        CarsUI.renderTable(filtered);
    });

    // Actions
    document.getElementById('cars-table-body').addEventListener('click', handleTableActions);
    
    // Export
    document.getElementById('btn-export').addEventListener('click', () => {
        const data = allCars.map((c, i) => ({
            '#': i+1,
            'اسم السيارة': c.name,
            'رقم السيارة': c.car_number,
            'رقم اللوحة': c.plate_number,
            'السائق': c.driver_name,
            'السعة': c.tank_capacity,
            'اللون': c.color,
            'ملاحظات': c.note
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "السيارات");
        XLSX.writeFile(wb, "Cars.xlsx");
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
        // 1. Upload Images if new ones selected
        let photoUrl = ui.existingPhoto.value;
        let idPhotoUrl = ui.existingIdPhoto.value;

        if (photoFile) {
            photoUrl = await CarsData.uploadFile(photoFile, 'car-photos');
        }
        if (idPhotoFile) {
            idPhotoUrl = await CarsData.uploadFile(idPhotoFile, 'car-ids');
        }

        // 2. Prepare Payload
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

        // 3. Save
        if (id) {
            await CarsData.updateCar(id, payload);
            CarsUI.showSuccess('تم التعديل', 'تم تحديث بيانات السيارة');
        } else {
            await CarsData.addCar(payload);
            CarsUI.showSuccess('تم الإضافة', 'تم إضافة السيارة بنجاح');
        }
        
        CarsUI.closeModal();
        refreshData();

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
                    refreshData();
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