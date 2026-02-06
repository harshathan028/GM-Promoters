// Reports Page
const ReportsPage = {
    async render() {
        Components.showLoading('page-container');

        try {
            const [dashboard, topAgents, monthlySales] = await Promise.all([
                API.getDashboard(),
                API.getTopAgents(10),
                API.getMonthlySales(new Date().getFullYear())
            ]);

            const data = dashboard.data;

            document.getElementById('page-container').innerHTML = `
        <div class="page-header">
          <div>
            <h1 class="page-title">Reports & Analytics</h1>
            <p class="page-subtitle">Comprehensive business insights and statistics</p>
          </div>
        </div>
        
        <!-- Summary Stats -->
        <div class="stats-grid">
          ${Components.renderStatCard({ type: 'primary', icon: 'fa-map', value: Utils.formatNumber(data.lands.total), label: 'Total Lands' })}
          ${Components.renderStatCard({ type: 'success', icon: 'fa-rupee-sign', value: Utils.formatCurrency(data.revenue.total), label: 'Total Revenue' })}
          ${Components.renderStatCard({ type: 'info', icon: 'fa-users', value: Utils.formatNumber(data.counts.customers), label: 'Customers' })}
          ${Components.renderStatCard({ type: 'warning', icon: 'fa-user-tie', value: Utils.formatNumber(data.counts.agents), label: 'Agents' })}
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-lg);">
          <!-- Land Status Distribution -->
          <div class="data-card">
            <div class="data-card-header">
              <h3 class="data-card-title">Land Status Distribution</h3>
            </div>
            <div style="padding: var(--spacing-lg);">
              <div style="display: flex; flex-direction: column; gap: var(--spacing-md);">
                ${this.renderProgressBar('Available', data.lands.available, data.lands.total, 'var(--success)')}
                ${this.renderProgressBar('Reserved', data.lands.reserved, data.lands.total, 'var(--warning)')}
                ${this.renderProgressBar('Sold', data.lands.sold, data.lands.total, 'var(--danger)')}
              </div>
            </div>
          </div>
          
          <!-- Revenue Summary -->
          <div class="data-card">
            <div class="data-card-header">
              <h3 class="data-card-title">Revenue Summary</h3>
            </div>
            <div style="padding: var(--spacing-lg);">
              <div class="info-card">
                <div class="info-row">
                  <span class="info-label">Total Revenue</span>
                  <span class="info-value" style="color: var(--success);">${Utils.formatCurrency(data.revenue.total)}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">This Month</span>
                  <span class="info-value">${Utils.formatCurrency(data.revenue.monthly)}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Pending Commissions</span>
                  <span class="info-value" style="color: var(--warning);">${Utils.formatCurrency(data.commissions.pending)}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Total Land Value</span>
                  <span class="info-value">${Utils.formatCurrency(data.landValues.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Monthly Sales Chart -->
        <div class="chart-container" style="margin-top: var(--spacing-lg);">
          <div class="chart-header">
            <h3 class="chart-title">Monthly Sales Trend</h3>
          </div>
          <canvas id="report-chart" style="width: 100%; height: 300px;"></canvas>
        </div>
        
        <!-- Top Agents Table -->
        <div class="data-card" style="margin-top: var(--spacing-lg);">
          <div class="data-card-header">
            <h3 class="data-card-title">Top Performing Agents</h3>
          </div>
          ${this.renderAgentsTable(topAgents.data)}
        </div>
      `;

            this.renderChart(monthlySales.data);

        } catch (error) {
            console.error('Reports error:', error);
            Components.showToast('Failed to load reports', 'error');
        }
    },

    renderProgressBar(label, value, total, color) {
        const percent = total > 0 ? (value / total * 100).toFixed(1) : 0;
        return `
      <div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>${label}</span>
          <span>${value} (${percent}%)</span>
        </div>
        <div style="height: 8px; background: var(--bg-dark-tertiary); border-radius: 4px; overflow: hidden;">
          <div style="width: ${percent}%; height: 100%; background: ${color}; border-radius: 4px;"></div>
        </div>
      </div>
    `;
    },

    renderAgentsTable(agents) {
        if (!agents || agents.length === 0) {
            return '<div class="empty-state"><p>No agent data</p></div>';
        }

        const columns = [
            { key: 'rank', label: '#', render: (v, item, i) => i + 1 },
            { key: 'name', label: 'Agent' },
            { key: 'salesCount', label: 'Sales' },
            { key: 'totalSalesAmount', label: 'Total Sales', format: 'currency' },
            { key: 'totalCommission', label: 'Commission Earned', format: 'currency' },
            { key: 'commissionPercent', label: 'Rate', render: (v) => `${v}%` }
        ];

        return Components.renderTable(agents, columns);
    },

    renderChart(data) {
        const canvas = document.getElementById('report-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const values = data.map(d => d.sales);
        const maxValue = Math.max(...values, 1);

        canvas.width = canvas.offsetWidth;
        canvas.height = 300;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const padding = 60;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2;

        // Draw line chart
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;
        ctx.beginPath();

        values.forEach((value, i) => {
            const x = padding + (i * (chartWidth / (values.length - 1)));
            const y = canvas.height - padding - (value / maxValue * chartHeight);

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });

        ctx.stroke();

        // Draw points
        values.forEach((value, i) => {
            const x = padding + (i * (chartWidth / (values.length - 1)));
            const y = canvas.height - padding - (value / maxValue * chartHeight);

            ctx.fillStyle = '#667eea';
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();

            // Month label
            ctx.fillStyle = '#94a3b8';
            ctx.font = '11px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(months[i], x, canvas.height - padding + 20);
        });
    }
};

window.ReportsPage = ReportsPage;
