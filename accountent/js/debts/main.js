import { DebtsData } from './data.js';
import { DebtsUI } from './ui.js';
import { AuthService } from '../../../Settings/auth.js'; 

let allDebts = [];

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    setupEventListeners();
    initThemeToggle();
    loadHeaderProfile();
    loadData();
}

async function loadHeaderProfile() {
    try {
        const profile = await DebtsData.fetchUserProfile();
        if(profile) DebtsUI.updateHeaderProfile(profile);
    } catch(err) {
        console.error("Profile load failed", err);
    }
}

async function loadData() {
    document.getElementById('loading-state').classList.remove('hidden');
    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('debts-table-body').innerHTML = '';

    allDebts = await DebtsData.fetchAggregatedDebts();
    applyFilters(); 

    document.getElementById('loading-state').classList.add('hidden');
}

function applyFilters() {
    const txt = document.getElementById('search-text').value.toLowerCase();
    
    const filtered = allDebts.filter(item => {
        return item.customer_name.toLowerCase().includes(txt) || 
               (item.tank_no && item.tank_no.toLowerCase().includes(txt));
    });

    DebtsUI.renderTable(filtered);
    return filtered; // Return for export use
}

function setupEventListeners() {
    // Search listener
    document.getElementById('search-text').addEventListener('input', applyFilters);

    // Pay Button Click using Event Delegation
    document.getElementById('debts-table-body').addEventListener('click', async (e) => {
        const btn = e.target.closest('.btn-pay');
        if (!btn) return;

        const customerId = btn.dataset.id;
        const customerName = btn.dataset.name;
        const currentDebt = Number(btn.dataset.debt);

        await handlePayClick(customerId, customerName, currentDebt);
    });

    // NEW: Export Excel Listener
    const btnExport = document.getElementById('btn-export-excel');
    if(btnExport) {
        btnExport.addEventListener('click', handleExportExcel);
    }

    // Logout - Fixed Logic to prevent Loop
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
                customClass: {
                    popup: 'rounded-3xl font-sans',
                    title: 'text-xl font-bold text-gray-800',
                    htmlContainer: 'text-gray-500'
                }
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        await AuthService.logout();
                    } catch (error) {
                        console.error("Logout error:", error);
                    } finally {
                        localStorage.clear();
                        sessionStorage.clear();
                        window.location.replace('login.html'); 
                    }
                }
            });
        });
    }
}

// NEW: Handle Export Logic
function handleExportExcel() {
    try {
        Swal.showLoading();
        
        // Get currently filtered data
        const txt = document.getElementById('search-text').value.toLowerCase();
        const filteredToExport = allDebts.filter(item => {
            return item.customer_name.toLowerCase().includes(txt) || 
                   (item.tank_no && item.tank_no.toLowerCase().includes(txt));
        });

        if (filteredToExport.length === 0) {
            Swal.fire('تنبيه', 'لا توجد بيانات لتصديرها', 'warning');
            return;
        }

        // Map data to Arabic headers for the Excel file
        const exportData = filteredToExport.map(item => ({
            "رقم الخزان": item.tank_no || '-',
            "اسم الزبون": item.customer_name,
            "نوع الخزان": item.tank_type || '-',
            "المنطقة": item.area_name || '-',
            "العنوان": item.address || '-',
            "رقم الهاتف": item.phone || '-',
            "تاريخ أقدم دين": item.oldest_date ? new Date(item.oldest_date).toLocaleDateString('ar-EG') : '-',
            "إجمالي الدين": item.total_debt
        }));

        // Create Workbook
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "الديون");
        
        // Generate File Name with Date
        const dateStr = new Date().toISOString().split('T')[0];
        XLSX.writeFile(workbook, `Debts_List_${dateStr}.xlsx`);
        
        Swal.close();

    } catch (error) {
        console.error("Export Error:", error);
        Swal.fire('خطأ', 'حدث خطأ أثناء تصدير الملف', 'error');
    }
}

async function handlePayClick(customerId, name, totalDebt) {
    const { value: amount } = await Swal.fire({
        title: `تسديد دين - ${name}`,
        html: `
            <div class="text-right mb-4">
                <p class="text-sm text-gray-500 font-bold mb-1">المبلغ الكلي المستحق</p>
                <p class="text-2xl font-bold text-red-600 font-mono">${totalDebt.toLocaleString()}</p>
            </div>
            <label class="block text-right text-xs font-bold text-gray-700 mb-1">المبلغ المدفوع</label>
            <input id="swal-payment-input" type="number" class="swal2-input w-full m-0" placeholder="أدخل المبلغ..." min="1" max="${totalDebt}">
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'تسديد',
        confirmButtonColor: '#10b981',
        cancelButtonText: 'إلغاء',
        preConfirm: () => {
            const val = document.getElementById('swal-payment-input').value;
            if (!val || val <= 0) return Swal.showValidationMessage('يرجى إدخال مبلغ صحيح');
            if (val > totalDebt) return Swal.showValidationMessage('المبلغ المدفوع أكبر من الدين الكلي');
            return val;
        }
    });

    if (amount) {
        try {
            Swal.showLoading();
            await DebtsData.processPayment(customerId, amount);
            DebtsUI.showSuccess('تم التسديد', 'تم تحديث سجل الديون بنجاح');
            loadData(); 
        } catch (error) {
            DebtsUI.showError('خطأ', 'فشل في معالجة الدفع: ' + error.message);
        }
    }
}

function initThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    const icon = document.getElementById('theme-icon');
    const body = document.body;
    
    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-mode');
        if(icon) icon.classList.replace('ph-moon', 'ph-sun');
    }

    if(btn) {
        btn.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            if (body.classList.contains('dark-mode')) {
                localStorage.setItem('theme', 'dark');
                if(icon) icon.classList.replace('ph-moon', 'ph-sun');
            } else {
                localStorage.setItem('theme', 'light');
                if(icon) icon.classList.replace('ph-sun', 'ph-moon');
            }
        });
    }
}