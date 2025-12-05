// Settings/sidebar.js
export const Sidebar = {
    menuItems: [
        { id: 'overview', label: 'الرئيسية', icon: 'ph-house', link: 'overview.html' },
        { id: 'tanks',    label: 'الخزانات', icon: 'ph-cylinder', link: 'tanks.html' },
        { id: 'drivers',  label: 'السائقين', icon: 'ph-truck', link: 'drivers.html' },
        { id: 'cars',     label: 'السيارات', icon: 'ph-car', link: 'cars.html' },
        { id: 'regions',  label: 'المناطق',   icon: 'ph-map-pin', link: 'areas.html' },
        { id: 'customers',label: 'الزبائن',   icon: 'ph-users', link: 'customers.html' },
        { id: 'late',     label: 'الزبائن المتأخرين', icon: 'ph-clock-counter-clockwise', link: '#' },
        { id: 'orders',   label: 'الطلبات',   icon: 'ph-clipboard-text', link: 'requests.html' },
        { id: 'debts',    label: 'الديون',    icon: 'ph-currency-dollar', link: 'debts.html' },
        { id: 'blocked',  label: 'المحظورين', icon: 'ph-prohibit', link: '#' },
        { id: 'history',  label: 'تاريخ الخزانات', icon: 'ph-clock', link: '#' },
        { id: 'finance',  label: 'الإدارة المالية', icon: 'ph-chart-line-up', link: '#' },
        { id: 'tracking', label: 'تتبع السائقين', icon: 'ph-crosshair', link: '#' },
    ],

    render: function(activePageId) {
        const navContainer = document.getElementById('sidebar-nav');
        if (!navContainer) return;

        navContainer.innerHTML = this.menuItems.map(item => {
            const isActive = item.id === activePageId;
            const activeClass = isActive ? 'active' : '';
            
            return `
                <a href="${item.link}" class="nav-link ${activeClass}">
                    <i class="ph ${item.icon} text-xl"></i>
                    <span>${item.label}</span>
                </a>
            `;
        }).join('');
    },

    initToggle: function() {
        const toggleBtn = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('main-sidebar');
        
        if (!toggleBtn || !sidebar) return;

        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('w-64');
            sidebar.classList.toggle('w-20');
            sidebar.classList.toggle('collapsed-mode');
        });
    }
};