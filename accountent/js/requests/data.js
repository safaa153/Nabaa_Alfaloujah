import { AuthService } from '../../../Settings/auth.js'; 

const supabase = AuthService.db;
const REQUESTS_TABLE = 'requests';
const DELETED_TABLE = 'deleted_fillings';
const FILLINGS_TABLE = 'fillings';
const DEBTS_TABLE = 'debts';

export const RequestsData = { 
    
    fetchRequests: async function(status) {
        if (!supabase) return [];
        try {
            // IF STATUS IS FINISHED -> FETCH FROM FILLINGS TABLE
            if (status === 'finished') {
                const { data, error } = await supabase
                    .from(FILLINGS_TABLE)
                    .select(`
                        *,
                        customers ( 
                            id, name, tank_no, phone, phone2, phone3, latitude, longitude, area_id, address,
                            tank_types ( name ),
                            areas ( name )
                        ),
                        drivers ( id, name )
                    `)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                return data.map(r => ({
                    id: r.id,
                    created_at: r.created_at,
                    status: 'finished',
                    request_type: r.filling_type,
                    notes: r.notes,
                    customer_id: r.customer_id,
                    customer_name: r.customer_name || (r.customers ? r.customers.name : 'غير معروف'),
                    tank_no: r.tank_no || (r.customers ? r.customers.tank_no : '-'),
                    tank_capacity: r.customers && r.customers.tank_types ? r.customers.tank_types.name : '-',
                    customer_phone: r.customers ? r.customers.phone : '-',
                    customer_phone2: r.customers ? r.customers.phone2 : null,
                    customer_phone3: r.customers ? r.customers.phone3 : null,
                    area_name: r.customers && r.customers.areas ? r.customers.areas.name : '-',
                    area_id: r.customers ? r.customers.area_id : null,
                    address_detail: r.customers ? r.customers.address : '',
                    lat: r.customers ? r.customers.latitude : null,
                    lng: r.customers ? r.customers.longitude : null,
                    price: r.amount || 0,
                    is_debt: r.is_debt, 
                    driver_name: r.drivers ? r.drivers.name : 'غير محدد',
                    driver_id: r.driver_id
                }));
            } 
            
            // ELSE -> FETCH FROM REQUESTS TABLE
            else {
                let query = supabase
                    .from(REQUESTS_TABLE)
                    .select(`
                        *,
                        customers ( 
                            id, name, tank_no, phone, phone2, phone3, latitude, longitude, area_id, address,
                            tank_types ( price, name ),
                            areas ( name )
                        ),
                        drivers ( id, name )
                    `)
                    .order('created_at', { ascending: true });

                if (status) {
                    query = query.eq('status', status);
                }

                const { data, error } = await query;
                if (error) throw error;

                return data.map(r => ({
                    ...r,
                    customer_id: r.customers ? r.customers.id : null,
                    customer_name: r.customers ? r.customers.name : 'غير معروف',
                    tank_no: r.customers ? r.customers.tank_no : '-',
                    tank_capacity: r.customers && r.customers.tank_types ? r.customers.tank_types.name : '-',
                    customer_phone: r.customers ? r.customers.phone : '-',
                    customer_phone2: r.customers ? r.customers.phone2 : null,
                    customer_phone3: r.customers ? r.customers.phone3 : null,
                    area_name: r.customers && r.customers.areas ? r.customers.areas.name : '-',
                    area_id: r.customers ? r.customers.area_id : null, 
                    address_detail: r.customers ? r.customers.address : '',
                    lat: r.customers ? r.customers.latitude : null,
                    lng: r.customers ? r.customers.longitude : null,
                    price: (r.request_type !== 'new_filling' && r.request_type !== 'external_sale') ? 0 
                           : (r.request_type === 'external_sale' ? 0 : (r.customers?.tank_types?.price || 0)),
                    driver_name: r.drivers ? r.drivers.name : 'غير محدد',
                    driver_id: r.driver_id,
                    is_debt: r.is_debt
                }));
            }

        } catch (error) {
            console.error("Fetch Requests Error:", error);
            return [];
        }
    },

    fetchLookups: async function() {
        try {
            const [custs, drivers, areas] = await Promise.all([
                supabase.from('customers').select('id, name, tank_no').order('tank_no', {ascending:true}),
                supabase.from('drivers').select('id, name').eq('role', 'driver').eq('is_active', true),
                supabase.from('areas').select('id, name').eq('is_active', true)
            ]);
            return {
                customers: custs.data || [],
                drivers: drivers.data || [],
                areas: areas.data || []
            };
        } catch (error) {
            return { customers: [], drivers: [], areas: [] };
        }
    },

    addRequest: async function(payload) {
        const { error } = await supabase.from(REQUESTS_TABLE).insert([payload]);
        if (error) throw error;
    },

    addFilling: async function(payload) {
        const { error } = await supabase.from(FILLINGS_TABLE).insert([payload]);
        if (error) throw error;
    },

    markDelivered: async function(id, isDebt) {
        const { error } = await supabase
            .from(REQUESTS_TABLE)
            .update({ 
                status: 'delivered',
                is_debt: isDebt 
            })
            .eq('id', id);
        
        if (error) throw error;
    },

    moveToFillings: async function(requestId, isDebt = false) {
        // 1. Fetch Request with Price Info
        const { data: req, error: fetchError } = await supabase
            .from(REQUESTS_TABLE)
            .select(`
                *, 
                customers ( 
                    id, name, tank_no, 
                    tank_types ( price ) 
                )
            `)
            .eq('id', requestId)
            .single();
        
        if (fetchError || !req) throw fetchError || new Error("Request not found");

        // 2. Calculate Amount (Force Number type)
        let amount = 0;
        if (req.request_type === 'new_filling') {
            // Access price safely and convert to Number
            const price = req.customers?.tank_types?.price;
            amount = price ? Number(price) : 0;
        } else if (req.request_type === 'external_sale') {
            amount = 0; // External sales in requests usually don't carry price in this logic, but if they did, parse it here
        }

        // 3. Insert into Fillings
        const fillingPayload = {
            customer_id: req.customer_id,
            driver_id: req.driver_id,
            filling_type: req.request_type,
            amount: amount,
            created_at: req.created_at,
            finished_at: new Date().toISOString(),
            notes: req.notes,
            tank_no: req.customers?.tank_no || 'Unknown',
            customer_name: req.customers?.name || 'Unknown',
            created_by: req.created_by,
            is_debt: isDebt 
        };

        const { data: newFilling, error: insertError } = await supabase
            .from(FILLINGS_TABLE)
            .insert([fillingPayload])
            .select()
            .single(); 

        if (insertError) throw insertError;

        // 4. IF DEBT: Insert into Debts Table
        // Only insert if amount > 0. Zero debts are unnecessary.
        if (isDebt && newFilling && amount > 0) {
            const debtPayload = {
                customer_id: req.customer_id,
                filling_id: newFilling.id,
                amount: amount,
                remaining_amount: amount, // Start with full amount remaining
                is_paid: false,
                notes: `Generated from request #${req.customers?.tank_no || ''}`
            };
            
            const { error: debtError } = await supabase.from(DEBTS_TABLE).insert([debtPayload]);
            if (debtError) {
                console.error("Error creating debt record:", debtError);
                // We don't throw here to avoid rolling back the filling, but user should know
            }
        }

        // 5. Delete from Requests
        const { error: deleteError } = await supabase.from(REQUESTS_TABLE).delete().eq('id', requestId);
        if (deleteError) throw deleteError;
    },

    deleteRequest: async function(id, deleterName) {
        const { data: req } = await supabase.from(REQUESTS_TABLE).select(`*, customers(name, tank_no)`).eq('id', id).single();
        if (req) {
            await supabase.from(DELETED_TABLE).insert([{
                original_id: req.id,
                customer_id: req.customer_id,
                tank_no: req.customers?.tank_no || 'Unknown',
                customer_name: req.customers?.name || 'Unknown',
                request_type: req.request_type,
                status_at_deletion: req.status,
                deleted_by: deleterName,
                original_created_at: req.created_at,
                notes: req.notes
            }]);
        }
        const { error } = await supabase.from(REQUESTS_TABLE).delete().eq('id', id);
        if (error) throw error;
    },

    deleteFilling: async function(id, deleterName) {
        const { data: filling } = await supabase.from(FILLINGS_TABLE).select('*').eq('id', id).single();
        if (filling) {
            await supabase.from(DELETED_TABLE).insert([{
                original_id: filling.id,
                customer_id: filling.customer_id,
                tank_no: filling.tank_no || 'Unknown',
                customer_name: filling.customer_name || 'Unknown',
                request_type: filling.filling_type,
                status_at_deletion: 'finished',
                deleted_by: deleterName,
                original_created_at: filling.created_at,
                notes: filling.notes
            }]);
        }
        const { error } = await supabase.from(FILLINGS_TABLE).delete().eq('id', id);
        if (error) throw error;
    },

    updateDriver: async function(requestId, driverId) {
        const { error } = await supabase.from(REQUESTS_TABLE).update({ driver_id: driverId }).eq('id', requestId);
        if (error) throw error;
    },

    updateDate: async function(requestId, newDate) {
        const { error } = await supabase.from(REQUESTS_TABLE).update({ created_at: newDate }).eq('id', requestId);
        if (error) throw error;
    },

    updateCustomerLocation: async function(customerId, lat, lng) {
        const { error } = await supabase.from('customers').update({ latitude: lat, longitude: lng }).eq('id', customerId);
        if (error) throw error;
    },

    fetchUserProfile: async function() {
        const { data } = await supabase.from('drivers').select('name, job_title, photo_url').eq('job_title', 'محاسب').limit(1).maybeSingle();
        return data;
    }
};