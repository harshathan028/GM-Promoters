// Agents Page
const AgentsPage = {
    currentPage: 1,
    filters: {},

    async render() {
        document.getElementById('page-container').innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Agent Management</h1>
          <p class="page-subtitle">Manage your sales agents and commissions</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="AgentsPage.exportData()">
            <i class="fas fa-download"></i> Export
          </button>
          <button class="btn btn-primary" onclick="AgentsPage.showAddModal()">
            <i class="fas fa-plus"></i> Add Agent
          </button>
        </div>
      </div>
      
      <div class="filters-bar">
        <div class="filter-group">
          <label>Status</label>
          <select id="filter-active" onchange="AgentsPage.applyFilters()">
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Search</label>
          <input type="text" id="filter-search" placeholder="Search agents..." onkeyup="AgentsPage.debounceSearch()">
        </div>
      </div>
      
      <div class="data-card">
        <div id="agents-table-container">
          <div class="loading"><div class="spinner"></div></div>
        </div>
      </div>
    `;

        this.loadData();
    },

    async loadData(page = 1) {
        this.currentPage = page;
        Components.showLoading('agents-table-container');

        try {
            const params = { page, limit: 10, ...this.filters };
            const response = await API.getAgents(params);

            const columns = [
                { key: 'agentId', label: 'ID' },
                { key: 'name', label: 'Name' },
                { key: 'phone', label: 'Phone' },
                { key: 'email', label: 'Email', render: (v) => v || '-' },
                { key: 'commissionPercent', label: 'Commission %', render: (v) => `${v}%` },
                { key: 'stats', label: 'Sales', render: (v) => v?.soldLandsCount || 0 },
                { key: 'stats', label: 'Commission Earned', render: (v) => Utils.formatCurrency(v?.totalCommission || 0) },
                { key: 'isActive', label: 'Status', render: (v) => Utils.getStatusBadge(v ? 'active' : 'inactive') },
                {
                    key: 'actions',
                    label: 'Actions',
                    render: (v, item) => `
            <div class="table-actions">
              <button class="action-btn view" onclick="AgentsPage.viewAgent(${item.id})" title="View">
                <i class="fas fa-eye"></i>
              </button>
              <button class="action-btn edit" onclick="AgentsPage.editAgent(${item.id})" title="Edit">
                <i class="fas fa-edit"></i>
              </button>
              <button class="action-btn delete" onclick="AgentsPage.deleteAgent(${item.id})" title="Delete">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          `
                }
            ];

            document.getElementById('agents-table-container').innerHTML =
                Components.renderTable(response.data, columns, { emptyMessage: 'No agents found' }) +
                Components.renderPagination(response.pagination, 'AgentsPage.loadData');

        } catch (error) {
            console.error('Load agents error:', error);
            Components.showToast('Failed to load agents', 'error');
        }
    },

    debounceSearch: Utils.debounce(function () {
        AgentsPage.applyFilters();
    }, 300),

    applyFilters() {
        this.filters = {
            isActive: document.getElementById('filter-active').value,
            search: document.getElementById('filter-search').value
        };
        this.loadData(1);
    },

    showAddModal() {
        this.showAgentForm();
    },

    async editAgent(id) {
        try {
            const response = await API.getAgent(id);
            this.showAgentForm(response.data);
        } catch (error) {
            Components.showToast('Failed to load agent details', 'error');
        }
    },

    showAgentForm(agent = null) {
        const isEdit = !!agent;

        openModal(isEdit ? 'Edit Agent' : 'Add New Agent', `
      <form id="agent-form">
        <input type="hidden" name="id" value="${agent?.id || ''}">
        
        <div class="form-row">
          <div class="form-group">
            <label>Full Name *</label>
            <input type="text" name="name" value="${agent?.name || ''}" required>
          </div>
          <div class="form-group">
            <label>Phone *</label>
            <input type="tel" name="phone" value="${agent?.phone || ''}" required>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Email</label>
            <input type="email" name="email" value="${agent?.email || ''}">
          </div>
          <div class="form-group">
            <label>Commission %</label>
            <input type="number" name="commissionPercent" value="${agent?.commissionPercent || 2}" step="0.1" min="0" max="100">
          </div>
        </div>
        
        <div class="form-group">
          <label>Address</label>
          <textarea name="address" rows="2">${agent?.address || ''}</textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Bank Account Name</label>
            <input type="text" name="bankAccountName" value="${agent?.bankAccountName || ''}">
          </div>
          <div class="form-group">
            <label>Bank Account Number</label>
            <input type="text" name="bankAccountNumber" value="${agent?.bankAccountNumber || ''}">
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Bank Name</label>
            <input type="text" name="bankName" value="${agent?.bankName || ''}">
          </div>
          <div class="form-group">
            <label>IFSC Code</label>
            <input type="text" name="ifscCode" value="${agent?.ifscCode || ''}">
          </div>
        </div>
        
        <div class="form-group">
          <label>
            <input type="checkbox" name="isActive" ${agent?.isActive !== false ? 'checked' : ''}> Active
          </label>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'} Agent</button>
        </div>
      </form>
    `);

        document.getElementById('agent-form').onsubmit = (e) => this.handleSubmit(e, isEdit);
    },

    async handleSubmit(e, isEdit) {
        e.preventDefault();
        const formData = Components.getFormData('agent-form');
        formData.isActive = document.querySelector('[name="isActive"]').checked;

        try {
            if (isEdit) {
                await API.updateAgent(formData.id, formData);
                Components.showToast('Agent updated successfully', 'success');
            } else {
                await API.createAgent(formData);
                Components.showToast('Agent created successfully', 'success');
            }
            closeModal();
            this.loadData(this.currentPage);
        } catch (error) {
            Components.showToast(error.message || 'Operation failed', 'error');
        }
    },

    async viewAgent(id) {
        try {
            const response = await API.getAgent(id);
            const agent = response.data;

            openModal('Agent Details', `
        <div class="info-card">
          <div class="info-row">
            <span class="info-label">Agent ID</span>
            <span class="info-value">${agent.agentId}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Name</span>
            <span class="info-value">${agent.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Phone</span>
            <span class="info-value">${agent.phone}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email</span>
            <span class="info-value">${agent.email || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Commission Rate</span>
            <span class="info-value">${agent.commissionPercent}%</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status</span>
            <span class="info-value">${Utils.getStatusBadge(agent.isActive ? 'active' : 'inactive')}</span>
          </div>
        </div>
        
        <h4 style="margin: var(--spacing-lg) 0 var(--spacing-md);">Commission Summary</h4>
        <div class="info-card">
          <div class="info-row">
            <span class="info-label">Total Sales</span>
            <span class="info-value">${Utils.formatCurrency(agent.stats?.totalSales || 0)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Total Commission</span>
            <span class="info-value" style="color: var(--success);">${Utils.formatCurrency(agent.stats?.totalCommission || 0)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Pending Commission</span>
            <span class="info-value" style="color: var(--warning);">${Utils.formatCurrency(agent.stats?.pendingCommission || 0)}</span>
          </div>
        </div>
      `, 'large');
        } catch (error) {
            Components.showToast('Failed to load agent details', 'error');
        }
    },

    async deleteAgent(id) {
        const confirmed = await Components.confirm('Delete Agent', 'Are you sure you want to delete this agent?');
        if (!confirmed) return;

        try {
            await API.deleteAgent(id);
            Components.showToast('Agent deleted successfully', 'success');
            this.loadData(this.currentPage);
        } catch (error) {
            Components.showToast(error.message || 'Failed to delete agent', 'error');
        }
    },

    exportData() {
        window.open(API.getExportUrl('agents'), '_blank');
    }
};

window.AgentsPage = AgentsPage;
