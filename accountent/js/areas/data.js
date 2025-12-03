// accountent/js/areas/data.js
import { AuthService } from '../../../Settings/auth.js'; 

const supabase = AuthService.db;
const TABLE = 'areas';

export const AreasData = { 
    
    subscription: null,
    refreshTimer: null,
    onDataChange: null,

    // Centralized Init
    init: function(onDataChangedCallback) {
        if (!supabase) return;
        
        this.onDataChange = onDataChangedCallback;

        this.fetchAllData().then(data => onDataChangedCallback(data));
        this.subscribeToChanges(onDataChangedCallback);
    },

    // Manual Refresh
    refresh: async function() {
        if (this.onDataChange) {
            const data = await this.fetchAllData();
            this.onDataChange(data);
        }
    },

    // Combined Fetcher
    fetchAllData: async function() {
        try {
            const [areas, drivers] = await Promise.all([
                this.fetchAreas(),
                this.fetchDrivers()
            ]);
            return { areas, drivers };
        } catch (error) {
            console.error("Fetch All Error:", error);
            return { areas: [], drivers: [] };
        }
    },

    // Realtime Debounce
    debouncedRefresh: function(callback) {
        if (this.refreshTimer) clearTimeout(this.refreshTimer);
        this.refreshTimer = setTimeout(async () => {
            const data = await this.fetchAllData();
            callback(data);
        }, 500); 
    },

    subscribeToChanges: function(callback) {
        if (this.subscription) supabase.removeChannel(this.subscription);
        
        this.subscription = supabase
            .channel('areas-page-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => this.debouncedRefresh(callback))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => this.debouncedRefresh(callback))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, () => this.debouncedRefresh(callback))
            .subscribe();
    },

    fetchAreas: async function() {
        if (!supabase) return [];
        try {
            // 1. Fetch Areas
            const { data: areas, error } = await supabase
                .from(TABLE)
                .select(`*, drivers ( id, name )`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // 2. Scalable Customer Counting (Optimized)
            const areasWithCounts = await Promise.all(areas.map(async (area) => {
                const { count } = await supabase
                    .from('customers')
                    .select('*', { count: 'exact', head: true })
                    .eq('area_id', area.id);
                
                return {
                    ...area,
                    customer_count: count || 0,
                    driver_name: area.drivers ? area.drivers.name : '-'
                };
            }));

            return areasWithCounts;

        } catch (error) {
            console.error("Error Fetching Areas:", error);
            return [];
        }
    },

    // --- Smart Profile Fetch (ID Match -> Fallback) ---
    fetchUserProfile: async function() {
        if (!supabase) return null;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            let profile = null;

            if (user) {
                // Try ID Match first
                const { data } = await supabase
                    .from('drivers')
                    .select('name, role, photo_url') 
                    .eq('id', user.id)
                    .maybeSingle();
                if (data) profile = data;
            }

            if (!profile) {
                // Fallback to finding an employee
                const { data } = await supabase
                    .from('drivers')
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

    fetchDrivers: async function() {
        const { data } = await supabase
            .from('drivers')
            .select('id, name')
            .eq('role', 'driver')
            .eq('is_active', true);
        return data || [];
    },

    // UPDATED: Now supports creator name
    addArea: async function(payload) {
        // If creator name isn't passed, try to fetch it
        if (!payload.created_by_name) {
            const user = await this.fetchUserProfile();
            if (user && user.name) {
                payload.created_by_name = user.name;
            }
        }
        
        const { error } = await supabase.from(TABLE).insert([payload]);
        if (error) throw error;
    },

    updateArea: async function(id, payload) {
        const { error } = await supabase.from(TABLE).update(payload).eq('id', id);
        if (error) throw error;
    },

    deleteArea: async function(id) {
        const { error } = await supabase.from(TABLE).delete().eq('id', id);
        if (error) {
            if (error.code === '23503') throw new Error("لا يمكن حذف المنطقة لأنها تحتوي على زبائن.");
            throw error;
        }
    }
};