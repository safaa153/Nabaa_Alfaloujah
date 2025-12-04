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

    // Fetch Full User Profile (Accountant)
    fetchUserProfile: async function() {
        if (!supabase) return null;
        try {
            const { data, error } = await supabase
                .from('drivers')
                .select('name, job_title, photo_url')
                .eq('job_title', 'محاسب')
                .limit(1)
                .maybeSingle();
            
            if (error) return null;
            return data;
        } catch (error) {
            console.error("Fetch Profile Error:", error);
            return null;
        }
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
            // 1. Fetch Total Customers Count
            const { count: customerCount } = await supabase
                .from('customers')
                .select('*', { count: 'exact', head: true });

            // 2. Fetch Active Areas Count
            const { count: areaCount } = await supabase
                .from('areas')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            // 3. Fetch Active Tank Types Count
            const { count: tankCount } = await supabase
                .from('tank_types')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            // 4. Fetch ALL Active Staff
            const { data: staff } = await supabase
                .from('drivers')
                .select('role')
                .eq('is_active', true);

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

            // Return Array of 6 Stat Objects
            return [
                { 
                    id: 'customers', 
                    label: 'إجمالي الزبائن', 
                    value: customerCount || 0, 
                    icon: 'ph-users-three', // Distinct Icon
                    desc: 'مشترك مسجل'
                },
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
                    icon: 'ph-steering-wheel', 
                    desc: 'سائق نشط'
                },
                { 
                    id: 'assistants', 
                    label: 'المساعدين', 
                    value: assistants, 
                    icon: 'ph-handshake', 
                    desc: 'مساعد نشط'
                },
                { 
                    id: 'employees', 
                    label: 'الموظفين', 
                    value: employees, 
                    icon: 'ph-briefcase', 
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
            const { data: tanks } = await supabase
                .from('tank_types')
                .select('id, name')
                .eq('is_active', true)
                .order('created_at', { ascending: true });

            if (!tanks || tanks.length === 0) return [];

            // FIXED: Changed 'tank_id' to 'tank_type_id'
            const { data: customers } = await supabase.from('customers').select('tank_type_id');
            
            const counts = {};
            const total = customers ? customers.length : 0;

            if (customers) {
                customers.forEach(c => {
                    // FIXED: Using tank_type_id to count
                    if(c.tank_type_id) counts[c.tank_type_id] = (counts[c.tank_type_id] || 0) + 1;
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