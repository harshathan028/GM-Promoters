// API Service
const API = {
    baseUrl: '/api',

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            credentials: 'include',
            ...options
        };

        // Handle FormData
        if (options.body instanceof FormData) {
            delete config.headers['Content-Type'];
        } else if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.reload();
                }
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Auth
    async login(username, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: { username, password }
        });
    },

    async signup(data) {
        return this.request('/auth/signup', {
            method: 'POST',
            body: data
        });
    },

    async logout() {
        return this.request('/auth/logout', { method: 'POST' });
    },

    async getSession() {
        return this.request('/auth/session');
    },

    async changePassword(currentPassword, newPassword) {
        return this.request('/auth/change-password', {
            method: 'POST',
            body: { currentPassword, newPassword }
        });
    },

    // Lands
    async getLands(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/lands?${query}`);
    },

    async getLand(id) {
        return this.request(`/lands/${id}`);
    },

    async createLand(formData) {
        return this.request('/lands', {
            method: 'POST',
            body: formData
        });
    },

    async updateLand(id, formData) {
        return this.request(`/lands/${id}`, {
            method: 'PUT',
            body: formData
        });
    },

    async deleteLand(id) {
        return this.request(`/lands/${id}`, { method: 'DELETE' });
    },

    async markLandSold(id, customerId) {
        return this.request(`/lands/${id}/mark-sold`, {
            method: 'POST',
            body: { customerId }
        });
    },

    async assignAgentToLand(landId, agentId, isPrimary = false) {
        return this.request(`/lands/${landId}/assign-agent`, {
            method: 'POST',
            body: { agentId, isPrimary }
        });
    },

    // Customers
    async getCustomers(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/customers?${query}`);
    },

    async getCustomer(id) {
        return this.request(`/customers/${id}`);
    },

    async createCustomer(formData) {
        return this.request('/customers', {
            method: 'POST',
            body: formData
        });
    },

    async updateCustomer(id, formData) {
        return this.request(`/customers/${id}`, {
            method: 'PUT',
            body: formData
        });
    },

    async deleteCustomer(id) {
        return this.request(`/customers/${id}`, { method: 'DELETE' });
    },

    // Agents
    async getAgents(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/agents?${query}`);
    },

    async getAgent(id) {
        return this.request(`/agents/${id}`);
    },

    async createAgent(data) {
        return this.request('/agents', {
            method: 'POST',
            body: data
        });
    },

    async updateAgent(id, data) {
        return this.request(`/agents/${id}`, {
            method: 'PUT',
            body: data
        });
    },

    async deleteAgent(id) {
        return this.request(`/agents/${id}`, { method: 'DELETE' });
    },

    async getAgentCommission(id, params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/agents/${id}/commission?${query}`);
    },

    // Transactions
    async getTransactions(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/transactions?${query}`);
    },

    async getTransaction(id) {
        return this.request(`/transactions/${id}`);
    },

    async createTransaction(formData) {
        return this.request('/transactions', {
            method: 'POST',
            body: formData
        });
    },

    async updateTransaction(id, formData) {
        return this.request(`/transactions/${id}`, {
            method: 'PUT',
            body: formData
        });
    },

    async deleteTransaction(id) {
        return this.request(`/transactions/${id}`, { method: 'DELETE' });
    },

    async getReceipt(id) {
        return this.request(`/transactions/${id}/receipt`);
    },

    // Reports
    async getDashboard() {
        return this.request('/reports/dashboard');
    },

    async getMonthlySales(year) {
        return this.request(`/reports/monthly-sales?year=${year}`);
    },

    async getTopAgents(limit = 5) {
        return this.request(`/reports/top-agents?limit=${limit}`);
    },

    async getRecentTransactions(limit = 10) {
        return this.request(`/reports/recent-transactions?limit=${limit}`);
    },

    async getActivityLog(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/reports/activity-log?${query}`);
    },

    // Search
    async globalSearch(query, type = null) {
        const params = { q: query };
        if (type) params.type = type;
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/search?${queryString}`);
    },

    // Users
    async getUsers() {
        return this.request('/users');
    },

    async updateUser(id, data) {
        return this.request(`/users/${id}`, {
            method: 'PUT',
            body: data
        });
    },

    async toggleUserStatus(id) {
        return this.request(`/users/${id}/toggle-status`, { method: 'POST' });
    },

    async changeUserRole(id, role) {
        return this.request(`/users/${id}/change-role`, {
            method: 'POST',
            body: { role }
        });
    },

    // Export
    getExportUrl(type) {
        return `${this.baseUrl}/export/${type}`;
    }
};

window.API = API;
