// accountent/js/drivers/data.js
import { AuthService } from '../../../Settings/auth.js'; 

const supabase = AuthService.db;
const DRIVERS_TABLE = 'drivers'; 
const CARS_TABLE = 'cars'; 
const TANKS_TABLE = 'tank_types';
const AREAS_TABLE = 'areas';
const BUCKET_PROFILES = 'user-profiles';

export const DriversData = { 
    
    subscription: null,
    refreshTimer: null,
    onDataChange: null, // NEW: Store callback for manual refresh

    init: function(onDataChangedCallback) {
        if (!supabase) return;
        
        // Save the callback
        this.onDataChange = onDataChangedCallback;

        // Initial Fetch
        this.fetchAllData().then(data => onDataChangedCallback(data));
        
        // Realtime
        this.subscribeToChanges(onDataChangedCallback);
    },

    // NEW: Manual Refresh Function
    refresh: async function() {
        if (this.onDataChange) {
            const data = await this.fetchAllData();
            this.onDataChange(data);
        }
    },

    fetchAllData: async function() {
        try {
            const [drivers, tanks, cars] = await Promise.all([
                this.fetchDrivers(),
                this.fetchTankTypes(),
                this.fetchCars()
            ]);
            return { drivers, tanks, cars };
        } catch (error) {
            console.error("Fetch All Data Error:", error);
            return { drivers: [], tanks: [], cars: [] };
        }
    },

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
            .channel('drivers-page-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: DRIVERS_TABLE }, () => this.debouncedRefresh(callback))
            .on('postgres_changes', { event: '*', schema: 'public', table: CARS_TABLE }, () => this.debouncedRefresh(callback))
            .on('postgres_changes', { event: '*', schema: 'public', table: TANKS_TABLE }, () => this.debouncedRefresh(callback))
            .subscribe();
    },

    fetchDrivers: async function() {
        if (!supabase) return [];
        try {
            const { data: drivers, error: driversError } = await supabase
                .from(DRIVERS_TABLE)
                .select('*')
                .order('created_at', { ascending: false });

            if (driversError) throw driversError;

            // Scalable Area Counting
            const driversWithCounts = await Promise.all(drivers.map(async (d) => {
                const { count } = await supabase
                    .from(AREAS_TABLE)
                    .select('*', { count: 'exact', head: true })
                    .eq('driver_id', d.id);
                
                return {
                    ...d,
                    area_count: count || 0
                };
            }));

            return driversWithCounts;

        } catch (error) {
            console.error("Fetch Drivers Error:", error);
            return [];
        }
    },

    fetchUserProfile: async function() {
        if (!supabase) return null;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            let profile = null;

            if (user) {
                const { data } = await supabase
                    .from(DRIVERS_TABLE)
                    .select('name, role, photo_url') 
                    .eq('id', user.id)
                    .maybeSingle();
                if (data) profile = data;
            }

            if (!profile) {
                const { data } = await supabase
                    .from(DRIVERS_TABLE)
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

    uploadProfileImage: async function(file) {
        if (!file) return null;
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `profile-${Date.now()}.${fileExt}`;

            const { data, error } = await supabase.storage
                .from(BUCKET_PROFILES)
                .upload(fileName, file, { cacheControl: '3600', upsert: false });

            if (error) {
                if (error.message.includes('row-level security')) {
                    throw new Error("يرجى تفعيل Policies في الـ Storage");
                }
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
    }
};