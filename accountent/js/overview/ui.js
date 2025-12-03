// accountent/js/overview/ui.js
export const OverviewUI = {
    
    renderStats: (containerId, statsData) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!statsData || statsData.length === 0) {
            container.innerHTML = `<div class="col-span-full text-center text-gray-400 py-8">لا توجد بيانات</div>`;
            return;
        }

        // Expanded Gradients Palette to handle 5+ cards
        const gradients = [
            { bg: 'bg-gradient-to-br from-cyan-400 to-sky-600', text: 'text-white', shadow: 'shadow-cyan-500/30' },      // Areas
            { bg: 'bg-gradient-to-br from-emerald-400 to-teal-600', text: 'text-white', shadow: 'shadow-emerald-500/30' }, // Tanks
            { bg: 'bg-gradient-to-br from-blue-500 to-indigo-600', text: 'text-white', shadow: 'shadow-blue-500/30' },     // Drivers
            { bg: 'bg-gradient-to-br from-violet-500 to-purple-600', text: 'text-white', shadow: 'shadow-violet-500/30' }, // Assistants
            { bg: 'bg-gradient-to-br from-amber-400 to-orange-600', text: 'text-white', shadow: 'shadow-amber-500/30' }    // Employees
        ];

        container.innerHTML = statsData.map((item, index) => {
            const style = gradients[index % gradients.length];
            
            return `
            <div class="relative bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300 group overflow-hidden">
                <div class="relative z-10 flex justify-between items-start">
                    <div>
                        <p class="text-sm text-gray-400 font-bold mb-1">${item.label}</p>
                        <h3 class="text-3xl font-bold text-gray-800 mb-1">${item.value}</h3>
                        <p class="text-[10px] text-gray-300 font-medium">${item.desc || ''}</p>
                    </div>
                    
                    <div class="w-12 h-12 rounded-2xl ${style.bg} flex items-center justify-center ${style.shadow} shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                        <i class="ph-fill ${item.icon} text-2xl ${style.text}"></i>
                    </div>
                </div>
                
                <!-- Decorative Circle -->
                <div class="absolute -bottom-6 -left-6 w-24 h-24 bg-gray-50 rounded-full z-0 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            </div>
            `;
        }).join('');
    },

    renderTanks: (containerId, tanksData) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!tanksData || tanksData.length === 0) {
            container.innerHTML = `<div class="col-span-2 text-center text-gray-400 py-8">لا توجد بيانات للخزانات</div>`;
            return;
        }

        const colors = ['#22d3ee', '#34d399', '#818cf8', '#fbbf24', '#f472b6'];

        container.innerHTML = tanksData.map((tank, index) => {
            const color = colors[index % colors.length];
            return `
            <div class="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                <div class="relative w-14 h-14 flex-shrink-0">
                    <div class="w-full h-full rounded-full flex items-center justify-center bg-gray-50"
                         style="background: conic-gradient(${color} ${tank.percentage}%, #f1f5f9 0%);">
                         <div class="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <span class="text-[10px] font-bold text-gray-700 dir-ltr">${tank.percentage}%</span>
                         </div>
                    </div>
                </div>
                
                <div class="flex-1">
                    <h4 class="text-sm font-bold text-gray-800">${tank.name}</h4>
                    <p class="text-xs text-gray-400 mt-0.5">${tank.count} مشترك</p>
                </div>

                <div class="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-cyan-50 group-hover:text-cyan-600 transition-colors">
                    <i class="ph-bold ph-caret-left"></i>
                </div>
            </div>
            `;
        }).join('');
    },

    renderAlerts: (containerId, alerts) => {
        // ... existing empty implementation or logic
    }
};