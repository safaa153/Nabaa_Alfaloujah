// accountent/js/customers/data.js
import { AuthService } from '../../../Settings/auth.js'; 

const supabase = AuthService.db;
const CUSTOMERS_TABLE = 'customers';
const REQUESTS_TABLE = 'requests'; 
const FILLINGS_TABLE = 'fillings'; // NEW: Fillings Table
const BUCKET_NAME = 'customer-docs';

export const CustomersData = { 
    
    // Fetch all customers with related data AND last filling
    fetchCustomers: async function() {
        if (!supabase) return [];
        try {
            // 1. Fetch Customers with Relations
            const { data: customers, error } = await supabase
                .from(CUSTOMERS_TABLE)
                .select(`
                    *,
                    tank_types ( id, name ),
                    areas ( id, name ),
                    drivers ( id, name )
                `)
                .order('tank_no', { ascending: true });

            if (error) throw error;

            // 2. Fetch Last Filling Date for EACH customer (Optimized with a single query if possible, 
            // but for simplicity and standard PostgREST, we might need a different approach or RPC.
            // Since we can't easily do a "Left Join Lateral" in standard JS client select without complex setup,
            // we will fetch ALL latest fillings or use a `.rpc()` call if you created a SQL function.
            // A simpler client-side approach for now (good for <2000 rows):
            
            // Let's fetch the latest filling for all customers in one go.
            // We select customer_id and max(filling_date). 
            // However, Supabase JS simple select doesn't support aggregate grouping easily without RPC.
            
            // ALTERNATIVE: Fetch ALL fillings ordered by date, then map them in JS.
            // NOTE: This might be heavy if you have millions of fillings.
            // BETTER: Create a Database View or Function. 
            // FOR NOW: I will assume you want to do it in JS for simplicity, assuming data volume is manageable.
            
            const { data: fillings } = await supabase
                .from(FILLINGS_TABLE)
                .select('customer_id, filling_date')
                .order('filling_date', { ascending: false });

            // Create a map of customer_id -> last_filling_date
            const lastFillingMap = {};
            if (fillings) {
                fillings.forEach(f => {
                    // Since it's ordered by date desc, the first time we see a customer_id, it's the latest
                    if (!lastFillingMap[f.customer_id]) {
                        lastFillingMap[f.customer_id] = f.filling_date;
                    }
                });
            }

            // 3. Merge Data
            return customers.map(c => ({
                ...c,
                tank_type_name: c.tank_types ? c.tank_types.name : 'غير محدد',
                area_name: c.areas ? c.areas.name : 'غير محدد',
                driver_name: c.drivers ? c.drivers.name : 'غير محدد',
                // Add the last filling date from our map
                last_filling: lastFillingMap[c.id] ? new Date(lastFillingMap[c.id]).toLocaleDateString('ar-EG') : '-'
            }));

        } catch (error) {
            console.error("Fetch Customers Error:", error);
            return [];
        }
    },

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

    // Check pending request
    checkPendingRequest: async function(customerId) {
        const { count, error } = await supabase
            .from(REQUESTS_TABLE)
            .select('id', { count: 'exact', head: true })
            .eq('customer_id', customerId)
            .eq('status', 'pending');
        
        if (error) throw error;
        return count > 0;
    },

    // Create Request
    createRequest: async function(customerId, requestType, creatorName, driverId) {
        const finalDriverId = driverId && driverId !== "" ? driverId : null;

        const payload = {
            customer_id: customerId,
            request_type: requestType,
            created_by: creatorName,
            driver_id: finalDriverId,
            status: 'pending'
        };

        const { error } = await supabase.from(REQUESTS_TABLE).insert([payload]);
        if (error) throw error;
    },

    addCustomer: async function(payload) {
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