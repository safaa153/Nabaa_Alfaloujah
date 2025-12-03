// accountent/js/cars/data.js
import { AuthService } from '../../../Settings/auth.js'; 

const supabase = AuthService.db;
const CARS_TABLE = 'cars';
const BUCKET_NAME = 'car-photos'; // UPDATED: Correct bucket name

export const CarsData = { 
    
    fetchCars: async function() {
        if (!supabase) return [];
        try {
            // 1. Fetch all cars (raw data)
            const carsResponse = await supabase
                .from(CARS_TABLE)
                .select('*')
                .order('created_at', { ascending: false });

            if (carsResponse.error) throw carsResponse.error;

            // 2. Fetch all drivers (for manual name lookup)
            const driversResponse = await supabase
                .from('drivers')
                .select('id, name');
            
            if (driversResponse.error) throw driversResponse.error;

            const driversMap = {};
            (driversResponse.data || []).forEach(d => {
                driversMap[d.id] = d.name;
            });

            // 3. Merge manually (Take ID and find name)
            return (carsResponse.data || []).map(car => {
                const driverName = driversMap[car.driver_id] || 'غير محدد';
                return {
                    ...car,
                    driver_name: driverName
                };
            });

        } catch (error) {
            console.error("Fetch Cars System Error:", error);
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

    // NEW: Fetch User Profile (Accountant)
    fetchUserProfile: async function() {
        if (!supabase) return null;
        try {
            // Fetch name, job_title, photo_url
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

    // --- FILE UPLOAD LOGIC ---
    uploadFile: async function(file, path) {
        if (!file) return null;
        try {
            // Sanitize filename to avoid issues with Arabic characters or spaces
            const fileExt = file.name.split('.').pop();
            const cleanPath = path.replace(/[^a-zA-Z0-9]/g, '-'); 
            const fileName = `${cleanPath}-${Date.now()}.${fileExt}`;

            // 1. Upload File
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error("❌ Storage Upload Error:", error);
                if (error.message.includes('new row violates row-level security policy')) {
                    throw new Error("خطأ صلاحيات: يرجى تفعيل Policies في إعدادات Storage");
                }
                throw error;
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(fileName);

            return publicUrl;
        } catch (error) {
            console.error("Upload Logic Error:", error);
            // Pass the specific error message to the UI
            throw new Error(error.message || "فشل في رفع الصورة");
        }
    },

    addCar: async function(payload) {
        const { error } = await supabase.from(CARS_TABLE).insert([payload]);
        if (error) {
            console.error("Add Car Error:", error.message);
            throw error;
        }
    },

    updateCar: async function(id, payload) {
        const { error } = await supabase.from(CARS_TABLE).update(payload).eq('id', id);
        if (error) {
            console.error("Update Car Error:", error.message);
            throw error;
        }
    },

    deleteCar: async function(id) {
        const { error } = await supabase.from(CARS_TABLE).delete().eq('id', id);
        if (error) {
            console.error("Delete Car Error:", error.message);
            throw error;
        }
    }
};