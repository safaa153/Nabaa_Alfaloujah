// accountent/js/overview/data.js
import { AuthService } from '../../../Settings/auth.js'; 

const supabase = AuthService.db;

export const OverviewData = {
    
    subscription: null,
    refreshTimer: null,

    init: async function(onUpdateCallback) {
        if (!supabase) return;

        // Initial Fetch
        const data = await this.fetchAllData();
        onUpdateCallback(data);

        if (this.subscription) supabase.removeChannel(this.subscription);

        // Realtime Subscription with Debounce
        this.subscription = supabase
            .channel('overview-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tank_types' }, () => this.debouncedRefresh(onUpdateCallback))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => this.debouncedRefresh(onUpdateCallback))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, () => this.debouncedRefresh(onUpdateCallback))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'areas' }, () => this.debouncedRefresh(onUpdateCallback))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'cars' }, () => this.debouncedRefresh(onUpdateCallback))
            .subscribe();
    },

    debouncedRefresh: function(callback) {
        if (this.refreshTimer) clearTimeout(this.refreshTimer);
        this.refreshTimer = setTimeout(async () => {
            const data = await this.fetchAllData();
            callback(data);
        }, 500); 
    },

    refresh: async function(callback) {
        const data = await this.fetchAllData();
        callback(data);
    },

    // --- FIXED: Fetch 'photo_url' directly from column (Overview Page) ---
    fetchUserProfile: async function() {
        if (!supabase) return null;
        try {
            // 1. Get Logged-in User ID
            const { data: { user } } = await supabase.auth.getUser();
            
            let profile = null;

            if (user) {
                // 2. Try Primary Match: User ID matches Driver ID
                const { data } = await supabase
                    .from('drivers')
                    // UPDATED: Selecting photo_url directly
                    .select('name, role, photo_url') 
                    .eq('id', user.id)
                    .maybeSingle();
                
                if (data) profile = data;
            }

            // 3. Fallback: If ID match failed, find the first 'employee'
            if (!profile) {
                const { data } = await supabase
                    .from('drivers')
                    // UPDATED: Selecting photo_url directly
                    .select('name, role, photo_url')
                    .eq('role', 'employee') 
                    .limit(1)
                    .maybeSingle();
                profile = data;
            }

            if (!profile) return null;

            return {
                name: profile.name,
                job_title: this.translateRole(profile.role),
                // UPDATED: No longer checking details.photo_url
                photo_url: profile.photo_url || null
            };

        } catch (error) {
            console.error("Fetch Profile Error:", error);
            return null;
        }
    },

    translateRole: function(role) {
        if (!role) return 'المسؤول';
        const r = role.toLowerCase().trim();
        if (r === 'employee') return 'محاسب / إداري';
        if (r === 'driver') return 'سائق';
        if (r === 'assistant') return 'مساعد';
        if (r === 'manager') return 'المدير';
        if (r === 'admin') return 'المسؤول';
        return role;
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
            // 1. Fetch Active Areas
            const { count: areaCount } = await supabase
                .from('areas')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            // 2. Fetch Active Tank Types
            const { count: tankCount } = await supabase
                .from('tank_types')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            // 3. Fetch Cars
            const { count: carCount } = await supabase
                .from('cars')
                .select('*', { count: 'exact', head: true });

            // 4. Fetch Staff Stats
            const { data: staff } = await supabase
                .from('drivers')
                .select('role')
                .eq('is_active', true);

            let drivers = 0;
            let assistants = 0;
            let employees = 0;

            if (staff) {
                staff.forEach(person => {
                    const role = person.role ? person.role.toLowerCase() : '';
                    if (role === 'driver') drivers++;
                    else if (role === 'assistant') assistants++;
                    else if (role === 'employee') employees++;
                });
            }

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
                    id: 'cars', 
                    label: 'السيارات', 
                    value: carCount || 0, 
                    icon: 'ph-truck', 
                    desc: 'مركبة بالخدمة'
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

            const tankPromises = tanks.map(async (t) => {
                const { count } = await supabase
                    .from('customers')
                    .select('*', { count: 'exact', head: true })
                    .eq('tank_id', t.id);
                
                return {
                    name: t.name,
                    count: count || 0
                };
            });

            const results = await Promise.all(tankPromises);
            
            const total = results.reduce((sum, t) => sum + t.count, 0);

            return results.map(t => ({
                ...t,
                percentage: total > 0 ? Math.round((t.count / total) * 100) : 0
            }));

        } catch (error) {
            console.error("Tank Levels Error:", error);
            return [];
        }
    }
};