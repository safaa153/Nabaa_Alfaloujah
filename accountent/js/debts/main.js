import { DebtsData } from './data.js';
import { DebtsUI } from './ui.js';
import { AuthService } from '../../../Settings/auth.js'; 

let allDebts = [];

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    setupEventListeners();
    initThemeToggle();
    loadData();
}

async function loadData() {
    document.getElementById('loading-state').classList.remove('hidden');
    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('debts-table-body').innerHTML = '';

    allDebts = await DebtsData.fetchAggregatedDebts();
    applyFilters(); // Renders the table

    document.getElementById('loading-state').classList.add('hidden');
}

function applyFilters() {
    const txt = document.getElementById('search-text').value.toLowerCase();
    
    const filtered = allDebts.filter(item => {
        return item.customer_name.toLowerCase().includes(txt) || 
               (item.tank_no && item.tank_no.toLowerCase().includes(txt));
    });

    DebtsUI.renderTable(filtered);
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
            window.location.replace('login.html');
        }
    });
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
            loadData(); // Refresh list to remove zero debts or update totals
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