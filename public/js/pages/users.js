// Users Page (Admin only)
const UsersPage = {
    async render() {
        document.getElementById('page-container').innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">User Management</h1>
          <p class="page-subtitle">Manage system users and roles</p>
        </div>
      </div>
      
      <div class="data-card">
        <div id="users-table-container">
          <div class="loading"><div class="spinner"></div></div>
        </div>
      </div>
    `;

        this.loadData();
    },

    async loadData() {
        Components.showLoading('users-table-container');

        try {
            const response = await API.getUsers();

            const columns = [
                { key: 'username', label: 'Username' },
                { key: 'fullName', label: 'Full Name' },
                { key: 'email', label: 'Email' },
                { key: 'role', label: 'Role', format: 'status' },
                { key: 'isActive', label: 'Status', render: (v) => Utils.getStatusBadge(v ? 'active' : 'inactive') },
                { key: 'lastLogin', label: 'Last Login', format: 'date' },
                {
                    key: 'actions',
                    label: 'Actions',
                    render: (v, item) => `
            <div class="table-actions">
              <button class="action-btn edit" onclick="UsersPage.changeRole(${item.id}, '${item.role}')" title="Change Role">
                <i class="fas fa-user-tag"></i>
              </button>
              <button class="action-btn ${item.isActive ? 'delete' : 'view'}" onclick="UsersPage.toggleStatus(${item.id})" title="${item.isActive ? 'Deactivate' : 'Activate'}">
                <i class="fas fa-${item.isActive ? 'ban' : 'check'}"></i>
              </button>
            </div>
          `
                }
            ];

            document.getElementById('users-table-container').innerHTML =
                Components.renderTable(response.data, columns, { emptyMessage: 'No users found' });

        } catch (error) {
            console.error('Load users error:', error);
            Components.showToast('Failed to load users', 'error');
        }
    },

    async changeRole(id, currentRole) {
        openModal('Change User Role', `
      <form id="role-form">
        <div class="form-group">
          <label>Select Role</label>
          <select name="role" id="new-role">
            <option value="admin" ${currentRole === 'admin' ? 'selected' : ''}>Admin</option>
            <option value="agent" ${currentRole === 'agent' ? 'selected' : ''}>Agent</option>
            <option value="staff" ${currentRole === 'staff' ? 'selected' : ''}>Staff</option>
          </select>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Update Role</button>
        </div>
      </form>
    `);

        document.getElementById('role-form').onsubmit = async (e) => {
            e.preventDefault();
            const newRole = document.getElementById('new-role').value;
            try {
                await API.changeUserRole(id, newRole);
                Components.showToast('Role updated successfully', 'success');
                closeModal();
                this.loadData();
            } catch (error) {
                Components.showToast(error.message || 'Failed to update role', 'error');
            }
        };
    },

    async toggleStatus(id) {
        try {
            await API.toggleUserStatus(id);
            Components.showToast('User status updated', 'success');
            this.loadData();
        } catch (error) {
            Components.showToast(error.message || 'Failed to update status', 'error');
        }
    }
};

// Activity Log Page
const ActivityPage = {
    currentPage: 1,

    async render() {
        document.getElementById('page-container').innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Activity Log</h1>
          <p class="page-subtitle">System activity and audit trail</p>
        </div>
      </div>
      
      <div class="data-card">
        <div id="activity-table-container">
          <div class="loading"><div class="spinner"></div></div>
        </div>
      </div>
    `;

        this.loadData();
    },

    async loadData(page = 1) {
        this.currentPage = page;
        Components.showLoading('activity-table-container');

        try {
            const response = await API.getActivityLog({ page, limit: 20 });

            const columns = [
                { key: 'createdAt', label: 'Time', format: 'datetime' },
                { key: 'user', label: 'User', render: (v) => v?.username || 'System' },
                { key: 'action', label: 'Action', render: (v) => `<span style="text-transform: capitalize;">${v}</span>` },
                { key: 'entityType', label: 'Entity', render: (v) => `<span style="text-transform: capitalize;">${v}</span>` },
                { key: 'description', label: 'Description', render: (v) => Utils.truncate(v, 50) }
            ];

            document.getElementById('activity-table-container').innerHTML =
                Components.renderTable(response.data, columns, { emptyMessage: 'No activity found' }) +
                Components.renderPagination(response.pagination, 'ActivityPage.loadData');

        } catch (error) {
            console.error('Load activity error:', error);
            Components.showToast('Failed to load activity log', 'error');
        }
    }
};

window.UsersPage = UsersPage;
window.ActivityPage = ActivityPage;
