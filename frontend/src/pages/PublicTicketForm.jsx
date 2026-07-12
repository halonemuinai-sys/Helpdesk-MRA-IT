import React, { useState, useEffect, useRef } from 'react';
import {
  Monitor, Wifi, Key, Printer, Smartphone, HelpCircle, Code,
  User, Mail, Building2, ChevronRight, ChevronLeft,
  CheckCircle2, Loader2, AlertCircle, Headphones, Send, Search, X
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CATEGORIES = [
  { value: 'Hardware', label: 'Hardware', icon: Monitor, desc: 'Laptop, PC, mouse, keyboard, monitor' },
  { value: 'Software', label: 'Software / Aplikasi', icon: Code, desc: 'Error aplikasi, install, lisensi' },
  { value: 'Network', label: 'Network / Internet', icon: Wifi, desc: 'Koneksi internet, WiFi, VPN' },
  { value: 'Access', label: 'Akses & Password', icon: Key, desc: 'Login, reset password, hak akses' },
  { value: 'Printer', label: 'Printer / Scanner', icon: Printer, desc: 'Masalah cetak, scan, fotokopi' },
  { value: 'Phone', label: 'HP / Telepon', icon: Smartphone, desc: 'Smartphone, ekstensi, PABX' },
  { value: 'Lainnya', label: 'Lainnya', icon: HelpCircle, desc: 'Kendala IT yang tidak ada di atas' },
];

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
      if (companyRef.current && !companyRef.current.contains(e.target)) {
        setCompanyOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fuzzyMatch = (text, query) => {
    const t = text.toLowerCase();
    const q = query.toLowerCase().trim();
    if (!q) return true;
    if (t.includes(q)) return true;
    // match each word in query, allowing 1 char typo per word (length > 3)
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

  const selectCompany = (name) => {
    setCompany(name);
    setCompanySearch(name);
    setCompanyOpen(false);
  };

  const effectiveCompany = company || companySearch;
  const step1Valid = name.trim() && email.trim() && effectiveCompany.trim();
  const step2Valid = category && title.trim() && description.trim();

  const handleNext = () => {
    if (step === 1 && step1Valid) setStep(2);
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
  };

  const handleSubmit = async () => {
    if (!step2Valid) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/tickets/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          company: (company || companySearch).trim(),
          category,
          title: title.trim(),
          description: description.trim(),
          priority: 'LOW',
          source: 'Self-Service Portal',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col">

      {/* Top Bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-3 shadow-sm">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
          <Headphones className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-xs font-extrabold text-gray-800 dark:text-slate-100 leading-none">IT MRA Helpdesk</p>
          <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">Self-Service Portal</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 py-6">
        <div className="w-full max-w-md">

          {/* Step Indicator */}
          {step < 3 && (
            <div className="flex items-center gap-2 mb-6">
              {[1, 2].map((s) => (
                <React.Fragment key={s}>
                  <div className={`flex items-center gap-1.5 ${step === s ? 'text-cyan-600 dark:text-cyan-400' : step > s ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold border-2 transition-all ${
                      step === s
                        ? 'bg-cyan-500 border-cyan-500 text-white'
                        : step > s
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}>
                      {step > s ? '✓' : s}
                    </div>
                    <span className="text-xs font-bold hidden sm:inline">
                      {s === 1 ? 'Identitas' : 'Masalah'}
                    </span>
                  </div>
                  {s < 2 && <div className={`flex-1 h-0.5 rounded-full ${step > s ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* ── Step 1: Identity ── */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h1 className="text-xl font-extrabold text-gray-800 dark:text-slate-100">Halo! Ada kendala IT?</h1>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Isi data diri kamu dulu ya, biar kami bisa bantu.</p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">

                <label className="flex items-center gap-3 px-4 py-3.5">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Nama lengkap"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-gray-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                    autoComplete="name"
                  />
                </label>

                <label className="flex items-center gap-3 px-4 py-3.5">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="email"
                    placeholder="Email kantor"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-gray-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                    autoComplete="email"
                    inputMode="email"
                  />
                </label>

                <div className="relative" ref={companyRef}>
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Cari perusahaan / unit kerja..."
                      value={companySearch}
                      onChange={e => { setCompanySearch(e.target.value); setCompany(''); setCompanyOpen(true); }}
                      onFocus={() => setCompanyOpen(true)}
                      className="flex-1 bg-transparent text-sm text-gray-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                      autoComplete="off"
                    />
                    {companySearch ? (
                      <button type="button" onClick={() => { setCompanySearch(''); setCompany(''); setCompanyOpen(true); }}>
                        <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                      </button>
                    ) : (
                      <Search className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    )}
                  </div>

                  {companyOpen && filteredCompanies.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-b-2xl shadow-xl max-h-52 overflow-y-auto">
                      {filteredCompanies.map(c => (
                        <button
                          key={c}
                          type="button"
                          onMouseDown={() => selectCompany(c)}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            company === c
                              ? 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300 font-bold'
                              : 'text-gray-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}

                  {companyOpen && companySearch.trim() && filteredCompanies.length === 0 && (
                    <div className="absolute left-0 right-0 top-full z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-b-2xl shadow-xl px-4 py-3 text-xs text-slate-400">
                      Tidak ditemukan. Ketik nama lengkap perusahaan kamu.
                    </div>
                  )}
                </div>

              </div>

              <button
                type="button"
                onClick={handleNext}
                disabled={!step1Valid}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                Lanjut
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Step 2: Problem ── */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h1 className="text-xl font-extrabold text-gray-800 dark:text-slate-100">Ceritakan masalahnya</h1>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Pilih kategori dan jelaskan kendalamu.</p>
              </div>

              {/* Category Grid */}
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">Jenis Masalah</p>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    const active = category === cat.value;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={`flex flex-col items-start gap-1.5 p-3 rounded-2xl border text-left transition-all active:scale-[0.97] ${
                          active
                            ? 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-400 dark:border-cyan-600 ring-1 ring-cyan-400/30'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-cyan-700'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${active ? 'text-cyan-500' : 'text-slate-400'}`} />
                        <span className={`text-xs font-bold leading-tight ${active ? 'text-cyan-700 dark:text-cyan-300' : 'text-gray-700 dark:text-slate-200'}`}>
                          {cat.label}
                        </span>
                        <span className="text-[10px] text-slate-400 leading-tight">{cat.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title + Description */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                <label className="flex items-center gap-3 px-4 py-3.5">
                  <span className="text-xs font-bold text-slate-400 shrink-0 w-12">Judul</span>
                  <input
                    type="text"
                    placeholder="Ringkasan singkat masalahmu"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-gray-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-2 px-4 py-3.5">
                  <span className="text-xs font-bold text-slate-400">Detail masalah</span>
                  <textarea
                    placeholder="Jelaskan secara lengkap: apa yang terjadi, sejak kapan, sudah dicoba apa saja..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    className="bg-transparent text-sm text-gray-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-none leading-relaxed"
                  />
                </label>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1.5 px-4 py-3.5 rounded-2xl text-sm font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!step2Valid || submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Kirim Laporan
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Success ── */}
          {step === 3 && (
            <div className="text-center space-y-6 animate-fade-in pt-4">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
              </div>

              <div>
                <h1 className="text-xl font-extrabold text-gray-800 dark:text-slate-100">Laporan Terkirim!</h1>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                  Terima kasih {name.split(' ')[0]}, laporanmu sudah kami terima.
                </p>
              </div>

              {ticketId && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm px-6 py-5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nomor Tiket</p>
                  <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400 tracking-tight font-mono">{ticketId}</p>
                  <p className="text-xs text-slate-400 mt-2">Simpan nomor ini untuk follow-up</p>
                </div>
              )}

              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 px-5 py-4 text-left space-y-2.5">
                <p className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Selanjutnya</p>
                {[
                  'Konfirmasi akan dikirim ke email kamu',
                  'Tim IT akan menghubungi kamu segera',
                  'Pantau status lewat nomor tiket di atas',
                ].map((txt, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">{i + 1}</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{txt}</p>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => { setStep(1); setName(''); setEmail(''); setCompany(''); setCompanySearch(''); setCategory(''); setTitle(''); setDescription(''); setTicketId(''); setError(''); }}
                className="w-full py-3.5 rounded-2xl text-sm font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all"
              >
                Kirim Laporan Lain
              </button>
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 mt-8">
            IT MRA Helpdesk · Wisma MRA Lt.6 · Working hours Mon–Fri 9am–5pm
          </p>

        </div>
      </div>
    </div>
  );
}
