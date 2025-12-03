// accountent/js/tanks/data.js
import { AuthService } from '../../../Settings/auth.js'; 

const supabase = AuthService.db;
const TABLE_NAME = 'tank_types'; 

export const TanksData = { 
    subscription: null,
    refreshTimer: null, // NEW: Timer for stability

    init: function(onDataChangedCallback) {
        if (!supabase) return;
        this.fetchTanks(onDataChangedCallback);
        this.subscribeToChanges(onDataChangedCallback);
    },

    fetchTanks: async function(callback) {
        try {
            // 1. Fetch Tanks
            const { data: tanks, error } = await supabase
                .from(TABLE_NAME)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            // 2. Scalable Counting
            const tankPromises = tanks.map(async (tank) => {
                const { count } = await supabase
                    .from('customers')
                    .select('*', { count: 'exact', head: true }) 
                    .eq('tank_id', tank.id);
                
                return {
                    ...tank,
                    customer_count: count || 0
                };
            });

            this.localCache = await Promise.all(tankPromises);
            
            callback(this.localCache);

        } catch (error) {
            console.error("Fetch Error:", error);
            if (typeof Swal !== 'undefined') Swal.fire('خطأ', error.message, 'error');
        }
    },

    // NEW: Debounce Logic (Prevents flickering)
    debouncedRefresh: function(callback) {
        if (this.refreshTimer) clearTimeout(this.refreshTimer);
        this.refreshTimer = setTimeout(() => {
            this.fetchTanks(callback);
        }, 500); 
    },

    subscribeToChanges: function(callback) {
        if (this.subscription) supabase.removeChannel(this.subscription);
        
        // UPDATED: Now calls debouncedRefresh instead of fetchTanks directly
        this.subscription = supabase
            .channel('tanks-page-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: TABLE_NAME }, () => this.debouncedRefresh(callback))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => this.debouncedRefresh(callback))
            .subscribe();
    },

    fetchUserProfile: async function() {
        if (!supabase) return null;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            let profile = null;

            if (user) {
                const { data } = await supabase
                    .from('drivers')
                    .select('name, role, photo_url') 
                    .eq('id', user.id)
                    .maybeSingle();
                if (data) profile = data;
            }

            if (!profile) {
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

    // ... Keep existing helper functions ...
    getCustomersByTankId: async function(tankId) {
        const { data, error } = await supabase
            .from('customers')
            .select('id, name, phone, address')
            .eq('tank_id', tankId);
        if (error) throw error;
        return data || [];
    },

    addTank: async function(tankData) {
        const { data, error } = await supabase.from(TABLE_NAME).insert([tankData]).select();
        if (error) throw error;
        return data;
    },

    updateTank: async function(id, updateData) {
        const { error } = await supabase.from(TABLE_NAME).update(updateData).eq('id', id);
        if (error) throw error;
    },

    deleteTank: async function(id) {
        const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);
        if (error) {
            if (error.code === '23503') {
                throw new Error("لا يمكن حذف هذا النوع لأنه مرتبط بزبائن مسجلين.");
            }
            throw error;
        }
    },

    getTankById: function(id) {
        return this.localCache.find(t => t.id == id);
    }
};