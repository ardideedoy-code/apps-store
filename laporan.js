/**
 * laporan.js
 * Logic for dashboard charts and reports.
 */

window.renderDashboard = async (container) => {
    container.innerHTML = `
        <div class="card">
            <div class="card-body">
                <h2>Selamat Datang, ${window.currentUser.nama}</h2>
                <p class="text-muted">Ini adalah ringkasan penjualan hari ini.</p>
            </div>
        </div>
        
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
            <div class="card" style="margin-bottom:0;">
                <div class="card-body">
                    <h4 class="text-muted">Total Penjualan</h4>
                    <h2 class="text-primary" id="dash_total">Rp 0</h2>
                </div>
            </div>
            <div class="card" style="margin-bottom:0;">
                <div class="card-body">
                    <h4 class="text-muted">Transaksi</h4>
                    <h2 class="text-success" id="dash_trx">0</h2>
                </div>
            </div>
            <div class="card" style="margin-bottom:0;">
                <div class="card-body">
                    <h4 class="text-muted">Produk Terjual</h4>
                    <h2 class="text-warning" id="dash_qty">0</h2>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h3>Grafik Penjualan 7 Hari Terakhir</h3>
            </div>
            <div class="card-body">
                <canvas id="salesChart" height="100"></canvas>
            </div>
        </div>
    `;

    // Load Data
    try {
        const sales = await window.posDB.getAllData('sales');
        const salesItems = await window.posDB.getAllData('sales_items');
        
        // Calculate Today's Stats
        const today = new Date().toISOString().split('T')[0];
        
        let totalSales = 0;
        let totalTrx = 0;
        let totalQty = 0;

        sales.forEach(s => {
            if (s.tanggal.startsWith(today)) {
                totalSales += s.grandTotal;
                totalTrx++;
            }
        });

        salesItems.forEach(i => {
            // we should ideally join, but for simplicity we check if invoice is in today's sales
            const sale = sales.find(x => x.invoice === i.invoice);
            if (sale && sale.tanggal.startsWith(today)) {
                totalQty += i.qty;
            }
        });

        const formatCurrency = (num) => {
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
        };

        document.getElementById('dash_total').innerText = formatCurrency(totalSales);
        document.getElementById('dash_trx').innerText = totalTrx;
        document.getElementById('dash_qty').innerText = totalQty;

        // Render Chart
        renderChart(sales);

    } catch (err) {
        console.error(err);
    }
};

const renderChart = (sales) => {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;

    // Group sales by date for the last 7 days
    const labels = [];
    const dataPoints = [];

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        labels.push(dateStr);
        
        let dailyTotal = 0;
        sales.forEach(s => {
            if (s.tanggal.startsWith(dateStr)) {
                dailyTotal += s.grandTotal;
            }
        });
        dataPoints.push(dailyTotal);
    }

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Penjualan (Rp)',
                data: dataPoints,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
};

