/**
 * backup.js
 * Logic for Backup, Restore, and Settings.
 */

window.renderPengaturan = async (container) => {
    container.innerHTML = `
        <div class="card mb-4">
            <div class="card-header">
                <h3>Pengaturan Toko</h3>
            </div>
            <div class="card-body">
                <form id="formSettings">
                    <div class="form-group">
                        <label class="form-label">Nama Toko</label>
                        <input type="text" id="set_nama" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Alamat</label>
                        <textarea id="set_alamat" class="form-control"></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Telepon</label>
                        <input type="text" id="set_telp" class="form-control">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Pajak Default (%)</label>
                        <input type="number" id="set_pajak" class="form-control" min="0" max="100">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Footer Struk</label>
                        <input type="text" id="set_footer" class="form-control">
                    </div>
                    <button type="submit" class="btn btn-primary mt-2"><i class="fas fa-save"></i> Simpan Pengaturan</button>
                </form>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h3>Backup & Restore Database</h3>
            </div>
            <div class="card-body">
                <p class="text-muted mb-4">Pastikan Anda rutin melakukan backup data untuk mencegah kehilangan data jika browser membersihkan cache.</p>
                <div class="flex gap-4">
                    <button class="btn btn-success" onclick="backupData()"><i class="fas fa-download"></i> Backup Database (JSON)</button>
                    
                    <div style="position: relative; overflow: hidden; display: inline-block;">
                        <button class="btn btn-warning"><i class="fas fa-upload"></i> Restore Database</button>
                        <input type="file" id="fileRestore" accept=".json" style="position: absolute; left: 0; top: 0; opacity: 0; cursor: pointer; height: 100%;" onchange="restoreData(this)">
                    </div>
                </div>
            </div>
        </div>
    `;

    // Load Settings
    try {
        const settings = await window.posDB.getAllData('settings');
        settings.forEach(s => {
            if(s.key === 'nama_toko') document.getElementById('set_nama').value = s.value;
            if(s.key === 'alamat_toko') document.getElementById('set_alamat').value = s.value;
            if(s.key === 'telepon') document.getElementById('set_telp').value = s.value;
            if(s.key === 'pajak_default') document.getElementById('set_pajak').value = s.value;
            if(s.key === 'footer_struk') document.getElementById('set_footer').value = s.value;
        });

        document.getElementById('formSettings').addEventListener('submit', async (e) => {
            e.preventDefault();
            await window.posDB.putData('settings', { key: 'nama_toko', value: document.getElementById('set_nama').value });
            await window.posDB.putData('settings', { key: 'alamat_toko', value: document.getElementById('set_alamat').value });
            await window.posDB.putData('settings', { key: 'telepon', value: document.getElementById('set_telp').value });
            await window.posDB.putData('settings', { key: 'pajak_default', value: document.getElementById('set_pajak').value });
            await window.posDB.putData('settings', { key: 'footer_struk', value: document.getElementById('set_footer').value });
            showToast('Pengaturan berhasil disimpan', 'success');
        });
    } catch (e) {
        console.error(e);
    }
};

window.backupData = async () => {
    try {
        const data = {
            version: 1,
            date: new Date().toISOString(),
            users: await window.posDB.getAllData('users'),
            products: await window.posDB.getAllData('products'),
            suppliers: await window.posDB.getAllData('suppliers'),
            customers: await window.posDB.getAllData('customers'),
            sales: await window.posDB.getAllData('sales'),
            sales_items: await window.posDB.getAllData('sales_items'),
            settings: await window.posDB.getAllData('settings')
        };

        const jsonStr = JSON.stringify(data);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `Backup_POS_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        showToast('Backup berhasil diunduh', 'success');
    } catch (err) {
        showToast('Gagal membuat backup', 'error');
    }
};

window.restoreData = async (input) => {
    if (input.files.length === 0) return;
    
    const file = input.files[0];
    if (confirm(`Apakah Anda yakin ingin me-restore data dari ${file.name}? Data saat ini mungkin tertimpa.`)) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Very basic validation
                if (!data.version) throw new Error("Invalid backup format");

                // We assume sequential restoration, you can improve by clearing stores first
                
                if(data.products) {
                    for(const p of data.products) {
                        await window.posDB.putData('products', p);
                    }
                }
                if(data.sales) {
                    for(const s of data.sales) {
                        await window.posDB.putData('sales', s);
                    }
                }
                if(data.sales_items) {
                    for(const si of data.sales_items) {
                        await window.posDB.putData('sales_items', si);
                    }
                }
                
                showToast('Restore berhasil! Silakan muat ulang halaman.', 'success');
                setTimeout(() => window.location.reload(), 2000);

            } catch (err) {
                console.error(err);
                showToast('Gagal restore: File rusak atau tidak kompatibel', 'error');
            }
            input.value = ''; // reset
        };
        reader.readAsText(file);
    } else {
        input.value = ''; // reset
    }
};
