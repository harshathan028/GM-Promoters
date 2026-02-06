// Transactions Page
const TransactionsPage = {
    currentPage: 1,
    filters: {},
    lands: [],
    customers: [],
    agents: [],

    async render() {
        document.getElementById('page-container').innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Transactions</h1>
          <p class="page-subtitle">Manage all land purchase transactions</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="TransactionsPage.exportData()">
            <i class="fas fa-download"></i> Export
          </button>
          <button class="btn btn-primary" onclick="TransactionsPage.showAddModal()">
            <i class="fas fa-plus"></i> New Transaction
          </button>
        </div>
      </div>
      
      <div class="filters-bar">
        <div class="filter-group">
          <label>Status</label>
          <select id="filter-status" onchange="TransactionsPage.applyFilters()">
            <option value="">All</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Payment Method</label>
          <select id="filter-method" onchange="TransactionsPage.applyFilters()">
            <option value="">All</option>
            <option value="cash">Cash</option>
            <option value="cheque">Cheque</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="upi">UPI</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Search</label>
          <input type="text" id="filter-search" placeholder="Transaction ID..." onkeyup="TransactionsPage.debounceSearch()">
        </div>
      </div>
      
      <div class="data-card">
        <div id="transactions-table-container">
          <div class="loading"><div class="spinner"></div></div>
        </div>
      </div>
    `;

        await this.loadLookupData();
        this.loadData();
    },

    async loadLookupData() {
        try {
            const [landsRes, customersRes, agentsRes] = await Promise.all([
                API.getLands({ limit: 100, status: 'available' }),
                API.getCustomers({ limit: 100 }),
                API.getAgents({ limit: 100, isActive: 'true' })
            ]);
            this.lands = landsRes.data;
            this.customers = customersRes.data;
            this.agents = agentsRes.data;
        } catch (error) {
            console.error('Failed to load lookup data', error);
        }
    },

    async loadData(page = 1) {
        this.currentPage = page;
        Components.showLoading('transactions-table-container');

        try {
            const params = { page, limit: 10, ...this.filters };
            const response = await API.getTransactions(params);

            const columns = [
                { key: 'transactionId', label: 'ID' },
                { key: 'land', label: 'Land', render: (v) => v?.location || '-' },
                { key: 'customer', label: 'Customer', render: (v) => v?.name || '-' },
                { key: 'amount', label: 'Amount', format: 'currency' },
                { key: 'paymentMethod', label: 'Method', render: (v) => v?.replace('_', ' ') },
                { key: 'paymentType', label: 'Type' },
                { key: 'status', label: 'Status', format: 'status' },
                { key: 'transactionDate', label: 'Date', format: 'date' },
                {
                    key: 'actions',
                    label: 'Actions',
                    render: (v, item) => `
            <div class="table-actions">
              <button class="action-btn view" onclick="TransactionsPage.viewReceipt(${item.id})" title="Receipt">
                <i class="fas fa-receipt"></i>
              </button>
              <button class="action-btn edit" onclick="TransactionsPage.editTransaction(${item.id})" title="Edit">
                <i class="fas fa-edit"></i>
              </button>
              <button class="action-btn delete" onclick="TransactionsPage.deleteTransaction(${item.id})" title="Delete">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          `
                }
            ];

            document.getElementById('transactions-table-container').innerHTML =
                Components.renderTable(response.data, columns, { emptyMessage: 'No transactions found' }) +
                Components.renderPagination(response.pagination, 'TransactionsPage.loadData');

        } catch (error) {
            console.error('Load transactions error:', error);
            Components.showToast('Failed to load transactions', 'error');
        }
    },

    debounceSearch: Utils.debounce(function () {
        TransactionsPage.applyFilters();
    }, 300),

    applyFilters() {
        this.filters = {
            status: document.getElementById('filter-status').value,
            paymentMethod: document.getElementById('filter-method').value,
            search: document.getElementById('filter-search').value
        };
        this.loadData(1);
    },

    showAddModal() {
        this.showTransactionForm();
    },

    async editTransaction(id) {
        try {
            const response = await API.getTransaction(id);
            this.showTransactionForm(response.data);
        } catch (error) {
            Components.showToast('Failed to load transaction details', 'error');
        }
    },

    showTransactionForm(txn = null) {
        const isEdit = !!txn;

        const landOptions = this.lands.map(l =>
            `<option value="${l.id}" ${txn?.landId === l.id ? 'selected' : ''}>${l.landId} - ${l.location} (${Utils.formatCurrency(l.price)})</option>`
        ).join('');

        const customerOptions = this.customers.map(c =>
            `<option value="${c.id}" ${txn?.customerId === c.id ? 'selected' : ''}>${c.name} - ${c.phone}</option>`
        ).join('');

        const agentOptions = this.agents.map(a =>
            `<option value="${a.id}" ${txn?.agentId === a.id ? 'selected' : ''}>${a.name}</option>`
        ).join('');

        openModal(isEdit ? 'Edit Transaction' : 'New Transaction', `
      <form id="transaction-form">
        <input type="hidden" name="id" value="${txn?.id || ''}">
        
        <div class="form-group">
          <label>Land *</label>
          <select name="landId" required>
            <option value="">Select Land...</option>
            ${landOptions}
          </select>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Customer *</label>
            <select name="customerId" required>
              <option value="">Select Customer...</option>
              ${customerOptions}
            </select>
          </div>
          <div class="form-group">
            <label>Agent</label>
            <select name="agentId">
              <option value="">Select Agent...</option>
              ${agentOptions}
            </select>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Amount (₹) *</label>
            <input type="number" name="amount" value="${txn?.amount || ''}" required>
          </div>
          <div class="form-group">
            <label>Payment Method</label>
            <select name="paymentMethod">
              <option value="cash" ${txn?.paymentMethod === 'cash' ? 'selected' : ''}>Cash</option>
              <option value="cheque" ${txn?.paymentMethod === 'cheque' ? 'selected' : ''}>Cheque</option>
              <option value="bank_transfer" ${txn?.paymentMethod === 'bank_transfer' ? 'selected' : ''}>Bank Transfer</option>
              <option value="upi" ${txn?.paymentMethod === 'upi' ? 'selected' : ''}>UPI</option>
              <option value="card" ${txn?.paymentMethod === 'card' ? 'selected' : ''}>Card</option>
            </select>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Payment Type</label>
            <select name="paymentType">
              <option value="full" ${txn?.paymentType === 'full' ? 'selected' : ''}>Full Payment</option>
              <option value="advance" ${txn?.paymentType === 'advance' ? 'selected' : ''}>Advance</option>
              <option value="installment" ${txn?.paymentType === 'installment' ? 'selected' : ''}>Installment</option>
              <option value="token" ${txn?.paymentType === 'token' ? 'selected' : ''}>Token</option>
            </select>
          </div>
          <div class="form-group">
            <label>Transaction Date</label>
            <input type="date" name="transactionDate" value="${txn?.transactionDate || new Date().toISOString().split('T')[0]}">
          </div>
        </div>
        
        <div class="form-group">
          <label>Notes</label>
          <textarea name="notes" rows="2">${txn?.notes || ''}</textarea>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'} Transaction</button>
        </div>
      </form>
    `, 'large');

        document.getElementById('transaction-form').onsubmit = (e) => this.handleSubmit(e, isEdit);
    },

    async handleSubmit(e, isEdit) {
        e.preventDefault();
        const formData = Components.getFormData('transaction-form');

        try {
            if (isEdit) {
                await API.updateTransaction(formData.id, formData);
                Components.showToast('Transaction updated successfully', 'success');
            } else {
                await API.createTransaction(formData);
                Components.showToast('Transaction recorded successfully', 'success');
            }
            closeModal();
            this.loadData(this.currentPage);
        } catch (error) {
            Components.showToast(error.message || 'Operation failed', 'error');
        }
    },

    async viewReceipt(id) {
        try {
            const response = await API.getReceipt(id);
            const txn = response.data;

            openModal('Payment Receipt', `
        <div class="receipt-container">
          <div class="receipt-header">
            <h2>GM Promoters</h2>
            <p>Land Promotion Company</p>
            <p style="font-size: 0.875rem; color: #6b7280;">Receipt #${txn.receiptNumber}</p>
          </div>
          
          <div class="receipt-row">
            <span class="receipt-label">Transaction ID</span>
            <span class="receipt-value">${txn.transactionId}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-label">Date</span>
            <span class="receipt-value">${Utils.formatDate(txn.transactionDate, 'long')}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-label">Customer</span>
            <span class="receipt-value">${txn.customer?.name || '-'}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-label">Land</span>
            <span class="receipt-value">${txn.land?.location || '-'}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-label">Payment Method</span>
            <span class="receipt-value">${txn.paymentMethod?.replace('_', ' ')}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-label">Payment Type</span>
            <span class="receipt-value">${txn.paymentType}</span>
          </div>
          
          <div class="receipt-total">
            <p>Amount Paid</p>
            <p class="amount">${Utils.formatCurrency(txn.amount)}</p>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="window.print()">
            <i class="fas fa-print"></i> Print
          </button>
        </div>
      `);
        } catch (error) {
            Components.showToast('Failed to load receipt', 'error');
        }
    },

    async deleteTransaction(id) {
        const confirmed = await Components.confirm('Delete Transaction', 'Are you sure you want to delete this transaction?');
        if (!confirmed) return;

        try {
            await API.deleteTransaction(id);
            Components.showToast('Transaction deleted successfully', 'success');
            this.loadData(this.currentPage);
        } catch (error) {
            Components.showToast(error.message || 'Failed to delete', 'error');
        }
    },

    exportData() {
        window.open(API.getExportUrl('transactions'), '_blank');
    }
};

window.TransactionsPage = TransactionsPage;
