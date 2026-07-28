import React, { useState, useEffect, useRef } from 'react';
import {
  Monitor, Wifi, Key, Printer, Smartphone, HelpCircle, Code,
  User, Mail, Building2, ChevronRight, ChevronLeft,
  CheckCircle2, Loader2, AlertCircle, Send, Search, X
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CATEGORIES = [
  { value: 'Hardware',  label: 'Hardware',          icon: Monitor,    desc: 'Laptop, PC, mouse, keyboard',  iconBg: 'bg-blue-50',    iconColor: 'text-blue-500'   },
  { value: 'Software',  label: 'Software / Aplikasi',icon: Code,       desc: 'Error aplikasi, install',       iconBg: 'bg-violet-50',  iconColor: 'text-violet-500' },
  { value: 'Network',   label: 'Network / Internet', icon: Wifi,       desc: 'Koneksi internet, WiFi, VPN',   iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500'},
  { value: 'Access',    label: 'Akses & Password',   icon: Key,        desc: 'Login, reset password',         iconBg: 'bg-amber-50',   iconColor: 'text-amber-500'  },
  { value: 'Printer',   label: 'Printer / Scanner',  icon: Printer,    desc: 'Masalah cetak, scan',           iconBg: 'bg-sky-50',     iconColor: 'text-sky-500'    },
  { value: 'Phone',     label: 'HP / Telepon',       icon: Smartphone, desc: 'Smartphone, ekstensi',          iconBg: 'bg-rose-50',    iconColor: 'text-rose-500'   },
  { value: 'Lainnya',   label: 'Lainnya',            icon: HelpCircle, desc: 'Kendala IT lainnya',            iconBg: 'bg-slate-50',   iconColor: 'text-slate-400'  },
];

const SUBCATEGORIES = {
  Access: [
    { value: 'Pembuatan Akun Email',         label: 'Buat Akun Email',        emoji: '📧' },
    { value: 'Reset Password Email',          label: 'Reset Password Email',   emoji: '🔑' },
    { value: 'Login Domain (Active Directory)', label: 'Login Domain / AD',    emoji: '🖥️' },
    { value: 'Akun Retailsoft ERP',           label: 'Retailsoft ERP',         emoji: '🛍️' },
    { value: 'Akun NetSuite ERP',             label: 'NetSuite ERP',           emoji: '📊' },
    { value: 'Akun Ginee ERP',                label: 'Ginee ERP',              emoji: '📦' },
    { value: 'Akun SAP',                      label: 'SAP',                    emoji: '⚙️' },
    { value: 'Akses Shared Folder / Drive',   label: 'Shared Folder',          emoji: '📁' },
    { value: 'VPN Account Request',           label: 'VPN / Remote',           emoji: '🔐' },
    { value: 'CCTV Access',                   label: 'Akses CCTV',             emoji: '📷' },
  ],
  Hardware: [
    { value: 'PC/Laptop',        label: 'Laptop / PC',      emoji: '💻' },
    { value: 'Monitor',          label: 'Monitor',           emoji: '🖥️' },
    { value: 'Keyboard/Mouse',   label: 'Keyboard / Mouse',  emoji: '⌨️' },
    { value: 'IP Phone',         label: 'IP Phone',          emoji: '☎️' },
    { value: 'UPS',              label: 'UPS / Power',       emoji: '🔋' },
    { value: 'Projector',        label: 'Proyektor',         emoji: '📽️' },
    { value: 'POS Cashier Machine', label: 'Mesin Kasir',   emoji: '🖨️' },
  ],
  Software: [
    { value: 'Outlook/Email',                         label: 'Outlook / Email',     emoji: '📨' },
    { value: 'Microsoft Office (Word, Excel, etc.)',   label: 'MS Office',           emoji: '📝' },
    { value: 'Google Workspace',                       label: 'Google Workspace',    emoji: '🔵' },
    { value: 'Retailsoft ERP',                         label: 'Retailsoft ERP',      emoji: '🛍️' },
    { value: 'NetSuite ERP',                           label: 'NetSuite ERP',        emoji: '📊' },
    { value: 'Ginee ERP',                              label: 'Ginee ERP',           emoji: '📦' },
    { value: 'SAP',                                    label: 'SAP',                 emoji: '⚙️' },
    { value: 'Operating System (Windows/macOS)',        label: 'OS Windows / macOS',  emoji: '🪟' },
    { value: 'Antivirus',                              label: 'Antivirus',           emoji: '🛡️' },
    { value: 'Custom Internal Apps',                   label: 'Aplikasi Internal',   emoji: '🔧' },
  ],
  Network: [
    { value: 'Internet Slow/Offline',   label: 'Internet Lambat / Mati',  emoji: '🌐' },
    { value: 'Wi-Fi Connection',        label: 'Wi-Fi / Hotspot',          emoji: '📶' },
    { value: 'LAN Cable Connection',    label: 'Kabel LAN',                emoji: '🔌' },
    { value: 'VPN/Remote Access',       label: 'VPN / Remote',             emoji: '🔐' },
    { value: 'Switch/Router Issue',     label: 'Switch / Router',          emoji: '📡' },
  ],
  Printer: [
    { value: 'Tidak Bisa Cetak',   label: 'Tidak Bisa Cetak',  emoji: '🖨️' },
    { value: 'Tidak Bisa Scan',    label: 'Tidak Bisa Scan',   emoji: '📄' },
    { value: 'Paper Jam',          label: 'Kertas Macet',       emoji: '⚠️' },
    { value: 'Kualitas Cetak',     label: 'Kualitas Cetak',    emoji: '🎨' },
  ],
  Phone: [
    { value: 'IP Phone / Ekstensi',   label: 'IP Phone / Ekstensi',   emoji: '☎️' },
    { value: 'Smartphone',            label: 'Smartphone',             emoji: '📱' },
    { value: 'WhatsApp Bisnis',       label: 'WhatsApp Bisnis',        emoji: '💬' },
  ],
};

// ── Reusable Input Row ────────────────────────────────────────────────────────
function InputRow({ icon: Icon, children, last }) {
  return (
    <div className={`flex items-center gap-3.5 px-5 py-4 ${!last ? 'border-b border-gray-100' : ''}`}>
      <Icon className="w-4 h-4 text-gray-400 shrink-0" />
      {children}
    </div>
  );
}

export default function PublicTicketForm() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [ticketId, setTicketId] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [companyOpen, setCompanyOpen] = useState(false);
  const [companies, setCompanies] = useState([]);
  const companyRef = useRef(null);

  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/companies/public`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setCompanies(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (companyRef.current && !companyRef.current.contains(e.target))
        setCompanyOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fuzzyMatch = (text, query) => {
    const t = text.toLowerCase();
    const q = query.toLowerCase().trim();
    if (!q) return true;
    if (t.includes(q)) return true;
    return q.split(/\s+/).filter(Boolean).every(word => {
      if (t.includes(word)) return true;
      if (word.length <= 3) return false;
      for (let i = 0; i <= t.length - word.length; i++) {
        let diff = 0;
        for (let j = 0; j < word.length; j++) {
          if (t[i + j] !== word[j]) diff++;
          if (diff > 1) break;
        }
        if (diff <= 1) return true;
      }
      return false;
    });
  };

  const filteredCompanies = companySearch.trim()
    ? companies.filter(c => fuzzyMatch(c, companySearch))
    : companies;

  const selectCompany = (val) => { setCompany(val); setCompanySearch(val); setCompanyOpen(false); };

  const effectiveCompany = company || companySearch;
  const step1Valid = name.trim() && email.trim() && effectiveCompany.trim();
  const step2Valid = category && title.trim() && description.trim();

  const handleNext = () => { if (step1Valid) setStep(2); };
  const handleBack = () => setStep(1);

  const handleSubmit = async () => {
    if (!step2Valid) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/tickets/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(), email: email.trim().toLowerCase(),
          company: effectiveCompany.trim(), category,
          subCategory: subCategory || undefined,
          title: title.trim(), description: description.trim(),
          priority: 'LOW', source: 'Self-Service Portal',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim laporan.');
      setTicketId(data.ticketId || data.ticket?.id || '');
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1); setName(''); setEmail(''); setCompany(''); setCompanySearch('');
    setCategory(''); setSubCategory(''); setTitle(''); setDescription(''); setTicketId(''); setError('');
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col items-center justify-start py-8 px-4">

      {/* Logo & Brand */}
      <div className="flex flex-col items-center gap-3 mb-6">
        <img
          src="/mra-logo.png"
          alt="MRA"
          className="h-12 object-contain"
          onError={e => { e.target.style.display = 'none'; }}
        />
        <div className="text-center">
          <p className="text-xs font-semibold text-slate-400 tracking-widest uppercase">IT Helpdesk · Self-Service Portal</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden">

        {/* Card Top Bar — step indicator */}
        {step < 3 && (
          <div className="px-6 pt-6 pb-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {['Identitas', 'Masalah'].map((label, idx) => {
                const s = idx + 1;
                const done = step > s;
                const active = step === s;
                return (
                  <React.Fragment key={s}>
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
                        done    ? 'bg-emerald-500 text-white' :
                        active  ? 'bg-slate-900 text-white' :
                                  'bg-gray-100 text-gray-400'
                      }`}>
                        {done ? '✓' : s}
                      </div>
                      <span className={`text-xs font-semibold ${active ? 'text-slate-800' : done ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {label}
                      </span>
                    </div>
                    {s < 2 && (
                      <div className={`flex-1 h-px ${done ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        <div className="px-6 py-6">

          {/* ── Step 1: Identity ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Ada kendala IT?</h1>
                <p className="text-sm text-slate-400 mt-1">Isi data diri kamu terlebih dahulu.</p>
              </div>

              {/* Input Card */}
              <div className="rounded-2xl border border-gray-100 overflow-visible shadow-sm">
                <InputRow icon={User}>
                  <input
                    type="text" placeholder="Nama lengkap" value={name}
                    onChange={e => setName(e.target.value)}
                    autoComplete="name"
                    className="flex-1 text-sm text-slate-800 placeholder-gray-300 focus:outline-none bg-transparent"
                  />
                </InputRow>

                <InputRow icon={Mail}>
                  <input
                    type="email" placeholder="Email kantor" value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email" inputMode="email"
                    className="flex-1 text-sm text-slate-800 placeholder-gray-300 focus:outline-none bg-transparent"
                  />
                </InputRow>

                {/* Company Searchable */}
                <div ref={companyRef} className="relative">
                  <InputRow icon={Building2} last>
                    <input
                      type="text" placeholder="Cari perusahaan / unit kerja..."
                      value={companySearch}
                      onChange={e => { setCompanySearch(e.target.value); setCompany(''); setCompanyOpen(true); }}
                      onFocus={() => setCompanyOpen(true)}
                      autoComplete="off"
                      className="flex-1 text-sm text-slate-800 placeholder-gray-300 focus:outline-none bg-transparent"
                    />
                    {companySearch ? (
                      <button type="button" onClick={() => { setCompanySearch(''); setCompany(''); setCompanyOpen(true); }}>
                        <X className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500 transition-colors" />
                      </button>
                    ) : (
                      <Search className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                    )}
                  </InputRow>

                  {companyOpen && filteredCompanies.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-52 overflow-y-auto">
                      {filteredCompanies.map(c => (
                        <button
                          key={c} type="button" onMouseDown={() => selectCompany(c)}
                          className={`w-full text-left px-5 py-2.5 text-sm transition-colors ${
                            company === c
                              ? 'bg-slate-900 text-white font-semibold'
                              : 'text-slate-700 hover:bg-gray-50'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}

                  {companyOpen && companySearch.trim() && filteredCompanies.length === 0 && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 bg-white border border-gray-100 rounded-2xl shadow-xl px-5 py-3 text-xs text-gray-400">
                      Tidak ditemukan. Ketik nama lengkap perusahaan.
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button" onClick={handleNext} disabled={!step1Valid}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-700 active:scale-[0.98] transition-all disabled:opacity-30 disabled:pointer-events-none shadow-sm"
              >
                Lanjut <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Step 2: Problem ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Ceritakan masalahnya</h1>
                <p className="text-sm text-slate-400 mt-1">Pilih kategori dan jelaskan kendala kamu.</p>
              </div>

              {/* Category Grid */}
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Jenis Masalah</p>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    const active = category === cat.value;
                    return (
                      <button
                        key={cat.value} type="button"
                        onClick={() => { setCategory(cat.value); setSubCategory(''); }}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all active:scale-[0.97] ${
                          active
                            ? 'border-slate-900 bg-slate-900 shadow-sm'
                            : 'border-gray-100 bg-white hover:border-gray-300 shadow-sm'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${active ? 'bg-white/10' : cat.iconBg}`}>
                          <Icon className={`w-4 h-4 ${active ? 'text-white' : cat.iconColor}`} />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-semibold leading-tight truncate ${active ? 'text-white' : 'text-slate-700'}`}>{cat.label}</p>
                          <p className={`text-[10px] leading-tight mt-0.5 truncate ${active ? 'text-slate-300' : 'text-gray-400'}`}>{cat.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sub-category chips — muncul saat kategori dipilih */}
              {category && SUBCATEGORIES[category] && (
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
                    {category === 'Access' ? 'Jenis Permintaan' : 'Detail Masalah'}
                    <span className="ml-1.5 text-gray-300 normal-case font-normal tracking-normal">· opsional</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUBCATEGORIES[category].map(sub => {
                      const active = subCategory === sub.value;
                      return (
                        <button
                          key={sub.value} type="button"
                          onClick={() => setSubCategory(active ? '' : sub.value)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-[0.96] ${
                            active
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-600 border-gray-200 hover:border-slate-400'
                          }`}
                        >
                          <span>{sub.emoji}</span>
                          {sub.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Title + Description */}
              <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Judul Masalah</p>
                  <input
                    type="text" placeholder="Ringkasan singkat masalah kamu..."
                    value={title} onChange={e => setTitle(e.target.value)}
                    className="w-full text-sm text-slate-800 placeholder-gray-300 focus:outline-none bg-transparent"
                  />
                </div>
                <div className="px-5 py-4">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Detail Masalah</p>
                  <textarea
                    placeholder="Jelaskan apa yang terjadi, sejak kapan, dan sudah dicoba apa saja..."
                    value={description} onChange={e => setDescription(e.target.value)}
                    rows={4}
                    className="w-full text-sm text-slate-800 placeholder-gray-300 focus:outline-none bg-transparent resize-none leading-relaxed"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <span className="text-sm text-red-500">{error}</span>
                </div>
              )}

              <div className="flex gap-2.5">
                <button
                  type="button" onClick={handleBack}
                  className="flex items-center gap-1.5 px-4 py-3.5 rounded-2xl text-sm font-semibold border border-gray-200 bg-white text-slate-600 hover:bg-gray-50 active:scale-[0.98] transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button" onClick={handleSubmit} disabled={!step2Valid || submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-700 active:scale-[0.98] transition-all disabled:opacity-30 disabled:pointer-events-none shadow-sm"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</>
                  ) : (
                    <><Send className="w-4 h-4" /> Kirim Laporan</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Success ── */}
          {step === 3 && (
            <div className="text-center space-y-5 py-2">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
              </div>

              <div>
                <h1 className="text-xl font-bold text-slate-900">Laporan Terkirim!</h1>
                <p className="text-sm text-slate-400 mt-1.5">
                  Terima kasih <span className="font-semibold text-slate-600">{name.split(' ')[0]}</span>, laporanmu sudah kami terima.
                </p>
              </div>

              {ticketId && (
                <div className="bg-slate-50 rounded-2xl px-6 py-5 border border-gray-100">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Nomor Tiket</p>
                  <p className="text-2xl font-bold text-slate-900 tracking-wide font-mono">{ticketId}</p>
                  <p className="text-xs text-gray-400 mt-1.5">Simpan nomor ini untuk follow-up</p>
                </div>
              )}

              <div className="text-left rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
                {[
                  { n: 1, txt: 'Email konfirmasi dikirim ke ' + email },
                  { n: 2, txt: 'Tim IT akan segera menghubungi kamu' },
                  { n: 3, txt: 'Gunakan nomor tiket di atas untuk follow-up' },
                ].map(({ n, txt }) => (
                  <div key={n} className="flex items-start gap-3.5 px-5 py-3.5">
                    <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{n}</div>
                    <p className="text-xs text-slate-500 leading-relaxed">{txt}</p>
                  </div>
                ))}
              </div>

              <button
                type="button" onClick={resetForm}
                className="w-full py-3.5 rounded-2xl text-sm font-semibold border border-gray-200 text-slate-600 hover:bg-gray-50 active:scale-[0.98] transition-all"
              >
                Kirim Laporan Lain
              </button>
            </div>
          )}

        </div>

        {/* Card Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-400">
            IT MRA Helpdesk &nbsp;·&nbsp; Wisma MRA Lt.6 &nbsp;·&nbsp; Mon–Fri 09.00–17.00 WIB
          </p>
        </div>

      </div>
    </div>
  );
}
