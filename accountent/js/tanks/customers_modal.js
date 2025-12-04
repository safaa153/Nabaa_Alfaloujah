import { TanksData } from './data.js';

export const CustomersModal = {
    modal: document.getElementById('customers-modal'),
    content: document.getElementById('customers-modal-content'),
    body: document.getElementById('customers-modal-body'),
    emptyState: document.getElementById('customers-empty-state'),
    closeBtn: document.getElementById('btn-close-customers-modal'),
    title: document.getElementById('customers-modal-title'),

    init: function() {
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.close();
            });
        }
    },

    open: async function(tankId, tankName) {
        this.modal.classList.remove('hidden');
        setTimeout(() => {
            this.content.classList.remove('scale-95', 'opacity-0');
            this.content.classList.add('scale-100', 'opacity-100');
        }, 10);

        this.title.innerText = `الزبائن المرتبطين بـ ${tankName}`;
        this.body.innerHTML = '<tr><td colspan="4" class="text-center py-8"><i class="ph ph-spinner animate-spin text-3xl text-blue-500"></i></td></tr>';
        this.emptyState.classList.add('hidden');

        try {
            const customers = await TanksData.getCustomersByTankId(tankId);
            this.renderList(customers);
        } catch (error) {
            console.error("Error in modal:", error);
            this.body.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-red-500">حدث خطأ: ${error.message}</td></tr>`;
        }
    },

    close: function() {
        this.content.classList.remove('scale-100', 'opacity-100');
        this.content.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            this.modal.classList.add('hidden');
            this.body.innerHTML = '';
        }, 300);
    },

    renderList: function(list) {
        this.body.innerHTML = '';
        
        if (!list || list.length === 0) {
            this.emptyState.classList.remove('hidden');
            return;
        }

        list.forEach((customer, index) => {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-50 hover:bg-gray-50 transition-colors';
            row.innerHTML = `
                <td class="p-4 text-gray-400 font-bold text-xs">#${index + 1}</td>
                <td class="p-4 font-bold text-gray-800">${customer.name}</td>
                <td class="p-4 font-mono text-xs text-gray-600 dir-ltr text-right">${customer.phone || '-'}</td>
                <td class="p-4 text-sm text-gray-500">${customer.address || '-'}</td>
            `;
            this.body.appendChild(row);
        });
    }
};