window.renderLaporan = async (container) => {
    container.innerHTML = `
        <div class="card">
            <div class="card-body">
                <h2>Laporan Transaksi & Keuangan</h2>
                <div class="flex gap-4 mb-4" style="align-items: flex-end;">
                    <div class="form-group mb-0">
                        <label class="form-label">Jenis Laporan</label>
                        <select id="lap_jenis" class="form-control" onchange="loadLaporan()">
                            <option value="penjualan">Laporan Penjualan</option>
                            <option value="aruskas">Laporan Arus Kas</option>
                        </select>
                    </div>
                    <div class="form-group mb-0">
                        <label class="form-label">Mulai Tanggal</label>
                        <input type="date" id="lap_start" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group mb-0">
                        <label class="form-label">Sampai Tanggal</label>
                        <input type="date" id="lap_end" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <button class="btn btn-primary" onclick="loadLaporan()"><i class="fas fa-search"></i> Tampilkan</button>
                    <button class="btn btn-outline" onclick="window.print()"><i class="fas fa-print"></i> Cetak</button>
                </div>

                <div class="table-responsive" id="tabel_penjualan">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Invoice</th>
                                <th>Tanggal</th>
                                <th>Kasir</th>
                                <th>Metode Pembayaran</th>
                                <th>Total Belanja</th>
                            </tr>
                        </thead>
                        <tbody id="laporanTableBody">
                            <tr><td colspan="5" style="text-align:center;">Memuat data...</td></tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <th colspan="4" style="text-align:right;">Grand Total:</th>
                                <th id="lap_grand_total">Rp 0</th>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div class="table-responsive" id="tabel_aruskas" style="display: none;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Tipe</th>
                                <th>Kategori</th>
                                <th>Keterangan</th>
                                <th>User</th>
                                <th>Nominal</th>
                            </tr>
                        </thead>
                        <tbody id="laporanArusKasBody">
                            <tr><td colspan="6" style="text-align:center;">Memuat data...</td></tr>
                        </tbody>
                    </table>
                    
                    <div style="margin-top: 1rem; padding: 1rem; background-color: var(--bg-main); border-radius: 8px;">
                        <div class="flex justify-between mb-2">
                            <span>Total Kas Masuk:</span>
                            <strong class="text-success" id="tot_kas_masuk">Rp 0</strong>
                        </div>
                        <div class="flex justify-between mb-2">
                            <span>Total Kas Keluar:</span>
                            <strong class="text-danger" id="tot_kas_keluar">Rp 0</strong>
                        </div>
                        <hr style="border-color: var(--border-color); margin: 0.5rem 0;">
                        <div class="flex justify-between">
                            <span>Saldo Akhir Kas:</span>
                            <strong class="text-primary" id="tot_kas_saldo" style="font-size: 1.2rem;">Rp 0</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    loadLaporan();
};

window.loadLaporan = async () => {
    const jenis = document.getElementById('lap_jenis').value;
    const start = document.getElementById('lap_start').value;
    const end = document.getElementById('lap_end').value;
    
    document.getElementById('tabel_penjualan').style.display = jenis === 'penjualan' ? 'block' : 'none';
    document.getElementById('tabel_aruskas').style.display = jenis === 'aruskas' ? 'block' : 'none';

    try {
        const formatCurrency = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

        if (jenis === 'penjualan') {
            const sales = await window.posDB.getAllData('sales');
            const tbody = document.getElementById('laporanTableBody');
            let html = '';
            let grandTotal = 0;

            const filtered = sales.filter(s => {
                const dateStr = s.tanggal.split('T')[0];
                return dateStr >= start && dateStr <= end;
            });

            if (filtered.length === 0) {
                html = `<tr><td colspan="5" style="text-align:center;">Tidak ada data penjualan pada periode ini.</td></tr>`;
            } else {
                filtered.forEach(s => {
                    html += `
                        <tr>
                            <td>${s.invoice}</td>
                            <td>${new Date(s.tanggal).toLocaleString('id-ID')}</td>
                            <td>${s.kasir}</td>
                            <td>${s.metode_pembayaran}</td>
                            <td>${formatCurrency(s.grandTotal)}</td>
                        </tr>
                    `;
                    grandTotal += s.grandTotal;
                });
                document.getElementById('lap_grand_total').innerText = formatCurrency(grandTotal);
            }
            tbody.innerHTML = html;
        } else if (jenis === 'aruskas') {
            const cashFlow = await window.posDB.getAllData('cash_flow');
            const tbody = document.getElementById('laporanArusKasBody');
            let html = '';
            let totalMasuk = 0;
            let totalKeluar = 0;

            const filtered = cashFlow.filter(c => {
                const dateStr = c.tanggal.split('T')[0];
                return dateStr >= start && dateStr <= end;
            });

            // Sort by date ascending
            filtered.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

            if (filtered.length === 0) {
                html = `<tr><td colspan="6" style="text-align:center;">Tidak ada data arus kas pada periode ini.</td></tr>`;
            } else {
                filtered.forEach(c => {
                    const isMasuk = c.tipe === 'Masuk';
                    const color = isMasuk ? 'var(--success)' : 'var(--danger)';
                    if (isMasuk) totalMasuk += c.nominal;
                    else totalKeluar += c.nominal;
                    
                    html += `
                        <tr>
                            <td>${new Date(c.tanggal).toLocaleString('id-ID')}</td>
                            <td><span style="color: ${color}; font-weight: bold;">${c.tipe}</span></td>
                            <td>${c.kategori}</td>
                            <td>${c.keterangan}</td>
                            <td>${c.user}</td>
                            <td style="color: ${color}; font-weight: bold;">${formatCurrency(c.nominal)}</td>
                        </tr>
                    `;
                });
            }
            tbody.innerHTML = html;
            
            document.getElementById('tot_kas_masuk').innerText = formatCurrency(totalMasuk);
            document.getElementById('tot_kas_keluar').innerText = formatCurrency(totalKeluar);
            document.getElementById('tot_kas_saldo').innerText = formatCurrency(totalMasuk - totalKeluar);
        }

    } catch (err) {
        showToast('Gagal memuat laporan', 'error');
    }
};
