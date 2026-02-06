// Utility Functions

const Utils = {
    // Format currency
    formatCurrency(amount, currency = 'INR') {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    },

    // Format number with commas
    formatNumber(num) {
        return new Intl.NumberFormat('en-IN').format(num || 0);
    },

    // Format date
    formatDate(date, format = 'short') {
        if (!date) return '-';
        const d = new Date(date);

        if (format === 'short') {
            return d.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        }

        if (format === 'long') {
            return d.toLocaleDateString('en-IN', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
        }

        if (format === 'datetime') {
            return d.toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        return d.toISOString().split('T')[0];
    },

    // Format area
    formatArea(size, unit = 'sqft') {
        const formatted = this.formatNumber(size);
        const unitLabels = {
            sqft: 'sq.ft',
            acres: 'acres',
            hectares: 'ha'
        };
        return `${formatted} ${unitLabels[unit] || unit}`;
    },

    // Get status badge HTML
    getStatusBadge(status) {
        const statusClasses = {
            available: 'badge-available',
            reserved: 'badge-reserved',
            sold: 'badge-sold',
            active: 'badge-active',
            inactive: 'badge-inactive',
            completed: 'badge-completed',
            pending: 'badge-pending',
            failed: 'badge-failed',
            admin: 'badge-admin',
            agent: 'badge-agent',
            staff: 'badge-staff'
        };

        return `<span class="badge ${statusClasses[status] || ''}">${status}</span>`;
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Truncate text
    truncate(text, length = 50) {
        if (!text) return '';
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    },

    // Generate random ID
    generateId() {
        return Math.random().toString(36).substring(2, 9);
    },

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Parse query params from URL
    getQueryParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    },

    // Deep clone object
    clone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    // Check if user has role
    hasRole(user, ...roles) {
        return roles.includes(user?.role);
    },

    // Get initials from name
    getInitials(name) {
        if (!name) return '?';
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }
};

window.Utils = Utils;
