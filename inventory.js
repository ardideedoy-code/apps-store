/**
 * inventory.js
 * Logic for Stock Adjustments (Retur, Mutasi, Stock Opname).
 */

window.renderInventory = async (container) => {
    container.innerHTML = `
        <div class="card">
            <div class="card-body">
                <h2>Manajemen Inventori (Retur & Penyesuaian)</h2>
                <hr style="border-color: var(--border-color); margin: 1rem 0;">
                
                <form id="formInventory">
                    <div class="flex gap-4 mb-4">
                        <div class="form-group w-full">
                            <label class="form-label">Jenis Transaksi</label>
                            <select id="inv_type" class="form-control" onchange="toggleInvFields()">
                                <option value="Retur Penjualan">Retur Penjualan (Stok Masuk)</option>
                                <option value="Retur Pembelian">Retur Pembelian (Stok Keluar)</option>
                                <option value="Mutasi">Mutasi / Buang Rusak (Stok Keluar)</option>
                                <option value="Stock Opname">Stock Opname (Penyesuaian Fisik)</option>
                            </select>
                        </div>
                        <div class="form-group w-full">
                            <label class="form-label">No. Referensi / Invoice (Opsional)</label>
                            <input type="text" id="inv_ref" class="form-control">
                        </div>
                    </div>

                    <div class="flex gap-4 mb-4">
                        <div class="form-group w-full">
                            <label class="form-label">Pilih Barang</label>
                            <select id="inv_barang" class="form-control"></select>
                        </div>
                        <div class="form-group" style="width: 150px;">
                            <label class="form-label" id="lbl_qty">Qty Penyesuaian</label>
                            <input type="number" id="inv_qty" class="form-control" value="1" min="1">
                        </div>
                    </div>

                    <div class="form-group mb-4">
                        <label class="form-label">Keterangan / Alasan</label>
                        <textarea id="inv_alasan" class="form-control" rows="2" required></textarea>
                    </div>

                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Proses Penyesuaian Stok</button>
                </form>
            </div>
        </div>
    `;

    try {
        const products = await window.posDB.getAllData('products');
        const sel = document.getElementById('inv_barang');
        products.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.kode_barang;
            opt.text = `${p.kode_barang} - ${p.nama_barang} (Stok: ${p.stok})`;
            sel.appendChild(opt);
        });
    } catch (err) {
        showToast('Gagal memuat barang', 'error');
    }

    document.getElementById('formInventory').addEventListener('submit', handleInventoryProcess);
};

window.toggleInvFields = () => {
    const type = document.getElementById('inv_type').value;
    const lbl = document.getElementById('lbl_qty');
    if (type === 'Stock Opname') {
        lbl.innerText = 'Stok Fisik Aktual';
    } else {
        lbl.innerText = 'Qty Penyesuaian';
    }
};

window.handleInventoryProcess = async (e) => {
    e.preventDefault();

    const type = document.getElementById('inv_type').value;
    const ref = document.getElementById('inv_ref').value;
    const kode = document.getElementById('inv_barang').value;
    const qty = parseInt(document.getElementById('inv_qty').value);
    const alasan = document.getElementById('inv_alasan').value;

    if (!kode) {
        showToast('Pilih barang terlebih dahulu', 'error');
        return;
    }

    try {
        const prod = await window.posDB.getData('products', kode);
        if (!prod) {
            showToast('Barang tidak ditemukan', 'error');
            return;
        }

        let oldStok = prod.stok;
        let diff = 0;

        if (type === 'Retur Penjualan') {
            diff = qty; // barang kembali ke toko
        } else if (type === 'Retur Pembelian' || type === 'Mutasi') {
            diff = -qty; // barang keluar dari toko
        } else if (type === 'Stock Opname') {
            diff = qty - prod.stok; // qty adalah stok fisik
        }

        prod.stok += diff;

        if (prod.stok < 0) {
            showToast('Proses gagal: Stok tidak boleh minus!', 'error');
            return;
        }

        await window.posDB.putData('products', prod);

        // Catat di log (atau tabel khusus inventory movements jika ada)
        await window.posDB.addData('logs', {
            timestamp: new Date().toISOString(),
            user: window.currentUser.username,
            action: `${type} [${kode}] - Ref: ${ref} - Diff: ${diff} - Alasan: ${alasan}`
        });

        showToast(`${type} berhasil diproses. Stok akhir: ${prod.stok}`, 'success');
        document.getElementById('formInventory').reset();
        
        // Refresh dropdown
        renderInventory(document.getElementById('main-content'));

    } catch (err) {
        console.error(err);
        showToast('Gagal memproses penyesuaian stok', 'error');
    }
};
