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
    
    inputs: {
        get id() { return document.getElementById('tank-id'); },
        get name() { return document.getElementById('tank-name'); },
        get price() { return document.getElementById('tank-price'); },
        get days() { return document.getElementById('tank-days'); },
        get status() { return document.getElementById('tank-status'); },
    },

    // --- POPUP NOTIFICATIONS ---
    showError: function(title, message) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: title,
                text: message,
                confirmButtonText: 'حسناً',
                confirmButtonColor: '#ef476f', // Uses new danger color
                customClass: { popup: 'rounded-2xl' }
            });
        } else {
            alert(title + "\n" + message);
        }
    },

    showSuccess: function(title, message) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: title,
                text: message,
                showConfirmButton: false,
                timer: 1500,
                customClass: { popup: 'rounded-2xl' }
            });
        } else {
            alert(message);
        }
    },

    renderTable: function(tanks) {
        const container = this.gridContainer;
        if(!container) return;
        container.innerHTML = '';
        
        if (!tanks) {
            this.loadingState.classList.remove('hidden');
            this.emptyState.classList.add('hidden');
            return;
        }
        this.loadingState.classList.add('hidden');

        if (tanks.length === 0) {
            this.emptyState.classList.remove('hidden');
            return;
        } else {
            this.emptyState.classList.add('hidden');
        }

        tanks.forEach((tank, index) => {
            const isActive = tank.is_active !== false;
            // Append "Liters" to the number
            const displayName = `${tank.name} لتر`;

            // Card background and styling remains clean white
            const card = document.createElement('div');
            card.className = 'tank-card bg-white rounded-3xl p-6 border border-gray-100 relative overflow-hidden group';
            
            card.innerHTML = `
                <!-- Top Right Accent Circle (Updated to a fresh Teal) -->
                <div class="absolute -right-6 -top-6 w-24 h-24 bg-teal-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>

                <div class="flex justify-between items-start mb-4 relative z-10">
                    <!-- Status Badge: Uses new success/active green -->
                    <div class="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                        <div class="w-2.5 h-2.5 rounded-full ${isActive ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-300'}"></div>
                        <span class="text-xs font-bold ${isActive ? 'text-green-700' : 'text-gray-400'}">
                            ${isActive ? 'فعال' : 'غير فعال'}
                        </span>
                    </div>
                    <span class="text-xs font-mono text-gray-300">#${index + 1}</span>
                </div>

                <div class="flex flex-col items-center text-center mb-6 relative z-10">
                    <!-- Cylinder Icon: Updated to Cyan/Teal Gradient for water theme -->
                    <div class="w-16 h-16 mb-4 cylinder-icon flex items-center justify-center bg-gradient-to-br from-cyan-100 to-teal-100 rounded-2xl text-cyan-700 shadow-md border border-cyan-200">
                        <i class="ph-fill ph-cylinder text-3xl"></i>
                    </div>
                    
                    <h3 class="text-2xl font-bold text-gray-800 mb-1 font-mono">${displayName}</h3>
                    
                    <div class="flex items-center gap-4 text-sm text-gray-500 mt-2">
                        <!-- Filling Days Badge: Updated to Teal colors -->
                        <span class="flex items-center gap-1 bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md">
                            <i class="ph-bold ph-calendar-blank"></i> ${tank.filling_days} يوم
                        </span>
                        <span class="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span class="font-bold text-gray-900">
                            ${Number(tank.price).toLocaleString()} <span class="text-xs font-normal text-gray-400">د.ع</span>
                        </span>
                    </div>
                </div>

                <!-- Footer: Actions -->
                <div class="border-t border-gray-50 pt-4 flex items-center justify-between relative z-10">
                    
                    <!-- View Customers Button: Updated to Sky Blue for action emphasis -->
                    <button type="button" 
                           class="btn-view-customers flex items-center gap-2 text-sm font-bold text-sky-600 hover:text-sky-800 transition-colors bg-sky-50 hover:bg-sky-100 px-3 py-2 rounded-xl"
                           data-id="${tank.id}"
                           title="عرض قائمة الزبائن">
                        <i class="ph-fill ph-users"></i>
                        <span>${tank.customer_count || 0} زبون</span>
                    </button>

                    <div class="flex items-center gap-2">
                         <button type="button" 
                                class="btn-edit w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-cyan-600 hover:text-white transition-all"
                                data-id="${tank.id}" title="تعديل">
                            <i class="ph-bold ph-pencil-simple"></i>
                        </button>
                        
                        <!-- Delete Button: Uses Red for warning -->
                        <button type="button" 
                                class="btn-delete w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-red-500 hover:text-white transition-all"
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
        if(this.inputs.status) {
            this.inputs.status.value = (tank.is_active !== false) ? "true" : "false";
        }
    }
};