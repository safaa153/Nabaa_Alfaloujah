import { RequestsData } from './data.js';
import { RequestsUI } from './ui.js';
import { RequestsModal } from './requests_modal.js';
import { AuthService } from '../../../Settings/auth.js'; 

let allRequests = [];
let lookups = {};
let currentTabStatus = 'pending';
let currentUserProfile = null;
let currentFilterType = 'all';

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    setupEventListeners();
    initThemeToggle();
    loadHeaderProfile();
    loadInitialData();
}

async function loadInitialData() {
    document.getElementById('loading-state').classList.remove('hidden');
    
    const [lData, rData] = await Promise.all([
        RequestsData.fetchLookups(),
        RequestsData.fetchRequests(currentTabStatus)
    ]);

    lookups = lData;
    allRequests = rData;

    RequestsModal.populateDropdowns(lookups);
    RequestsUI.setLookups(lookups);
    
    // Populate new filters
    populateMainFilters(lookups);

    applyFilters();

    document.getElementById('loading-state').classList.add('hidden');
    setupRealtime();
}

function populateMainFilters(lookups) {
    const areaSelect = document.getElementById('filter-area');
    const driverSelect = document.getElementById('filter-driver');
    
    areaSelect.innerHTML = '<option value="">المنطقة (الكل)</option>' + 
        lookups.areas.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
        
    driverSelect.innerHTML = '<option value="">السائق (الكل)</option>' + 
        lookups.drivers.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
}

async function loadHeaderProfile() {
    const profile = await RequestsData.fetchUserProfile();
    currentUserProfile = profile;
    if(profile) RequestsUI.updateHeaderProfile(profile);
}

function setupRealtime() {
    AuthService.db.channel('requests-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, async () => {
            if(currentTabStatus !== 'finished') {
                allRequests = await RequestsData.fetchRequests(currentTabStatus);
                applyFilters();
            }
        })
        .subscribe();
}

function applyFilters() {
    const txt = document.getElementById('search-text').value.toLowerCase();
    const typeFilter = document.getElementById('filter-type').value;
    const areaFilter = document.getElementById('filter-area').value;
    const driverFilter = document.getElementById('filter-driver').value;
    const dateFrom = document.getElementById('date-from').value;
    const dateTo = document.getElementById('date-to').value;

    const filtered = allRequests.filter(req => {
        const matchText = req.customer_name.toLowerCase().includes(txt) || 
                          req.tank_no.toLowerCase().includes(txt);
        const matchType = typeFilter ? req.request_type === typeFilter : true;
        const matchArea = areaFilter ? req.area_id == areaFilter : true;
        const matchDriver = driverFilter ? req.driver_id == driverFilter : true;

        let matchDate = true;
        const reqDate = new Date(req.created_at);
        const today = new Date();
        reqDate.setHours(0,0,0,0);
        today.setHours(0,0,0,0);

        if (currentFilterType === 'today') {
            matchDate = reqDate.getTime() === today.getTime();
        } else if (currentFilterType === 'yesterday') {
            const yest = new Date(today);
            yest.setDate(today.getDate() - 1);
            matchDate = reqDate.getTime() === yest.getTime();
        } else if (currentFilterType === 'this_month') {
            matchDate = reqDate.getMonth() === today.getMonth() && reqDate.getFullYear() === today.getFullYear();
        } else if (currentFilterType === 'custom' && dateFrom && dateTo) {
            const dFrom = new Date(dateFrom);
            const dTo = new Date(dateTo);
            dTo.setHours(23,59,59,999);
            const rTime = new Date(req.created_at).getTime();
            matchDate = rTime >= dFrom.getTime() && rTime <= dTo.getTime();
        }

        return matchText && matchType && matchArea && matchDriver && matchDate;
    });

    document.getElementById('results-count').innerText = `العدد: ${filtered.length}`;
    RequestsUI.renderTable(filtered, currentTabStatus);
}

