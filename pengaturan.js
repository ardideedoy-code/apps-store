/**
 * pengaturan.js
 * Modul untuk Pengaturan Toko dan Manajemen Pengguna (Users)
 */

window.renderPengaturan = async (container) => {
    const isAdmin = window.currentUser && window.currentUser.role === 'Administrator';

    container.innerHTML = `
        <div class="card">
            <div class="card-body">
                <h2>Pengaturan Sistem</h2>
                <div class="flex gap-4 mb-4" style="border-bottom: 1px solid var(--border-color); padding-bottom: 1rem;">
                    <button class="btn btn-primary" id="btnTabToko" onclick="switchPengaturanTab('toko')"><i class="fas fa-store"></i> Pengaturan Toko</button>
                    ${isAdmin ? `<button class="btn btn-outline" id="btnTabUser" onclick="switchPengaturanTab('user')"><i class="fas fa-users"></i> Pengaturan User</button>` : ''}
                </div>
                
                <!-- Pengaturan Toko -->
                <div id="tabToko">
                    <form id="formToko" onsubmit="savePengaturanToko(event)">
                        <div class="form-group mb-4">
                            <label class="form-label">Nama Toko</label>
                            <input type="text" id="toko_nama" class="form-control" required>
                        </div>
                        <div class="form-group mb-4">
                            <label class="form-label">Alamat Toko</label>
                            <textarea id="toko_alamat" class="form-control" rows="3" required></textarea>
                        </div>
                        <div class="form-group mb-4">
                            <label class="form-label">Telepon / WhatsApp</label>
                            <input type="text" id="toko_telepon" class="form-control" required>
                        </div>
                        <div class="form-group mb-4">
                            <label class="form-label">Pajak Default (%)</label>
                            <input type="number" id="toko_pajak" class="form-control" value="0" min="0" max="100">
                        </div>
                        <div class="form-group mb-4">
                            <label class="form-label">Footer Struk</label>
                            <input type="text" id="toko_footer" class="form-control">
                        </div>
                        <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Simpan Pengaturan Toko</button>
                    </form>
                </div>

                <!-- Pengaturan User -->
                ${isAdmin ? `
                <div id="tabUser" style="display: none;">
                    <div class="flex justify-between items-center mb-4">
                        <h3>Daftar Pengguna</h3>
                        <button class="btn btn-primary" onclick="openUserModal()"><i class="fas fa-plus"></i> Tambah User</button>
                    </div>
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Nama Lengkap</th>
                                    <th>Role</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="userTableBody">
                                <tr><td colspan="4" style="text-align:center;">Loading...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>

        ${isAdmin ? `
        <!-- Modal Tambah/Edit User -->
        <div id="modalUser" class="modal" style="display: none;">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3 id="modalUserTitle">Tambah User Baru</h3>
                    <span class="close" onclick="closeUserModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="formUser" onsubmit="saveUser(event)">
                        <input type="hidden" id="user_id">
                        <div class="form-group mb-4">
                            <label class="form-label">Username <span class="text-danger">*</span></label>
                            <input type="text" id="user_username" class="form-control" required autocomplete="off">
                        </div>
                        <div class="form-group mb-4">
                            <label class="form-label">Nama Lengkap <span class="text-danger">*</span></label>
                            <input type="text" id="user_nama" class="form-control" required>
                        </div>
                        <div class="form-group mb-4">
                            <label class="form-label">Role <span class="text-danger">*</span></label>
                            <select id="user_role" class="form-control" required>
                                <option value="Administrator">Administrator</option>
                                <option value="Kasir">Kasir</option>
                            </select>
                        </div>
                        <div class="form-group mb-4">
                            <label class="form-label">Password <span class="text-danger">*</span></label>
                            <input type="password" id="user_password" class="form-control" placeholder="Kosongkan jika tidak ingin mengubah password (saat edit)" required autocomplete="new-password">
                        </div>
                        <div class="flex justify-end gap-2 mt-4">
                            <button type="button" class="btn btn-secondary" onclick="closeUserModal()">Batal</button>
                            <button type="submit" class="btn btn-primary">Simpan</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        ` : ''}
    `;
    
    await loadPengaturanToko();
    if (isAdmin) {
        await loadUsers();
    }
};

window.switchPengaturanTab = (tab) => {
    const isAdmin = window.currentUser && window.currentUser.role === 'Administrator';
    
    document.getElementById('tabToko').style.display = tab === 'toko' ? 'block' : 'none';
    
    const btnToko = document.getElementById('btnTabToko');
    btnToko.className = tab === 'toko' ? 'btn btn-primary' : 'btn btn-outline';

    if (isAdmin) {
        document.getElementById('tabUser').style.display = tab === 'user' ? 'block' : 'none';
        const btnUser = document.getElementById('btnTabUser');
        btnUser.className = tab === 'user' ? 'btn btn-primary' : 'btn btn-outline';
    }
};

// --- Logika Pengaturan Toko ---
window.loadPengaturanToko = async () => {
    try {
        const settings = await window.posDB.getAllData('settings');
        const getSet = (key, def) => {
            const s = settings.find(x => x.key === key);
            return s ? s.value : def;
        };

        document.getElementById('toko_nama').value = getSet('nama_toko', '');
        document.getElementById('toko_alamat').value = getSet('alamat_toko', '');
        document.getElementById('toko_telepon').value = getSet('telepon', '');
        document.getElementById('toko_pajak').value = getSet('pajak_default', 0);
        document.getElementById('toko_footer').value = getSet('footer_struk', '');
    } catch (err) {
        console.error(err);
    }
};

window.savePengaturanToko = async (e) => {
    e.preventDefault();
    try {
        const settingsToSave = [
            { key: 'nama_toko', value: document.getElementById('toko_nama').value },
            { key: 'alamat_toko', value: document.getElementById('toko_alamat').value },
            { key: 'telepon', value: document.getElementById('toko_telepon').value },
            { key: 'pajak_default', value: parseFloat(document.getElementById('toko_pajak').value) || 0 },
            { key: 'footer_struk', value: document.getElementById('toko_footer').value }
        ];

        for (const s of settingsToSave) {
            await window.posDB.putData('settings', s);
        }

        showToast('Pengaturan toko berhasil disimpan', 'success');
        
        // Refresh sidebar title if possible
        const storeNameEl = document.querySelector('.sidebar-header span');
        if (storeNameEl) {
            storeNameEl.innerText = settingsToSave[0].value;
        }
    } catch (err) {
        showToast('Gagal menyimpan pengaturan toko', 'error');
        console.error(err);
    }
};

// --- Logika Manajemen User ---
window.loadUsers = async () => {
    try {
        const users = await window.posDB.getAllData('users');
        const tbody = document.getElementById('userTableBody');
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Tidak ada data user.</td></tr>';
            return;
        }

        let html = '';
        users.forEach(u => {
            html += `
                <tr>
                    <td>${u.username}</td>
                    <td>${u.nama}</td>
                    <td><span class="badge" style="background-color: ${u.role === 'Administrator' ? 'var(--primary-color)' : 'var(--secondary-color)'}">${u.role}</span></td>
                    <td>
                        <button type="button" class="btn btn-secondary btn-sm" onclick='editUser(${JSON.stringify(u)})'><i class="fas fa-edit"></i> Edit</button>
                        ${u.username !== 'admin' ? `<button type="button" class="btn btn-danger btn-sm" onclick="deleteUser(${u.id})"><i class="fas fa-trash"></i> Hapus</button>` : ''}
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;

    } catch (err) {
        showToast('Gagal memuat data user', 'error');
        console.error(err);
    }
};

