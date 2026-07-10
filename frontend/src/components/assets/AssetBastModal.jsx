import React from 'react';
import { createPortal } from 'react-dom';
import { FileText } from 'lucide-react';

export default function AssetBastModal({
  isBastModalOpen, bastAsset, onClose,
  bastDocNum, setBastDocNum,
  bastAgentName, setBastAgentName,
  bastNotes, setBastNotes,
  handlePrintBast,
  formatIndonesianDate,
  user,
}) {
  if (!isBastModalOpen || !bastAsset) return null;

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 overflow-y-auto print-modal-wrapper">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-250 dark:border-slate-800/80 shadow-2xl w-full max-w-5xl overflow-hidden animate-slide-up flex flex-col md:flex-row print-modal-content">

          {/* Left Panel: Config (no-print) */}
          <div className="w-full md:w-80 bg-gray-50/50 dark:bg-slate-950/20 p-6 border-b md:border-b-0 md:border-r border-gray-200 dark:border-slate-800 flex flex-col justify-between gap-5 no-print">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">BAST Generator</h3>
                  <p className="text-[10px] text-gray-400 font-semibold">Kustomisasi Dokumen Serah Terima</p>
                </div>
              </div>

              <hr className="border-gray-200 dark:border-slate-800" />

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider block">No. BAST *</label>
                  <input type="text" value={bastDocNum} onChange={(e) => setBastDocNum(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-955/40 border border-gray-250 dark:border-slate-800/80 text-gray-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider block">Yang Menyerahkan (IT Agent) *</label>
                  <input type="text" value={bastAgentName} onChange={(e) => setBastAgentName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-955/40 border border-gray-250 dark:border-slate-800/80 text-gray-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider block">Catatan Kelengkapan Unit</label>
                  <textarea value={bastNotes} onChange={(e) => setBastNotes(e.target.value)} placeholder="e.g. Kondisi mulus, kelengkapan: Charger Adaptor, Tas Laptop, Mouse wireless..." rows="4"
                    className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-955/40 border border-gray-250 dark:border-slate-800/80 text-gray-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition font-sans" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button onClick={handlePrintBast} className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-rose-500/10" style={{ backgroundColor: '#f43f5e', color: '#ffffff' }}>
                Cetak BAST (Print)
              </button>
              <button onClick={onClose} className="w-full py-2 border border-gray-250 dark:border-slate-850 hover:bg-gray-100 dark:hover:bg-slate-800/50 text-gray-655 dark:text-slate-350 text-xs font-bold rounded-xl transition">
                Tutup
              </button>
            </div>
          </div>

          {/* Right Panel: A4 Preview */}
          <div className="flex-1 bg-gray-100/70 dark:bg-slate-950/10 p-6 overflow-y-auto max-h-[85vh] flex justify-center items-start print-preview-container">

            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                body { background: white !important; color: black !important; }
                .no-print, .no-print * { display: none !important; visibility: hidden !important; }
                #root { display: none !important; }
                .print-modal-wrapper { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; height: auto !important; background: white !important; z-index: 9999 !important; overflow: visible !important; display: block !important; padding: 0 !important; margin: 0 !important; box-shadow: none !important; border: none !important; }
                .print-modal-content { border: none !important; box-shadow: none !important; width: 100% !important; max-width: 100% !important; background: white !important; display: block !important; }
                .print-preview-container { background: white !important; padding: 0 !important; margin: 0 !important; max-height: none !important; overflow: visible !important; display: block !important; width: 100% !important; }
                #bast-print-area { display: block !important; visibility: visible !important; width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 30px !important; box-shadow: none !important; border: none !important; background: white !important; color: black !important; font-size: 11pt !important; line-height: 1.4 !important; }
              }
            `}} />

            <div id="bast-print-area" className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-800 p-8 md:p-12 shadow-md rounded-lg border border-gray-200 text-left font-sans leading-relaxed relative flex flex-col justify-between" style={{ color: '#000000', backgroundColor: '#ffffff' }}>
              <div>
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
                  <div className="flex items-center gap-3">
                    <img src="/mra_logo.png" alt="MRA Group Logo" className="h-10 w-auto object-contain" />
                    <div>
                      <h2 className="text-sm font-black tracking-tight text-black uppercase">{bastAsset.companyMaster?.name || 'PT MUGI REKSO ABADI'}</h2>
                      <p className="text-[10px] text-gray-600 font-semibold tracking-wider uppercase">IT Infrastructure & Support</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">IT Helpdesk Department</h4>
                    <p className="text-[9px] text-gray-500 font-semibold mt-0.5">Wisma MRA, Cilandak, Jakarta</p>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center space-y-1.5 my-6">
                  <h1 className="text-base font-black tracking-wide uppercase border-b border-slate-900 inline-block px-4 pb-0.5 text-black">
                    BERITA ACARA SERAH TERIMA PERANGKAT IT
                  </h1>
                  <p className="text-xs font-semibold text-gray-800">Nomor: <span className="font-mono">{bastDocNum}</span></p>
                </div>

                <p className="text-xs text-justify mb-5 leading-relaxed text-black">
                  Pada hari ini, <span className="font-bold">{formatIndonesianDate(new Date())}</span>, kami yang bertanda tangan di bawah ini telah melakukan serah terima perangkat aset IT. Perangkat ini diserahkan untuk dipergunakan menunjang kegiatan operasional kantor MRA Group:
                </p>

                {/* Parties */}
                <div className="grid grid-cols-2 gap-6 text-xs mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <p className="font-extrabold uppercase tracking-wide text-gray-500 text-[9px] border-b border-slate-200 pb-1 mb-2">PIHAK PERTAMA (IT Support)</p>
                    <table className="w-full text-left">
                      <tbody>
                        <tr><td className="w-16 font-semibold text-gray-500">Nama</td><td className="w-2">:</td><td className="font-bold text-black">{bastAgentName}</td></tr>
                        <tr><td className="font-semibold text-gray-500">Jabatan</td><td>:</td><td className="font-medium text-black">{user?.jobPosition || 'IT Infrastructure Support'}</td></tr>
                        <tr><td className="font-semibold text-gray-500">Departemen</td><td>:</td><td className="font-medium text-black">{user?.department || 'IT Department'}</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <p className="font-extrabold uppercase tracking-wide text-gray-500 text-[9px] border-b border-slate-200 pb-1 mb-2">PIHAK KEDUA (Penerima)</p>
                    <table className="w-full text-left">
                      <tbody>
                        <tr><td className="w-16 font-semibold text-gray-500">Nama</td><td className="w-2">:</td><td className="font-bold text-black">{bastAsset.user?.name || '-'}</td></tr>
                        <tr><td className="font-semibold text-gray-500">NIP / ID</td><td>:</td><td className="font-mono font-semibold text-black">{bastAsset.user?.id || '-'}</td></tr>
                        <tr><td className="font-semibold text-gray-500">Departemen</td><td>:</td><td className="font-medium text-black">{bastAsset.user?.department || '-'}</td></tr>
                        <tr><td className="font-semibold text-gray-500">Entitas</td><td>:</td><td className="font-bold text-slate-700">{bastAsset.companyMaster?.name || '-'}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Specs Table */}
                <div className="space-y-2 mb-6">
                  <p className="text-[10px] font-bold text-gray-450 uppercase tracking-wider text-black">Detail Perangkat & Spesifikasi:</p>
                  <table className="w-full border-collapse border border-slate-900 text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[9px]">
                        <th className="border border-slate-900 py-1.5 px-3">Komponen Aset</th>
                        <th className="border border-slate-900 py-1.5 px-3">Spesifikasi Detail / Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td className="border border-slate-900 py-1.5 px-3 font-semibold bg-slate-50 text-black">Tipe Perangkat</td><td className="border border-slate-900 py-1.5 px-3 font-bold uppercase text-black font-mono">{bastAsset.ownershipType === 'RENTAL' ? 'Sewa (Rental Device)' : 'Milik Sendiri (Owned)'}</td></tr>
                      <tr><td className="border border-slate-900 py-1.5 px-3 font-semibold bg-slate-50 text-black">Brand & Model</td><td className="border border-slate-900 py-1.5 px-3 font-bold text-black">{bastAsset.brand} {bastAsset.model}</td></tr>
                      <tr><td className="border border-slate-900 py-1.5 px-3 font-semibold bg-slate-50 text-black">Processor / Chipset</td><td className="border border-slate-900 py-1.5 px-3 text-black">{bastAsset.processor || '-'}</td></tr>
                      <tr><td className="border border-slate-900 py-1.5 px-3 font-semibold bg-slate-50 text-black">RAM & Storage</td><td className="border border-slate-900 py-1.5 px-3 text-black">{bastAsset.ram || '-'} RAM | {bastAsset.storage || '-'} Storage</td></tr>
                      <tr><td className="border border-slate-900 py-1.5 px-3 font-semibold bg-slate-50 text-black">Sistem Operasi (OS)</td><td className="border border-slate-900 py-1.5 px-3 text-black">{bastAsset.os || '-'}</td></tr>
                      <tr><td className="border border-slate-900 py-1.5 px-3 font-semibold bg-slate-50 text-black">Kode Tag Aset</td><td className="border border-slate-900 py-1.5 px-3 font-mono font-bold text-black">{bastAsset.assetTag}</td></tr>
                      {bastAsset.deviceRef && (
                        <tr>
                          <td className="border border-slate-900 py-1.5 px-3 font-semibold bg-slate-50 text-black">
                            {bastAsset.brand.toLowerCase() === 'apple' ? 'IMEI / Serial Number' : 'Device Reference Code'}
                          </td>
                          <td className="border border-slate-900 py-1.5 px-3 font-mono font-bold text-rose-600">{bastAsset.deviceRef}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Terms */}
                <div className="space-y-1.5 mb-8">
                  <p className="text-[10px] font-bold text-gray-450 uppercase tracking-wider text-black">Syarat & Ketentuan Pemakaian:</p>
                  <ol className="list-decimal pl-4 space-y-1 text-[10px] text-gray-700 leading-normal text-justify">
                    <li>Perangkat ini merupakan aset operasional milik/sewa <span className="font-bold">{bastAsset.companyMaster?.name || 'PT Mugi Rekso Abadi'}</span> dan hanya dipergunakan untuk menunjang produktivitas kerja karyawan yang bersangkutan.</li>
                    <li>Pihak Kedua (Karyawan) wajib merawat, menjaga kebersihan, dan bertanggung jawab penuh atas keamanan fisik perangkat dari benturan, cairan, atau suhu ekstrim.</li>
                    <li>Apabila terjadi kehilangan perangkat akibat pencurian atau kelalaian pribadi, Karyawan wajib melampirkan Surat Laporan Kehilangan dari Kepolisian dan bersedia menanggung denda penggantian sesuai dengan kebijakan manajemen.</li>
                    <li>Karyawan wajib mengembalikan perangkat ini secara lengkap (termasuk adaptor charger, tas, dll.) ke departemen IT Support apabila yang bersangkutan mengundurkan diri (resign), mengalami pemutusan hubungan kerja, atau masa kontrak sewa perangkat telah berakhir.</li>
                  </ol>
                </div>

                {bastNotes && (
                  <div className="mb-8 border border-dashed border-slate-400 p-2.5 rounded-lg bg-slate-50/50 text-[10px] text-black">
                    <span className="font-extrabold uppercase block text-gray-500 tracking-wider mb-1">Catatan Serah Terima / Kelengkapan Tambahan:</span>
                    <p className="italic text-slate-700">{bastNotes}</p>
                  </div>
                )}
              </div>

              {/* Signatures */}
              <div>
                <div className="grid grid-cols-2 gap-12 text-center text-xs mt-8">
                  <div className="flex flex-col items-center">
                    <p className="font-bold text-black">PIHAK PERTAMA</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Yang Menyerahkan,</p>
                    <div style={{ height: '80px', minHeight: '80px', flexShrink: 0 }} className="w-full flex items-center justify-center">&nbsp;</div>
                    <div className="space-y-1">
                      <p className="font-bold underline text-black">{bastAgentName}</p>
                      <p className="text-[9px] text-gray-500">{user?.jobPosition || 'IT Infrastructure Support'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="font-bold text-black">PIHAK KEDUA</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Yang Menerima,</p>
                    <div style={{ height: '80px', minHeight: '80px', flexShrink: 0 }} className="w-full flex items-center justify-center">&nbsp;</div>
                    <div className="space-y-1">
                      <p className="font-bold underline text-black">{bastAsset.user?.name || '-'}</p>
                      <p className="text-[9px] text-gray-500">NIP: {bastAsset.user?.id || '-'}</p>
                    </div>
                  </div>
                </div>
                <div className="text-center text-[8px] text-gray-400 mt-12 border-t border-gray-150 pt-2 font-mono">
                  Dicetak secara otomatis melalui Sistem Helpdesk IT MRA Group pada {new Date().toLocaleString('id-ID')}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
