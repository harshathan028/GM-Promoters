// UI Components

const Components = {
    // Toast notification
    showToast(message, type = 'info', duration = 4000) {
        const container = document.getElementById('toast-container');
        const id = Utils.generateId();

        const icons = {
            success: 'fa-check',
            error: 'fa-times',
            warning: 'fa-exclamation',
            info: 'fa-info'
        };

        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Info'
        };

        const toast = document.createElement('div');
        toast.id = `toast-${id}`;
        toast.className = `toast ${type}`;
        toast.innerHTML = `
      <div class="toast-icon"><i class="fas ${icons[type]}"></i></div>
      <div class="toast-content">
        <div class="toast-title">${titles[type]}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" onclick="Components.closeToast('${id}')">
        <i class="fas fa-times"></i>
      </button>
    `;

        container.appendChild(toast);

        setTimeout(() => this.closeToast(id), duration);
    },

    closeToast(id) {
        const toast = document.getElementById(`toast-${id}`);
        if (toast) {
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 300);
        }
    },

    // Confirm dialog
    confirm(title, message) {
        return new Promise((resolve) => {
            const overlay = document.getElementById('confirm-overlay');
            const titleEl = document.getElementById('confirm-title');
            const messageEl = document.getElementById('confirm-message');
            const confirmBtn = document.getElementById('confirm-btn');

            titleEl.textContent = title;
            messageEl.textContent = message;
            overlay.classList.remove('hidden');

            const handleConfirm = () => {
                overlay.classList.add('hidden');
                confirmBtn.removeEventListener('click', handleConfirm);
                resolve(true);
            };

            confirmBtn.addEventListener('click', handleConfirm);

            window.cancelConfirm = () => {
                overlay.classList.add('hidden');
                confirmBtn.removeEventListener('click', handleConfirm);
                resolve(false);
            };
        });
    },

    // Render data table
    renderTable(data, columns, options = {}) {
        if (!data || data.length === 0) {
            return `
        <div class="empty-state">
          <div class="empty-state-icon"><i class="fas fa-inbox"></i></div>
          <h3>No Data Found</h3>
          <p>${options.emptyMessage || 'No records to display'}</p>
        </div>
      `;
        }

        const headerCells = columns.map(col =>
            `<th data-sort="${col.key}">${col.label} <i class="fas fa-sort"></i></th>`
        ).join('');

        const rows = data.map(item => {
            const cells = columns.map(col => {
                let value = item[col.key];

                if (col.render) {
                    value = col.render(value, item);
                } else if (col.format === 'currency') {
                    value = Utils.formatCurrency(value);
                } else if (col.format === 'date') {
                    value = Utils.formatDate(value);
                } else if (col.format === 'status') {
                    value = Utils.getStatusBadge(value);
                }

                return `<td>${value ?? '-'}</td>`;
            }).join('');

            return `<tr data-id="${item.id}">${cells}</tr>`;
        }).join('');

        return `
      <div class="table-container">
        <table class="data-table">
          <thead><tr>${headerCells}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
    },

    // Render pagination
    renderPagination(pagination, onPageChange) {
        const { page, pages, total, limit } = pagination;
        const start = (page - 1) * limit + 1;
        const end = Math.min(page * limit, total);

        let pageButtons = '';
        const maxButtons = 5;
        let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
        let endPage = Math.min(pages, startPage + maxButtons - 1);

        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageButtons += `<button class="pagination-btn ${i === page ? 'active' : ''}" onclick="${onPageChange}(${i})">${i}</button>`;
        }

        return `
      <div class="pagination">
        <div class="pagination-info">
          Showing ${start} to ${end} of ${total} entries
        </div>
        <div class="pagination-controls">
          <button class="pagination-btn" onclick="${onPageChange}(1)" ${page === 1 ? 'disabled' : ''}>
            <i class="fas fa-angle-double-left"></i>
          </button>
          <button class="pagination-btn" onclick="${onPageChange}(${page - 1})" ${page === 1 ? 'disabled' : ''}>
            <i class="fas fa-angle-left"></i>
          </button>
          ${pageButtons}
          <button class="pagination-btn" onclick="${onPageChange}(${page + 1})" ${page === pages ? 'disabled' : ''}>
            <i class="fas fa-angle-right"></i>
          </button>
          <button class="pagination-btn" onclick="${onPageChange}(${pages})" ${page === pages ? 'disabled' : ''}>
            <i class="fas fa-angle-double-right"></i>
          </button>
        </div>
      </div>
    `;
    },

    // Show loading
    showLoading(container) {
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }
        if (container) {
            container.innerHTML = `
        <div class="loading">
          <div class="spinner"></div>
        </div>
      `;
        }
    },

    // Form helpers
    getFormData(formId) {
        const form = document.getElementById(formId);
        if (!form) return {};

        const formData = new FormData(form);
        const data = {};

        for (const [key, value] of formData.entries()) {
            if (data[key]) {
                if (!Array.isArray(data[key])) {
                    data[key] = [data[key]];
                }
                data[key].push(value);
            } else {
                data[key] = value;
            }
        }

        return data;
    },

    // Populate form with data
    populateForm(formId, data) {
        const form = document.getElementById(formId);
        if (!form || !data) return;

        Object.keys(data).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = data[key];
                } else {
                    input.value = data[key] ?? '';
                }
            }
        });
    },

    // Render stats card
    renderStatCard(config) {
        return `
      <div class="stat-card ${config.type || 'primary'}">
        <div class="stat-header">
          <div>
            <div class="stat-value">${config.value}</div>
            <div class="stat-label">${config.label}</div>
          </div>
          <div class="stat-icon">
            <i class="fas ${config.icon}"></i>
          </div>
        </div>
        ${config.change ? `
          <div class="stat-change ${config.change >= 0 ? 'positive' : 'negative'}">
            <i class="fas fa-arrow-${config.change >= 0 ? 'up' : 'down'}"></i>
            ${Math.abs(config.change)}%
          </div>
        ` : ''}
      </div>
    `;
    }
};

window.Components = Components;
