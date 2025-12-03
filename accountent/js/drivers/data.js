// accountent/js/drivers/data.js
import { AuthService } from '../../../Settings/auth.js'; 

const supabase = AuthService.db;
const DRIVERS_TABLE = 'drivers'; 
const CARS_TABLE = 'cars'; 
const TANKS_TABLE = 'tank_types';
const AREAS_TABLE = 'areas';

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

    // UPDATED: Fetch name, color, and note
    fetchCars: async function() {
        if (!supabase) return [];
        try {
            const { data, error } = await supabase
                .from(CARS_TABLE)
                .select('id, name, color, note') // Added color and note here
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