function handleExportExcel() {
    try {
        Swal.showLoading();
        const txt = document.getElementById('search-text').value.toLowerCase();
        const typeFilter = document.getElementById('filter-type').value;
        const areaFilter = document.getElementById('filter-area').value;
        const driverFilter = document.getElementById('filter-driver').value;
        const dateFrom = document.getElementById('date-from').value;
        const dateTo = document.getElementById('date-to').value;

        const filteredToExport = allRequests.filter(req => {
            const matchText = req.customer_name.toLowerCase().includes(txt) || req.tank_no.toLowerCase().includes(txt);
            const matchType = typeFilter ? req.request_type === typeFilter : true;
            const matchArea = areaFilter ? req.area_id == areaFilter : true;
            const matchDriver = driverFilter ? req.driver_id == driverFilter : true;
            
            let matchDate = true;
            const reqDate = new Date(req.created_at);
            const today = new Date();
            reqDate.setHours(0,0,0,0);
            today.setHours(0,0,0,0);

            if (currentFilterType === 'today') matchDate = reqDate.getTime() === today.getTime();
            else if (currentFilterType === 'yesterday') {
                const yest = new Date(today);
                yest.setDate(today.getDate() - 1);
                matchDate = reqDate.getTime() === yest.getTime();
            } else if (currentFilterType === 'this_month') {
                matchDate = reqDate.getMonth() === today.getMonth() && reqDate.getFullYear() === today.getFullYear();
            } else if (currentFilterType === 'custom' && dateFrom && dateTo) {
                const dFrom = new Date(dateFrom);
                const dTo = new Date(dateTo);
                dTo.setHours(23,59,59,999);
                const rTime = new Date(req.created_at).getTime();
                matchDate = rTime >= dFrom.getTime() && rTime <= dTo.getTime();
            }
            return matchText && matchType && matchArea && matchDriver && matchDate;
        });

        if (filteredToExport.length === 0) {
            Swal.fire('تنبيه', 'لا توجد بيانات لتصديرها', 'warning');
            return;
        }

        const exportData = filteredToExport.map(item => {
            let typeStr = '';
            switch(item.request_type) {
                case 'new_filling': typeStr = 'تعبئة'; break;
                case 'change_water': typeStr = 'تبديل'; break;
                case 'withdraw_tank': typeStr = 'سحب'; break;
                case 'set_location': typeStr = 'تحديد موقع'; break;
                case 'external_sale': typeStr = 'بيع خارجي'; break;
                default: typeStr = item.request_type;
            }
            return {
                "رقم الخزان": item.tank_no,
                "اسم الزبون": item.customer_name,
                "المنطقة": item.area_name,
                "الهاتف": item.customer_phone,
                "نوع الطلب": typeStr,
                "السائق": item.driver_name,
                "التاريخ": new Date(item.created_at).toLocaleDateString('ar-EG'),
                "الحالة": item.status === 'pending' ? 'معلق' : (item.status === 'delivered' ? 'واصل' : 'منتهي')
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "الطلبات");
        const dateStr = new Date().toISOString().split('T')[0];
        XLSX.writeFile(workbook, `Requests_List_${dateStr}.xlsx`);
        
        Swal.close();

    } catch (error) {
        console.error("Export Error:", error);
        Swal.fire('خطأ', 'حدث خطأ أثناء تصدير الملف', 'error');
    }
}

function setupEventListeners() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');

            currentTabStatus = e.currentTarget.dataset.status;
            
            document.getElementById('loading-state').classList.remove('hidden');
            document.getElementById('empty-state').classList.add('hidden');
            document.getElementById('requests-table-body').innerHTML = '';
            
            allRequests = await RequestsData.fetchRequests(currentTabStatus);
            applyFilters();
            document.getElementById('loading-state').classList.add('hidden');
        });
    });

    ['search-text', 'filter-type', 'filter-area', 'filter-driver'].forEach(id => {
        document.getElementById(id).addEventListener('input', applyFilters);
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            currentFilterType = e.currentTarget.dataset.filter;
            
            const customDiv = document.getElementById('custom-date-range');
            if (currentFilterType === 'custom') {
                customDiv.classList.remove('hidden');
            } else {
                customDiv.classList.add('hidden');
            }
            applyFilters();
        });
    });

    ['date-from', 'date-to'].forEach(id => {
        document.getElementById(id).addEventListener('input', applyFilters);
    });

    document.getElementById('btn-add-request').addEventListener('click', () => RequestsModal.open());
    document.getElementById('btn-direct-filling').addEventListener('click', () => handleDirectAction('new_filling', 'delivered'));
    document.getElementById('btn-direct-withdraw').addEventListener('click', () => handleDirectAction('withdraw_tank', 'delivered'));
    document.getElementById('btn-external-filling').addEventListener('click', handleExternalFilling);
    document.getElementById('btn-export-excel').addEventListener('click', handleExportExcel);
    document.getElementById('btn-close-modal').addEventListener('click', () => RequestsModal.close());
    document.getElementById('btn-cancel-modal').addEventListener('click', () => RequestsModal.close());
    document.getElementById('request-form').addEventListener('submit', handleFormSubmit);
    
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
            window.location.replace('login.html');
        }
    });

    document.getElementById('requests-table-body').addEventListener('click', handleTableActions);
}

