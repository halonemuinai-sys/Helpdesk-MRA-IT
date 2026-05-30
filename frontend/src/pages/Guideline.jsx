import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  LayoutDashboard,
  FilePlus2,
  Ticket,
  Users,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Calendar,
  Clock,
  UserCheck,
  CheckCircle,
  HelpCircle,
  Play
} from 'lucide-react';

export default function Guideline({ user }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const slides = [
    {
      title: "MRA IT Helpdesk",
      subtitle: "Selamat Datang di Portal Panduan Penggunaan",
      icon: BookOpen,
      color: "from-brand-500 to-indigo-500",
      description: "Portal ini dirancang untuk mempermudah pemantauan, pelaporan, dan penyelesaian insiden teknologi informasi di lingkungan MRA Group. Panduan interaktif ini akan membantu Anda memahami alur kerja utama aplikasi dalam hitungan menit.",
      bullets: [
        { icon: Sparkles, text: "Sistem pelaporan insiden terpusat untuk seluruh divisi." },
        { icon: Clock, text: "Pemantauan SLA (Service Level Agreement) waktu nyata (real-time)." },
        { icon: UserCheck, text: "Otomatisasi penugasan agen dan alur kerja approval tiket." }
      ],
      visual: (
        <div className="relative w-full h-64 bg-slate-900/30 dark:bg-slate-950/40 rounded-2xl flex flex-col justify-center items-center overflow-hidden border border-gray-200/20">
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/10 to-indigo-500/10 dark:from-brand-500/20 dark:to-indigo-500/20 blur-xl opacity-80" />
          
          {/* Main Floating Card Mockup */}
          <div className="relative w-72 bg-white/90 dark:bg-slate-900/90 rounded-2xl shadow-xl p-5 border border-white/20 dark:border-slate-800/80 animate-mockup-float">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
                MRA-00042
              </span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Assigned
              </span>
            </div>
            
            <h4 className="font-bold text-sm text-gray-800 dark:text-slate-100 truncate mb-1">
              Printer Lantai 3 Macet & Garis
            </h4>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-3 truncate">
              Pelapor: Amanda (Corporate Marketing)
            </p>
            
            <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-slate-800 text-[10px] text-gray-400 dark:text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                SLA: 2 Jam Sisa
              </span>
              <span>Prioritas: High</span>
            </div>
          </div>
          
          {/* Floating Accents */}
          <div className="absolute top-4 left-6 w-8 h-8 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 blur-sm animate-bounce" />
          <div className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-brand-500/10 dark:bg-brand-500/20 blur-sm" />
        </div>
      )
    },
    {
      title: "Dashboard & SLA Analytics",
      subtitle: "Monitoring Kinerja & Statistik Waktu Nyata",
      icon: LayoutDashboard,
      color: "from-blue-500 to-teal-500",
      description: "Halaman Dashboard menyajikan ringkasan KPI (Key Performance Indicator) secara langsung. Anda dapat menyaring data berdasarkan Bulan dan Tahun secara spesifik untuk melihat tren performa SLA tim IT.",
      bullets: [
        { icon: CheckCircle, text: "KPI Utama: Persentase pemenuhan SLA, waktu respon, dan waktu resolusi." },
        { icon: Sparkles, text: "Spotlight Agent: Menampilkan Agen IT terbaik dengan performa tertinggi." },
        { icon: LayoutDashboard, text: "Bagan Distribusi: Visualisasi jenis insiden dan kategori paling kritis." }
      ],
      visual: (
        <div className="relative w-full h-64 bg-slate-900/30 dark:bg-slate-950/40 rounded-2xl p-4 flex flex-col justify-between overflow-hidden border border-gray-200/20">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-teal-500/10 dark:from-blue-500/20 dark:to-blue-500/20 blur-xl opacity-80" />
          
          {/* Dashboard Mini Mockups */}
          <div className="grid grid-cols-2 gap-3 z-10">
            {/* SLA Card */}
            <div className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-3 border border-white/20 dark:border-slate-800/80 shadow-sm">
              <p className="text-[10px] text-gray-500 dark:text-slate-400 font-semibold">Team SLA Compliance</p>
              <h5 className="text-lg font-bold text-teal-600 dark:text-teal-400 mt-0.5">98.4%</h5>
              <div className="w-full bg-gray-100 dark:bg-slate-850 h-1.5 rounded-full overflow-hidden mt-2">
                <div className="bg-teal-500 h-full rounded-full animate-progress-fill" style={{ width: '94%' }} />
              </div>
            </div>
            {/* Spotlight Card */}
            <div className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-3 border border-white/20 dark:border-slate-800/80 shadow-sm flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-400 animate-bounce">
                🏆
              </div>
              <div className="overflow-hidden">
                <p className="text-[9px] text-gray-500 dark:text-slate-400 truncate">Spotlight Agent</p>
                <p className="text-xs font-bold text-gray-800 dark:text-slate-200 truncate mt-0.5">Roni Wijaya</p>
              </div>
            </div>
          </div>
          
          {/* Filter Bar Mockup */}
          <div className="bg-white/85 dark:bg-slate-900/85 rounded-xl p-2.5 border border-white/20 dark:border-slate-800/80 z-10 flex items-center justify-between text-[10px] text-gray-600 dark:text-slate-300 shadow-sm">
            <span className="font-bold flex items-center gap-1 text-slate-700 dark:text-slate-300">
              📅 Filter Terpilih:
            </span>
            <div className="flex gap-1.5">
              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-semibold">Mei</span>
              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-semibold">2026</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Input Tiket & SLA Priority",
      subtitle: "Registrasi Insiden & Pencatatan Akurat",
      icon: FilePlus2,
      color: "from-purple-500 to-pink-500",
      description: "Setiap tiket insiden dimasukkan dengan informasi detil seperti pelapor, divisi, dan kategori kendala. Prioritas (Low, Medium, High) secara otomatis menentukan durasi target SLA.",
      bullets: [
        { icon: Calendar, text: "Incident Backdating: Pencatatan tanggal mundur jika insiden baru dilaporkan telat." },
        { icon: Clock, text: "SLA Matrix: Target waktu respon & resolusi disesuaikan dengan urgensi masalah." },
        { icon: Users, text: "Searchable Select: Mempermudah pencarian nama karyawan dari direktori perusahaan." }
      ],
      visual: (
        <div className="relative w-full h-64 bg-slate-900/30 dark:bg-slate-950/40 rounded-2xl p-4 flex flex-col justify-center items-center overflow-hidden border border-gray-200/20">
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 blur-xl opacity-80" />
          
          {/* Calendar / Backdate Mockup */}
          <div className="relative w-72 bg-white/90 dark:bg-slate-900/90 rounded-2xl shadow-xl p-4 border border-white/20 dark:border-slate-800/80 z-10 animate-pulse-glow-purple">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-slate-800">
              <Calendar className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-bold text-gray-800 dark:text-slate-200">Incident Backdating</span>
            </div>
            
            <div className="space-y-2">
              <div className="bg-purple-50/50 dark:bg-purple-950/20 p-2.5 rounded-xl border border-purple-100 dark:border-purple-900/40">
                <p className="text-[10px] text-purple-700 dark:text-purple-300 font-bold">
                  ⚠️ Fitur Pencatatan Mundur Aktif
                </p>
                <p className="text-[9px] text-purple-600/80 dark:text-purple-400/85 mt-0.5 leading-normal">
                  Tanggal insiden diatur sebelum waktu pembuatan tiket saat ini.
                </p>
              </div>
              
              <div className="flex justify-between items-center text-[10px] pt-1">
                <span className="text-gray-500 dark:text-slate-400">Tanggal Kejadian:</span>
                <span className="font-bold text-gray-800 dark:text-slate-200 bg-gray-100 dark:bg-slate-850 px-2 py-0.5 rounded">
                  28 May 2026, 14:00
                </span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Alur Proses Tiket & SLA Stepper",
      subtitle: "Siklus Penyelesaian Berbasis Penugasan",
      icon: Ticket,
      color: "from-amber-500 to-orange-500",
      description: "Tiket berjalan secara runtut melalui tahapan status (Created -> Assigned -> In Progress -> Resolved -> Closed). Anda dapat memantau status secara langsung di panel detail modal.",
      bullets: [
        { icon: Clock, text: "Play/Pause SLA: Stop sementara perhitungan SLA jika menunggu feedback eksternal." },
        { icon: CheckCircle, text: "Resolusi & Catatan: Pengisian catatan tindakan wajib dilakukan sebelum tiket di-Resolve." },
        { icon: ShieldAlert, text: "Audit Logs: Riwayat lengkap aktivitas tiket tercatat otomatis demi akuntabilitas." }
      ],
      visual: (
        <div className="relative w-full h-64 bg-slate-900/30 dark:bg-slate-950/40 rounded-2xl p-4 flex flex-col justify-center items-center overflow-hidden border border-gray-200/20">
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 blur-xl opacity-80" />
          
          {/* Stepper Mockup */}
          <div className="relative w-72 bg-white/90 dark:bg-slate-900/90 rounded-2xl shadow-xl p-4 border border-white/20 dark:border-slate-800/80 z-10 space-y-3 animate-mockup-float">
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-700 dark:text-slate-200">
              <span>SLA Tracker</span>
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Active
              </span>
            </div>
            
            {/* Horizontal Mini Stepper */}
            <div className="flex items-center justify-between relative py-2">
              <div className="absolute left-2 right-2 top-1/2 h-[2px] bg-gray-200 dark:bg-slate-850 -translate-y-1/2 -z-10" />
              <div className="absolute left-2 w-1/2 top-1/2 h-[2px] bg-brand-500 -translate-y-1/2 -z-10" />
              
              <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center text-[9px] text-white font-bold">
                ✓
              </div>
              <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center text-[9px] text-white font-bold">
                ✓
              </div>
              <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center text-[9px] text-white font-bold ring-4 ring-brand-100 dark:ring-brand-950 animate-pulse">
                3
              </div>
              <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-slate-800 flex items-center justify-center text-[9px] text-gray-400 font-bold">
                4
              </div>
            </div>
            <div className="flex justify-between text-[8px] text-gray-400 dark:text-slate-500 font-semibold px-0.5">
              <span>Created</span>
              <span>Assigned</span>
              <span className="text-brand-600 dark:text-brand-400">In Progress</span>
              <span>Resolved</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Manajemen User & Tiket (Admin)",
      subtitle: "Kontrol Akses Tingkat Lanjut & Pemeliharaan",
      icon: Users,
      color: "from-red-500 to-rose-500",
      description: "Khusus untuk Admin, tersedia panel kontrol penuh untuk mengelola daftar karyawan, mereset password, mengubah status otorisasi, serta menghapus tiket tak valid dengan pop-up konfirmasi interaktif.",
      bullets: [
        { icon: Users, text: "User Management: Penyesuaian hak akses departemen dan jabatan karyawan." },
        { icon: ShieldAlert, text: "Ticket Deletion: Hapus tiket redundan dengan proteksi SweetAlert2 yang aman." },
        { icon: UserCheck, text: "Security Actions: Mengubah password atau reset langsung kredensial akun." }
      ],
      visual: (
        <div className="relative w-full h-64 bg-slate-900/30 dark:bg-slate-950/40 rounded-2xl p-4 flex flex-col justify-center items-center overflow-hidden border border-gray-200/20">
          <div className="absolute inset-0 bg-gradient-to-tr from-red-500/10 to-rose-500/10 dark:from-red-500/20 dark:to-red-500/20 blur-xl opacity-80" />
          
          {/* SweetAlert2 style popup mockup */}
          <div className="relative w-72 bg-white/95 dark:bg-slate-900/95 rounded-2xl shadow-xl p-4 border border-white/20 dark:border-slate-800/80 z-10 flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400 mb-2 border border-red-100 dark:border-red-900/30 animate-wiggle-alert">
              ⚠️
            </div>
            
            <h5 className="text-xs font-bold text-gray-800 dark:text-slate-100">Apakah Anda Yakin?</h5>
            <p className="text-[9px] text-gray-400 dark:text-slate-500 mt-1 max-w-[200px] leading-normal">
              Tindakan menghapus tiket MRA-00042 tidak dapat dibatalkan!
            </p>
            
            <div className="flex gap-2 mt-3 w-full">
              <button className="flex-1 bg-red-600 text-white rounded-lg py-1.5 text-[9px] font-bold shadow-md hover:bg-red-700 transition animate-pulse-glow-red">
                Ya, Hapus!
              </button>
              <button className="flex-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 rounded-lg py-1.5 text-[9px] font-bold hover:bg-gray-200 dark:hover:bg-slate-700 transition">
                Batal
              </button>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      navigate('/dashboard');
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const currentInfo = slides[currentSlide];
  const SlideIcon = currentInfo.icon;
  const progressPercent = ((currentSlide + 1) / slides.length) * 100;

  return (
    <div className="max-w-6xl mx-auto py-6 relative">
      {/* Inline styles for custom slide animations */}
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes mockupFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(0.5deg); }
        }
        @keyframes progressFill {
          from { width: 0%; }
          to { width: 94%; }
        }
        @keyframes pulseGlowPurple {
          0%, 100% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0); }
          50% { box-shadow: 0 0 8px 2px rgba(168, 85, 247, 0.15); }
        }
        @keyframes wiggleAlert {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08) rotate(3deg); }
        }
        @keyframes pulseGlowRed {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          50% { box-shadow: 0 0 8px 2px rgba(239, 68, 68, 0.2); }
        }
        .animate-slide-up-fade {
          animation: slideUpFade 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-mockup-float {
          animation: mockupFloat 4s ease-in-out infinite;
        }
        .animate-progress-fill {
          animation: progressFill 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-pulse-glow-purple {
          animation: pulseGlowPurple 3s ease-in-out infinite;
        }
        .animate-wiggle-alert {
          animation: wiggleAlert 2s ease-in-out infinite;
        }
        .animate-pulse-glow-red {
          animation: pulseGlowRed 2s ease-in-out infinite;
        }
      `}</style>

      {/* Header section with icon and subtitle */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-100 dark:bg-brand-950/80 rounded-2xl text-brand-600 dark:text-brand-400">
            <HelpCircle className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">
              Panduan Aplikasi IT Helpdesk
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Pelajari fitur utama dan alur operasional sistem IT Helpdesk MRA.
            </p>
          </div>
        </div>
        
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200 font-semibold px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-900 rounded-xl transition"
        >
          Lewati Panduan (Skip)
        </button>
      </div>

      {/* Main Glassmorphism Slide Card Container */}
      <div className="relative glass-panel bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-3xl border border-gray-200/50 dark:border-slate-800/60 shadow-xl overflow-hidden min-h-[500px] flex flex-col justify-between transition-all duration-300">
        
        {/* Progress Bar at top of card */}
        <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800/60">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Content Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-8 lg:p-12 flex-1 items-center">
          
          {/* Left Column: Descriptive Text Content */}
          <div key={currentSlide} className="lg:col-span-7 space-y-6 animate-slide-up-fade">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${currentInfo.color} text-white shadow-md shadow-brand-500/10`}>
                <SlideIcon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                Slide {currentSlide + 1} dari {slides.length}
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {currentInfo.title}
              </h2>
              <h3 className="text-lg font-semibold text-brand-600 dark:text-brand-400">
                {currentInfo.subtitle}
              </h3>
            </div>

            <p className="text-gray-600 dark:text-slate-350 text-sm leading-relaxed max-w-xl">
              {currentInfo.description}
            </p>

            {/* Bullet Point features list */}
            <div className="space-y-3 pt-2">
              {currentInfo.bullets.map((bullet, idx) => {
                const BulletIcon = bullet.icon;
                return (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="mt-1 bg-brand-50 dark:bg-brand-950/40 p-1.5 rounded-lg text-brand-500 dark:text-brand-400">
                      <BulletIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-slate-300 leading-snug">
                      {bullet.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Stylized Visual Mockups */}
          <div key={`visual-${currentSlide}`} className="lg:col-span-5 flex justify-center items-center animate-slide-up-fade">
            <div className="w-full max-w-md">
              {currentInfo.visual}
            </div>
          </div>
        </div>

        {/* Footer Navigation bar */}
        <div className="border-t border-gray-200/50 dark:border-slate-800/60 p-6 px-8 lg:px-12 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/30 rounded-b-3xl">
          
          {/* Navigation dots */}
          <div className="flex gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  currentSlide === idx
                    ? 'w-7 bg-brand-500'
                    : 'bg-gray-300 dark:bg-slate-700 hover:bg-gray-400 dark:hover:bg-slate-600'
                }`}
                aria-label={`Pindah ke slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Nav buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrev}
              disabled={currentSlide === 0}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition ${
                currentSlide === 0
                  ? 'text-gray-350 dark:text-slate-650 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Kembali
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl px-5 py-2.5 text-xs font-bold shadow-lg shadow-brand-500/20 hover:shadow-xl hover:shadow-brand-500/30 transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {currentSlide === slides.length - 1 ? (
                <>
                  Mulai Gunakan Aplikasi
                  <Play className="w-3.5 h-3.5 fill-white" />
                </>
              ) : (
                <>
                  Lanjut
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
