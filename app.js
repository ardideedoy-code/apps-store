/**
 * app.js
 * Main SPA Router and Application Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize Database
        await window.posDB.initDB();
        console.log('Database initialized successfully.');
        
        // Check Authentication Status
        checkAuth();
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showToast('Gagal memuat database lokal', 'error');
    }
});

// Toast Notification System
window.showToast = (message, type = 'info') => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';

    toast.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// Utilities for currency formatting on inputs
window.formatRibuan = (input) => {
    let value = input.value.replace(/[^0-9]/g, '');
    if (value) {
        value = parseInt(value, 10).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    input.value = value;
};

window.parseRibuan = (value) => {
    if (!value) return 0;
    return parseInt(value.toString().replace(/\./g, ''), 10) || 0;
};

// Routing & Auth
const checkAuth = () => {
    const activeUser = sessionStorage.getItem('activeUser');
    const appContainer = document.getElementById('app');
    
    if (activeUser) {
        // Logged in
        window.currentUser = JSON.parse(activeUser);
        loadLayout(appContainer);
    } else {
        // Not logged in
        loadLogin(appContainer);
    }
};

const logout = () => {
    sessionStorage.removeItem('activeUser');
    window.currentUser = null;
    checkAuth();
};

// Load Login View
const loadLogin = (container) => {
    container.innerHTML = `
        <div class="login-container">
            <div class="login-card">
                <h2><i class="fas fa-cash-register"></i> POS System</h2>
                <form id="loginForm">
                    <div class="form-group">
                        <label class="form-label">Username</label>
                        <input type="text" id="username" class="form-control" required autofocus autocomplete="off">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input type="password" id="password" class="form-control" required>
                    </div>
                    <button type="submit" class="btn btn-primary w-full" style="margin-top: 1rem;">Login</button>
                </form>
            </div>
        </div>
    `;

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;

        try {
            const users = await window.posDB.getByIndex('users', 'username', user);
            if (users.length > 0 && users[0].password === pass) {
                // Success
                sessionStorage.setItem('activeUser', JSON.stringify(users[0]));
                
                // Log activity
                await window.posDB.addData('logs', {
                    timestamp: new Date().toISOString(),
                    user: users[0].username,
                    action: 'Login'
                });

                showToast('Login berhasil', 'success');
                checkAuth();
            } else {
                showToast('Username atau password salah', 'error');
            }
        } catch (err) {
            showToast('Terjadi kesalahan saat login', 'error');
        }
    });
};

// Load Main Layout
const loadLayout = (container) => {
    const isAdmin = window.currentUser.role === 'Administrator';
    
    container.innerHTML = `
        <div class="app-container">
            <!-- Sidebar -->
            <aside class="sidebar">
                <div class="sidebar-header">
                    <i class="fas fa-store"></i> <span style="margin-left:10px;">POS System</span>
                </div>
                <div class="sidebar-nav">
                    <div class="nav-item active" data-page="dashboard"><i class="fas fa-home"></i> Dashboard</div>
                    <div class="nav-item" data-page="pos"><i class="fas fa-cash-register"></i> POS Kasir</div>
                    
                    ${isAdmin ? `
                        <div class="nav-item" data-page="master-barang"><i class="fas fa-box"></i> Data Barang</div>
                        <div class="nav-item" data-page="master-supplier"><i class="fas fa-truck"></i> Data Supplier</div>
                        <div class="nav-item" data-page="master-pelanggan"><i class="fas fa-users"></i> Data Pelanggan</div>
                        <div class="nav-item" data-page="pembelian"><i class="fas fa-shopping-cart"></i> Pembelian</div>
                        <div class="nav-item" data-page="inventory"><i class="fas fa-exchange-alt"></i> Retur & Mutasi</div>
                        <div class="nav-item" data-page="kas"><i class="fas fa-wallet"></i> Kas & Bank</div>
                        <div class="nav-item" data-page="laporan"><i class="fas fa-chart-bar"></i> Laporan</div>
                    ` : ''}
                    
                    <div class="nav-item" data-page="pengaturan"><i class="fas fa-cog"></i> Pengaturan</div>
                    <div class="nav-item" style="color: var(--danger); margin-top: auto;" id="btnLogout">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </div>
                </div>
            </aside>

            <!-- Main Content -->
            <main class="main-wrapper">
                <header class="top-header">
                    <div>
                        <h3 id="page-title">Dashboard</h3>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="user-info">
                            <i class="fas fa-user-circle"></i> ${window.currentUser.nama} (${window.currentUser.role})
                        </div>
                        <button class="btn btn-outline" onclick="toggleTheme()" title="Toggle Theme">
                            <i class="fas fa-moon"></i>
                        </button>
                    </div>
                </header>
                
                <div class="content-area" id="main-content">
                    <!-- Page content will be loaded here -->
                </div>
            </main>
        </div>
    `;

    // Navigation Logic
    const navItems = document.querySelectorAll('.nav-item[data-page]');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            navItems.forEach(n => n.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            const page = e.currentTarget.getAttribute('data-page');
            document.getElementById('page-title').innerText = e.currentTarget.innerText;
            loadPage(page);
        });
    });

    document.getElementById('btnLogout').addEventListener('click', logout);

    // Default load Dashboard
    loadPage('dashboard');
};

const loadPage = (pageName) => {
    const content = document.getElementById('main-content');
    content.innerHTML = `<div style="text-align:center; padding: 2rem;"><i class="fas fa-spinner fa-spin fa-2x"></i><br>Loading...</div>`;
    
    // Simple routing (could be extracted to separate files in a larger app, but keeping here for simplicity/SPA nature)
    setTimeout(() => {
        try {
            switch(pageName) {
                case 'dashboard':
                    if (typeof window.renderDashboard === 'function') window.renderDashboard(content);
                    break;
                case 'pos':
                    if (typeof window.renderPOS === 'function') window.renderPOS(content);
                    break;
                case 'master-barang':
                    if (typeof window.renderMasterBarang === 'function') window.renderMasterBarang(content);
                    break;
                case 'master-supplier':
                    if (typeof window.renderMasterSupplier === 'function') window.renderMasterSupplier(content);
                    break;
                case 'master-pelanggan':
                    if (typeof window.renderMasterPelanggan === 'function') window.renderMasterPelanggan(content);
                    break;
                case 'pembelian':
                    if (typeof window.renderPembelian === 'function') window.renderPembelian(content);
                    break;
                case 'inventory':
                    if (typeof window.renderInventory === 'function') window.renderInventory(content);
                    break;
                case 'laporan':
                    if (typeof window.renderLaporan === 'function') window.renderLaporan(content);
                    break;
                case 'kas':
                    if (typeof window.renderKas === 'function') window.renderKas(content);
                    break;
                case 'pengaturan':
                    if (typeof window.renderPengaturan === 'function') window.renderPengaturan(content);
                    break;
                default:
                    content.innerHTML = `<h2>Under Construction</h2><p>Halaman ${pageName} belum tersedia.</p>`;
            }
        } catch (e) {
            content.innerHTML = `<div class="card p-4"><h3 class="text-danger">Error</h3><p>${e.message}</p></div>`;
            console.error(e);
        }
    }, 100);
};

// Theme toggle
window.toggleTheme = () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    if (isDark) {
        document.body.removeAttribute('data-theme');
    } else {
        document.body.setAttribute('data-theme', 'dark');
    }
};

// Removed placeholders
