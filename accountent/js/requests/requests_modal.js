export const RequestsModal = {
    
    customersList: [], // Store for searching

    get modal() { return document.getElementById('request-modal'); },
    get modalContent() { return document.getElementById('request-modal-content'); },
    get form() { return document.getElementById('request-form'); },
    get suggestionsContainer() { return document.getElementById('customer-suggestions'); },
    get suggestionsList() { return document.getElementById('suggestions-list'); },
    get selectedDisplay() { return document.getElementById('selected-customer-display'); },
    get searchInput() { return document.getElementById('req-customer-search'); },
    
    inputs: {
        customerId: document.getElementById('req-customer-id'),
        customerSearch: document.getElementById('req-customer-search'),
        type: document.getElementById('req-type'),
        driver: document.getElementById('req-driver'),
        notes: document.getElementById('req-notes'),
        id: document.getElementById('req-id')
    },

    init: function() {
        // Setup Search Listeners
        this.inputs.customerSearch.addEventListener('input', (e) => this.handleSearch(e.target.value));
        this.inputs.customerSearch.addEventListener('focus', (e) => this.handleSearch(e.target.value));
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#customer-suggestions') && !e.target.closest('#req-customer-search')) {
                this.suggestionsContainer.classList.add('hidden');
            }
        });

        // Clear button
        document.getElementById('btn-clear-customer').addEventListener('click', () => {
            this.clearCustomerSelection();
        });
    },

    open: function() {
        this.init(); // Ensure listeners are attached
        this.modal.classList.remove('hidden');
        setTimeout(() => {
            this.modalContent.classList.remove('scale-95', 'opacity-0');
            this.modalContent.classList.add('scale-100', 'opacity-100');
        }, 10);
        
        // Reset Search UI
        this.clearCustomerSelection();
    },

    close: function() {
        this.modalContent.classList.remove('scale-100', 'opacity-100');
        this.modalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            this.modal.classList.add('hidden');
            this.form.reset();
            this.inputs.id.value = '';
            this.clearCustomerSelection();
        }, 300);
    },

    populateDropdowns: function(lookups) {
        const { customers, drivers } = lookups;
        this.customersList = customers; // Store for local search

        this.inputs.driver.innerHTML = '<option value="">اختر السائق...</option>' + 
            drivers.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    },

    handleSearch: function(query) {
        if (!query) {
            this.suggestionsContainer.classList.add('hidden');
            return;
        }

        const lowerQ = query.toLowerCase();
        const matches = this.customersList.filter(c => 
            (c.tank_no && c.tank_no.toLowerCase().includes(lowerQ)) || 
            (c.name && c.name.toLowerCase().includes(lowerQ))
        ).slice(0, 10); // Limit to 10 results

        if (matches.length > 0) {
            this.renderSuggestions(matches);
            this.suggestionsContainer.classList.remove('hidden');
        } else {
            this.suggestionsContainer.classList.add('hidden');
        }
    },

    renderSuggestions: function(list) {
        this.suggestionsList.innerHTML = list.map(c => `
            <li class="suggestion-item p-3 cursor-pointer border-b border-gray-50 last:border-0 flex justify-between items-center group" 
                onclick="document.getElementById('request-form').dispatchEvent(new CustomEvent('customer-selected', {detail: '${c.id}'}))">
                <div>
                    <span class="font-bold text-gray-800 text-sm block">${c.name}</span>
                    <span class="text-xs text-gray-400">خزان: ${c.tank_no}</span>
                </div>
                <i class="ph-bold ph-plus-circle text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"></i>
            </li>
        `).join('');

        // Add event listeners for selection (using inline onclick above for simplicity or delegated event here)
        // Better:
        const items = this.suggestionsList.querySelectorAll('.suggestion-item');
        items.forEach((item, index) => {
            item.onclick = () => this.selectCustomer(list[index]);
        });
    },

    selectCustomer: function(customer) {
        this.inputs.customerId.value = customer.id;
        document.getElementById('selected-customer-name').innerText = `${customer.tank_no} - ${customer.name}`;
        
        this.selectedDisplay.classList.remove('hidden');
        this.searchInput.classList.add('hidden'); // Hide search input
        this.suggestionsContainer.classList.add('hidden');
    },

    clearCustomerSelection: function() {
        this.inputs.customerId.value = '';
        this.inputs.customerSearch.value = '';
        this.selectedDisplay.classList.add('hidden');
        this.searchInput.classList.remove('hidden');
    },

    getData: function() {
        return {
            id: this.inputs.id.value,
            customerId: this.inputs.customerId.value,
            type: this.inputs.type.value || 'new_filling', // Default if hidden
            driverId: this.inputs.driver.value,
            notes: this.inputs.notes.value
        };
    }
};