async function handleDirectAction(type, targetStatus) {
    RequestsModal.open();
    const typeSelect = document.getElementById('req-type');
    typeSelect.value = type;
    typeSelect.disabled = true; 
    RequestsModal.targetStatus = targetStatus; 
}

async function handleExternalFilling() {
    const { value: formValues } = await Swal.fire({
        title: 'بيع خارجي',
        html: `
            <div class="flex flex-col gap-3 text-right">
                <div>
                    <label class="text-xs font-bold text-gray-500">السعر</label>
                    <input id="swal-price" type="number" class="w-full p-2 border rounded-lg focus:border-cyan-500 outline-none" placeholder="مثلاً 5000">
                </div>
                <div>
                    <label class="text-xs font-bold text-gray-500">التاريخ</label>
                    <input id="swal-date" type="datetime-local" class="w-full p-2 border rounded-lg focus:border-cyan-500 outline-none" value="${new Date().toISOString().slice(0, 16)}">
                </div>
                <div>
                    <label class="text-xs font-bold text-gray-500">ملاحظات</label>
                    <input id="swal-notes" type="text" class="w-full p-2 border rounded-lg focus:border-cyan-500 outline-none">
                </div>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'حفظ',
        cancelButtonText: 'إلغاء',
        preConfirm: () => {
            return {
                price: document.getElementById('swal-price').value,
                date: document.getElementById('swal-date').value,
                notes: document.getElementById('swal-notes').value
            }
        }
    });

    if (formValues) {
        if (!formValues.price) return Swal.fire('خطأ', 'يرجى إدخال السعر', 'error');
        
        try {
            let creatorName = currentUserProfile ? currentUserProfile.name : 'مسؤول';
            const payload = {
                filling_type: 'external_sale',
                amount: parseInt(formValues.price),
                created_by: creatorName,
                notes: `بيع خارجي - ${formValues.notes}`,
                created_at: new Date(formValues.date).toISOString(),
                finished_at: new Date().toISOString(),
                customer_name: 'بيع خارجي',
                tank_no: '-',
                is_debt: false 
            };
            
            await RequestsData.addFilling(payload); 
            RequestsUI.showSuccess('تم', 'تم تسجيل البيع الخارجي في السجل');
            
            if (currentTabStatus === 'finished') {
                allRequests = await RequestsData.fetchRequests('finished');
                applyFilters();
            }
        } catch (err) {
            console.error(err);
            RequestsUI.showError('خطأ', 'فشل في حفظ البيانات');
        }
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const data = RequestsModal.getData();
    
    try {
        Swal.showLoading();
        let creatorName = currentUserProfile ? currentUserProfile.name : 'مسؤول';
        const targetStatus = RequestsModal.targetStatus || 'pending';
        
        const payload = {
            customer_id: data.customerId,
            request_type: data.type,
            driver_id: data.driverId,
            notes: data.notes,
            status: targetStatus,
            created_by: creatorName
        };

        await RequestsData.addRequest(payload);
        
        RequestsUI.showSuccess('تم بنجاح', 'تم إضافة الطلب');
        RequestsModal.close();
        RequestsModal.targetStatus = null;
        document.getElementById('req-type').disabled = false;

        allRequests = await RequestsData.fetchRequests(currentTabStatus);
        applyFilters();

    } catch (err) {
        RequestsUI.showError('خطأ', err.message);
    }
}

async function handleTableActions(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    // THIS LINE WAS MISSING OR VITAL: Find the row to locate checkbox
    const row = btn.closest('tr');

    if (btn.classList.contains('btn-save-driver')) {
        const select = row.querySelector(`.driver-select`);
        try {
            await RequestsData.updateDriver(id, select.value);
            RequestsUI.showSuccess('تم', 'تم تحديث السائق');
        } catch(err) {
            RequestsUI.showError('خطأ', err.message);
        }
    }

    if (btn.classList.contains('btn-save-date')) {
        const input = row.querySelector(`.date-input`);
        if(!input.value) return;
        try {
            await RequestsData.updateDate(id, input.value);
            RequestsUI.showSuccess('تم', 'تم تحديث التاريخ');
        } catch(err) {
            RequestsUI.showError('خطأ', err.message);
        }
    }

    if (btn.classList.contains('btn-set-location')) {
        if (!navigator.geolocation) return RequestsUI.showError('خطأ', 'المتصفح لا يدعم تحديد الموقع');
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                await RequestsData.updateCustomerLocation(btn.dataset.customer, pos.coords.latitude, pos.coords.longitude);
                RequestsUI.showSuccess('تم', 'تم حفظ الموقع الحالي');
                allRequests = await RequestsData.fetchRequests(currentTabStatus);
                applyFilters();
            } catch(err) {
                RequestsUI.showError('خطأ', 'فشل حفظ الموقع');
            }
        });
    }

    // Driver Delivery Confirmation
    if (btn.classList.contains('btn-confirm-delivery')) {
        const debtCheckbox = row.querySelector('.debt-checkbox');
        const isDebt = debtCheckbox ? debtCheckbox.checked : false;

        Swal.fire({
            title: 'تأكيد التوصيل؟',
            text: isDebt ? 'تم تحديد هذا الطلب كـ "آجل" (دين)' : '',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            confirmButtonText: 'نعم'
        }).then(async (res) => {
            if(res.isConfirmed) {
                try {
                    await RequestsData.markDelivered(id, isDebt);
                    RequestsUI.showSuccess('تم', 'تم التحويل للمحاسبة');
                    allRequests = await RequestsData.fetchRequests(currentTabStatus);
                    applyFilters();
                } catch(err) {
                    RequestsUI.showError('خطأ', err.message);
                }
            }
        });
    }

    // Accountant Finish Confirmation
    if (btn.classList.contains('btn-confirm-finish')) {
        const debtCheckbox = row.querySelector('.debt-checkbox');
        const isDebt = debtCheckbox ? debtCheckbox.checked : false;

        let confirmText = 'سيتم نقل الطلب لسجل التعبئات وحساب القيمة';
        if (isDebt) confirmText = 'سيتم تسجيل الطلب كـ "آجل" (دين) في سجل الديون';

        Swal.fire({
            title: isDebt ? 'إنهاء وتسجيل دين؟' : 'إنهاء وتخزين؟',
            text: confirmText,
            icon: isDebt ? 'warning' : 'question',
            showCancelButton: true,
            confirmButtonColor: isDebt ? '#ef4444' : '#0891b2',
            confirmButtonText: 'نعم, إنهاء'
        }).then(async (res) => {
            if(res.isConfirmed) {
                try {
                    await RequestsData.moveToFillings(id, isDebt);
                    RequestsUI.showSuccess('تم', isDebt ? 'تم تسجيل الدين وحفظ التعبئة' : 'تم حفظ التعبئة في السجل');
                    allRequests = await RequestsData.fetchRequests(currentTabStatus);
                    applyFilters();
                } catch (err) {
                    RequestsUI.showError('خطأ', 'فشل في الحفظ: ' + err.message);
                }
            }
        });
    }

    if (btn.classList.contains('btn-delete')) {
        Swal.fire({
            title: 'حذف؟',
            text: currentTabStatus === 'finished' ? 'سيتم حذف التعبئة من السجل نهائياً' : 'سيتم حذف الطلب',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'حذف'
        }).then(async (res) => {
            if(res.isConfirmed) {
                const deleter = currentUserProfile ? currentUserProfile.name : 'Unknown';
                try {
                    if (currentTabStatus === 'finished') {
                        await RequestsData.deleteFilling(id, deleter);
                    } else {
                        await RequestsData.deleteRequest(id, deleter);
                    }
                    RequestsUI.showSuccess('تم الحذف', '');
                    allRequests = await RequestsData.fetchRequests(currentTabStatus);
                    applyFilters();
                } catch(err) {
                    RequestsUI.showError('خطأ', 'فشل الحذف: ' + err.message);
                }
            }
        });
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