// accountent/js/customers/main.js
import { CustomersData } from './data.js';
import { CustomersUI } from './ui.js';
import { AuthService } from '../../../Settings/auth.js'; 

let allCustomers = [];
let displayedLimit = 50; 
let lookups = {};
let currentUserProfile = null; 

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    setupEventListeners();
    initThemeToggle();
    loadHeaderProfile();
    loadInitialData();
}

async function loadInitialData() {
    document.getElementById('loading-state').classList.remove('hidden');
    
    const [lData, cData] = await Promise.all([
        CustomersData.fetchLookups(),
        CustomersData.fetchCustomers()
    ]);

    lookups = lData;
    allCustomers = cData;

    CustomersUI.populateDropdowns(lookups);
    applyFilters(); 
    checkUrlFilters();

    document.getElementById('loading-state').classList.add('hidden');
    setupRealtime();
}

function checkUrlFilters() {
    const params = new URLSearchParams(window.location.search);
    const tankTypeId = params.get('tank_type_id');
    const areaId = params.get('area_id');
    const driverId = params.get('driver_id');

    if (tankTypeId) document.getElementById('filter-tank-type').value = tankTypeId;
    if (areaId) document.getElementById('filter-area').value = areaId;
    if (driverId) document.getElementById('filter-driver').value = driverId;

    if (tankTypeId || areaId || driverId) applyFilters();
}

async function loadHeaderProfile() {
    const profile = await CustomersData.fetchUserProfile();
    currentUserProfile = profile; 
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

function applyFilters() {
    const txt = document.getElementById('search-text').value.toLowerCase();
    const phoneTxt = document.getElementById('search-phone').value.trim(); 
    const type = document.getElementById('filter-tank-type').value;
    const area = document.getElementById('filter-area').value;
    const driver = document.getElementById('filter-driver').value; 

    const filtered = allCustomers.filter(c => {
        const matchText = c.name.toLowerCase().includes(txt) || c.tank_no.toLowerCase().includes(txt);
        
        const matchPhone = phoneTxt ? (
            (c.phone && c.phone.includes(phoneTxt)) ||
            (c.phone2 && c.phone2.includes(phoneTxt)) ||
            (c.phone3 && c.phone3.includes(phoneTxt))
        ) : true;

        const matchType = type ? c.tank_type_id === type : true;
        const matchArea = area ? c.area_id === area : true;
        const matchDriver = driver ? c.driver_id === driver : true; 
        
        return matchText && matchPhone && matchType && matchArea && matchDriver;
    });

    const isSearching = txt.length > 0 || phoneTxt.length > 0;
    const toRender = isSearching ? filtered : filtered.slice(0, displayedLimit);

    CustomersUI.renderTable(toRender, filtered.length);
}

function setupEventListeners() {
    ['search-text', 'search-phone', 'filter-tank-type', 'filter-area', 'filter-driver'].forEach(id => {
        document.getElementById(id).addEventListener('input', applyFilters);
    });

    document.getElementById('btn-show-all').addEventListener('click', () => {
        displayedLimit = allCustomers.length;
        applyFilters();
    });
    
    document.getElementById('btn-export-excel').addEventListener('click', handleExportExcel);

    document.getElementById('btn-add-customer').addEventListener('click', () => CustomersUI.openModal(false));
    document.getElementById('btn-close-modal').addEventListener('click', () => CustomersUI.closeModal());
    document.getElementById('btn-cancel-modal').addEventListener('click', () => CustomersUI.closeModal());
    document.getElementById('customer-form').addEventListener('submit', handleFormSubmit);

    document.getElementById('customers-table-body').addEventListener('click', handleTableActions);
    
    document.body.addEventListener('click', (e) => {
        if(e.target.closest('#dropdown-portal')) handlePortalActions(e);
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.btn-dots') && !e.target.closest('#active-dropdown')) {
            CustomersUI.closeDropdown();
        }
    });

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
            Swal.showLoading();
            try {
                await AuthService.logout();
                localStorage.clear();
                sessionStorage.clear();
                window.location.replace('login.html');
            } catch (error) {
                console.error("Logout error:", error);
                localStorage.clear();
                window.location.replace('login.html');
            }
        }
    });
}

