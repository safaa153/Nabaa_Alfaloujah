// accountent/js/drivers/data.js
import { AuthService } from '../../../Settings/auth.js'; 

const supabase = AuthService.db;
const DRIVERS_TABLE = 'drivers'; 
const CARS_TABLE = 'cars'; 
const TANKS_TABLE = 'tank_types';
const AREAS_TABLE = 'areas';
const BUCKET_PROFILES = 'user-profiles';

export const DriversData = { 
    
    fetchDrivers: async function() {
        if (!supabase) return [];
        try {
            const { data: drivers, error: driversError } = await supabase
                .from(DRIVERS_TABLE)
                .select('*')
                .order('created_at', { ascending: false });

            if (driversError) throw driversError;

            const { data: areas, error: areasError } = await supabase
                .from(AREAS_TABLE)
                .select('driver_id');

            const areaCounts = {};
            if (!areasError && areas) {
                areas.forEach(a => {
                    if (a.driver_id) {
                        areaCounts[a.driver_id] = (areaCounts[a.driver_id] || 0) + 1;
                    }
                });
            }

            return drivers.map(d => ({
                ...d,
                area_count: areaCounts[d.id] || 0
            }));

        } catch (error) {
            console.error("Fetch Drivers Error:", error);
            return [];
        }
    },

    // NEW: Get Customers for a specific driver (with Area Name)
    getCustomersByDriverId: async function(driverId) {
        const { data, error } = await supabase
            .from('customers')
            .select(`
                id, 
                name, 
                phone, 
                address,
                areas ( id, name )
            `)
            .eq('driver_id', driverId);
        
        if (error) throw error;
        return data || [];
    },

    fetchUserProfile: async function() {
        if (!supabase) return null;
        try {
            const { data, error } = await supabase
                .from(DRIVERS_TABLE)
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

    uploadProfileImage: async function(file) {
        if (!file) return null;
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `profile-${Date.now()}.${fileExt}`;

            const { data, error } = await supabase.storage
                .from(BUCKET_PROFILES)
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error("Profile Upload Error:", error);
                throw error;
            }

            const { data: { publicUrl } } = supabase.storage
                .from(BUCKET_PROFILES)
                .getPublicUrl(fileName);

            return publicUrl;
        } catch (error) {
            throw error;
        }
    },

    fetchCars: async function() {
        if (!supabase) return [];
        try {
            const { data, error } = await supabase
                .from(CARS_TABLE)
                .select('id, name, color, note')
                .order('name', { ascending: true });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Fetch Cars Error:", error);
            return [];
        }
    },

    getAreasByDriverId: async function(driverId) {
        const { data, error } = await supabase
            .from(AREAS_TABLE)
            .select('id, name')
            .eq('driver_id', driverId);
        
        if (error) throw error;
        return data || [];
    },

    fetchTankTypes: async function() {
        if (!supabase) return [];
        try {
            const { data, error } = await supabase
                .from(TANKS_TABLE)
                .select('id, name')
                .eq('is_active', true);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Fetch Tanks Error:", error);
            return [];
        }
    },

    addDriver: async function(payload) {
        const { data, error } = await supabase.from(DRIVERS_TABLE).insert([payload]).select();
        if (error) throw error;
        return data;
    },

    updateDriver: async function(id, payload) {
        const { error } = await supabase.from(DRIVERS_TABLE).update(payload).eq('id', id);
        if (error) throw error;
    },

    deleteDriver: async function(id) {
        const { error } = await supabase.from(DRIVERS_TABLE).delete().eq('id', id);
        if (error) throw error;
    },

    getDriverById: function(list, id) {
        return list.find(d => d.id == id);
    }
};