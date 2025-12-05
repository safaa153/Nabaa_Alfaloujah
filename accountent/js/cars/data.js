// accountent/js/cars/data.js
import { AuthService } from '../../../Settings/auth.js'; 

const supabase = AuthService.db;
const CARS_TABLE = 'cars';
const BUCKET_NAME = 'car-photos'; 

export const CarsData = { 
    
    subscription: null,
    refreshTimer: null,
    onDataChange: null,

    init: function(onDataChangedCallback) {
        if (!supabase) return;
        this.onDataChange = onDataChangedCallback; 
        this.fetchAllData().then(data => onDataChangedCallback(data));
        this.subscribeToChanges(onDataChangedCallback);
    },

    refresh: async function() {
        if (this.onDataChange) {
            const data = await this.fetchAllData();
            this.onDataChange(data);
        }
    },

    fetchAllData: async function() {
        try {
            const [cars, drivers] = await Promise.all([
                this.fetchCars(),
                this.fetchDrivers()
            ]);
            
            const driversMap = {};
            drivers.forEach(d => { driversMap[d.id] = d.name; });

            const mergedCars = cars.map(car => ({
                ...car,
                driver_name: driversMap[car.driver_id] || 'غير محدد'
            }));

            return { cars: mergedCars, drivers };
        } catch (error) {
            console.error("Fetch All Error:", error);
            return { cars: [], drivers: [] };
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
            .channel('cars-page-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: CARS_TABLE }, () => this.debouncedRefresh(callback))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, () => this.debouncedRefresh(callback))
            .subscribe();
    },

    fetchCars: async function() {
        try {
            const { data, error } = await supabase
                .from(CARS_TABLE)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Fetch Cars Error:", error);
            return [];
        }
    },

    fetchDrivers: async function() {
        try {
            const { data, error } = await supabase
                .from('drivers')
                .select('id, name')
                .eq('role', 'driver')
                .eq('is_active', true);
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Fetch Drivers Error:", error);
            return [];
        }
    },

    // NEW: Get Customers by Driver ID for Modal
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

    uploadFile: async function(file, bucket) {
        if (!file) return null;
        try {
            const fileExt = file.name.split('.').pop();
            const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '-');
            const fileName = `${cleanName}-${Date.now()}.${fileExt}`;

            const { error } = await supabase.storage
                .from(bucket)
                .upload(fileName, file, { cacheControl: '3600', upsert: false });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(fileName);

            return publicUrl;
        } catch (error) {
            throw new Error("فشل رفع الملف: " + error.message);
        }
    },

    addCar: async function(payload) {
        const { error } = await supabase.from(CARS_TABLE).insert([payload]);
        if (error) throw error;
    },

    updateCar: async function(id, payload) {
        const { error } = await supabase.from(CARS_TABLE).update(payload).eq('id', id);
        if (error) throw error;
    },

    deleteCar: async function(id) {
        const { error } = await supabase.from(CARS_TABLE).delete().eq('id', id);
        if (error) throw error;
    }
};