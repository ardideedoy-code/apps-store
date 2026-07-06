/**
 * pos.js
 * Logic for Point of Sale (Kasir) transactions.
 */

let cart = [];
let pajakSetting = 11;

window.renderPOS = async (container) => {
    // Load setting pajak
    try {
        const pjk = await window.posDB.getData('settings', 'pajak_default');
        if (pjk) pajakSetting = parseFloat(pjk.value);
    } catch(e) {}

    container.innerHTML = `
        <div style="display: flex; gap: 1.5rem; height: calc(100vh - 120px);">
            <!-- Left Side: Product Selection & Cart -->
            <div class="card" style="flex: 2; display: flex; flex-direction: column; margin-bottom: 0;">
                <div class="card-header flex justify-between items-center">
                    <div style="width: 100%; max-width: 400px; display: flex; gap: 0.5rem;">
                        <input type="text" id="pos_search" class="form-control" placeholder="Scan Barcode / Cari Nama Barang..." autofocus>
                        <button class="btn btn-primary" onclick="searchProductPOS()"><i class="fas fa-search"></i></button>
                    </div>
                </div>
                
                <div class="card-body" style="flex: 1; overflow-y: auto; padding: 0;">
                    <table class="table" style="width: 100%;">
                        <thead style="position: sticky; top: 0; background: var(--bg-main); z-index: 10;">
                            <tr>
                                <th>Barang</th>
                                <th>Harga</th>
                                <th style="width: 100px;">Qty</th>
                                <th>Subtotal</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="cartTableBody">
                            <!-- Cart Items Go Here -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Right Side: Summary & Payment -->
            <div class="card" style="flex: 1; display: flex; flex-direction: column; margin-bottom: 0; background-color: var(--bg-main);">
                <div class="card-body" style="display: flex; flex-direction: column; height: 100%;">
                    
                    <div style="flex: 1;">
                        <div class="flex justify-between mb-4">
                            <span class="text-muted">Subtotal</span>
                            <strong id="pos_subtotal">Rp 0</strong>
                        </div>
                        <div class="flex justify-between mb-4">
                            <span class="text-muted">Diskon Nota</span>
                            <div style="width: 120px;">
                                <input type="text" id="pos_diskon" class="form-control" style="text-align: right;" value="0" oninput="window.formatRibuan(this); calculateCart()">
                            </div>
                        </div>
                        <div class="flex justify-between mb-4">
                            <span class="text-muted">Pajak (${pajakSetting}%)</span>
                            <strong id="pos_pajak">Rp 0</strong>
                        </div>
                        <hr style="border-color: var(--border-color); margin: 1rem 0;">
                        <div class="flex justify-between" style="font-size: 1.5rem;">
                            <strong>Total</strong>
                            <strong id="pos_grand_total" class="text-primary">Rp 0</strong>
                        </div>
                    </div>

                    <div style="margin-top: 1.5rem;">
                        <button class="btn btn-danger w-full mb-4" onclick="clearCart()"><i class="fas fa-trash"></i> Batalkan Transaksi</button>
                        <button class="btn btn-primary w-full" style="height: 60px; font-size: 1.25rem;" onclick="showPaymentModal()"><i class="fas fa-money-bill-wave"></i> BAYAR</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Payment Modal -->
        <div id="modalPayment" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1000; justify-content:center; align-items:center;">
            <div class="card" style="width: 100%; max-width: 400px; margin: 2rem;">
                <div class="card-header">
                    <h3>Pembayaran</h3>
                    <button class="btn btn-outline" onclick="closePaymentModal()"><i class="fas fa-times"></i></button>
                </div>
                <div class="card-body">
                    <div class="form-group mb-4">
                        <label class="form-label">Total Tagihan</label>
                        <input type="text" id="pay_tagihan" class="form-control" style="font-size: 1.5rem; font-weight: bold; text-align:right;" readonly>
                    </div>
                    
                    <div class="form-group mb-4">
                        <label class="form-label">Metode Pembayaran</label>
                        <select id="pay_method" class="form-control">
                            <option value="Tunai">Tunai</option>
                            <option value="Transfer">Transfer</option>
                            <option value="QRIS">QRIS</option>
                            <option value="Debit">Debit</option>
                        </select>
                    </div>

                    <div class="form-group mb-4">
                        <label class="form-label">Jumlah Bayar</label>
                        <input type="text" id="pay_amount" class="form-control" style="font-size: 1.5rem; text-align:right;" oninput="window.formatRibuan(this); calculateChange()">
                    </div>

                    <div class="form-group mb-4">
                        <label class="form-label">Kembalian</label>
                        <input type="text" id="pay_change" class="form-control" style="font-size: 1.5rem; color: var(--success); text-align:right;" readonly value="Rp 0">
                    </div>

                    <button class="btn btn-primary w-full" style="height: 50px; font-size: 1.125rem;" onclick="processPayment()">Selesai & Cetak Struk</button>
                </div>
            </div>
        </div>

        <!-- Product Search Modal -->
        <div id="modalSearchProduct" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1000; justify-content:center; align-items:center;">
            <div class="card" style="width: 100%; max-width: 600px; max-height: 80vh; display: flex; flex-direction: column; margin: 2rem;">
                <div class="card-header">
                    <h3>Pilih Barang</h3>
                    <button class="btn btn-outline" onclick="closeSearchProductModal()"><i class="fas fa-times"></i></button>
                </div>
                <div class="card-body" style="overflow-y: auto;">
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Barang</th>
                                    <th>Stok</th>
                                    <th>Harga</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="searchProductList"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('pos_search').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchProductPOS();
        }
    });

    cart = [];
    renderCart();
};

window.searchProductPOS = async () => {
    const query = document.getElementById('pos_search').value.trim();
    if (!query) return;

    try {
        const products = await window.posDB.getAllData('products');
        
        // Exact match barcode or code
        const exactMatch = products.find(p => p.kode_barang === query || p.barcode === query);
        
        if (exactMatch) {
            addToCart(exactMatch);
            document.getElementById('pos_search').value = '';
            document.getElementById('pos_search').focus();
        } else {
            // Partial match on name
            const matches = products.filter(p => p.nama_barang.toLowerCase().includes(query.toLowerCase()));
            if (matches.length === 1) {
                addToCart(matches[0]);
                document.getElementById('pos_search').value = '';
                document.getElementById('pos_search').focus();
            } else if (matches.length > 1) {
                showSearchProductModal(matches);
            } else {
                showToast('Barang tidak ditemukan', 'error');
            }
        }
    } catch (err) {
        showToast('Terjadi kesalahan saat mencari barang', 'error');
    }
};

window.showSearchProductModal = (products) => {
    const tbody = document.getElementById('searchProductList');
    let html = '';
    products.forEach(p => {
        html += `
            <tr>
                <td>${p.nama_barang}<br><small class="text-muted">${p.kode_barang}</small></td>
                <td>${p.stok}</td>
                <td>${formatCurrency(p.harga_jual)}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="addToCartFromModal('${p.kode_barang}')">Pilih</button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
    
    // Store temporarily
    window.tempSearchProducts = products;
    document.getElementById('modalSearchProduct').style.display = 'flex';
};

