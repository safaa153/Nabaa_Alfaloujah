// accountent/js/drivers/ui.js
export const DriversUI = {
    
    get tableBody() { return document.getElementById('drivers-table-body'); },
    get tableHeader() { return document.getElementById('table-headers'); },
    get emptyState() { return document.getElementById('empty-state'); },
    get loadingState() { return document.getElementById('loading-state'); },
    get modal() { return document.getElementById('driver-modal'); },
    get modalContent() { return document.getElementById('driver-modal-content'); },
    get form() { return document.getElementById('driver-form'); },
    
    inputs: {
        id: document.getElementById('driver-id'),
        role: document.getElementById('driver-role'),
        name: document.getElementById('driver-name'),
        username: document.getElementById('driver-username'),
        status: document.getElementById('driver-status'),
        phone1: document.getElementById('driver-phone1'),
        phone2: document.getElementById('driver-phone2'),
        phone3: document.getElementById('driver-phone3'),
        carName: document.getElementById('driver-car'),
        linkedDriver: document.getElementById('assistant-linked-driver'),
        jobTitle: document.getElementById('employee-job-title'),
        salary: document.getElementById('employee-salary'),
        jobDesc: document.getElementById('employee-job-desc'),
        driverFields: document.getElementById('driver-specific-fields'),
        assistantFields: document.getElementById('assistant-specific-fields'),
        employeeFields: document.getElementById('employee-specific-fields'),
        commissionContainer: document.getElementById('commission-container'),
        commissionSection: document.getElementById('commission-section')
    },

    renderTable: function(list, allStaff, currentView) {
        const tbody = this.tableBody;
        if(!tbody) return;
        tbody.innerHTML = '';
        
        this.updateHeaders(currentView);

        this.loadingState.classList.add('hidden');
        if (!list || list.length === 0) {
            this.emptyState.classList.remove('hidden');
            return;
        }
        this.emptyState.classList.add('hidden');

        list.forEach((item, index) => {
            const isActive = item.is_active !== false;
            
            let extraColumns = '';
            if (currentView === 'driver') {
                extraColumns = `
                    <td class="text-center font-bold text-blue-600">${item.area_count || 0}</td>
                    <td class="text-center text-gray-700 text-sm font-medium">${item.car_name || '-'}</td>
                `;
            } else if (currentView === 'assistant') {
                const boss = allStaff.find(d => d.id === item.linked_driver_id);
                extraColumns = `
                    <td class="text-center text-gray-500" colspan="2">
                        <div class="flex items-center justify-center gap-2">
                            <span class="text-xs text-gray-400">يعمل مع:</span>
                            <span class="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs font-bold">
                                ${boss ? boss.name : 'غير محدد'}
                            </span>
                        </div>
                    </td>
                `;
            } else if (currentView === 'employee') {
                extraColumns = `
                    <td class="text-center font-bold text-gray-700">${item.job_title || '-'}</td>
                    <td class="text-center font-bold text-emerald-600 dir-ltr">${item.salary ? item.salary.toLocaleString() : '0'}</td>
                `;
            }

            let actionCell = '';
            if (currentView === 'employee') {
                 actionCell = `<td class="text-center text-xs text-gray-400 truncate max-w-[150px]">${item.job_description || '-'}</td>`;
            } else {
                 actionCell = `
                    <td class="text-center p-4">
                        <button class="btn-commission w-9 h-9 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors shadow-sm flex items-center justify-center mx-auto" data-id="${item.id}" title="عرض العمولة">
                            <i class="ph-duotone ph-coins text-xl"></i>
                        </button>
                    </td>
                 `;
            }

            const row = document.createElement('tr');
            row.className = 'table-row-anim';
            row.innerHTML = `
                <td class="font-bold text-gray-400 p-4">#${index + 1}</td>
                <td class="font-bold text-gray-800 p-4">${item.name}</td>
                <td class="p-4 dir-ltr text-right text-gray-600 font-mono text-xs">${item.phone}</td>
                
                ${extraColumns}
                
                <td class="text-center p-4">
                    <span class="badge ${isActive ? 'badge-active' : 'badge-inactive'}">
                        ${isActive ? 'نشط' : 'متوقف'}
                    </span>
                </td>
                
                <!-- PHONES BUTTON -->
                <td class="text-center p-4">
                     <button class="btn-phones w-9 h-9 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white transition-colors flex items-center justify-center mx-auto shadow-sm" data-id="${item.id}" title="أرقام الهاتف">
                        <i class="ph-bold ph-list-numbers text-lg"></i>
                    </button>
                </td>

                ${actionCell}

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

    updateHeaders: function(view) {
        let cols = '';
        if (view === 'driver') {
            cols = `
                <th>#</th> <th>الاسم</th> <th>الهاتف</th>
                <th class="text-center">عدد المناطق</th>
                <th class="text-center">السيارة</th>
                <th class="text-center">الحالة</th>
                <th class="text-center">أرقام الهاتف</th>
                <th class="text-center">العمولة</th>
                <th class="text-center">تعديل</th> <th class="text-center">حذف</th>
            `;
        } else if (view === 'assistant') {
             cols = `
                <th>#</th> <th>الاسم</th> <th>الهاتف</th>
                <th class="text-center" colspan="2">السائق المسؤول</th>
                <th class="text-center">الحالة</th>
                <th class="text-center">أرقام الهاتف</th>
                <th class="text-center">العمولة</th>
                <th class="text-center">تعديل</th> <th class="text-center">حذف</th>
            `;
        } else if (view === 'employee') {
             cols = `
                <th>#</th> <th>الاسم</th> <th>الهاتف</th>
                <th class="text-center">الوظيفة</th>
                <th class="text-center">الراتب</th>
                <th class="text-center">الحالة</th>
                <th class="text-center">أرقام الهاتف</th>
                <th class="text-center">الوصف</th>
                <th class="text-center">تعديل</th> <th class="text-center">حذف</th>
            `;
        }
        this.tableHeader.innerHTML = `<tr>${cols}</tr>`;
    },

    // ... rest of openModal, fillForm, etc. (Same as before)
    openModal: function(isEdit = false, role = 'driver', tankTypes = [], allStaff = []) {
        this.modal.classList.remove('hidden');
        setTimeout(() => {
            this.modalContent.classList.remove('scale-95', 'opacity-0');
            this.modalContent.classList.add('scale-100', 'opacity-100');
        }, 10);
        
        const titles = { 'driver': 'إضافة سائق', 'assistant': 'إضافة مساعد', 'employee': 'إضافة موظف' };
        document.getElementById('modal-title').innerText = isEdit ? 'تعديل البيانات' : titles[role];
        
        this.inputs.role.value = role;

        this.inputs.driverFields.classList.add('hidden');
        this.inputs.assistantFields.classList.add('hidden');
        this.inputs.employeeFields.classList.add('hidden');
        this.inputs.commissionSection.classList.add('hidden');

        if (role === 'driver') {
            this.inputs.driverFields.classList.remove('hidden');
            this.inputs.commissionSection.classList.remove('hidden');
            this.renderCommissionInputs(tankTypes);
        } else if (role === 'assistant') {
            this.inputs.assistantFields.classList.remove('hidden');
            this.inputs.commissionSection.classList.remove('hidden');
            this.renderCommissionInputs(tankTypes);
            const drivers = allStaff.filter(d => d.role === 'driver');
            this.inputs.linkedDriver.innerHTML = '<option value="">اختر السائق...</option>' + 
                drivers.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
        } else if (role === 'employee') {
            this.inputs.employeeFields.classList.remove('hidden');
        }
    },

    renderCommissionInputs: function(tanks) {
        const container = this.inputs.commissionContainer;
        if(container.innerHTML !== '') return; 

        container.innerHTML = tanks.map(tank => `
            <div class="commission-group bg-gray-50 p-3 rounded-lg border border-gray-100" data-tank-id="${tank.id}">
                <label class="text-xs font-bold text-blue-600 block mb-2">${tank.name}</label>
                <div class="grid grid-cols-3 gap-2">
                    <div>
                        <label class="text-[10px] text-gray-500">الحد (لتر)</label>
                        <input type="number" class="comm-threshold w-full p-2 text-sm border rounded focus:border-blue-500 outline-none" placeholder="0">
                    </div>
                    <div>
                        <label class="text-[10px] text-gray-500">العمولة (د.ع)</label>
                        <input type="number" class="comm-base w-full p-2 text-sm border rounded focus:border-blue-500 outline-none" placeholder="0">
                    </div>
                    <div>
                        <label class="text-[10px] text-gray-500">الإضافي (د.ع)</label>
                        <input type="number" class="comm-bonus w-full p-2 text-sm border rounded focus:border-blue-500 outline-none" placeholder="0">
                    </div>
                </div>
            </div>
        `).join('');
    },

    fillForm: function(data) {
        this.inputs.id.value = data.id;
        this.inputs.role.value = data.role;
        this.inputs.name.value = data.name;
        this.inputs.username.value = data.username || '';
        this.inputs.status.value = (data.is_active !== false) ? "true" : "false";
        this.inputs.phone1.value = data.phone || '';
        this.inputs.phone2.value = data.phone2 || '';
        this.inputs.phone3.value = data.phone3 || '';

        if (data.role === 'driver') {
            this.inputs.carName.value = data.car_name || '';
        } else if (data.role === 'assistant') {
            this.inputs.linkedDriver.value = data.linked_driver_id || '';
        } else if (data.role === 'employee') {
            this.inputs.jobTitle.value = data.job_title || 'وظيفة اخرى';
            this.inputs.salary.value = data.salary || '';
            this.inputs.jobDesc.value = data.job_description || '';
        }

        if (data.role === 'driver' || data.role === 'assistant') {
            const rules = data.commission_rules || {};
            const groups = document.querySelectorAll('.commission-group');
            groups.forEach(group => {
                const tankId = group.dataset.tankId;
                const rule = rules[tankId];
                if (rule) {
                    group.querySelector('.comm-threshold').value = rule.threshold || '';
                    group.querySelector('.comm-base').value = rule.base || '';
                    group.querySelector('.comm-bonus').value = rule.bonus || '';
                }
            });
        }
    },

    closeModal: function() {
        this.modalContent.classList.remove('scale-100', 'opacity-100');
        this.modalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            this.modal.classList.add('hidden');
            this.form.reset();
            this.inputs.id.value = '';
        }, 300);
    },
    
    showError: function(t, m) { Swal.fire({icon:'error', title:t, text:m, confirmButtonText:'حسناً', confirmButtonColor: '#ef476f', customClass: { popup: 'rounded-2xl' }}); },
    showSuccess: function(t, m) { Swal.fire({icon:'success', title:t, text:m, showConfirmButton:false, timer:1500, customClass: { popup: 'rounded-2xl' }}); }
};