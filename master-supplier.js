/**
 * master-supplier.js
 * Logic for managing suppliers.
 */

window.renderMasterSupplier = async (container) => {
    container.innerHTML = `
        <div class="card">
            <div class="card-body">
                <div class="flex justify-between items-center mb-4">
                    <h2>Data Supplier</h2>
                    <button class="btn btn-primary" onclick="showFormSupplier()"><i class="fas fa-plus"></i> Tambah Supplier</button>
                </div>
                
                <div class="flex justify-between items-center mb-4">
                    <input type="text" id="searchSupplier" class="form-control" style="max-width: 300px;" placeholder="Cari kode/nama supplier...">
                    <button class="btn btn-outline" onclick="loadDataSupplier()"><i class="fas fa-sync"></i> Refresh</button>
                </div>

                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Kode</th>
                                <th>Nama Supplier</th>
                                <th>Telepon</th>
                                <th>Alamat</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="tableSupplierBody">
                            <tr><td colspan="5" style="text-align:center;"><i class="fas fa-spinner fa-spin"></i> Memuat data...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <!-- Modal Form -->
        <div id="modalFormSupplier" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1000; justify-content:center; align-items:center;">
            <div class="card" style="width: 100%; max-width: 500px; margin: 2rem;">
                <div class="card-header">
                    <h3 id="formSupplierTitle">Tambah Supplier</h3>
                    <button class="btn btn-outline" onclick="closeFormSupplier()"><i class="fas fa-times"></i></button>
                </div>
                <div class="card-body">
                    <form id="formSupplier">
                        <input type="hidden" id="supp_is_edit" value="0">
                        
                        <div class="form-group mb-4">
                            <label class="form-label">Kode Supplier</label>
                            <input type="text" id="supp_kode" class="form-control" placeholder="Otomatis jika kosong">
                        </div>

                        <div class="form-group mb-4">
                            <label class="form-label">Nama Supplier <span class="text-danger">*</span></label>
                            <input type="text" id="supp_nama" class="form-control" required>
                        </div>

                        <div class="form-group mb-4">
                            <label class="form-label">Telepon / WhatsApp</label>
                            <input type="text" id="supp_telp" class="form-control">
                        </div>
                        
                        <div class="form-group mb-4">
                            <label class="form-label">Alamat</label>
                            <textarea id="supp_alamat" class="form-control" rows="3"></textarea>
                        </div>

                        <div class="flex justify-between" style="margin-top: 1.5rem;">
                            <button type="button" class="btn btn-outline" onclick="closeFormSupplier()">Batal</button>
                            <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Simpan</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.getElementById('searchSupplier').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        filterTableSupplier(query);
    });

    document.getElementById('formSupplier').addEventListener('submit', handleSimpanSupplier);
    loadDataSupplier();
};

window.loadDataSupplier = async () => {
    try {
        const items = await window.posDB.getAllData('suppliers');
        window.currentSuppliers = items; 
        renderTableSupplier(items);
    } catch (err) {
        showToast('Gagal memuat data supplier', 'error');
    }
};

const renderTableSupplier = (items) => {
    const tbody = document.getElementById('tableSupplierBody');
    if (!items || items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Tidak ada data supplier</td></tr>`;
        return;
    }

    let html = '';
    items.forEach(p => {
        html += `
            <tr>
                <td><b>${p.kode_supplier}</b></td>
                <td>${p.nama}</td>
                <td>${p.telepon || '-'}</td>
                <td>${p.alamat || '-'}</td>
                <td>
                    <button class="btn btn-outline" style="padding: 0.25rem 0.5rem;" onclick="editSupplier('${p.kode_supplier}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger" style="padding: 0.25rem 0.5rem;" onclick="hapusSupplier('${p.kode_supplier}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
};

const filterTableSupplier = (query) => {
    if (!window.currentSuppliers) return;
    const filtered = window.currentSuppliers.filter(p => {
        return (p.kode_supplier && p.kode_supplier.toLowerCase().includes(query)) ||
               (p.nama && p.nama.toLowerCase().includes(query));
    });
    renderTableSupplier(filtered);
};

window.showFormSupplier = () => {
    document.getElementById('formSupplier').reset();
    document.getElementById('supp_is_edit').value = "0";
    document.getElementById('supp_kode').readOnly = false;
    document.getElementById('formSupplierTitle').innerText = 'Tambah Supplier';
    document.getElementById('modalFormSupplier').style.display = 'flex';
};

window.closeFormSupplier = () => {
    document.getElementById('modalFormSupplier').style.display = 'none';
};

window.handleSimpanSupplier = async (e) => {
    e.preventDefault();
    
    const isEdit = document.getElementById('supp_is_edit').value === "1";
    let kode = document.getElementById('supp_kode').value.trim();
    
    if (!kode && !isEdit) kode = 'SUP' + Date.now().toString().slice(-6);
    
    const data = {
        kode_supplier: kode,
        nama: document.getElementById('supp_nama').value,
        telepon: document.getElementById('supp_telp').value,
        alamat: document.getElementById('supp_alamat').value
    };

    try {
        if (isEdit) {
            await window.posDB.putData('suppliers', data);
            showToast('Supplier berhasil diperbarui', 'success');
        } else {
            const exist = await window.posDB.getData('suppliers', kode);
            if (exist) { showToast('Kode sudah digunakan!', 'error'); return; }
            await window.posDB.addData('suppliers', data);
            showToast('Supplier berhasil ditambahkan', 'success');
        }
        closeFormSupplier();
        loadDataSupplier();
    } catch (err) {
        showToast('Terjadi kesalahan saat menyimpan', 'error');
    }
};

window.editSupplier = async (kode) => {
    try {
        const item = await window.posDB.getData('suppliers', kode);
        if (item) {
            document.getElementById('supp_is_edit').value = "1";
            document.getElementById('supp_kode').value = item.kode_supplier;
            document.getElementById('supp_kode').readOnly = true; 
            document.getElementById('supp_nama').value = item.nama;
            document.getElementById('supp_telp').value = item.telepon || '';
            document.getElementById('supp_alamat').value = item.alamat || '';

            document.getElementById('formSupplierTitle').innerText = 'Edit Supplier';
            document.getElementById('modalFormSupplier').style.display = 'flex';
        }
    } catch (err) {
        showToast('Gagal memuat detail', 'error');
    }
};

window.hapusSupplier = async (kode) => {
    if (confirm(`Hapus supplier ${kode}?`)) {
        try {
            await window.posDB.deleteData('suppliers', kode);
            showToast('Supplier berhasil dihapus', 'success');
            loadDataSupplier();
        } catch (err) {
            showToast('Gagal menghapus', 'error');
        }
    }
};