// -----------------------------------------------------------
// NEW: Send Request Logic with Checks & Driver Selection
// -----------------------------------------------------------
async function sendRequest(id, type, name, defaultDriverId) {
    try {
        Swal.showLoading();

        // 1. Check for Pending Requests (Skip check if type is set_location)
        if (type !== 'set_location') {
            const hasPending = await CustomersData.checkPendingRequest(id);
            if (hasPending) {
                Swal.fire({
                    icon: 'warning',
                    title: 'يوجد طلب معلق',
                    text: 'يوجد طلب قيد التنفيذ لهذا الزبون بالفعل، لا يمكن إضافة طلب جديد.',
                    confirmButtonText: 'حسناً',
                    confirmButtonColor: '#f59e0b',
                    customClass: { popup: 'rounded-2xl' }
                });
                return;
            }
        }

        // 2. Prepare Driver Options
        const driversList = lookups.drivers || [];
        const optionsHtml = driversList.map(d => 
            `<option value="${d.id}" ${d.id === defaultDriverId ? 'selected' : ''}>${d.name}</option>`
        ).join('');

        // Get readable title
        let typeTitle = 'طلب جديد';
        if(type === 'new_filling') typeTitle = 'طلب تعبئة';
        if(type === 'withdraw_tank') typeTitle = 'سحب خزان';
        if(type === 'change_water') typeTitle = 'تبديل مياه';
        if(type === 'set_location') typeTitle = 'تحديد موقع';

        // 3. Show Confirmation with Driver Selection
        const { isConfirmed, value: selectedDriverId } = await Swal.fire({
            title: typeTitle,
            html: `
                <div class="text-right text-sm text-gray-600 mb-4">
                    <p class="mb-2">الزبون: <b>${name}</b></p>
                    <label class="block mb-1 font-bold text-xs text-gray-500">سائق الطلب:</label>
                    <select id="swal-driver-select" class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-cyan-500 outline-none">
                        <option value="">-- بدون سائق --</option>
                        ${optionsHtml}
                    </select>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            confirmButtonText: 'تأكيد وإرسال',
            cancelButtonText: 'إلغاء',
            customClass: { popup: 'rounded-3xl' },
            preConfirm: () => {
                return document.getElementById('swal-driver-select').value;
            }
        });

        if (isConfirmed) {
            // Get creator name safely
            let creatorName = 'مسؤول';
            if(currentUserProfile && currentUserProfile.name) {
                creatorName = currentUserProfile.name;
            }

            // Send to Database with selected driver (or null if none selected)
            await CustomersData.createRequest(id, type, creatorName, selectedDriverId);
            
            CustomersUI.showSuccess('تم الإرسال', 'تم إنشاء الطلب بنجاح');
        }
        
    } catch (err) {
        console.error(err);
        CustomersUI.showError('خطأ', 'فشل في إرسال الطلب، حاول مرة أخرى');
    }
}

function handleExportExcel() {
    try {
        Swal.showLoading();
        
        const txt = document.getElementById('search-text').value.toLowerCase();
        const phoneTxt = document.getElementById('search-phone').value.trim(); 
        const type = document.getElementById('filter-tank-type').value;
        const area = document.getElementById('filter-area').value;
        const driver = document.getElementById('filter-driver').value; 

        const filteredToExport = allCustomers.filter(c => {
            const matchText = c.name.toLowerCase().includes(txt) || c.tank_no.toLowerCase().includes(txt);
            const matchPhone = phoneTxt ? (
                (c.phone && c.phone.includes(phoneTxt)) ||
                (c.phone2 && c.phone2.includes(phoneTxt)) ||
                (c.phone3 && c.phone3.includes(phoneTxt))
            ) : true;
            const matchType = type ? c.tank_type_id === type : true;
            const matchArea = area ? c.area_id === area : true;
            const matchDriver = driver ? c.driver_id === driver : true; 
            return matchText && matchPhone && matchType && matchArea && matchDriver;
        });

        if (filteredToExport.length === 0) {
            Swal.fire('تنبيه', 'لا توجد بيانات لتصديرها', 'warning');
            return;
        }

        const exportData = filteredToExport.map(item => ({
            "رقم الخزان": item.tank_no,
            "اسم الزبون": item.name,
            "نوع الخزان": item.tank_type_name,
            "المنطقة": item.area_name,
            "السائق": item.driver_name,
            "الهاتف 1": item.phone,
            "الهاتف 2": item.phone2 || '-',
            "الهاتف 3": item.phone3 || '-',
            "العنوان": item.address || '-',
            "خط العرض": item.latitude || '',
            "خط الطول": item.longitude || '',
            "آخر تعبئة": item.last_filling || '-',
            "تاريخ الإضافة": item.created_at ? new Date(item.created_at).toLocaleDateString('ar-EG') : '-',
            "تمت الإضافة بواسطة": item.created_by || '-'
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        
        const wscols = [
            {wch:10}, {wch:20}, {wch:15}, {wch:15}, {wch:15}, 
            {wch:15}, {wch:15}, {wch:15}, {wch:25}, {wch:10}, 
            {wch:10}, {wch:15}, {wch:15}, {wch:20}
        ];
        worksheet['!cols'] = wscols;

        XLSX.utils.book_append_sheet(workbook, worksheet, "الزبائن");

        const dateStr = new Date().toISOString().split('T')[0];
        XLSX.writeFile(workbook, `Customers_List_${dateStr}.xlsx`);
        
        Swal.close();

    } catch (error) {
        console.error("Export Error:", error);
        Swal.fire('خطأ', 'حدث خطأ أثناء تصدير الملف', 'error');
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const ui = CustomersUI.inputs;
    
    try {
        Swal.showLoading();
        
        let doc1Url = ui.existingDoc1.value;
        let doc2Url = ui.existingDoc2.value;

        if (ui.doc1.files[0]) doc1Url = await CustomersData.uploadDoc(ui.doc1.files[0]);
        if (ui.doc2.files[0]) doc2Url = await CustomersData.uploadDoc(ui.doc2.files[0]);

        let creatorName = null;
        if(currentUserProfile && currentUserProfile.name) {
            creatorName = currentUserProfile.name;
        }

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
            if(creatorName) {
                payload.created_by = creatorName;
            }
            await CustomersData.addCustomer(payload);
            CustomersUI.showSuccess('تم الإضافة', 'تم إضافة الزبون بنجاح');
        }
        CustomersUI.closeModal();
        
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

    if (btn.classList.contains('btn-dots')) {
        e.stopPropagation();
        CustomersUI.closeDropdown();
        const rect = btn.getBoundingClientRect();
        CustomersUI.renderDropdown(rect, id, item.name);
        return;
    }

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

    // New Request (Green Plus)
    if (btn.classList.contains('btn-new-request')) {
        sendRequest(id, 'new_filling', item.name, item.driver_id);
    }
}

// Handle actions from the Portal Dropdown
function handlePortalActions(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    
    const id = btn.dataset.id;
    // We need to fetch the item to get driver_id and name
    const item = allCustomers.find(c => c.id == id);
    if (!item) return;

    const name = item.name;
    const driverId = item.driver_id;

    if (btn.classList.contains('btn-action-withdraw')) {
        CustomersUI.closeDropdown();
        sendRequest(id, 'withdraw_tank', name, driverId);
    }
    if (btn.classList.contains('btn-action-water')) {
        CustomersUI.closeDropdown();
        sendRequest(id, 'change_water', name, driverId);
    }
    if (btn.classList.contains('btn-action-location')) {
        CustomersUI.closeDropdown();
        sendRequest(id, 'set_location', name, driverId);
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