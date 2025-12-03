// accountent/js/cars/ui.js
export const CarsUI = {
    
    get tableBody() { return document.getElementById('cars-table-body'); },
    get emptyState() { return document.getElementById('empty-state'); },
    get loadingState() { return document.getElementById('loading-state'); },
    get modal() { return document.getElementById('car-modal'); },
    get modalContent() { return document.getElementById('car-modal-content'); },
    get form() { return document.getElementById('car-form'); },
    get submitBtn() { return document.getElementById('btn-submit-car'); },
    
    get headerName() { return document.getElementById('header-user-name'); },
    get headerRole() { return document.getElementById('header-user-role'); },
    get headerAvatarContainer() { return document.getElementById('header-user-avatar'); },
    get headerAvatarImg() { return document.getElementById('header-user-img'); },

    inputs: {
        id: document.getElementById('car-id'),
        name: document.getElementById('car-name'),
        number: document.getElementById('car-number'),
        plate: document.getElementById('car-plate'),
        color: document.getElementById('car-color'),
        capacity: document.getElementById('car-capacity'),
        driver: document.getElementById('car-driver'),
        note: document.getElementById('car-note'),
        photo: document.getElementById('car-photo'),
        idPhoto: document.getElementById('car-id-photo'),
        existingPhoto: document.getElementById('existing-photo-url'),
        existingIdPhoto: document.getElementById('existing-id-photo-url'),
        previewPhoto: document.getElementById('preview-car-photo'),
        previewId: document.getElementById('preview-id-photo')
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
                if(profile.name) letterSpan.innerText = profile.name.charAt(0);
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
            const row = document.createElement('tr');
            row.className = 'table-row-anim';
            row.innerHTML = `
                <td class="font-bold text-gray-400 p-4">#${index + 1}</td>
                <td class="font-bold text-gray-800 p-4">${item.name}</td>
                <td class="text-center font-mono text-xs text-gray-600">${item.car_number || '-'}</td>
                <td class="text-center text-sm font-medium text-blue-700 bg-blue-50 rounded-lg px-2 py-1 mx-auto w-fit">${item.driver_name}</td>
                <td class="text-center text-gray-600">${item.tank_capacity ? item.tank_capacity.toLocaleString() + ' لتر' : '-'}</td>
                <td class="text-center text-xs">${item.color || '-'}</td>
                <td class="text-center text-xs text-gray-500 max-w-[150px] truncate" title="${item.note || ''}">${item.note || '-'}</td>
                
                <td class="text-center">
                    <div class="flex items-center justify-center gap-2">
                        ${item.photo_url ? 
                            `<a href="${item.photo_url}" target="_blank" class="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-blue-100 text-blue-600"><i class="ph-fill ph-image"></i></a>` 
                            : `<span class="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-300"><i class="ph ph-image"></i></span>`
                        }
                        ${item.id_photo_url ? 
                            `<a href="${item.id_photo_url}" target="_blank" class="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-blue-100 text-blue-600"><i class="ph-fill ph-identification-card"></i></a>` 
                            : `<span class="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-300"><i class="ph ph-identification-card"></i></span>`
                        }
                    </div>
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
        
        document.getElementById('modal-title').innerText = isEdit ? 'تعديل بيانات السيارة' : 'إضافة سيارة جديدة';
        
        this.inputs.driver.innerHTML = '<option value="">اختر السائق...</option>' + 
            drivers.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    },

    fillForm: function(data) {
        this.inputs.id.value = data.id;
        this.inputs.name.value = data.name;
        this.inputs.number.value = data.car_number || '';
        this.inputs.plate.value = data.plate_number || '';
        this.inputs.color.value = data.color || '';
        this.inputs.capacity.value = data.tank_capacity || '';
        this.inputs.driver.value = data.driver_id || '';
        this.inputs.note.value = data.note || '';
        
        this.inputs.existingPhoto.value = data.photo_url || '';
        this.inputs.existingIdPhoto.value = data.id_photo_url || '';

        // Reset Links
        this.inputs.previewPhoto.classList.add('hidden');
        this.inputs.previewId.classList.add('hidden');

        if(data.photo_url) {
            this.inputs.previewPhoto.classList.remove('hidden');
            this.inputs.previewPhoto.querySelector('a').href = data.photo_url;
        }
        if(data.id_photo_url) {
            this.inputs.previewId.classList.remove('hidden');
            this.inputs.previewId.querySelector('a').href = data.id_photo_url;
        }
    },

    closeModal: function() {
        this.modalContent.classList.remove('scale-100', 'opacity-100');
        this.modalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            this.modal.classList.add('hidden');
            this.form.reset();
            this.inputs.id.value = '';
            this.inputs.existingPhoto.value = '';
            this.inputs.existingIdPhoto.value = '';
            this.inputs.previewPhoto.classList.add('hidden');
            this.inputs.previewId.classList.add('hidden');
            this.setLoading(false);
        }, 300);
    },

    setLoading: function(isLoading) {
        if(isLoading) {
            this.submitBtn.disabled = true;
            this.submitBtn.innerHTML = '<i class="ph ph-spinner animate-spin"></i> جاري الحفظ...';
        } else {
            this.submitBtn.disabled = false;
            this.submitBtn.innerHTML = 'حفظ';
        }
    },

    showError: function(t, m) { Swal.fire({icon:'error', title:t, text:m, confirmButtonText:'حسناً', confirmButtonColor: '#ef476f', customClass: { popup: 'rounded-2xl' }}); },
    showSuccess: function(t, m) { Swal.fire({icon:'success', title:t, text:m, showConfirmButton:false, timer:1500, customClass: { popup: 'rounded-2xl' }}); }
};