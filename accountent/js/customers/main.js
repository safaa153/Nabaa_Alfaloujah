// accountent/js/customers/main.js
import { CustomersData } from './data.js';
import { CustomersUI } from './ui.js';
import { AuthService } from '../../../Settings/auth.js'; 

let allCustomers = [];
let lookups = {};

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    setupEventListeners();
    initThemeToggle();
    loadHeaderProfile();
    loadInitialData();
}

async function loadInitialData() {
    document.getElementById('loading-state').classList.remove('hidden');
    
    // Fetch Lookups & Customers parallel
    const [lData, cData] = await Promise.all([
        CustomersData.fetchLookups(),
        CustomersData.fetchCustomers()
    ]);

    lookups = lData;
    allCustomers = cData;

    CustomersUI.populateDropdowns(lookups);
    CustomersUI.renderTable(allCustomers);
    
    // NEW: Check for URL parameters to apply filters
    checkUrlFilters();

    document.getElementById('loading-state').classList.add('hidden');
    setupRealtime();
}

// NEW: Read URL params and filter
function checkUrlFilters() {
    const params = new URLSearchParams(window.location.search);
    const tankTypeId = params.get('tank_type_id');
    const areaId = params.get('area_id');
    const driverId = params.get('driver_id');

    if (tankTypeId) {
        document.getElementById('filter-tank-type').value = tankTypeId;
    }
    if (areaId) {
        document.getElementById('filter-area').value = areaId;
    }
    if (driverId) {
        document.getElementById('filter-driver').value = driverId;
    }

    if (tankTypeId || areaId || driverId) {
        applyFilters();
    }
}

async function loadHeaderProfile() {
    const profile = await CustomersData.fetchUserProfile();
    if(profile) CustomersUI.updateHeaderProfile(profile);
}

function setupRealtime() {
    AuthService.db.channel('customers-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, async () => {
            allCustomers = await CustomersData.fetchCustomers();
            applyFilters();
        })
        .subscribe();
}

// Live Search Logic
function applyFilters() {
    const txt = document.getElementById('search-text').value.toLowerCase();
    const type = document.getElementById('filter-tank-type').value;
    const area = document.getElementById('filter-area').value;
    const driver = document.getElementById('filter-driver').value; // NEW

    const filtered = allCustomers.filter(c => {
        const matchText = c.name.toLowerCase().includes(txt) || c.tank_no.toLowerCase().includes(txt);
        const matchType = type ? c.tank_type_id === type : true;
        const matchArea = area ? c.area_id === area : true;
        const matchDriver = driver ? c.driver_id === driver : true; // NEW
        return matchText && matchType && matchArea && matchDriver;
    });

    CustomersUI.renderTable(filtered);
}

function setupEventListeners() {
    // Search Inputs
    ['search-text', 'filter-tank-type', 'filter-area', 'filter-driver'].forEach(id => {
        document.getElementById(id).addEventListener('input', applyFilters);
    });

    // Modal
    document.getElementById('btn-add-customer').addEventListener('click', () => CustomersUI.openModal(false));
    document.getElementById('btn-close-modal').addEventListener('click', () => CustomersUI.closeModal());
    document.getElementById('btn-cancel-modal').addEventListener('click', () => CustomersUI.closeModal());
    document.getElementById('customer-form').addEventListener('submit', handleFormSubmit);

    // Table Actions
    document.getElementById('customers-table-body').addEventListener('click', handleTableActions);

    // Logout
    document.getElementById('btn-logout').addEventListener('click', async () => {
        const { isConfirmed } = await Swal.fire({
            title: 'تسجيل الخروج؟',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'خروج',
            cancelButtonText: 'إلغاء'
        });
        if(isConfirmed) {
            await AuthService.logout();
            window.location.replace('../../index.html');
        }
    });
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const ui = CustomersUI.inputs;
    
    try {
        Swal.showLoading();
        
        // Upload Docs if selected
        let doc1Url = ui.existingDoc1.value;
        let doc2Url = ui.existingDoc2.value;

        if (ui.doc1.files[0]) doc1Url = await CustomersData.uploadDoc(ui.doc1.files[0]);
        if (ui.doc2.files[0]) doc2Url = await CustomersData.uploadDoc(ui.doc2.files[0]);

        const payload = {
            tank_no: ui.tankNo.value,
            name: ui.name.value,
            tank_type_id: ui.tankType.value || null,
            phone: ui.phone1.value,
            phone2: ui.phone2.value || null,
            phone3: ui.phone3.value || null,
            area_id: ui.area.value || null,
            driver_id: ui.driver.value || null,
            address: ui.address.value || null,
            latitude: ui.lat.value ? parseFloat(ui.lat.value) : null,
            longitude: ui.lng.value ? parseFloat(ui.lng.value) : null,
            doc1_url: doc1Url,
            doc2_url: doc2Url
        };

        if (ui.id.value) {
            await CustomersData.updateCustomer(ui.id.value, payload);
            CustomersUI.showSuccess('تم التعديل', 'تم تحديث بيانات الزبون');
        } else {
            await CustomersData.addCustomer(payload);
            CustomersUI.showSuccess('تم الإضافة', 'تم إضافة الزبون بنجاح');
        }
        CustomersUI.closeModal();
        
        // Refresh local list immediately
        allCustomers = await CustomersData.fetchCustomers();
        applyFilters();

    } catch (err) {
        CustomersUI.showError('خطأ', err.message);
    }
}

function handleTableActions(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    const item = allCustomers.find(c => c.id == id);

    if (btn.classList.contains('btn-delete')) {
        Swal.fire({
            title: 'حذف الزبون؟',
            text: "لن تتمكن من التراجع عن هذا!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'حذف'
        }).then(async (res) => {
            if(res.isConfirmed) {
                try {
                    await CustomersData.deleteCustomer(id);
                    CustomersUI.showSuccess('تم الحذف', '');
                    allCustomers = await CustomersData.fetchCustomers();
                    applyFilters();
                } catch(err) {
                    CustomersUI.showError('خطأ', err.message);
                }
            }
        });
    }

    if (btn.classList.contains('btn-edit')) {
        CustomersUI.openModal(true, item);
    }

    if (btn.classList.contains('btn-phones')) {
        Swal.fire({
            title: `أرقام تواصل: ${item.name}`,
            html: `
                <div class="text-right space-y-2">
                    <p class="bg-gray-50 p-2 rounded flex justify-between"><span>${item.phone}</span> <span class="text-xs text-blue-500 font-bold">أساسي</span></p>
                    ${item.phone2 ? `<p class="bg-gray-50 p-2 rounded flex justify-between"><span>${item.phone2}</span> <span class="text-xs text-gray-400">إضافي</span></p>` : ''}
                    ${item.phone3 ? `<p class="bg-gray-50 p-2 rounded flex justify-between"><span>${item.phone3}</span> <span class="text-xs text-gray-400">إضافي</span></p>` : ''}
                </div>
            `,
            confirmButtonText: 'إغلاق',
            customClass: { popup: 'rounded-2xl' }
        });
    }

    if (btn.classList.contains('btn-new-request')) {
        Swal.fire('قريباً', 'سيتم تفعيل ميزة الطلبات في التحديث القادم', 'info');
    }
}

function initThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    const icon = document.getElementById('theme-icon');
    const body = document.body;

    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-mode');
        icon.classList.replace('ph-moon', 'ph-sun');
    }

    btn.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        if (body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
            icon.classList.replace('ph-moon', 'ph-sun');
        } else {
            localStorage.setItem('theme', 'light');
            icon.classList.replace('ph-sun', 'ph-moon');
        }
    });
}