// Lands Page
const LandsPage = {
    currentPage: 1,
    filters: {},

    async render() {
        document.getElementById('page-container').innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Land Management</h1>
          <p class="page-subtitle">Manage all your land properties</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="LandsPage.exportData()">
            <i class="fas fa-download"></i> Export
          </button>
          <button class="btn btn-primary" onclick="LandsPage.showAddModal()">
            <i class="fas fa-plus"></i> Add Land
          </button>
        </div>
      </div>
      
      <!-- Filters -->
      <div class="filters-bar">
        <div class="filter-group">
          <label>Status</label>
          <select id="filter-status" onchange="LandsPage.applyFilters()">
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Sold</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Type</label>
          <select id="filter-type" onchange="LandsPage.applyFilters()">
            <option value="">All Types</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="agricultural">Agricultural</option>
            <option value="industrial">Industrial</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Search</label>
          <input type="text" id="filter-search" placeholder="Search lands..." onkeyup="LandsPage.debounceSearch()">
        </div>
      </div>
      
      <!-- Data Table -->
      <div class="data-card">
        <div id="lands-table-container">
          <div class="loading"><div class="spinner"></div></div>
        </div>
      </div>
    `;

        this.loadData();
    },

    async loadData(page = 1) {
        this.currentPage = page;
        Components.showLoading('lands-table-container');

        try {
            const params = { page, limit: 10, ...this.filters };
            const response = await API.getLands(params);

            const columns = [
                { key: 'landId', label: 'Land ID' },
                { key: 'location', label: 'Location', render: (v) => Utils.truncate(v, 30) },
                { key: 'areaSize', label: 'Area', render: (v, item) => Utils.formatArea(v, item.areaUnit) },
                { key: 'price', label: 'Price', format: 'currency' },
                { key: 'landType', label: 'Type', render: (v) => `<span style="text-transform: capitalize;">${v}</span>` },
                { key: 'status', label: 'Status', format: 'status' },
                { key: 'primaryAgent', label: 'Agent', render: (v) => v?.name || '-' },
                {
                    key: 'actions',
                    label: 'Actions',
                    render: (v, item) => `
            <div class="table-actions">
              <button class="action-btn view" onclick="LandsPage.viewLand(${item.id})" title="View">
                <i class="fas fa-eye"></i>
              </button>
              <button class="action-btn edit" onclick="LandsPage.editLand(${item.id})" title="Edit">
                <i class="fas fa-edit"></i>
              </button>
              <button class="action-btn delete" onclick="LandsPage.deleteLand(${item.id})" title="Delete">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          `
                }
            ];

            document.getElementById('lands-table-container').innerHTML =
                Components.renderTable(response.data, columns, { emptyMessage: 'No lands found' }) +
                Components.renderPagination(response.pagination, 'LandsPage.loadData');

        } catch (error) {
            console.error('Load lands error:', error);
            Components.showToast('Failed to load lands', 'error');
        }
    },

    debounceSearch: Utils.debounce(function () {
        LandsPage.applyFilters();
    }, 300),

    applyFilters() {
        this.filters = {
            status: document.getElementById('filter-status').value,
            landType: document.getElementById('filter-type').value,
            search: document.getElementById('filter-search').value
        };
        this.loadData(1);
    },

    showAddModal() {
        this.showLandForm();
    },

    async editLand(id) {
        try {
            const response = await API.getLand(id);
            this.showLandForm(response.data);
        } catch (error) {
            Components.showToast('Failed to load land details', 'error');
        }
    },

    showLandForm(land = null) {
        const isEdit = !!land;

        openModal(isEdit ? 'Edit Land' : 'Add New Land', `
      <form id="land-form">
        <input type="hidden" name="id" value="${land?.id || ''}">
        
        <div class="form-row">
          <div class="form-group">
            <label>Location *</label>
            <input type="text" name="location" value="${land?.location || ''}" required>
          </div>
          <div class="form-group">
            <label>Survey Number</label>
            <input type="text" name="surveyNumber" value="${land?.surveyNumber || ''}">
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Area Size *</label>
            <input type="number" name="areaSize" value="${land?.areaSize || ''}" step="0.01" required>
          </div>
          <div class="form-group">
            <label>Unit</label>
            <select name="areaUnit">
              <option value="sqft" ${land?.areaUnit === 'sqft' ? 'selected' : ''}>Square Feet</option>
              <option value="acres" ${land?.areaUnit === 'acres' ? 'selected' : ''}>Acres</option>
              <option value="hectares" ${land?.areaUnit === 'hectares' ? 'selected' : ''}>Hectares</option>
            </select>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Price (₹) *</label>
            <input type="number" name="price" value="${land?.price || ''}" required>
          </div>
          <div class="form-group">
            <label>Land Type</label>
            <select name="landType">
              <option value="residential" ${land?.landType === 'residential' ? 'selected' : ''}>Residential</option>
              <option value="commercial" ${land?.landType === 'commercial' ? 'selected' : ''}>Commercial</option>
              <option value="agricultural" ${land?.landType === 'agricultural' ? 'selected' : ''}>Agricultural</option>
              <option value="industrial" ${land?.landType === 'industrial' ? 'selected' : ''}>Industrial</option>
              <option value="mixed" ${land?.landType === 'mixed' ? 'selected' : ''}>Mixed</option>
            </select>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Status</label>
            <select name="status">
              <option value="available" ${land?.status === 'available' ? 'selected' : ''}>Available</option>
              <option value="reserved" ${land?.status === 'reserved' ? 'selected' : ''}>Reserved</option>
              <option value="sold" ${land?.status === 'sold' ? 'selected' : ''}>Sold</option>
            </select>
          </div>
          <div class="form-group">
            <label>Coordinates</label>
            <input type="text" name="coordinates" value="${land?.coordinates || ''}" placeholder="Lat, Long">
          </div>
        </div>
        
        <div class="form-group">
          <label>Description</label>
          <textarea name="description" rows="3">${land?.description || ''}</textarea>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'} Land</button>
        </div>
      </form>
    `);

        document.getElementById('land-form').onsubmit = (e) => this.handleSubmit(e, isEdit);
    },

    async handleSubmit(e, isEdit) {
        e.preventDefault();
        const formData = Components.getFormData('land-form');

        try {
            if (isEdit) {
                await API.updateLand(formData.id, formData);
                Components.showToast('Land updated successfully', 'success');
            } else {
                await API.createLand(formData);
                Components.showToast('Land created successfully', 'success');
            }
            closeModal();
            this.loadData(this.currentPage);
        } catch (error) {
            Components.showToast(error.message || 'Operation failed', 'error');
        }
    },

    async viewLand(id) {
        try {
            const response = await API.getLand(id);
            const land = response.data;

            openModal('Land Details', `
        <div class="info-card">
          <div class="info-row">
            <span class="info-label">Land ID</span>
            <span class="info-value">${land.landId}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Location</span>
            <span class="info-value">${land.location}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Area</span>
            <span class="info-value">${Utils.formatArea(land.areaSize, land.areaUnit)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Price</span>
            <span class="info-value">${Utils.formatCurrency(land.price)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Type</span>
            <span class="info-value" style="text-transform: capitalize;">${land.landType}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status</span>
            <span class="info-value">${Utils.getStatusBadge(land.status)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Survey Number</span>
            <span class="info-value">${land.surveyNumber || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Primary Agent</span>
            <span class="info-value">${land.primaryAgent?.name || '-'}</span>
          </div>
        </div>
        ${land.description ? `<p style="margin-top: var(--spacing-md); color: var(--text-dark-secondary);">${land.description}</p>` : ''}
      `);
        } catch (error) {
            Components.showToast('Failed to load land details', 'error');
        }
    },

    async deleteLand(id) {
        const confirmed = await Components.confirm('Delete Land', 'Are you sure you want to delete this land? This action cannot be undone.');
        if (!confirmed) return;

        try {
            await API.deleteLand(id);
            Components.showToast('Land deleted successfully', 'success');
            this.loadData(this.currentPage);
        } catch (error) {
            Components.showToast(error.message || 'Failed to delete land', 'error');
        }
    },

    exportData() {
        window.open(API.getExportUrl('lands'), '_blank');
        Components.showToast('Export started', 'success');
    }
};

window.LandsPage = LandsPage;