window.closeSearchProductModal = () => {
    document.getElementById('modalSearchProduct').style.display = 'none';
};

window.addToCartFromModal = (kode) => {
    const p = window.tempSearchProducts.find(x => x.kode_barang === kode);
    if (p) {
        addToCart(p);
        closeSearchProductModal();
        document.getElementById('pos_search').value = '';
        document.getElementById('pos_search').focus();
    }
};

window.addToCart = (product) => {
    if (product.stok <= 0) {
        showToast('Stok barang habis (0)!', 'error');
        return;
    }

    const existing = cart.find(item => item.kode_barang === product.kode_barang);
    
    if (existing) {
        if (existing.qty + 1 > product.stok) {
            showToast('Kuantitas melebihi stok tersedia!', 'warning');
            return;
        }
        existing.qty += 1;
    } else {
        cart.push({
            kode_barang: product.kode_barang,
            nama_barang: product.nama_barang,
            harga: product.harga_jual,
            stok_tersedia: product.stok,
            qty: 1,
            diskon: 0
        });
    }
    renderCart();
};

window.updateCartQty = (kode, qty) => {
    const item = cart.find(x => x.kode_barang === kode);
    if (item) {
        let newQty = parseFloat(qty) || 1;
        if (newQty <= 0) newQty = 1;
        
        if (newQty > item.stok_tersedia) {
            showToast('Kuantitas melebihi stok yang tersedia!', 'warning');
            newQty = item.stok_tersedia;
            // update input visually
            renderCart();
        }
        
        item.qty = newQty;
        renderCart();
    }
};

window.removeCartItem = (kode) => {
    cart = cart.filter(x => x.kode_barang !== kode);
    renderCart();
};

window.clearCart = () => {
    if (cart.length > 0 && confirm('Kosongkan keranjang?')) {
        cart = [];
        document.getElementById('pos_diskon').value = 0;
        renderCart();
    }
};

window.formatCurrency = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
};

