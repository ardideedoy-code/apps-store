/**
 * kas.js
 * Pencatatan Kas Masuk dan Kas Keluar Manual
 */

window.renderKas = async (container) => {
    container.innerHTML = `
        <div class="card mb-4">
            <div class="card-body">
                <h2>Pencatatan Kas & Bank Manual</h2>
                <hr style="border-color: var(--border-color); margin: 1rem 0;">
                
                <form id="formKas" onsubmit="simpanKasManual(event)">
                    <div class="flex gap-4 mb-4">
                        <div class="form-group w-full">
                            <label class="form-label">Tanggal <span class="text-danger">*</span></label>
                            <input type="datetime-local" id="kas_tanggal" class="form-control" required>
                        </div>
                        <div class="form-group w-full">
                            <label class="form-label">Tipe Kas <span class="text-danger">*</span></label>
                            <select id="kas_tipe" class="form-control" required>
                                <option value="Masuk">Kas Masuk</option>
                                <option value="Keluar">Kas Keluar</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group mb-4">
                        <label class="form-label">Nominal (Rp) <span class="text-danger">*</span></label>
                        <input type="text" id="kas_nominal" class="form-control" required oninput="window.formatRibuan(this)">
                    </div>
                    <div class="form-group mb-4">
                        <label class="form-label">Keterangan / Catatan <span class="text-danger">*</span></label>
                        <textarea id="kas_keterangan" class="form-control" rows="3" required placeholder="Misal: Bayar listrik, Modal awal, dsb"></textarea>
                    </div>
                    <div class="flex justify-end">
                        <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Simpan Catatan Kas</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Set default tanggal to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('kas_tanggal').value = now.toISOString().slice(0, 16);
};

window.simpanKasManual = async (e) => {
    e.preventDefault();
    const tglInput = document.getElementById('kas_tanggal').value;
    const tipe = document.getElementById('kas_tipe').value;
    const nominal = window.parseRibuan(document.getElementById('kas_nominal').value);
    const keterangan = document.getElementById('kas_keterangan').value.trim();

    if (nominal <= 0) {
        showToast('Nominal harus lebih dari 0', 'warning');
        return;
    }

    const tgl = new Date(tglInput).toISOString();
    const kategori = tipe === 'Masuk' ? 'Manual Masuk' : 'Manual Keluar';

    const data = {
        tanggal: tgl,
        tipe: tipe,
        kategori: kategori,
        keterangan: keterangan,
        nominal: nominal,
        user: window.currentUser ? window.currentUser.username : 'Unknown'
    };

    try {
        await window.posDB.addData('cash_flow', data);
        showToast('Catatan Kas berhasil disimpan', 'success');
        
        // Reset
        document.getElementById('kas_nominal').value = '';
        document.getElementById('kas_keterangan').value = '';
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('kas_tanggal').value = now.toISOString().slice(0, 16);
    } catch (err) {
        showToast('Gagal menyimpan kas', 'error');
        console.error(err);
    }
};
