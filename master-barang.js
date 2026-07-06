/**
 * master-barang.js
 * Logic for managing products.
 */

window.renderMasterBarang = async (container) => {
    container.innerHTML = `
        <div class="card">
            <div class="card-body">
                <div class="flex justify-between items-center mb-4">
                    <h2>Data Barang</h2>
                    <button class="btn btn-primary" onclick="showFormBarang()"><i class="fas fa-plus"></i> Tambah Barang</button>
                </div>
                
                <div class="flex justify-between items-center mb-4">
                    <input type="text" id="searchBarang" class="form-control" style="max-width: 300px;" placeholder="Cari kode/nama/barcode...">
                    <button class="btn btn-outline" onclick="loadDataBarang()"><i class="fas fa-sync"></i> Refresh</button>
                </div>

                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Kode / Barcode</th>
                                <th>Nama Barang</th>
                                <th>Kategori</th>
                                <th>Stok</th>
                                <th>Harga Beli</th>
                                <th>Harga Jual</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="tableBarangBody">
                            <tr><td colspan="7" style="text-align:center;"><i class="fas fa-spinner fa-spin"></i> Memuat data...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <!-- Modal Form (Hidden by default) -->
        <div id="modalFormBarang" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1000; justify-content:center; align-items:center;">
            <div class="card" style="width: 100%; max-width: 600px; max-height: 90vh; overflow-y:auto; margin: 2rem;">
                <div class="card-header">
                    <h3 id="formBarangTitle">Tambah Barang</h3>
                    <button class="btn btn-outline" onclick="closeFormBarang()"><i class="fas fa-times"></i></button>
                </div>
                <div class="card-body">
                    <form id="formBarang">
                        <input type="hidden" id="barang_is_edit" value="0">
                        
                        <div class="flex gap-4 mb-4">
                            <div class="form-group w-full">
                                <label class="form-label">Kode Barang</label>
                                <input type="text" id="barang_kode" class="form-control" placeholder="Otomatis jika kosong">
                            </div>
                            <div class="form-group w-full">
                                <label class="form-label">Barcode</label>
                                <input type="text" id="barang_barcode" class="form-control">
                            </div>
                        </div>

                        <div class="form-group mb-4">
                            <label class="form-label">Nama Barang <span class="text-danger">*</span></label>
                            <input type="text" id="barang_nama" class="form-control" required>
                        </div>

                        <div class="flex gap-4 mb-4">
                            <div class="form-group w-full">
                                <label class="form-label">Kategori</label>
                                <input type="text" id="barang_kategori" class="form-control" list="kategoriList">
                                <datalist id="kategoriList">
                                    <option value="Makanan">
                                    <option value="Minuman">
                                    <option value="Elektronik">
                                    <option value="Alat Tulis">
                                </datalist>
                            </div>
                            <div class="form-group w-full">
                                <label class="form-label">Satuan</label>
                                <input type="text" id="barang_satuan" class="form-control" value="PCS">
                            </div>
                        </div>
                        
                        <div class="flex gap-4 mb-4">
                            <div class="form-group w-full">
                                <label class="form-label">Harga Modal <span class="text-danger">*</span></label>
                                <input type="text" id="barang_harga_modal" class="form-control" required oninput="window.formatRibuan(this)">
                            </div>
                            <div class="form-group w-full">
                                <label class="form-label">Harga Jual <span class="text-danger">*</span></label>
                                <input type="text" id="barang_harga_jual" class="form-control" required oninput="window.formatRibuan(this)">
                            </div>
                        </div>

                        <div class="flex gap-4 mb-4">
                            <div class="form-group w-full">
                                <label class="form-label">Stok Awal</label>
                                <input type="number" id="barang_stok" class="form-control" value="0" min="0">
                            </div>
                            <div class="form-group w-full">
                                <label class="form-label">Stok Minimum</label>
                                <input type="number" id="barang_stok_min" class="form-control" value="5" min="0">
                            </div>
                        </div>

                        <div class="flex justify-between" style="margin-top: 1.5rem;">
                            <button type="button" class="btn btn-outline" onclick="closeFormBarang()">Batal</button>
                            <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Simpan</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    // Initialize listeners
    document.getElementById('searchBarang').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        filterTableBarang(query);
    });

    document.getElementById('formBarang').addEventListener('submit', handleSimpanBarang);

    // Load Data
    loadDataBarang();
};

window.loadDataBarang = async () => {
    try {
        const products = await window.posDB.getAllData('products');
        window.currentProducts = products; // Save for filtering
        renderTableBarang(products);
    } catch (err) {
        console.error(err);
        showToast('Gagal memuat data barang', 'error');
    }
};

window.formatCurrency = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
};

const renderTableBarang = (products) => {
    const tbody = document.getElementById('tableBarangBody');
    if (!products || products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Tidak ada data barang</td></tr>`;
        return;
    }

    let html = '';
    products.forEach(p => {
        let stokClass = '';
        if (p.stok <= p.minimum_stok) {
            stokClass = 'text-danger';
        }
        
        html += `
            <tr>
                <td>
                    <b>${p.kode_barang}</b>
                    ${p.barcode ? `<br><small class="text-muted">${p.barcode}</small>` : ''}
                </td>
                <td>${p.nama_barang}</td>
                <td>${p.kategori || '-'}</td>
                <td class="${stokClass}"><b>${p.stok}</b> ${p.satuan}</td>
                <td>${formatCurrency(p.harga_modal)}</td>
                <td>${formatCurrency(p.harga_jual)}</td>
                <td>
                    <button class="btn btn-outline" style="padding: 0.25rem 0.5rem;" onclick="editBarang('${p.kode_barang}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger" style="padding: 0.25rem 0.5rem;" onclick="hapusBarang('${p.kode_barang}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
};

const filterTableBarang = (query) => {
    if (!window.currentProducts) return;
    const filtered = window.currentProducts.filter(p => {
        return (p.kode_barang && p.kode_barang.toLowerCase().includes(query)) ||
               (p.barcode && p.barcode.toLowerCase().includes(query)) ||
               (p.nama_barang && p.nama_barang.toLowerCase().includes(query));
    });
    renderTableBarang(filtered);
};

window.showFormBarang = () => {
    document.getElementById('formBarang').reset();
    document.getElementById('barang_is_edit').value = "0";
    document.getElementById('barang_kode').readOnly = false;
    document.getElementById('formBarangTitle').innerText = 'Tambah Barang';
    document.getElementById('modalFormBarang').style.display = 'flex';
};

window.closeFormBarang = () => {
    document.getElementById('modalFormBarang').style.display = 'none';
};

const generateKodeBarang = () => {
    return 'BRG' + Date.now().toString().slice(-6);
};

window.handleSimpanBarang = async (e) => {
    e.preventDefault();
    
    const isEdit = document.getElementById('barang_is_edit').value === "1";
    let kode = document.getElementById('barang_kode').value.trim();
    
    if (!kode && !isEdit) {
        kode = generateKodeBarang();
    }
    
    const data = {
        kode_barang: kode,
        barcode: document.getElementById('barang_barcode').value,
        nama_barang: document.getElementById('barang_nama').value,
        kategori: document.getElementById('barang_kategori').value,
        satuan: document.getElementById('barang_satuan').value,
        harga_modal: window.parseRibuan(document.getElementById('barang_harga_modal').value),
        harga_jual: window.parseRibuan(document.getElementById('barang_harga_jual').value),
        stok: parseInt(document.getElementById('barang_stok').value) || 0,
        minimum_stok: parseInt(document.getElementById('barang_stok_min').value) || 0,
        updated_at: new Date().toISOString()
    };

    try {
        if (isEdit) {
            await window.posDB.putData('products', data);
            showToast('Barang berhasil diperbarui', 'success');
        } else {
            // Cek apakah kode sudah ada
            const exist = await window.posDB.getData('products', kode);
            if (exist) {
                showToast('Kode barang sudah digunakan!', 'error');
                return;
            }
            await window.posDB.addData('products', data);
            showToast('Barang berhasil ditambahkan', 'success');
        }
        
        // Log action
        await window.posDB.addData('logs', {
            timestamp: new Date().toISOString(),
            user: window.currentUser.username,
            action: isEdit ? 'Edit Barang: ' + kode : 'Tambah Barang: ' + kode
        });

        closeFormBarang();
        loadDataBarang();
    } catch (err) {
        console.error(err);
        showToast('Terjadi kesalahan saat menyimpan barang', 'error');
    }
};

window.editBarang = async (kode) => {
    try {
        const item = await window.posDB.getData('products', kode);
        if (item) {
            document.getElementById('barang_is_edit').value = "1";
            document.getElementById('barang_kode').value = item.kode_barang;
            document.getElementById('barang_kode').readOnly = true; // Prevent changing PK
            document.getElementById('barang_barcode').value = item.barcode || '';
            document.getElementById('barang_nama').value = item.nama_barang;
            document.getElementById('barang_kategori').value = item.kategori || '';
            document.getElementById('barang_satuan').value = item.satuan || 'PCS';
            
            const modalEl = document.getElementById('barang_harga_modal');
            modalEl.value = item.harga_modal;
            window.formatRibuan(modalEl);
            
            const jualEl = document.getElementById('barang_harga_jual');
            jualEl.value = item.harga_jual;
            window.formatRibuan(jualEl);
            
            document.getElementById('barang_stok').value = item.stok;
            document.getElementById('barang_stok_min').value = item.minimum_stok || 0;

            document.getElementById('formBarangTitle').innerText = 'Edit Barang';
            document.getElementById('modalFormBarang').style.display = 'flex';
        }
    } catch (err) {
        showToast('Gagal memuat detail barang', 'error');
    }
};

window.hapusBarang = async (kode) => {
    if (confirm(`Apakah Anda yakin ingin menghapus barang dengan kode ${kode}?`)) {
        try {
            await window.posDB.deleteData('products', kode);
            showToast('Barang berhasil dihapus', 'success');
            
            await window.posDB.addData('logs', {
                timestamp: new Date().toISOString(),
                user: window.currentUser.username,
                action: 'Hapus Barang: ' + kode
            });

            loadDataBarang();
        } catch (err) {
            showToast('Gagal menghapus barang', 'error');
        }
    }
};
