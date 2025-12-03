// accountent/js/overview/data.js
import { AuthService } from '../../../Settings/auth.js'; 

const supabase = AuthService.db;

export const OverviewData = {
    
    subscription: null,

    init: async function(onUpdateCallback) {
        if (!supabase) return;

        // Initial Fetch
        const data = await this.fetchAllData();
        onUpdateCallback(data);

        if (this.subscription) supabase.removeChannel(this.subscription);

        // Realtime Subscription
        this.subscription = supabase
            .channel('overview-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tank_types' }, () => this.refresh(onUpdateCallback))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => this.refresh(onUpdateCallback))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, () => this.refresh(onUpdateCallback))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'areas' }, () => this.refresh(onUpdateCallback))
            .subscribe();
    },

    refresh: async function(callback) {
        const data = await this.fetchAllData();
        callback(data);
    },

    fetchAllData: async function() {
        try {
            const [stats, tanks] = await Promise.all([
                this.fetchStats(),
                this.fetchTankLevels()
            ]);
            
            return { stats, tanks, alerts: [] };
        } catch (error) {
            console.error("Overview Data Error:", error);
            return { stats: [], tanks: [], alerts: [] };
        }
    },

    fetchStats: async function() {
        try {
            // 1. Fetch Active Areas Count
            const { count: areaCount } = await supabase
                .from('areas')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            // 2. Fetch Active Tank Types Count
            const { count: tankCount } = await supabase
                .from('tank_types')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            // 3. Fetch ALL Active Staff (Drivers, Assistants, Employees)
            const { data: staff } = await supabase
                .from('drivers')
                .select('role')
                .eq('is_active', true);

            // Count them manually
            let drivers = 0;
            let assistants = 0;
            let employees = 0;

            if (staff) {
                staff.forEach(person => {
                    if (person.role === 'driver') drivers++;
                    else if (person.role === 'assistant') assistants++;
                    else if (person.role === 'employee') employees++;
                });
            }

            // Return Array of Stat Objects (Now with 3 separate cards for staff)
            return [
                { 
                    id: 'areas', 
                    label: 'المناطق النشطة', 
                    value: areaCount || 0, 
                    icon: 'ph-map-pin',
                    desc: 'تغطية التوزيع'
                },
                { 
                    id: 'tanks', 
                    label: 'أنواع الخزانات', 
                    value: tankCount || 0, 
                    icon: 'ph-cylinder',
                    desc: 'أنواع متوفرة'
                },
                { 
                    id: 'drivers', 
                    label: 'السائقين', 
                    value: drivers, 
                    icon: 'ph-steering-wheel', // Driver Icon
                    desc: 'سائق نشط'
                },
                { 
                    id: 'assistants', 
                    label: 'المساعدين', 
                    value: assistants, 
                    icon: 'ph-handshake', // Assistant Icon
                    desc: 'مساعد نشط'
                },
                { 
                    id: 'employees', 
                    label: 'الموظفين', 
                    value: employees, 
                    icon: 'ph-briefcase', // Employee Icon
                    desc: 'كادر إداري/فني'
                }
            ];

        } catch (error) {
            console.error("Stats Error:", error);
            return [];
        }
    },

    fetchTankLevels: async function() {
        try {
            // Get Active Tanks
            const { data: tanks } = await supabase
                .from('tank_types')
                .select('id, name')
                .eq('is_active', true)
                .order('created_at', { ascending: true });

            if (!tanks || tanks.length === 0) return [];

            // Get Customers to calculate distribution
            const { data: customers } = await supabase.from('customers').select('tank_id');
            
            const counts = {};
            const total = customers ? customers.length : 0;

            if (customers) {
                customers.forEach(c => {
                    if(c.tank_id) counts[c.tank_id] = (counts[c.tank_id] || 0) + 1;
                });
            }

            return tanks.map(t => ({
                name: t.name,
                count: counts[t.id] || 0,
                percentage: total > 0 ? Math.round(((counts[t.id] || 0) / total) * 100) : 0
            }));
        } catch (error) {
            console.error("Tank Levels Error:", error);
            return [];
        }
    }
};