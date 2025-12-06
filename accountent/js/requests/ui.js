export const RequestsUI = {
    lookups: {}, 

    setLookups: function(data) {
        this.lookups = data;
    },
    
    get tableBody() { return document.getElementById('requests-table-body'); },
    get headerName() { return document.getElementById('header-user-name'); },
    get headerRole() { return document.getElementById('header-user-role'); },
    get headerAvatarImg() { return document.getElementById('header-user-img'); },
    get headerAvatarContainer() { return document.getElementById('header-user-avatar'); },

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

    renderTable: function(list, currentStatus) {
        const tbody = this.tableBody;
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!list || list.length === 0) {
            document.getElementById('empty-state').classList.remove('hidden');
            return;
        }
        document.getElementById('empty-state').classList.add('hidden');

        list.forEach((item, index) => {
            // Type formatting
            let typeLabel = item.request_type;
            let typeClass = 'bg-gray-100 text-gray-600';
            if(item.request_type === 'new_filling') { typeLabel = 'تعبئة'; typeClass = 'bg-blue-50 text-blue-600'; }
            if(item.request_type === 'change_water') { typeLabel = 'تبديل'; typeClass = 'bg-purple-50 text-purple-600'; }
            if(item.request_type === 'withdraw_tank') { typeLabel = 'سحب'; typeClass = 'bg-orange-50 text-orange-600'; }
            if(item.request_type === 'set_location') { typeLabel = 'موقع'; typeClass = 'bg-green-50 text-green-600'; }
            if(item.request_type === 'external_sale') { typeLabel = 'بيع خارجي'; typeClass = 'bg-pink-50 text-pink-600'; }

            let priceDisplay = 'مجاني';
            if (item.price > 0) priceDisplay = `${item.price.toLocaleString()}`;

            // Status Badge
            let statusLabel = '';
            let statusClass = '';
            switch(item.status) {
                case 'pending': statusLabel = 'معلق'; statusClass = 'bg-yellow-100 text-yellow-700'; break;
                case 'delivered': statusLabel = 'واصل'; statusClass = 'bg-cyan-100 text-cyan-700'; break;
                case 'finished': statusLabel = 'منتهي'; statusClass = 'bg-emerald-100 text-emerald-700'; break;
                default: statusLabel = item.status; statusClass = 'bg-gray-100 text-gray-600';
            }

            if (item.status === 'finished' && item.is_debt) {
                statusLabel = 'آجل (دين)';
                statusClass = 'bg-red-100 text-red-700';
            }

            const statusHtml = `<span class="px-2 py-1 rounded-md text-[10px] font-bold ${statusClass}">${statusLabel}</span>`;

            // Location Logic
            let locationHtml = '';
            const hasLocation = item.lat && item.lng;
            const isSetLocationRequest = item.request_type === 'set_location';
            
            if (isSetLocationRequest || !hasLocation) {
                locationHtml = `
                    <button class="btn-set-location w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors mx-auto" data-customer="${item.customer_id}" title="تحديث الموقع">
                        <i class="ph-bold ph-map-pin text-lg"></i>
                    </button>`;
            } else {
                locationHtml = `
                    <a href="https://waze.com/ul?ll=${item.lat},${item.lng}&navigate=yes" target="_blank" class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200 transition-colors mx-auto" title="Waze">
                        <i class="ph-fill ph-navigation-arrow text-lg"></i>
                    </a>`;
            }

            // Driver (Inline)
            let driverHtml = '';
            if (currentStatus === 'pending' || currentStatus === 'delivered') {
                const driversOptions = this.lookups.drivers ? this.lookups.drivers.map(d => 
                    `<option value="${d.id}" ${d.id === item.driver_id ? 'selected' : ''}>${d.name}</option>`
                ).join('') : '';
                
                driverHtml = `
                    <div class="flex items-center gap-1">
                        <select class="driver-select w-full bg-gray-50 border border-gray-200 rounded-lg text-[11px] py-1 px-1 outline-none focus:border-cyan-500" data-id="${item.id}">
                            ${driversOptions}
                        </select>
                        <button class="btn-save-driver w-6 h-6 bg-emerald-500 text-white rounded-md flex items-center justify-center hover:bg-emerald-600 shadow-sm flex-shrink-0" data-id="${item.id}" title="حفظ السائق">
                            <i class="ph-bold ph-check"></i>
                        </button>
                    </div>`;
            } else {
                driverHtml = `<span class="text-xs font-bold text-gray-600">${item.driver_name}</span>`;
            }

            // Date & Time (Editable)
            let dateValue = '';
            if (item.created_at) {
                const d = new Date(item.created_at);
                const offset = d.getTimezoneOffset() * 60000;
                dateValue = new Date(d.getTime() - offset).toISOString().slice(0, 16);
            }

            let dateHtml = '';
            if (currentStatus === 'pending' || currentStatus === 'delivered') {
                dateHtml = `
                    <div class="flex items-center gap-1 dir-ltr justify-center">
                        <input type="datetime-local" class="date-input w-32 bg-gray-50 border border-gray-200 rounded-lg text-[10px] py-1 px-1 outline-none focus:border-cyan-500 text-center" value="${dateValue}" data-id="${item.id}">
                        <button class="btn-save-date w-6 h-6 bg-emerald-500 text-white rounded-md flex items-center justify-center hover:bg-emerald-600 shadow-sm flex-shrink-0" data-id="${item.id}" title="حفظ التاريخ">
                            <i class="ph-bold ph-check"></i>
                        </button>
                    </div>`;
            } else {
                dateHtml = `
                    <div class="flex flex-col items-center">
                        <span class="dir-ltr font-mono text-xs text-gray-600 font-bold">${new Date(item.created_at).toLocaleDateString('ar-EG')}</span>
                        <span class="dir-ltr font-mono text-[10px] text-gray-400">${new Date(item.created_at).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>`;
            }

            // Capacity
            const capacityDisplay = item.tank_capacity || '-';

            // Checkbox for Debt
            const debtCheckbox = `
                <label class="flex items-center gap-1 cursor-pointer bg-red-50 px-2 py-1 rounded-lg border border-red-100 hover:bg-red-100 transition-colors">
                    <input type="checkbox" class="debt-checkbox w-3 h-3 text-red-600 rounded focus:ring-red-500 border-gray-300" data-id="${item.id}" ${item.is_debt ? 'checked' : ''}>
                    <span class="text-[10px] font-bold text-red-500">آجل</span>
                </label>
            `;

            // --- BIGGER ACTION BUTTONS ---
            let actionButtons = '';
            const deleteBtn = `
                <button class="btn-delete w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors" data-id="${item.id}" title="حذف">
                    <i class="ph-bold ph-trash text-lg"></i>
                </button>`;

            if (currentStatus === 'pending') {
                actionButtons = `
                    <div class="flex items-center gap-2">
                        ${debtCheckbox} 
                        <button class="btn-confirm-delivery py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95 text-xs" data-id="${item.id}" title="تأكيد التوصيل">
                            <i class="ph-bold ph-check text-base"></i>
                            <span>توصيل</span>
                        </button>
                        ${deleteBtn}
                    </div>
                `;
            } else if (currentStatus === 'delivered') {
                actionButtons = `
                    <div class="flex items-center gap-2">
                        ${debtCheckbox}
                        <button class="btn-confirm-finish py-2 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2 transition-transform active:scale-95 text-xs" data-id="${item.id}" title="إنهاء الطلب">
                            <i class="ph-bold ph-check-double text-base"></i>
                            <span>إنهاء</span>
                        </button>
                        ${deleteBtn}
                    </div>
                `;
            } else {
                 // Finished
                 actionButtons = `
                    <div class="flex items-center gap-2">
                        ${item.is_debt ? '<i class="ph-bold ph-warning-circle text-red-500" title="آجل"></i>' : '<i class="ph-fill ph-check-circle text-green-500 text-xl ml-2"></i>'}
                        ${deleteBtn}
                    </div>
                 `;
            }

            const area = item.area_name || '-';
            const addr = item.address_detail || '-';
            const hasExtraPhones = item.customer_phone2 || item.customer_phone3;
            
            const row = document.createElement('tr');
            row.className = 'table-row-anim border-b border-gray-50 hover:bg-gray-50/50';
            row.innerHTML = `
                <td class="p-4 font-bold text-gray-400">#${index + 1}</td>
                <td class="p-4 text-center"><span class="font-mono font-bold text-blue-600 text-lg">${item.tank_no}</span></td>
                <td class="p-4 text-center"><span class="font-bold text-gray-600 text-xs">${capacityDisplay}</span></td>
                <td class="p-4 font-bold text-gray-800 whitespace-nowrap text-xs">${item.customer_name}</td>
                <td class="p-4"><span class="font-bold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 text-[10px] whitespace-nowrap">${area}</span></td>
                <td class="p-4"><span class="text-[10px] text-gray-500 truncate block max-w-[150px]" title="${addr}">${addr}</span></td>
                <td class="p-4">
                    <div class="flex items-center gap-2">
                        <span class="font-mono dir-ltr text-gray-600 bg-blue-50 px-2 py-1 rounded text-[11px] text-blue-700 font-bold">${item.customer_phone}</span>
                        ${hasExtraPhones ? 
                            `<button class="btn-show-phones w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center hover:bg-purple-200 transition-colors shadow-sm" data-id="${item.id}"><i class="ph-bold ph-phone-plus text-xs"></i></button>` : ''}
                    </div>
                </td>
                <td class="p-4 text-center">
                    <div class="flex flex-col items-center gap-1">
                        <span class="${typeClass} px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap">${typeLabel}</span>
                        <span class="text-xs font-bold text-emerald-600">${priceDisplay}</span>
                    </div>
                </td>
                <td class="p-4 text-center">${statusHtml}</td>
                <td class="p-4">${driverHtml}</td>
                <td class="p-4 text-center">${dateHtml}</td>
                <td class="p-4 text-center">${locationHtml}</td>
                <td class="p-4 text-center">
                    ${actionButtons}
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    showError: function(t, m) { Swal.fire({icon:'error', title:t, text:m, confirmButtonText:'حسناً', confirmButtonColor:'#ef476f', customClass:{popup:'rounded-2xl'}}); },
    showSuccess: function(t, m) { Swal.fire({icon:'success', title:t, text:m, showConfirmButton:false, timer:1500, customClass:{popup:'rounded-2xl'}}); }
};