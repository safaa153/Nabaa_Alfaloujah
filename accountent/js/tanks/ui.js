// accountent/js/tanks/ui.js
export const TanksUI = {
    
    // Selectors
    get gridContainer() { return document.getElementById('tanks-grid-container'); },
    get emptyState() { return document.getElementById('empty-state'); },
    get loadingState() { return document.getElementById('loading-state'); },
    get modal() { return document.getElementById('tank-modal'); },
    get modalContent() { return document.getElementById('tank-modal-content'); },
    get modalTitle() { return document.getElementById('modal-title'); },
    get form() { return document.getElementById('tank-form'); },
    
    // Header Selectors
    get headerName() { return document.getElementById('header-user-name'); },
    get headerRole() { return document.getElementById('header-user-role'); },
    get headerAvatarContainer() { return document.getElementById('header-user-avatar'); },
    get headerAvatarImg() { return document.getElementById('header-user-img'); },
    
    inputs: {
        get id() { return document.getElementById('tank-id'); },
        get name() { return document.getElementById('tank-name'); },
        get price() { return document.getElementById('tank-price'); },
        get days() { return document.getElementById('tank-days'); },
        get status() { return document.getElementById('tank-status'); },
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

    showError: function(title, message) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({icon:'error', title, text:message, confirmButtonText:'حسناً', confirmButtonColor:'#ef476f', customClass:{popup:'rounded-2xl'}});
        } else { alert(message); }
    },

    showSuccess: function(title, message) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({icon:'success', title, text:message, showConfirmButton:false, timer:1500, customClass:{popup:'rounded-2xl'}});
        }
    },

    renderTable: function(tanks) {
        const container = this.gridContainer;
        if (!container) return;
        
        container.innerHTML = '';
        this.loadingState.classList.add('hidden');

        if (!tanks || tanks.length === 0) {
            this.emptyState.classList.remove('hidden');
            return;
        }
        this.emptyState.classList.add('hidden');

        tanks.forEach(tank => {
            const isActive = tank.is_active !== false;
            const statusClass = isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500';
            const statusText = isActive ? 'فعال' : 'غير فعال';

            const card = document.createElement('div');
            card.className = "tank-card bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:border-cyan-100";
            
            card.innerHTML = `
                <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                
                <div class="flex justify-between items-start mb-6">
                    <div class="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center text-2xl shadow-sm group-hover:bg-cyan-600 group-hover:text-white transition-colors duration-300">
                        <i class="ph-fill ph-cylinder cylinder-icon"></i>
                    </div>
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${statusClass}">
                        ${statusText}
                    </span>
                </div>

                <h3 class="text-xl font-bold text-gray-800 mb-1">${tank.name}</h3>
                <p class="text-sm text-gray-400 font-medium mb-4">السعة / اللتر</p>
                
                <div class="space-y-3 mb-6">
                    <div class="flex items-center justify-between text-sm bg-gray-50 p-3 rounded-xl">
                        <span class="text-gray-500 flex items-center gap-2"><i class="ph-duotone ph-users text-blue-500"></i> المشتركين</span>
                        <span class="font-bold text-gray-800">${tank.customer_count || 0}</span>
                    </div>
                    <div class="flex items-center justify-between text-sm bg-gray-50 p-3 rounded-xl">
                        <span class="text-gray-500 flex items-center gap-2"><i class="ph-duotone ph-money text-green-500"></i> السعر</span>
                        <span class="font-bold text-gray-800">${parseInt(tank.price).toLocaleString()} <span class="text-[10px] text-gray-400">د.ع</span></span>
                    </div>
                    <div class="flex items-center justify-between text-sm bg-gray-50 p-3 rounded-xl">
                        <span class="text-gray-500 flex items-center gap-2"><i class="ph-duotone ph-calendar-blank text-purple-500"></i> دورة التعبئة</span>
                        <span class="font-bold text-gray-800">${tank.filling_days || 30} <span class="text-[10px] text-gray-400">يوم</span></span>
                    </div>
                </div>

                <div class="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                    <span class="text-xs font-bold text-gray-400">الإجراءات</span>
                    <div class="flex gap-2">
                         <button class="btn-customers w-9 h-9 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center justify-center" 
                                data-id="${tank.id}" title="عرض المشتركين">
                            <i class="ph-bold ph-users"></i>
                        </button>

                         <button class="btn-edit w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm flex items-center justify-center" 
                                data-id="${tank.id}" title="تعديل">
                            <i class="ph-bold ph-pencil-simple"></i>
                        </button>
                        
                        <button class="btn-delete w-9 h-9 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center justify-center" 
                                data-id="${tank.id}" title="حذف">
                            <i class="ph-bold ph-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    },

    openModal: function(isEdit = false) {
        this.modal.classList.remove('hidden');
        setTimeout(() => {
            this.modalContent.classList.remove('scale-95', 'opacity-0');
            this.modalContent.classList.add('scale-100', 'opacity-100');
        }, 10);
        this.modalTitle.innerText = isEdit ? 'تعديل الخزان' : 'إضافة خزان جديد';
    },

    closeModal: function() {
        this.modalContent.classList.remove('scale-100', 'opacity-100');
        this.modalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            this.modal.classList.add('hidden');
            this.form.reset();
            this.inputs.id.value = '';
            if(this.inputs.status) this.inputs.status.value = "true";
        }, 300);
    },

    fillForm: function(tank) {
        this.inputs.id.value = tank.id;
        this.inputs.name.value = tank.name;
        this.inputs.price.value = tank.price;
        this.inputs.days.value = tank.filling_days;
        this.inputs.status.value = (tank.is_active !== false) ? "true" : "false";
    }
};