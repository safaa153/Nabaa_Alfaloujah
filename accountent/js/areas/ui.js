// accountent/js/areas/ui.js
export const AreasUI = {
    
    get tableBody() { return document.getElementById('areas-table-body'); },
    get emptyState() { return document.getElementById('empty-state'); },
    get loadingState() { return document.getElementById('loading-state'); },
    get modal() { return document.getElementById('area-modal'); },
    get modalContent() { return document.getElementById('area-modal-content'); },
    
    // Header Elements
    get headerName() { return document.getElementById('header-user-name'); },
    get headerRole() { return document.getElementById('header-user-role'); },
    get headerAvatarContainer() { return document.getElementById('header-user-avatar'); },
    get headerAvatarImg() { return document.getElementById('header-user-img'); },

    inputs: {
        id: document.getElementById('area-id'),
        name: document.getElementById('area-name'),
        driver: document.getElementById('area-driver'),
        status: document.getElementById('area-status')
    },

    updateHeaderProfile: function(profile) {
        if (!profile) return;
        if (this.headerName) this.headerName.innerText = profile.name || 'المسؤول';
        if (this.headerRole) this.headerRole.innerText = profile.job_title || 'ACCOUNTANT';

        const container = this.headerAvatarContainer;
        const img = this.headerAvatarImg;
        if (!container || !img) return;

        if (profile.photo_url) {
            img.src = profile.photo_url;
            img.classList.remove('hidden');
            const letterSpan = container.querySelector('span');
            if(letterSpan) letterSpan.style.display = 'none';
        } else {
            img.classList.add('hidden');
            const letterSpan = container.querySelector('span');
            if(letterSpan) {
                letterSpan.style.display = 'block';
                if (profile.name) letterSpan.innerText = profile.name.charAt(0);
            }
        }
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
            
            // Format Data
            const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('ar-EG') : '-';
            const createdBy = item.created_by_name || '-';

            const row = document.createElement('tr');
            row.className = 'table-row-anim';
            row.innerHTML = `
                <td class="font-bold text-gray-400 p-4">#${index + 1}</td>
                <td class="font-bold text-gray-800 p-4">${item.name}</td>
                <td class="p-4">
                    <span class="text-xs bg-cyan-50 text-cyan-700 px-3 py-1.5 rounded-full font-semibold">
                        ${item.driver_name || 'غير محدد'}
                    </span>
                </td>
                <td class="text-center font-bold text-cyan-600 p-4">${item.customer_count || 0}</td>
                
                <!-- NEW COLUMNS -->
                <td class="text-center text-xs text-gray-500 font-medium">${createdBy}</td>
                <td class="text-gray-500 text-xs dir-ltr text-right p-4 font-mono">${dateStr}</td>

                <td class="text-center p-4">
                    <span class="badge ${isActive ? 'badge-active' : 'badge-inactive'}">
                        ${isActive ? 'فعال' : 'غير فعال'}
                    </span>
                </td>
                
                <td class="text-center p-4">
                    <button class="btn-customers bg-cyan-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-cyan-700 transition-colors shadow-md shadow-cyan-500/20" data-id="${item.id}">
                        عرض الزبائن
                    </button>
                </td>
                <td class="text-center p-4">
                    <button class="btn-edit bg-emerald-500 text-white w-9 h-9 rounded-xl hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/20" data-id="${item.id}">
                        <i class="ph-bold ph-pencil-simple text-lg"></i>
                    </button>
                </td>
                <td class="text-center p-4">
                    <button class="btn-delete bg-red-500 text-white w-9 h-9 rounded-xl hover:bg-red-600 transition-colors shadow-md shadow-red-500/20" data-id="${item.id}">
                        <i class="ph-bold ph-trash text-lg"></i>
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

    showError: function(t, m) { Swal.fire({icon:'error', title:t, text:m, confirmButtonText:'حسناً', confirmButtonColor: '#ef476f', customClass: { popup: 'rounded-2xl' }}); },
    showSuccess: function(t, m) { Swal.fire({icon:'success', title:t, text:m, showConfirmButton:false, timer:1500, customClass: { popup: 'rounded-2xl' }}); }
};