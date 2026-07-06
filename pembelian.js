/**
 * pembelian.js
 * Logic for Purchases (Pembelian) which adds stock.
 */

window.renderPembelian = async (container) => {
    container.innerHTML = `
        <div class="card">
            <div class="card-body">
                <h2>Pembelian Barang Baru (Masuk Gudang)</h2>
                <hr style="border-color: var(--border-color); margin: 1rem 0;">
                
                <form id="formPembelian">
                    <div class="flex gap-4 mb-4">
                        <div class="form-group w-full">
                            <label class="form-label">No. Invoice / Pembelian</label>
                            <input type="text" id="beli_invoice" class="form-control" placeholder="Otomatis jika kosong">
                        </div>
                        <div class="form-group w-full">
                            <label class="form-label">Supplier</label>
                            <select id="beli_supplier" class="form-control">
                                <option value="">Pilih Supplier (Opsional)</option>
                            </select>
                        </div>
                    </div>

                    <div class="card mb-4" style="background-color: var(--bg-main);">
                        <div class="card-body">
                            <h4 class="mb-4">Tambah Item Barang</h4>
                            <div class="flex gap-4">
                                <div class="form-group" style="flex: 2;">
                                    <label class="form-label">Pilih Barang</label>
                                    <select id="beli_barang_select" class="form-control"></select>
                                </div>
                                <div class="form-group" style="width: 100px;">
                                    <label class="form-label">Qty</label>
                                    <input type="number" id="beli_qty" class="form-control" value="1" min="1">
                                </div>
                                <div class="form-group" style="flex: 1; min-width: 150px;">
                                    <label class="form-label">Harga Beli (Rp)</label>
                                    <input type="text" id="beli_harga" class="form-control" value="0" oninput="window.formatRibuan(this)">
                                </div>
                                <div class="form-group" style="display: flex; align-items: flex-end;">
                                    <button type="button" class="btn btn-secondary" onclick="addBeliItem()"><i class="fas fa-plus"></i> Tambah</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="table-responsive mb-4">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Kode Barang</th>
                                    <th>Nama Barang</th>
                                    <th>Qty Masuk</th>
                                    <th>Harga Beli</th>
                                    <th>Subtotal</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="beliTableBody">
                                <tr><td colspan="6" style="text-align:center;">Belum ada item</td></tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="flex justify-between items-center" style="margin-top: 1.5rem;">
                        <h3>Total: <span id="beli_total_harga" class="text-primary">Rp 0</span></h3>
                        <button type="button" class="btn btn-primary" onclick="simpanPembelian()"><i class="fas fa-save"></i> Proses Pembelian</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    window.beliCart = [];
    
    try {
        // Load suppliers
        const suppliers = await window.posDB.getAllData('suppliers');
        const selSup = document.getElementById('beli_supplier');
        suppliers.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.kode_supplier;
            opt.text = s.nama;
            selSup.appendChild(opt);
        });

        // Load products
        const products = await window.posDB.getAllData('products');
        window.beliProductsList = products;
        const selPrd = document.getElementById('beli_barang_select');
        products.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.kode_barang;
            opt.text = `${p.kode_barang} - ${p.nama_barang}`;
            opt.dataset.harga = p.harga_modal;
            opt.dataset.nama = p.nama_barang;
            selPrd.appendChild(opt);
        });

        // Auto update harga on select change
        selPrd.addEventListener('change', (e) => {
            const selectedOpt = e.target.options[e.target.selectedIndex];
            if (selectedOpt) {
                const el = document.getElementById('beli_harga');
                el.value = selectedOpt.dataset.harga || 0;
                window.formatRibuan(el);
            }
        });
        
        // Trigger default select
        if (selPrd.options.length > 0) {
            selPrd.dispatchEvent(new Event('change'));
        }

    } catch (err) {
        showToast('Gagal memuat data master', 'error');
    }
};

window.addBeliItem = async () => {
    const sel = document.getElementById('beli_barang_select');
    if (sel.selectedIndex === -1) {
        showToast('Pilih barang terlebih dahulu', 'warning');
        return;
    }
    
    const opt = sel.options[sel.selectedIndex];
    const kode = opt.value;
    const nama = opt.dataset.nama;
    const qty = parseInt(document.getElementById('beli_qty').value) || 1;
    const harga = window.parseRibuan(document.getElementById('beli_harga').value);
    
    const existing = window.beliCart.find(x => x.kode_barang === kode);
    if (existing) {
        existing.qty += qty;
        existing.harga = harga; // Update dengan harga terakhir
    } else {
        window.beliCart.push({
            kode_barang: kode,
            nama_barang: nama,
            qty: qty,
            harga: harga
        });
    }
    
    renderBeliCart();
};

window.removeBeliItem = (kode) => {
    window.beliCart = window.beliCart.filter(x => x.kode_barang !== kode);
    renderBeliCart();
};

window.formatCurrency = window.formatCurrency || ((num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num));

window.renderBeliCart = () => {
    const tbody = document.getElementById('beliTableBody');
    let html = '';
    let total = 0;
    
    if (window.beliCart.length === 0) {
        html = `<tr><td colspan="6" style="text-align:center;">Belum ada item</td></tr>`;
    } else {
        window.beliCart.forEach(item => {
            const sub = item.qty * item.harga;
            total += sub;
            html += `
                <tr>
                    <td>${item.kode_barang}</td>
                    <td>${item.nama_barang}</td>
                    <td>${item.qty}</td>
                    <td>${formatCurrency(item.harga)}</td>
                    <td>${formatCurrency(sub)}</td>
                    <td><button type="button" class="btn btn-danger btn-sm" onclick="removeBeliItem('${item.kode_barang}')"><i class="fas fa-trash"></i></button></td>
                </tr>
            `;
        });
    }
    
    tbody.innerHTML = html;
    document.getElementById('beli_total_harga').innerText = formatCurrency(total);
};

window.simpanPembelian = async () => {
    if (window.beliCart.length === 0) {
        showToast('Keranjang pembelian kosong!', 'error');
        return;
    }

    let invoice = document.getElementById('beli_invoice').value.trim();
    if (!invoice) invoice = 'PO-' + Date.now().toString();
    const supplier = document.getElementById('beli_supplier').value;

    const purchaseHeader = {
        nomor_pembelian: invoice,
        tanggal: new Date().toISOString(),
        supplier: supplier
    };

    try {
        await window.posDB.addData('purchases', purchaseHeader);

        let totalPembelian = 0;
        for (const item of window.beliCart) {
            totalPembelian += (item.harga * item.qty);
            // Log ke purchase items
            await window.posDB.addData('purchase_items', {
                nomor_pembelian: invoice,
                kode_barang: item.kode_barang,
                qty: item.qty,
                harga: item.harga
            });
            
            // Tambah stok ke master product & perbarui harga beli rata-rata/terbaru
            const prod = await window.posDB.getData('products', item.kode_barang);
            if (prod) {
                prod.stok += item.qty;
                prod.harga_modal = item.harga; // Update harga modal
                await window.posDB.putData('products', prod);
            }
        }
        
        await window.posDB.addData('logs', {
            timestamp: new Date().toISOString(),
            user: window.currentUser.username,
            action: 'Pembelian Masuk: ' + invoice
        });

        // Cash Flow (Pembelian = Kas Keluar)
        await window.posDB.addData('cash_flow', {
            tanggal: purchaseHeader.tanggal,
            tipe: 'Keluar',
            kategori: 'Pembelian',
            keterangan: 'Invoice Pembelian: ' + invoice,
            nominal: totalPembelian,
            user: window.currentUser.username
        });

        showToast('Pembelian berhasil diproses. Stok bertambah.', 'success');
        
        // Reset form
        window.beliCart = [];
        renderBeliCart();
        document.getElementById('beli_invoice').value = '';

    } catch (err) {
        showToast('Gagal memproses pembelian', 'error');
        console.error(err);
    }
};
