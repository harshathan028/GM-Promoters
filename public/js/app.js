// Main Application
const App = {
    user: null,
    currentPage: 'overview',

    async init() {
        await this.checkAuth();
        this.setupEventListeners();
    },

    async checkAuth() {
        try {
            const response = await API.getSession();
            if (response.authenticated) {
                this.user = response.user;
                this.showDashboard();
            } else {
                this.showLogin();
            }
        } catch (error) {
            this.showLogin();
        }
    },

    showLogin() {
        document.getElementById('login-page').classList.remove('hidden');
        document.getElementById('signup-page').classList.add('hidden');
        document.getElementById('dashboard').classList.add('hidden');
    },

    showDashboard() {
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('signup-page').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');

        // Update user info
        document.getElementById('sidebar-username').textContent = this.user.fullName;
        document.getElementById('sidebar-role').textContent = this.user.role;
        document.getElementById('header-username').textContent = this.user.fullName;

        // Show/hide admin menu items
        const adminItems = document.querySelectorAll('.admin-only');
        adminItems.forEach(item => {
            item.style.display = this.user.role === 'admin' ? 'block' : 'none';
        });

        // Load initial page
        this.navigate('overview');
    },

    setupEventListeners() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await API.login(username, password);
                this.user = response.user;
                Components.showToast('Login successful!', 'success');
                this.showDashboard();
            } catch (error) {
                Components.showToast(error.message || 'Login failed', 'error');
            }
        });

        // Signup form
        document.getElementById('signup-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = Components.getFormData('signup-form');

            try {
                await API.signup(formData);
                Components.showToast('Registration successful! Please login.', 'success');
                showLogin();
            } catch (error) {
                Components.showToast(error.message || 'Registration failed', 'error');
            }
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.navigate(page);
            });
        });

        // Global search
        const searchInput = document.getElementById('global-search');
        const searchResults = document.getElementById('search-results');

        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();

            if (query.length < 2) {
                searchResults.classList.remove('active');
                return;
            }

            searchTimeout = setTimeout(async () => {
                try {
                    const response = await API.globalSearch(query);
                    this.renderSearchResults(response.data);
                } catch (error) {
                    console.error('Search error:', error);
                }
            }, 300);
        });

        searchInput.addEventListener('blur', () => {
            setTimeout(() => searchResults.classList.remove('active'), 200);
        });

        // Close dropdowns on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-dropdown')) {
                document.getElementById('user-menu').classList.remove('active');
            }
        });
    },

    navigate(page) {
        this.currentPage = page;

        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Close mobile sidebar
        document.getElementById('sidebar').classList.remove('open');

        // Load page content
        switch (page) {
            case 'overview':
                DashboardPage.render();
                break;
            case 'lands':
                LandsPage.render();
                break;
            case 'customers':
                CustomersPage.render();
                break;
            case 'agents':
                AgentsPage.render();
                break;
            case 'transactions':
                TransactionsPage.render();
                break;
            case 'reports':
                ReportsPage.render();
                break;
            case 'users':
                if (this.user.role === 'admin') {
                    UsersPage.render();
                }
                break;
            case 'activity':
                if (this.user.role === 'admin') {
                    ActivityPage.render();
                }
                break;
            default:
                DashboardPage.render();
        }
    },

    renderSearchResults(data) {
        const container = document.getElementById('search-results');
        let html = '';

        if (data.lands?.length > 0) {
            html += `<div class="search-result-group"><h4>Lands</h4>`;
            data.lands.forEach(land => {
                html += `
          <div class="search-result-item" onclick="App.navigate('lands'); setTimeout(() => LandsPage.viewLand(${land.id}), 100);">
            <i class="fas fa-map-marked-alt"></i>
            <div>
              <div>${land.landId}</div>
              <div class="text-sm text-muted">${land.location}</div>
            </div>
          </div>
        `;
            });
            html += '</div>';
        }

        if (data.customers?.length > 0) {
            html += `<div class="search-result-group"><h4>Customers</h4>`;
            data.customers.forEach(customer => {
                html += `
          <div class="search-result-item" onclick="App.navigate('customers'); setTimeout(() => CustomersPage.viewCustomer(${customer.id}), 100);">
            <i class="fas fa-user"></i>
            <div>
              <div>${customer.name}</div>
              <div class="text-sm text-muted">${customer.phone}</div>
            </div>
          </div>
        `;
            });
            html += '</div>';
        }

        if (data.agents?.length > 0) {
            html += `<div class="search-result-group"><h4>Agents</h4>`;
            data.agents.forEach(agent => {
                html += `
          <div class="search-result-item" onclick="App.navigate('agents'); setTimeout(() => AgentsPage.viewAgent(${agent.id}), 100);">
            <i class="fas fa-user-tie"></i>
            <div>
              <div>${agent.name}</div>
              <div class="text-sm text-muted">${agent.phone}</div>
            </div>
          </div>
        `;
            });
            html += '</div>';
        }

        if (!html) {
            html = '<div class="empty-state" style="padding: 1rem;"><p class="text-muted">No results found</p></div>';
        }

        container.innerHTML = html;
        container.classList.add('active');
    }
};

// Global functions
function showLogin() {
    document.getElementById('login-page').classList.remove('hidden');
    document.getElementById('signup-page').classList.add('hidden');
}

function showSignup() {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('signup-page').classList.remove('hidden');
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

function toggleUserMenu() {
    document.getElementById('user-menu').classList.toggle('active');
}

async function logout() {
    try {
        await API.logout();
        Components.showToast('Logged out successfully', 'success');
        App.user = null;
        App.showLogin();
    } catch (error) {
        Components.showToast('Logout failed', 'error');
    }
}

function refreshData() {
    App.navigate(App.currentPage);
    Components.showToast('Data refreshed', 'info');
}

function openModal(title, content, size = '') {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = content;
    document.getElementById('modal').className = `modal ${size}`;
    document.getElementById('modal-overlay').classList.add('active');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
}

function showChangePassword() {
    openModal('Change Password', `
    <form id="change-password-form">
      <div class="form-group">
        <label>Current Password</label>
        <input type="password" name="currentPassword" required>
      </div>
      <div class="form-group">
        <label>New Password</label>
        <input type="password" name="newPassword" required minlength="6">
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Update Password</button>
      </div>
    </form>
  `);

    document.getElementById('change-password-form').onsubmit = async (e) => {
        e.preventDefault();
        const formData = Components.getFormData('change-password-form');

        try {
            await API.changePassword(formData.currentPassword, formData.newPassword);
            Components.showToast('Password changed successfully', 'success');
            closeModal();
        } catch (error) {
            Components.showToast(error.message || 'Failed to change password', 'error');
        }
    };
}

// Initialize app on DOM load
document.addEventListener('DOMContentLoaded', () => App.init());

window.App = App;
