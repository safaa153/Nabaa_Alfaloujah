// accountent/js/tanks/data.js
import { AuthService } from '../../../Settings/auth.js'; 

const supabase = AuthService.db;
const TABLE_NAME = 'tank_types'; 

export const TanksData = { 
    subscription: null,
    localCache: [],

    init: function(onDataChangedCallback) {
        if (!supabase) return;
        this.fetchTanks(onDataChangedCallback);
        this.subscribeToChanges(onDataChangedCallback);
    },

    fetchTanks: async function(callback) {
        try {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            const counts = await this.getCustomerCounts();

            this.localCache = data.map(tank => ({
                ...tank,
                customer_count: counts[tank.id] || 0
            }));
            
            callback(this.localCache);

        } catch (error) {
            console.error("Fetch Error:", error);
            if (typeof Swal !== 'undefined') Swal.fire('خطأ', error.message, 'error');
        }
    },

    getCustomerCounts: async function() {
        // FIXED: Changed tank_id to tank_type_id
        const { data } = await supabase.from('customers').select('tank_type_id');
        const counts = {};
        if(data) {
            data.forEach(c => {
                if(c.tank_type_id) counts[c.tank_type_id] = (counts[c.tank_type_id] || 0) + 1;
            });
        }
        return counts;
    },

    // NEW: Get Customers by Tank ID for Modal
    getCustomersByTankId: async function(tankId) {
        if (!supabase) return [];
        // FIXED: Changed tank_id to tank_type_id
        const { data, error } = await supabase
            .from('customers')
            .select('id, name, phone, address')
            .eq('tank_type_id', tankId);
        
        if (error) throw error;
        return data || [];
    },

    // User Profile
    fetchUserProfile: async function() {
        if (!supabase) return null;
        try {
            const { data, error } = await supabase
                .from('drivers')
                .select('name, job_title, photo_url')
                .eq('job_title', 'محاسب')
                .limit(1)
                .maybeSingle();
            return data;
        } catch (error) { return null; }
    },

    subscribeToChanges: function(callback) {
        if (this.subscription) supabase.removeChannel(this.subscription);
        this.subscription = supabase
            .channel('tanks-page-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: TABLE_NAME }, () => this.fetchTanks(callback))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => this.fetchTanks(callback))
            .subscribe();
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