// Dashboard Page
const DashboardPage = {
    async render() {
        Components.showLoading('page-container');

        try {
            const [dashboard, topAgents, recentTxns] = await Promise.all([
                API.getDashboard(),
                API.getTopAgents(5),
                API.getRecentTransactions(5)
            ]);

            const data = dashboard.data;

            document.getElementById('page-container').innerHTML = `
        <div class="page-header">
          <div>
            <h1 class="page-title">Dashboard</h1>
            <p class="page-subtitle">Welcome back! Here's your business overview.</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-secondary" onclick="DashboardPage.exportReport()">
              <i class="fas fa-download"></i> Export Report
            </button>
          </div>
        </div>
        
        <!-- Stats Grid -->
        <div class="stats-grid">
          ${Components.renderStatCard({
                type: 'primary',
                icon: 'fa-map-marked-alt',
                value: Utils.formatNumber(data.lands.total),
                label: 'Total Lands'
            })}
          ${Components.renderStatCard({
                type: 'success',
                icon: 'fa-check-circle',
                value: Utils.formatNumber(data.lands.available),
                label: 'Available Lands'
            })}
          ${Components.renderStatCard({
                type: 'warning',
                icon: 'fa-clock',
                value: Utils.formatNumber(data.lands.reserved),
                label: 'Reserved Lands'
            })}
          ${Components.renderStatCard({
                type: 'danger',
                icon: 'fa-handshake',
                value: Utils.formatNumber(data.lands.sold),
                label: 'Sold Lands'
            })}
        </div>
        
        <div class="stats-grid">
          ${Components.renderStatCard({
                type: 'info',
                icon: 'fa-rupee-sign',
                value: Utils.formatCurrency(data.revenue.total),
                label: 'Total Revenue'
            })}
          ${Components.renderStatCard({
                type: 'success',
                icon: 'fa-chart-line',
                value: Utils.formatCurrency(data.revenue.monthly),
                label: 'This Month Revenue'
            })}
          ${Components.renderStatCard({
                type: 'primary',
                icon: 'fa-users',
                value: Utils.formatNumber(data.counts.customers),
                label: 'Total Customers'
            })}
          ${Components.renderStatCard({
                type: 'warning',
                icon: 'fa-user-tie',
                value: Utils.formatNumber(data.counts.agents),
                label: 'Active Agents'
            })}
        </div>
        
        <!-- Charts & Lists Row -->
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: var(--spacing-lg); margin-top: var(--spacing-lg);">
          <!-- Sales Chart -->
          <div class="chart-container">
            <div class="chart-header">
              <h3 class="chart-title">Monthly Sales</h3>
              <select id="chart-year" onchange="DashboardPage.updateChart()">
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>
            <canvas id="sales-chart" class="chart-canvas"></canvas>
          </div>
          
          <!-- Top Agents -->
          <div class="data-card">
            <div class="data-card-header">
              <h3 class="data-card-title">Top Agents</h3>
            </div>
            <div style="padding: var(--spacing-md);">
              ${this.renderTopAgents(topAgents.data)}
            </div>
          </div>
        </div>
        
        <!-- Recent Transactions -->
        <div class="data-card" style="margin-top: var(--spacing-lg);">
          <div class="data-card-header">
            <h3 class="data-card-title">Recent Transactions</h3>
            <button class="btn btn-sm btn-secondary" onclick="App.navigate('transactions')">
              View All <i class="fas fa-arrow-right"></i>
            </button>
          </div>
          ${this.renderRecentTransactions(recentTxns.data)}
        </div>
      `;

            this.initChart();

        } catch (error) {
            console.error('Dashboard error:', error);
            Components.showToast('Failed to load dashboard', 'error');
        }
    },

    renderTopAgents(agents) {
        if (!agents || agents.length === 0) {
            return '<p class="text-muted text-center">No agents found</p>';
        }

        return agents.map((agent, index) => `
      <div class="info-card" style="display: flex; align-items: center; gap: var(--spacing-md); margin-bottom: var(--spacing-sm);">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--accent-gradient); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
          ${index + 1}
        </div>
        <div style="flex: 1;">
          <div style="font-weight: 600;">${agent.name}</div>
          <div class="text-sm text-muted">${agent.salesCount || 0} sales</div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 600; color: var(--success);">${Utils.formatCurrency(agent.totalSalesAmount)}</div>
        </div>
      </div>
    `).join('');
    },

    renderRecentTransactions(transactions) {
        if (!transactions || transactions.length === 0) {
            return '<div class="empty-state"><p>No recent transactions</p></div>';
        }

        const columns = [
            { key: 'transactionId', label: 'ID' },
            { key: 'land', label: 'Land', render: (v) => v?.location || '-' },
            { key: 'customer', label: 'Customer', render: (v) => v?.name || '-' },
            { key: 'amount', label: 'Amount', format: 'currency' },
            { key: 'status', label: 'Status', format: 'status' },
            { key: 'transactionDate', label: 'Date', format: 'date' }
        ];

        return Components.renderTable(transactions, columns);
    },

    async initChart() {
        const salesData = await API.getMonthlySales(2026);
        this.renderChart(salesData.data);
    },

    async updateChart() {
        const year = document.getElementById('chart-year').value;
        const salesData = await API.getMonthlySales(year);
        this.renderChart(salesData.data);
    },

    renderChart(data) {
        const canvas = document.getElementById('sales-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const values = data.map(d => d.sales);
        const maxValue = Math.max(...values, 1);

        // Clear canvas
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const padding = 50;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2;
        const barWidth = chartWidth / months.length - 10;

        // Draw bars
        const gradient = ctx.createLinearGradient(0, canvas.height - padding, 0, padding);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');

        values.forEach((value, index) => {
            const barHeight = (value / maxValue) * chartHeight;
            const x = padding + (index * (chartWidth / months.length)) + 5;
            const y = canvas.height - padding - barHeight;

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, 4);
            ctx.fill();

            // Month label
            ctx.fillStyle = '#94a3b8';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(months[index], x + barWidth / 2, canvas.height - padding + 20);
        });
    },

    exportReport() {
        window.open(API.getExportUrl('transactions'), '_blank');
        Components.showToast('Report download started', 'success');
    }
};

window.DashboardPage = DashboardPage;