window.openUserModal = () => {
    document.getElementById('modalUserTitle').innerText = 'Tambah User Baru';
    document.getElementById('formUser').reset();
    document.getElementById('user_id').value = '';
    document.getElementById('user_password').required = true;
    document.getElementById('modalUser').style.display = 'flex';
};

window.closeUserModal = () => {
    document.getElementById('modalUser').style.display = 'none';
};

window.editUser = (user) => {
    document.getElementById('modalUserTitle').innerText = 'Edit User';
    document.getElementById('user_id').value = user.id;
    document.getElementById('user_username').value = user.username;
    document.getElementById('user_nama').value = user.nama;
    document.getElementById('user_role').value = user.role;
    document.getElementById('user_password').value = '';
    document.getElementById('user_password').required = false; // Optional on edit
    document.getElementById('modalUser').style.display = 'flex';
};

window.saveUser = async (e) => {
    e.preventDefault();
    const id = document.getElementById('user_id').value;
    const username = document.getElementById('user_username').value.trim();
    const nama = document.getElementById('user_nama').value.trim();
    const role = document.getElementById('user_role').value;
    const password = document.getElementById('user_password').value;

    try {
        const users = await window.posDB.getAllData('users');
        
        // Cek duplikasi username (kecuali id yang sama)
        const exists = users.find(u => u.username.toLowerCase() === username.toLowerCase() && String(u.id) !== id);
        if (exists) {
            showToast('Username sudah digunakan!', 'error');
            return;
        }

        if (id) {
            // Edit
            const existingUser = await window.posDB.getData('users', parseInt(id));
            if (existingUser) {
                existingUser.username = username;
                existingUser.nama = nama;
                existingUser.role = role;
                if (password) {
                    existingUser.password = password;
                }
                await window.posDB.putData('users', existingUser);
                showToast('User berhasil diperbarui', 'success');
            }
        } else {
            // Tambah
            await window.posDB.addData('users', {
                username: username,
                nama: nama,
                role: role,
                password: password
            });
            showToast('User berhasil ditambahkan', 'success');
        }

        closeUserModal();
        await loadUsers();
    } catch (err) {
        showToast('Terjadi kesalahan sistem', 'error');
        console.error(err);
    }
};

window.deleteUser = async (id) => {
    if (confirm('Yakin ingin menghapus user ini?')) {
        try {
            await window.posDB.deleteData('users', id);
            showToast('User berhasil dihapus', 'success');
            await loadUsers();
        } catch (err) {
            showToast('Gagal menghapus user', 'error');
            console.error(err);
        }
    }
};
