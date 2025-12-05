// accountent/js/customers/ui.js
export const CustomersUI = {
    
    get tableBody() { return document.getElementById('customers-table-body'); },
    get modal() { return document.getElementById('customer-modal'); },
    get modalContent() { return document.getElementById('customer-modal-content'); },
    get form() { return document.getElementById('customer-form'); },
    
    // Portal for dropdowns
    get portal() { 
        let el = document.getElementById('dropdown-portal');
        if (!el) {
            el = document.createElement('div');
            el.id = 'dropdown-portal';
            el.style.position = 'relative'; 
            el.style.zIndex = '9999';
            document.body.appendChild(el);
        }
        return el;
    },
    
    get headerName() { return document.getElementById('header-user-name'); },
    get headerRole() { return document.getElementById('header-user-role'); },
    get headerAvatarImg() { return document.getElementById('header-user-img'); },
    get headerAvatarContainer() { return document.getElementById('header-user-avatar'); },

    inputs: {
        id: document.getElementById('customer-id'),
        tankNo: document.getElementById('cust-tank-no'),
        name: document.getElementById('cust-name'),
        tankType: document.getElementById('cust-tank-type'),
        phone1: document.getElementById('cust-phone1'),
        phone2: document.getElementById('cust-phone2'),
        phone3: document.getElementById('cust-phone3'),
        area: document.getElementById('cust-area'),
        driver: document.getElementById('cust-driver'),
        address: document.getElementById('cust-address'),
        lat: document.getElementById('cust-lat'),
        lng: document.getElementById('cust-lng'),
        doc1: document.getElementById('cust-doc1'),
        doc2: document.getElementById('cust-doc2'),
        linkDoc1: document.getElementById('link-doc1'),
        linkDoc2: document.getElementById('link-doc2'),
        existingDoc1: document.getElementById('existing-doc1'),
        existingDoc2: document.getElementById('existing-doc2')
    },

    updateHeaderProfile: function(profile) {
        if (!profile) return;
        if (this.headerName) this.headerName.innerText = profile.name || 'المسؤول';
        if (this.headerRole) this.headerRole.innerText = profile.job_title || 'ACCOUNTANT';
        
        if (profile.photo_url) {
            this.headerAvatarImg.src = profile.photo_url;
            this.headerAvatarImg.classList.remove('hidden');
            const span = this.headerAvatarContainer.querySelector('span');
            if(span) span.style.display = 'none';
        }
    },

    renderTable: function(list, totalCount) {
        const tbody = this.tableBody;
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!list || list.length === 0) {
            document.getElementById('empty-state').classList.remove('hidden');
            document.getElementById('pagination-controls').classList.add('hidden');
            return;
        }
        document.getElementById('empty-state').classList.add('hidden');

        const controls = document.getElementById('pagination-controls');
        const showAllBtn = document.getElementById('btn-show-all');
        const countText = document.getElementById('showing-count');
        
        if (controls) {
            if (list.length < totalCount) {
                controls.classList.remove('hidden');
                if(countText) countText.innerText = `عرض ${list.length} من أصل ${totalCount} زبون`;
                if(showAllBtn) showAllBtn.classList.remove('hidden');
            } else {
                 if(totalCount > 50) {
                     controls.classList.remove('hidden');
                     if(showAllBtn) showAllBtn.classList.add('hidden');
                     if(countText) countText.innerText = `عرض الكل (${totalCount} زبون)`;
                 } else {
                     controls.classList.add('hidden');
                 }
            }
        }

        list.forEach((item, index) => {
            const hasLocation = item.latitude && item.longitude;
            const locationBtnClass = hasLocation 
                ? 'text-blue-600 hover:bg-blue-50 cursor-pointer' 
                : 'text-gray-300 cursor-not-allowed';
            const locationUrl = hasLocation 
                ? `https://www.google.com/maps?q=${item.latitude},${item.longitude}` 
                : '#';
            
            let photoIcons = '';
            if (item.doc1_url || item.doc2_url) {
                photoIcons = `
                    <div class="flex items-center justify-center gap-1">
                        ${item.doc1_url ? `<a href="${item.doc1_url}" target="_blank" class="text-cyan-600 hover:text-cyan-800"><i class="ph-fill ph-image text-lg"></i></a>` : ''}
                        ${item.doc2_url ? `<a href="${item.doc2_url}" target="_blank" class="text-cyan-600 hover:text-cyan-800"><i class="ph-fill ph-image text-lg"></i></a>` : ''}
                    </div>
                `;
            } else {
                photoIcons = `<span class="text-gray-300 text-xs">-</span>`;
            }

            const createdAtDate = item.created_at ? new Date(item.created_at).toLocaleString('ar-EG', {
                year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
            }) : '-';
            
            const createdBy = item.created_by || '-';

            // Ensure last_filling is displayed nicely. Data layer provides it as a string or '-'
            const lastFillingDisplay = item.last_filling || '-';

            const row = document.createElement('tr');
            row.className = 'table-row-anim border-b border-gray-50 hover:bg-gray-50/50';
            row.innerHTML = `
                <td class="p-4 font-bold text-gray-400">#${index + 1}</td>
                <td class="p-4 font-mono font-bold text-blue-600">${item.tank_no}</td>
                <td class="p-4 font-bold text-gray-800">${item.name}</td>
                <td class="p-4 text-xs text-gray-600">${item.tank_type_name}</td>
                <td class="p-4"><span class="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">${item.area_name}</span></td>
                <td class="p-4 text-xs text-gray-500">${item.driver_name}</td>
                <td class="p-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <span class="font-mono text-xs dir-ltr">${item.phone}</span>
                        ${(item.phone2 || item.phone3) ? 
                            `<button class="w-6 h-6 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center hover:bg-purple-100 btn-phones" data-id="${item.id}" title="أرقام أخرى"><i class="ph-bold ph-phone-plus"></i></button>` 
                            : ''}
                    </div>
                </td>
                <td class="p-4 text-center">
                    <a href="${locationUrl}" target="_blank" class="w-8 h-8 rounded-xl flex items-center justify-center transition-colors mx-auto ${locationBtnClass}">
                        <i class="ph-fill ph-map-pin text-lg"></i>
                    </a>
                </td>
                <td class="p-4 text-center">
                    ${photoIcons}
                </td>
                
                <td class="p-4 text-center dir-ltr text-xs text-gray-500 font-mono">
                    ${createdAtDate}
                </td>
                <td class="p-4 text-center text-xs text-gray-500">
                    <span class="bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100">${createdBy}</span>
                </td>

                <td class="p-4 text-center">
                     <button class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center btn-new-request mx-auto" data-id="${item.id}" title="طلب تعبئة">
                        <i class="ph-bold ph-plus"></i>
                    </button>
                </td>
                <td class="p-4 text-center text-xs font-bold text-gray-700 dir-ltr">
                    ${lastFillingDisplay}
                </td>
                <td class="p-4 text-center">
                    <div class="flex items-center justify-center gap-2 relative">
                        <button class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center btn-edit" data-id="${item.id}" title="تعديل">
                            <i class="ph-bold ph-pencil-simple"></i>
                        </button>
                        <button class="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center btn-delete" data-id="${item.id}" title="حذف">
                            <i class="ph-bold ph-trash"></i>
                        </button>
                        
                        <button class="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center btn-dots" data-id="${item.id}" title="خيارات إضافية">
                            <i class="ph-bold ph-dots-three-vertical"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    renderDropdown: function(rect, id, name) {
        this.portal.innerHTML = `
            <div id="active-dropdown" class="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col items-stretch text-right w-64 animate-fade-in ring-1 ring-black/5">
                 <button class="px-4 py-3 hover:bg-gray-50 text-sm font-bold text-gray-700 flex items-center gap-3 btn-action-withdraw transition-colors" data-id="${id}" data-name="${name}">
                    <div class="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0"><i class="ph-fill ph-arrow-u-up-left text-orange-500"></i></div>
                    <span>طلب سحب خزان</span>
                </button>
                <button class="px-4 py-3 hover:bg-gray-50 text-sm font-bold text-gray-700 flex items-center gap-3 btn-action-water transition-colors" data-id="${id}" data-name="${name}">
                    <div class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0"><i class="ph-fill ph-drop text-blue-500"></i></div>
                    <span>طلب تبديل مياه مجاني</span>
                </button>
                <button class="px-4 py-3 hover:bg-gray-50 text-sm font-bold text-gray-700 flex items-center gap-3 btn-action-location transition-colors" data-id="${id}" data-name="${name}">
                    <div class="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0"><i class="ph-fill ph-map-pin text-green-500"></i></div>
                    <span>طلب تحديد موقع</span>
                </button>
            </div>
        `;
        
        const dropdown = document.getElementById('active-dropdown');
        const dropdownWidth = 256; 
        const dropdownHeight = 180; 

        const spaceBelow = window.innerHeight - rect.bottom;
        let topPos = rect.bottom + 5;
        
        if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
            topPos = rect.top - dropdownHeight - 5; 
        }

        let leftPos = rect.left;

        if (leftPos < 10) {
            leftPos = 10; 
        }
        
        if (leftPos + dropdownWidth > window.innerWidth) {
            leftPos = window.innerWidth - dropdownWidth - 10;
        }

        dropdown.style.top = `${topPos}px`;
        dropdown.style.left = `${leftPos}px`;
    },
    
    closeDropdown: function() {
        if(this.portal) this.portal.innerHTML = '';
    },

    openModal: function(isEdit = false, data = null) {
        this.modal.classList.remove('hidden');
        setTimeout(() => {
            this.modalContent.classList.remove('scale-95', 'opacity-0');
            this.modalContent.classList.add('scale-100', 'opacity-100');
        }, 10);
        document.getElementById('modal-title').innerText = isEdit ? 'تعديل بيانات الزبون' : 'إضافة زبون جديد';
        
        if (data) this.fillForm(data);
    },

    closeModal: function() {
        this.modalContent.classList.remove('scale-100', 'opacity-100');
        this.modalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            this.modal.classList.add('hidden');
            this.form.reset();
            this.inputs.id.value = '';
            this.inputs.linkDoc1.classList.add('hidden');
            this.inputs.linkDoc2.classList.add('hidden');
            this.inputs.existingDoc1.value = '';
            this.inputs.existingDoc2.value = '';
        }, 300);
    },

    fillForm: function(data) {
        const i = this.inputs;
        i.id.value = data.id;
        i.tankNo.value = data.tank_no;
        i.name.value = data.name;
        i.tankType.value = data.tank_type_id || '';
        i.phone1.value = data.phone;
        i.phone2.value = data.phone2 || '';
        i.phone3.value = data.phone3 || '';
        i.area.value = data.area_id || '';
        i.driver.value = data.driver_id || '';
        i.address.value = data.address || '';
        i.lat.value = data.latitude || '';
        i.lng.value = data.longitude || '';
        
        i.existingDoc1.value = data.doc1_url || '';
        i.existingDoc2.value = data.doc2_url || '';

        if(data.doc1_url) { i.linkDoc1.href = data.doc1_url; i.linkDoc1.classList.remove('hidden'); }
        if(data.doc2_url) { i.linkDoc2.href = data.doc2_url; i.linkDoc2.classList.remove('hidden'); }
    },

    populateDropdowns: function(lookups) {
        const { tankTypes, areas, drivers } = lookups;
        
        this.inputs.tankType.innerHTML = '<option value="">اختر النوع...</option>' + 
            tankTypes.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
        this.inputs.area.innerHTML = '<option value="">اختر المنطقة...</option>' + 
            areas.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
        this.inputs.driver.innerHTML = '<option value="">اختر السائق...</option>' + 
            drivers.map(d => `<option value="${d.id}">${d.name}</option>`).join('');

        document.getElementById('filter-tank-type').innerHTML = '<option value="">نوع الخزان (الكل)</option>' + 
            tankTypes.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
        document.getElementById('filter-area').innerHTML = '<option value="">المنطقة (الكل)</option>' + 
            areas.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
        
        document.getElementById('filter-driver').innerHTML = '<option value="">السائق (الكل)</option>' + 
            drivers.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    },

    showError: function(t, m) { Swal.fire({icon:'error', title:t, text:m, confirmButtonText:'حسناً', confirmButtonColor:'#ef476f', customClass:{popup:'rounded-2xl'}}); },
    showSuccess: function(t, m) { Swal.fire({icon:'success', title:t, text:m, showConfirmButton:false, timer:1500, customClass:{popup:'rounded-2xl'}}); }
};