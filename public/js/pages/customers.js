// Customers Page
const CustomersPage = {
    currentPage: 1,
    filters: {},

    async render() {
        document.getElementById('page-container').innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Customer Management</h1>
          <p class="page-subtitle">Manage your customers and their purchases</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="CustomersPage.exportData()">
            <i class="fas fa-download"></i> Export
          </button>
          <button class="btn btn-primary" onclick="CustomersPage.showAddModal()">
            <i class="fas fa-plus"></i> Add Customer
          </button>
        </div>
      </div>
      
      <div class="filters-bar">
        <div class="filter-group">
          <label>Search</label>
          <input type="text" id="filter-search" placeholder="Search by name, phone..." onkeyup="CustomersPage.debounceSearch()">
        </div>
      </div>
      
      <div class="data-card">
        <div id="customers-table-container">
          <div class="loading"><div class="spinner"></div></div>
        </div>
      </div>
    `;

        this.loadData();
    },

    async loadData(page = 1) {
        this.currentPage = page;
        Components.showLoading('customers-table-container');

        try {
            const params = { page, limit: 10, ...this.filters };
            const response = await API.getCustomers(params);

            const columns = [
                { key: 'customerId', label: 'ID' },
                { key: 'name', label: 'Name' },
                { key: 'phone', label: 'Phone' },
                { key: 'email', label: 'Email', render: (v) => v || '-' },
                { key: 'city', label: 'City', render: (v) => v || '-' },
                { key: 'purchasedLands', label: 'Purchases', render: (v) => v?.length || 0 },
                {
                    key: 'actions',
                    label: 'Actions',
                    render: (v, item) => `
            <div class="table-actions">
              <button class="action-btn view" onclick="CustomersPage.viewCustomer(${item.id})" title="View">
                <i class="fas fa-eye"></i>
              </button>
              <button class="action-btn edit" onclick="CustomersPage.editCustomer(${item.id})" title="Edit">
                <i class="fas fa-edit"></i>
              </button>
              <button class="action-btn delete" onclick="CustomersPage.deleteCustomer(${item.id})" title="Delete">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          `
                }
            ];

            document.getElementById('customers-table-container').innerHTML =
                Components.renderTable(response.data, columns, { emptyMessage: 'No customers found' }) +
                Components.renderPagination(response.pagination, 'CustomersPage.loadData');

        } catch (error) {
            console.error('Load customers error:', error);
            Components.showToast('Failed to load customers', 'error');
        }
    },

    debounceSearch: Utils.debounce(function () {
        CustomersPage.applyFilters();
    }, 300),

    applyFilters() {
        this.filters = {
            search: document.getElementById('filter-search').value
        };
        this.loadData(1);
    },

    showAddModal() {
        this.showCustomerForm();
    },

    async editCustomer(id) {
        try {
            const response = await API.getCustomer(id);
            this.showCustomerForm(response.data);
        } catch (error) {
            Components.showToast('Failed to load customer details', 'error');
        }
    },

    showCustomerForm(customer = null) {
        const isEdit = !!customer;

        openModal(isEdit ? 'Edit Customer' : 'Add New Customer', `
      <form id="customer-form">
        <input type="hidden" name="id" value="${customer?.id || ''}">
        
        <div class="form-row">
          <div class="form-group">
            <label>Full Name *</label>
            <input type="text" name="name" value="${customer?.name || ''}" required>
          </div>
          <div class="form-group">
            <label>Phone *</label>
            <input type="tel" name="phone" value="${customer?.phone || ''}" required>
          </div>
        </div>
        
        <div class="form-group">
          <label>Email</label>
          <input type="email" name="email" value="${customer?.email || ''}">
        </div>
        
        <div class="form-group">
          <label>Address</label>
          <textarea name="address" rows="2">${customer?.address || ''}</textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>City</label>
            <input type="text" name="city" value="${customer?.city || ''}">
          </div>
          <div class="form-group">
            <label>State</label>
            <input type="text" name="state" value="${customer?.state || ''}">
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Pincode</label>
            <input type="text" name="pincode" value="${customer?.pincode || ''}">
          </div>
          <div class="form-group">
            <label>ID Proof Type</label>
            <select name="idProofType">
              <option value="">Select...</option>
              <option value="aadhar" ${customer?.idProofType === 'aadhar' ? 'selected' : ''}>Aadhar Card</option>
              <option value="pan" ${customer?.idProofType === 'pan' ? 'selected' : ''}>PAN Card</option>
              <option value="passport" ${customer?.idProofType === 'passport' ? 'selected' : ''}>Passport</option>
              <option value="voter_id" ${customer?.idProofType === 'voter_id' ? 'selected' : ''}>Voter ID</option>
              <option value="driving_license" ${customer?.idProofType === 'driving_license' ? 'selected' : ''}>Driving License</option>
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label>ID Proof Number</label>
          <input type="text" name="idProofNumber" value="${customer?.idProofNumber || ''}">
        </div>
        
        <div class="form-group">
          <label>Notes</label>
          <textarea name="notes" rows="2">${customer?.notes || ''}</textarea>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'} Customer</button>
        </div>
      </form>
    `);

        document.getElementById('customer-form').onsubmit = (e) => this.handleSubmit(e, isEdit);
    },

    async handleSubmit(e, isEdit) {
        e.preventDefault();
        const formData = Components.getFormData('customer-form');

        try {
            if (isEdit) {
                await API.updateCustomer(formData.id, formData);
                Components.showToast('Customer updated successfully', 'success');
            } else {
                await API.createCustomer(formData);
                Components.showToast('Customer created successfully', 'success');
            }
            closeModal();
            this.loadData(this.currentPage);
        } catch (error) {
            Components.showToast(error.message || 'Operation failed', 'error');
        }
    },

    async viewCustomer(id) {
        try {
            const response = await API.getCustomer(id);
            const customer = response.data;

            openModal('Customer Details', `
        <div class="info-card">
          <div class="info-row">
            <span class="info-label">Customer ID</span>
            <span class="info-value">${customer.customerId}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Name</span>
            <span class="info-value">${customer.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Phone</span>
            <span class="info-value">${customer.phone}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email</span>
            <span class="info-value">${customer.email || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Address</span>
            <span class="info-value">${customer.address || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">City</span>
            <span class="info-value">${customer.city || '-'}, ${customer.state || ''}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Total Purchases</span>
            <span class="info-value">${customer.stats?.purchaseCount || 0} lands</span>
          </div>
          <div class="info-row">
            <span class="info-label">Total Amount</span>
            <span class="info-value">${Utils.formatCurrency(customer.stats?.totalPurchases || 0)}</span>
          </div>
        </div>
      `);
        } catch (error) {
            Components.showToast('Failed to load customer details', 'error');
        }
    },

    async deleteCustomer(id) {
        const confirmed = await Components.confirm('Delete Customer', 'Are you sure you want to delete this customer?');
        if (!confirmed) return;

        try {
            await API.deleteCustomer(id);
            Components.showToast('Customer deleted successfully', 'success');
            this.loadData(this.currentPage);
        } catch (error) {
            Components.showToast(error.message || 'Failed to delete customer', 'error');
        }
    },

    exportData() {
        window.open(API.getExportUrl('customers'), '_blank');
    }
};

window.CustomersPage = CustomersPage;
