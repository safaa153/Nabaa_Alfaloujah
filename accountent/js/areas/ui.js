// accountent/js/areas/ui.js
export const AreasUI = {
    
    get tableBody() { return document.getElementById('areas-table-body'); },
    get emptyState() { return document.getElementById('empty-state'); },
    get loadingState() { return document.getElementById('loading-state'); },
    get modal() { return document.getElementById('area-modal'); },
    get modalContent() { return document.getElementById('area-modal-content'); },
    
    inputs: {
        id: document.getElementById('area-id'),
        name: document.getElementById('area-name'),
        driver: document.getElementById('area-driver'),
        status: document.getElementById('area-status')
    },

    renderTable: function(list) {
        const tbody = this.tableBody;
        if(!tbody) return;
        tbody.innerHTML = '';

        this.loadingState.classList.add('hidden');
        if (!list || list.length === 0) {
            this.emptyState.classList.remove('hidden');
            return;
        }
        this.emptyState.classList.add('hidden');

        list.forEach((item, index) => {
            const isActive = item.is_active !== false;
            const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('ar-EG') : '-';

            const row = document.createElement('tr');
            row.className = 'table-row-anim'; // Apply animation class
            row.innerHTML = `
                <td class="font-bold text-gray-400 p-4">#${index + 1}</td>
                <td class="font-bold text-gray-800 p-4">${item.name}</td>
                <td class="p-4">
                    <!-- Driver name uses a soft cyan tag -->
                    <span class="text-xs bg-cyan-50 text-cyan-700 px-3 py-1.5 rounded-full font-semibold">
                        ${item.driver_name || 'غير محدد'}
                    </span>
                </td>
                <td class="text-center font-bold text-cyan-600 p-4">${item.customer_count}</td>
                <td class="text-center p-4">
                    <!-- Status Badge uses the new success/danger colors from styles.css -->
                    <span class="badge ${isActive ? 'badge-active' : 'badge-inactive'}">
                        ${isActive ? 'فعال' : 'غير فعال'}
                    </span>
                </td>
                <td class="text-gray-500 text-xs dir-ltr text-right p-4">${dateStr}</td>
                
                <!-- Actions -->
                <td class="text-center p-4">
                    <!-- View Customers Button: Primary action color (Cyan/Sky) -->
                    <button class="btn-customers bg-cyan-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-cyan-700 transition-colors shadow-md shadow-cyan-500/20" data-id="${item.id}">
                        عرض الزبائن
                    </button>
                </td>
                <td class="text-center p-4">
                    <!-- Edit Button: Secondary accent color (Teal/Emerald) -->
                    <button class="btn-edit bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/20" data-id="${item.id}">
                        تعديل
                    </button>
                </td>
                <td class="text-center p-4">
                    <!-- Delete Button: Danger color (Red) -->
                    <button class="btn-delete bg-red-500 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-red-600 transition-colors shadow-md shadow-red-500/20" data-id="${item.id}">
                        حذف
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    openModal: function(isEdit = false, drivers = []) {
        this.modal.classList.remove('hidden');
        setTimeout(() => {
            this.modalContent.classList.remove('scale-95', 'opacity-0');
            this.modalContent.classList.add('scale-100', 'opacity-100');
        }, 10);
        
        document.getElementById('modal-title').innerText = isEdit ? 'تعديل المنطقة' : 'إضافة منطقة جديدة';
        
        // Populate Drivers
        this.inputs.driver.innerHTML = '<option value="">اختر السائق...</option>' + 
            drivers.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    },

    closeModal: function() {
        this.modalContent.classList.remove('scale-100', 'opacity-100');
        this.modalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            this.modal.classList.add('hidden');
            document.getElementById('area-form').reset();
            this.inputs.id.value = '';
        }, 300);
    },

    fillForm: function(data) {
        this.inputs.id.value = data.id;
        this.inputs.name.value = data.name;
        this.inputs.driver.value = data.driver_id || '';
        this.inputs.status.value = (data.is_active !== false) ? "true" : "false";
    },

    // Updated Swal calls to use rounded-2xl/3xl and new danger color (if needed)
    showError: function(t, m) { Swal.fire({icon:'error', title:t, text:m, confirmButtonText:'حسناً', confirmButtonColor: '#ef476f', customClass: { popup: 'rounded-2xl' }}); },
    showSuccess: function(t, m) { Swal.fire({icon:'success', title:t, text:m, showConfirmButton:false, timer:1500, customClass: { popup: 'rounded-2xl' }}); }
};