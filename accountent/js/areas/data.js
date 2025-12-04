// accountent/js/areas/data.js
import { AuthService } from '../../../Settings/auth.js'; 

const supabase = AuthService.db;
const TABLE = 'areas';

export const AreasData = { 
    
    fetchAreas: async function() {
        if (!supabase) return [];
        try {
            const { data, error } = await supabase
                .from(TABLE)
                .select(`
                    *,
                    drivers ( id, name ) 
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Get customer counts per area
            const counts = await this.getCustomerCounts();
            
            return data.map(area => ({
                ...area,
                customer_count: counts[area.id] || 0,
                driver_name: area.drivers ? area.drivers.name : '-'
            }));

        } catch (error) {
            console.error("Error:", error);
            return [];
        }
    },

    // NEW: Get Customers for a specific Area
    getCustomersByAreaId: async function(areaId) {
        const { data, error } = await supabase
            .from('customers')
            .select('id, name, phone, address')
            .eq('area_id', areaId);
        
        if (error) throw error;
        return data || [];
    },

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

    getCustomerCounts: async function() {
        const { data } = await supabase.from('customers').select('area_id');
        const counts = {};
        if(data) {
            data.forEach(c => {
                if(c.area_id) counts[c.area_id] = (counts[c.area_id] || 0) + 1;
            });
        }
        return counts;
    },

    fetchDrivers: async function() {
        const { data } = await supabase
            .from('drivers')
            .select('id, name')
            .eq('role', 'driver')
            .eq('is_active', true);
        return data || [];
    },

    addArea: async function(payload) {
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