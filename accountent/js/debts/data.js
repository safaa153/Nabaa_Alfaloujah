import { AuthService } from '../../../Settings/auth.js'; 

const supabase = AuthService.db;
const DEBTS_TABLE = 'debts';
const FILLINGS_TABLE = 'fillings';

export const DebtsData = {
    
    // Fetch and Aggregate Debts
    fetchAggregatedDebts: async function() {
        if (!supabase) return [];
        try {
            // 1. Fetch ALL unpaid debt records with extended Customer info including Tank Type
            const { data: rawDebts, error } = await supabase
                .from(DEBTS_TABLE)
                .select(`
                    id, amount, remaining_amount, created_at,
                    customers (
                        id, name, tank_no, phone, phone2, phone3, 
                        address, latitude, longitude,
                        areas ( name ),
                        tank_types ( name )
                    )
                `)
                .eq('is_paid', false)
                .order('created_at', { ascending: true }); // Oldest first

            if (error) throw error;

            // 2. Group by Customer ID
            const customersMap = {};

            rawDebts.forEach(record => {
                if (!record.customers) return; 
                const custId = record.customers.id;

                if (!customersMap[custId]) {
                    customersMap[custId] = {
                        customer_id: custId,
                        customer_name: record.customers.name,
                        tank_no: record.customers.tank_no,
                        tank_type: record.customers.tank_types ? record.customers.tank_types.name : '-',
                        phone: record.customers.phone,
                        phone2: record.customers.phone2,
                        phone3: record.customers.phone3,
                        area_name: record.customers.areas ? record.customers.areas.name : '-',
                        address: record.customers.address,
                        lat: record.customers.latitude,
                        lng: record.customers.longitude,
                        total_debt: 0,
                        oldest_date: record.created_at, // Initialize with first record
                        records_count: 0
                    };
                }

                // Sum up the REMAINING amount
                customersMap[custId].total_debt += Number(record.remaining_amount);
                
                // Track oldest date
                if (new Date(record.created_at) < new Date(customersMap[custId].oldest_date)) {
                    customersMap[custId].oldest_date = record.created_at;
                }

                customersMap[custId].records_count++;
            });

            return Object.values(customersMap);

        } catch (error) {
            console.error("Fetch Debts Error:", error);
            return [];
        }
    },

    // Process Payment (FIFO Logic) with Filling Update
    processPayment: async function(customerId, amountPaid) {
        if (amountPaid <= 0) return;

        // Fetch active debts for this customer
        const { data: customerDebts, error: fetchError } = await supabase
            .from(DEBTS_TABLE)
            .select('*')
            .eq('customer_id', customerId)
            .eq('is_paid', false)
            .order('created_at', { ascending: true });

        if (fetchError) throw fetchError;

        let remainingPayment = Number(amountPaid);

        for (const debt of customerDebts) {
            if (remainingPayment <= 0) break;

            const currentDebtAmount = Number(debt.remaining_amount);
            
            if (remainingPayment >= currentDebtAmount) {
                // Fully Pay this debt
                
                // 1. Mark Debt as Paid
                await supabase
                    .from(DEBTS_TABLE)
                    .update({ remaining_amount: 0, is_paid: true })
                    .eq('id', debt.id);
                
                // 2. Update Original Filling Request (Remove "Debt" flag)
                // This makes the request look "Finished" (Green) instead of "Debt" (Red) in the requests/fillings table
                if (debt.filling_id) {
                    await supabase
                        .from(FILLINGS_TABLE)
                        .update({ is_debt: false })
                        .eq('id', debt.filling_id);
                }

                remainingPayment -= currentDebtAmount;
            } else {
                // Partially Pay
                const newBalance = currentDebtAmount - remainingPayment;
                await supabase
                    .from(DEBTS_TABLE)
                    .update({ remaining_amount: newBalance })
                    .eq('id', debt.id);
                
                // For partial payment, we DO NOT update the fillings table. 
                // The request remains flagged as "Debt" until fully paid.
                
                remainingPayment = 0;
            }
        }
    },

    fetchUserProfile: async function() {
        const { data } = await supabase.from('drivers').select('name, job_title').eq('job_title', 'محاسب').limit(1).maybeSingle();
        return data;
    }
};