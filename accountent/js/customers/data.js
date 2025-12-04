// accountent/js/customers/data.js
import { AuthService } from '../../../Settings/auth.js'; 

const supabase = AuthService.db;
const CUSTOMERS_TABLE = 'customers';
const BUCKET_NAME = 'customer-docs';

export const CustomersData = { 
    
    // Fetch all customers with related data
    fetchCustomers: async function() {
        if (!supabase) return [];
        try {
            const { data, error } = await supabase
                .from(CUSTOMERS_TABLE)
                .select(`
                    *,
                    tank_types ( id, name ),
                    areas ( id, name ),
                    drivers ( id, name )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data.map(c => ({
                ...c,
                tank_type_name: c.tank_types ? c.tank_types.name : 'غير محدد',
                area_name: c.areas ? c.areas.name : 'غير محدد',
                driver_name: c.drivers ? c.drivers.name : 'غير محدد'
            }));

        } catch (error) {
            console.error("Fetch Customers Error:", error);
            return [];
        }
    },

    // Fetch lookups for dropdowns
    fetchLookups: async function() {
        try {
            const [tanks, areas, drivers] = await Promise.all([
                supabase.from('tank_types').select('id, name').eq('is_active', true),
                supabase.from('areas').select('id, name').eq('is_active', true),
                supabase.from('drivers').select('id, name').eq('role', 'driver').eq('is_active', true)
            ]);

            return {
                tankTypes: tanks.data || [],
                areas: areas.data || [],
                drivers: drivers.data || []
            };
        } catch (error) {
            console.error("Fetch Lookups Error:", error);
            return { tankTypes: [], areas: [], drivers: [] };
        }
    },

    // Add Customer with Unique Tank Check
    addCustomer: async function(payload) {
        // 1. Check uniqueness (Optional optimization, Supabase throws error anyway)
        const { count } = await supabase
            .from(CUSTOMERS_TABLE)
            .select('id', { count: 'exact', head: true })
            .eq('tank_no', payload.tank_no);
        
        if (count > 0) throw new Error("رقم الخزان موجود مسبقاً!");

        const { error } = await supabase.from(CUSTOMERS_TABLE).insert([payload]);
        if (error) {
            if (error.code === '23505') throw new Error("رقم الخزان موجود مسبقاً!");
            throw error;
        }
    },

    updateCustomer: async function(id, payload) {
        const { error } = await supabase.from(CUSTOMERS_TABLE).update(payload).eq('id', id);
        if (error) throw error;
    },

    deleteCustomer: async function(id) {
        const { error } = await supabase.from(CUSTOMERS_TABLE).delete().eq('id', id);
        if (error) throw error;
    },

    // Upload Documents
    uploadDoc: async function(file) {
        if (!file) return null;
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `doc-${Date.now()}.${fileExt}`;
            
            const { error } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(fileName, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(fileName);

            return publicUrl;
        } catch (error) {
            console.error("Upload Error:", error);
            throw new Error("فشل في رفع المستند");
        }
    },

    // User Profile for Header
    fetchUserProfile: async function() {
        const { data } = await supabase
            .from('drivers')
            .select('name, job_title, photo_url')
            .eq('job_title', 'محاسب')
            .limit(1)
            .maybeSingle();
        return data;
    }
};