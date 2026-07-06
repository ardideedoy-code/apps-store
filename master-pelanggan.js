/**
 * master-pelanggan.js
 * Logic for managing customers.
 */

window.renderMasterPelanggan = async (container) => {
    container.innerHTML = `
        <div class="card">
            <div class="card-body">
                <div class="flex justify-between items-center mb-4">
                    <h2>Data Pelanggan</h2>
                    <button class="btn btn-primary" onclick="showFormPelanggan()"><i class="fas fa-plus"></i> Tambah Pelanggan</button>
                </div>
                
                <div class="flex justify-between items-center mb-4">
                    <input type="text" id="searchPelanggan" class="form-control" style="max-width: 300px;" placeholder="Cari kode/nama pelanggan...">
                    <button class="btn btn-outline" onclick="loadDataPelanggan()"><i class="fas fa-sync"></i> Refresh</button>
                </div>

                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Kode</th>
                                <th>Nama Pelanggan</th>
                                <th>Telepon</th>
                                <th>Alamat</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="tablePelangganBody">
                            <tr><td colspan="5" style="text-align:center;"><i class="fas fa-spinner fa-spin"></i> Memuat data...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <!-- Modal Form -->
        <div id="modalFormPelanggan" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1000; justify-content:center; align-items:center;">
            <div class="card" style="width: 100%; max-width: 500px; margin: 2rem;">
                <div class="card-header">
                    <h3 id="formPelangganTitle">Tambah Pelanggan</h3>
                    <button class="btn btn-outline" onclick="closeFormPelanggan()"><i class="fas fa-times"></i></button>
                </div>
                <div class="card-body">
                    <form id="formPelanggan">
                        <input type="hidden" id="cust_is_edit" value="0">
                        
                        <div class="form-group mb-4">
                            <label class="form-label">Kode Pelanggan</label>
                            <input type="text" id="cust_kode" class="form-control" placeholder="Otomatis jika kosong">
                        </div>

                        <div class="form-group mb-4">
                            <label class="form-label">Nama Pelanggan <span class="text-danger">*</span></label>
                            <input type="text" id="cust_nama" class="form-control" required>
                        </div>

                        <div class="form-group mb-4">
                            <label class="form-label">Telepon / WhatsApp</label>
                            <input type="text" id="cust_telp" class="form-control">
                        </div>
                        
                        <div class="form-group mb-4">
                            <label class="form-label">Alamat</label>
                            <textarea id="cust_alamat" class="form-control" rows="3"></textarea>
                        </div>

                        <div class="flex justify-between" style="margin-top: 1.5rem;">
                            <button type="button" class="btn btn-outline" onclick="closeFormPelanggan()">Batal</button>
                            <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Simpan</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.getElementById('searchPelanggan').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        filterTablePelanggan(query);
    });

    document.getElementById('formPelanggan').addEventListener('submit', handleSimpanPelanggan);
    loadDataPelanggan();
};

window.loadDataPelanggan = async () => {
    try {
        const items = await window.posDB.getAllData('customers');
        window.currentCustomers = items; 
        renderTablePelanggan(items);
    } catch (err) {
        showToast('Gagal memuat data pelanggan', 'error');
    }
};

const renderTablePelanggan = (items) => {
    const tbody = document.getElementById('tablePelangganBody');
    if (!items || items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Tidak ada data pelanggan</td></tr>`;
        return;
    }

    let html = '';
    items.forEach(p => {
        html += `
            <tr>
                <td><b>${p.kode_pelanggan}</b></td>
                <td>${p.nama}</td>
                <td>${p.telepon || '-'}</td>
                <td>${p.alamat || '-'}</td>
                <td>
                    <button class="btn btn-outline" style="padding: 0.25rem 0.5rem;" onclick="editPelanggan('${p.kode_pelanggan}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger" style="padding: 0.25rem 0.5rem;" onclick="hapusPelanggan('${p.kode_pelanggan}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
};

const filterTablePelanggan = (query) => {
    if (!window.currentCustomers) return;
    const filtered = window.currentCustomers.filter(p => {
        return (p.kode_pelanggan && p.kode_pelanggan.toLowerCase().includes(query)) ||
               (p.nama && p.nama.toLowerCase().includes(query));
    });
    renderTablePelanggan(filtered);
};

window.showFormPelanggan = () => {
    document.getElementById('formPelanggan').reset();
    document.getElementById('cust_is_edit').value = "0";
    document.getElementById('cust_kode').readOnly = false;
    document.getElementById('formPelangganTitle').innerText = 'Tambah Pelanggan';
    document.getElementById('modalFormPelanggan').style.display = 'flex';
};

window.closeFormPelanggan = () => {
    document.getElementById('modalFormPelanggan').style.display = 'none';
};

window.handleSimpanPelanggan = async (e) => {
    e.preventDefault();
    
    const isEdit = document.getElementById('cust_is_edit').value === "1";
    let kode = document.getElementById('cust_kode').value.trim();
    
    if (!kode && !isEdit) kode = 'CUST' + Date.now().toString().slice(-6);
    
    const data = {
        kode_pelanggan: kode,
        nama: document.getElementById('cust_nama').value,
        telepon: document.getElementById('cust_telp').value,
        alamat: document.getElementById('cust_alamat').value
    };

    try {
        if (isEdit) {
            await window.posDB.putData('customers', data);
            showToast('Pelanggan berhasil diperbarui', 'success');
        } else {
            const exist = await window.posDB.getData('customers', kode);
            if (exist) { showToast('Kode sudah digunakan!', 'error'); return; }
            await window.posDB.addData('customers', data);
            showToast('Pelanggan berhasil ditambahkan', 'success');
        }
        closeFormPelanggan();
        loadDataPelanggan();
    } catch (err) {
        showToast('Terjadi kesalahan saat menyimpan', 'error');
    }
};

window.editPelanggan = async (kode) => {
    try {
        const item = await window.posDB.getData('customers', kode);
        if (item) {
            document.getElementById('cust_is_edit').value = "1";
            document.getElementById('cust_kode').value = item.kode_pelanggan;
            document.getElementById('cust_kode').readOnly = true; 
            document.getElementById('cust_nama').value = item.nama;
            document.getElementById('cust_telp').value = item.telepon || '';
            document.getElementById('cust_alamat').value = item.alamat || '';

            document.getElementById('formPelangganTitle').innerText = 'Edit Pelanggan';
            document.getElementById('modalFormPelanggan').style.display = 'flex';
        }
    } catch (err) {
        showToast('Gagal memuat detail', 'error');
    }
};

window.hapusPelanggan = async (kode) => {
    if (confirm(`Hapus pelanggan ${kode}?`)) {
        try {
            await window.posDB.deleteData('customers', kode);
            showToast('Pelanggan berhasil dihapus', 'success');
            loadDataPelanggan();
        } catch (err) {
            showToast('Gagal menghapus', 'error');
        }
    }
};
