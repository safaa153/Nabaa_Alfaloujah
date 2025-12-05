export const DebtsUI = {
    get tableBody() { return document.getElementById('debts-table-body'); },
    get totalLabel() { return document.getElementById('total-debts-sum'); },

    renderTable: function(list) {
        const tbody = this.tableBody;
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!list || list.length === 0) {
            document.getElementById('empty-state').classList.remove('hidden');
            this.totalLabel.innerText = '0';
            return;
        }
        document.getElementById('empty-state').classList.add('hidden');

        // Calculate Grand Total
        const grandTotal = list.reduce((sum, item) => sum + item.total_debt, 0);
        this.totalLabel.innerText = grandTotal.toLocaleString();

        list.forEach((item, index) => {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-50 hover:bg-gray-50/50 transition-colors group';
            
            const area = item.area_name || '-';
            const address = item.address || '-';
            const tankType = item.tank_type || '-';
            const dateStr = item.oldest_date ? new Date(item.oldest_date).toLocaleDateString('ar-EG') : '-';
            
            // Waze Button
            let locationHtml = '<span class="text-xs text-gray-300">-</span>';
            if (item.lat && item.lng) {
                locationHtml = `
                    <a href="https://waze.com/ul?ll=${item.lat},${item.lng}&navigate=yes" target="_blank" 
                       class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200 transition-colors mx-auto shadow-sm" title="Waze">
                        <i class="ph-fill ph-navigation-arrow text-lg"></i>
                    </a>`;
            }

            // Extra Phones Logic
            const hasExtraPhones = item.phone2 || item.phone3;
            let phonesHtml = `
                <div class="flex items-center gap-2">
                    <span class="font-mono dir-ltr text-gray-600 bg-blue-50 px-2 py-1 rounded text-[11px] text-blue-700 font-bold">${item.phone || '-'}</span>
                    ${hasExtraPhones ? 
                        `<button class="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center hover:bg-purple-200 transition-colors shadow-sm" 
                            onclick="Swal.fire({title: 'أرقام إضافية', html: '${item.phone2 || ''}<br>${item.phone3 || ''}', confirmButtonText: 'حسناً'})"
                            title="أرقام أخرى">
                            <i class="ph-bold ph-phone-plus text-xs"></i>
                        </button>` 
                        : ''}
                </div>`;

            // Row Content
            row.innerHTML = `
                <td class="p-4 font-bold text-gray-400 text-center">#${index + 1}</td>
                
                <td class="p-4">
                    <span class="font-mono font-bold text-blue-600 text-lg">${item.tank_no || '-'}</span>
                </td>
                
                <td class="p-4">
                    <span class="font-bold text-gray-800 text-sm whitespace-nowrap">${item.customer_name}</span>
                </td>

                <td class="p-4 text-center">
                    <span class="font-bold text-gray-600 text-xs">${tankType}</span>
                </td>
                
                <td class="p-4">
                    <span class="font-bold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 text-[10px] whitespace-nowrap">${area}</span>
                </td>

                <td class="p-4">
                    <span class="text-[11px] text-gray-500 block max-w-[200px] truncate" title="${address}">${address}</span>
                </td>

                <td class="p-4 text-center">
                    ${locationHtml}
                </td>

                <td class="p-4">
                    ${phonesHtml}
                </td>
                
                <td class="p-4 text-center">
                    <span class="font-mono text-xs text-gray-500 dir-ltr bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 whitespace-nowrap">${dateStr}</span>
                </td>

                <td class="p-4 text-center">
                    <span class="font-bold text-red-600 text-sm whitespace-nowrap">${item.total_debt.toLocaleString()}</span>
                </td>

                <td class="p-4 text-center">
                    <button class="btn-pay py-1.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 mx-auto transition-transform active:scale-95 text-xs whitespace-nowrap" 
                        data-id="${item.customer_id}" 
                        data-name="${item.customer_name}"
                        data-debt="${item.total_debt}">
                        <i class="ph-bold ph-hand-coins text-sm"></i>
                        <span>تسديد</span>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    showError: function(t, m) { Swal.fire({icon:'error', title:t, text:m, confirmButtonText:'حسناً', confirmButtonColor:'#ef476f'}); },
    showSuccess: function(t, m) { Swal.fire({icon:'success', title:t, text:m, showConfirmButton:false, timer:1500}); }
};