window.calculateCart = () => {
    let subtotal = 0;
    cart.forEach(item => {
        subtotal += (item.harga * item.qty) - item.diskon;
    });

    const diskonNota = window.parseRibuan(document.getElementById('pos_diskon').value);
    const dasarPengenaanPajak = subtotal - diskonNota;
    const pajak = (dasarPengenaanPajak * pajakSetting) / 100;
    const grandTotal = Math.round(dasarPengenaanPajak + pajak);

    document.getElementById('pos_subtotal').innerText = formatCurrency(subtotal);
    document.getElementById('pos_pajak').innerText = formatCurrency(pajak);
    document.getElementById('pos_grand_total').innerText = formatCurrency(grandTotal);

    // Save calculation state
    window.currentTransaction = {
        subtotal,
        diskonNota,
        pajak,
        grandTotal
    };
};

window.renderCart = () => {
    const tbody = document.getElementById('cartTableBody');
    let html = '';
    
    if (cart.length === 0) {
        html = `<tr><td colspan="5" style="text-align:center; padding: 2rem;">Keranjang kosong</td></tr>`;
    } else {
        cart.forEach(item => {
            const sub = (item.harga * item.qty) - item.diskon;
            html += `
                <tr>
                    <td>
                        <div style="font-weight: 500;">${item.nama_barang}</div>
                        <small class="text-muted">${item.kode_barang}</small>
                    </td>
                    <td>${formatCurrency(item.harga)}</td>
                    <td>
                        <input type="number" class="form-control" style="width: 70px; padding: 0.25rem;" value="${item.qty}" min="1" onchange="updateCartQty('${item.kode_barang}', this.value)">
                    </td>
                    <td>${formatCurrency(sub)}</td>
                    <td>
                        <button class="btn btn-danger" style="padding: 0.25rem 0.5rem;" onclick="removeCartItem('${item.kode_barang}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    }
    
    tbody.innerHTML = html;
    calculateCart();
};

window.showPaymentModal = () => {
    if (cart.length === 0) {
        showToast('Keranjang masih kosong', 'warning');
        return;
    }
    
    const gt = window.currentTransaction.grandTotal;
    document.getElementById('pay_tagihan').value = formatCurrency(gt);
    
    let payInput = document.getElementById('pay_amount');
    payInput.value = gt;
    window.formatRibuan(payInput);
    
    document.getElementById('modalPayment').style.display = 'flex';
    calculateChange();
    
    setTimeout(() => {
        document.getElementById('pay_amount').focus();
        document.getElementById('pay_amount').select();
    }, 100);
};

window.closePaymentModal = () => {
    document.getElementById('modalPayment').style.display = 'none';
};

window.calculateChange = () => {
    const bayar = window.parseRibuan(document.getElementById('pay_amount').value);
    const tagihan = window.currentTransaction.grandTotal;
    const kembalian = bayar - tagihan;
    
    const changeEl = document.getElementById('pay_change');
    if (kembalian < 0) {
        changeEl.value = 'Kurang: ' + formatCurrency(Math.abs(kembalian));
        changeEl.style.color = 'var(--danger)';
    } else {
        changeEl.value = formatCurrency(kembalian);
        changeEl.style.color = 'var(--success)';
    }
};

const generateInvoiceNumber = () => {
    const date = new Date();
    const ymd = date.getFullYear().toString() + (date.getMonth()+1).toString().padStart(2,'0') + date.getDate().toString().padStart(2,'0');
    return 'INV-' + ymd + '-' + Math.floor(Math.random() * 10000).toString().padStart(4,'0');
};

window.processPayment = async () => {
    const bayar = window.parseRibuan(document.getElementById('pay_amount').value);
    const tagihan = window.currentTransaction.grandTotal;
    
    if (bayar < tagihan) {
        showToast('Uang pembayaran kurang!', 'error');
        return;
    }
    
    const invoiceNumber = generateInvoiceNumber();
    const kembalian = bayar - tagihan;
    const method = document.getElementById('pay_method').value;
    const t = window.currentTransaction;

    const saleHeader = {
        invoice: invoiceNumber,
        tanggal: new Date().toISOString(),
        kasir: window.currentUser.username,
        subtotal: t.subtotal,
        diskon: t.diskonNota,
        pajak: t.pajak,
        grandTotal: t.grandTotal,
        bayar: bayar,
        kembalian: kembalian,
        metode_pembayaran: method
    };

    try {
        // 1. Save Header
        await window.posDB.addData('sales', saleHeader);
        
        // 2. Save Items and Deduct Stock
        for (const item of cart) {
            const saleItem = {
                invoice: invoiceNumber,
                kode_barang: item.kode_barang,
                nama_barang: item.nama_barang,
                harga: item.harga,
                qty: item.qty,
                diskon: item.diskon,
                subtotal: (item.harga * item.qty) - item.diskon
            };
            await window.posDB.addData('sales_items', saleItem);
            
            // Deduct stock
            const product = await window.posDB.getData('products', item.kode_barang);
            if (product) {
                product.stok -= item.qty;
                await window.posDB.putData('products', product);
            }
        }
        
        // 3. Log
        await window.posDB.addData('logs', {
            timestamp: new Date().toISOString(),
            user: window.currentUser.username,
            action: 'Penjualan: ' + invoiceNumber
        });

        // 3.5 Cash Flow (Penjualan = Kas Masuk)
        await window.posDB.addData('cash_flow', {
            tanggal: saleHeader.tanggal,
            tipe: 'Masuk',
            kategori: 'Penjualan',
            keterangan: 'Invoice: ' + invoiceNumber,
            nominal: saleHeader.grandTotal,
            user: window.currentUser.username
        });

        closePaymentModal();
        
        // 4. Print Receipt
        printReceipt(saleHeader, cart);
        
        // Reset Cart
        cart = [];
        document.getElementById('pos_diskon').value = 0;
        renderCart();
        
        showToast('Transaksi berhasil disimpan', 'success');

    } catch (err) {
        console.error(err);
        showToast('Gagal menyimpan transaksi', 'error');
    }
};

window.printReceipt = async (header, items) => {
    let namaToko = 'Toko Anda';
    let alamat = 'Alamat Toko';
    let footer = 'Terima kasih atas kunjungan Anda.';
    
    try {
        const sToko = await window.posDB.getData('settings', 'nama_toko');
        const sAlamat = await window.posDB.getData('settings', 'alamat_toko');
        const sFooter = await window.posDB.getData('settings', 'footer_struk');
        if(sToko) namaToko = sToko.value;
        if(sAlamat) alamat = sAlamat.value;
        if(sFooter) footer = sFooter.value;
    } catch(e) {}

    const printArea = document.getElementById('print-area');
    
    let itemsHtml = '';
    items.forEach(item => {
        itemsHtml += `
            <div style="display:flex; justify-content:space-between; margin-bottom: 2px;">
                <span>${item.nama_barang}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom: 5px;">
                <span>${item.qty} x ${formatCurrency(item.harga)}</span>
                <span>${formatCurrency(item.qty * item.harga)}</span>
            </div>
        `;
    });

    const receiptHtml = `
        <div style="width: 80mm; margin: 0 auto; padding: 10px; font-family: monospace; font-size: 12px; color: black; background: white;">
            <div style="text-align: center; margin-bottom: 10px;">
                <h2 style="margin: 0; font-size: 16px;">${namaToko}</h2>
                <p style="margin: 0;">${alamat}</p>
            </div>
            <hr style="border-top: 1px dashed black;">
            <div style="display:flex; justify-content:space-between; margin: 5px 0;">
                <span>No: ${header.invoice}</span>
                <span>${new Date(header.tanggal).toLocaleString('id-ID')}</span>
            </div>
            <div style="margin-bottom: 5px;">Kasir: ${header.kasir}</div>
            <hr style="border-top: 1px dashed black;">
            
            <div style="margin: 10px 0;">
                ${itemsHtml}
            </div>
            
            <hr style="border-top: 1px dashed black;">
            <div style="display:flex; justify-content:space-between; margin: 2px 0;">
                <span>Subtotal</span>
                <span>${formatCurrency(header.subtotal)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin: 2px 0;">
                <span>Diskon</span>
                <span>${formatCurrency(header.diskon)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin: 2px 0;">
                <span>Pajak</span>
                <span>${formatCurrency(header.pajak)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin: 5px 0; font-weight: bold; font-size: 14px;">
                <span>Total</span>
                <span>${formatCurrency(header.grandTotal)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin: 2px 0;">
                <span>Bayar (${header.metode_pembayaran})</span>
                <span>${formatCurrency(header.bayar)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin: 2px 0;">
                <span>Kembalian</span>
                <span>${formatCurrency(header.kembalian)}</span>
            </div>
            <hr style="border-top: 1px dashed black;">
            <div style="text-align: center; margin-top: 10px;">
                <p style="margin: 0;">${footer}</p>
            </div>
        </div>
    `;

    printArea.innerHTML = receiptHtml;
    window.print();
    printArea.innerHTML = ''; // clear after print
};
