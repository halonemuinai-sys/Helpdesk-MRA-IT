import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, Loader2, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Login({ onLogin }) {
  const [view, setView] = useState('login'); // 'login' | 'forgot' | 'forgot-success'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'An error occurred during login.');
      }

      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');

      setView('forgot-success');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-white font-sans w-full">
      
      {/* Left side: Hero Brand Showcase (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-950 via-slate-900 to-brand-900 flex-col justify-between p-12 border-r border-white/5">
        {/* Glow Effects */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>

        {/* Top Branding */}
        <div className="flex items-center relative z-10">
          <img src="/mra-logo.png" alt="MRA Group Logo" className="h-11 w-auto object-contain" />
        </div>

        {/* Center Slogan */}
        <div className="space-y-6 relative z-10 max-w-md my-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full w-fit block">
            IT Operations & SLA
          </span>
          <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-none">
            Corporate IT Helpdesk Management
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Monitor infrastructure health, resolve employee tickets within SLA targets, and track operational KPI performance across all MRA branches.
          </p>

          <div className="space-y-3 pt-4 text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center">✓</div>
              <span>Cascade Company & Location Routing</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center">✓</div>
              <span>Automated SLA Response & Resolution Timers</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center">✓</div>
              <span>Comprehensive KPI Agent Leaderboards</span>
            </div>
          </div>
        </div>

        {/* Footer Credit */}
        <div className="text-[10px] text-slate-500 relative z-10 font-medium">
          © {new Date().getFullYear()} PT Mugi Rekso Abadi (Group). All rights reserved.
        </div>
      </div>

      {/* Right side: Forms */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 md:px-16 lg:px-24 bg-slate-950 relative overflow-hidden">
        {/* Subtle Cyber Grid */}
        <div className="absolute inset-0 cyber-grid pointer-events-none opacity-60"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(70,98,193,0.03),transparent)] pointer-events-none"></div>

        {/* Animated Floating Aurora Orbs */}
        <div className="absolute top-1/4 -right-1/4 w-[400px] h-[400px] rounded-full bg-brand-500/5 dark:bg-brand-500/10 blur-[100px] animate-float-orb-1 pointer-events-none"></div>
        <div className="absolute bottom-1/4 -left-1/4 w-[350px] h-[350px] rounded-full bg-rose-500/5 dark:bg-rose-500/5 blur-[90px] animate-float-orb-2 pointer-events-none"></div>
        <div className="absolute -bottom-10 right-1/4 w-[300px] h-[300px] rounded-full bg-cyan-400/5 dark:bg-cyan-400/5 blur-[80px] animate-float-orb-3 pointer-events-none"></div>

        <div className="w-full max-w-md mx-auto space-y-8 animate-fade-in relative z-10">
          
          {/* Logo on Mobile Only */}
          <div className="flex lg:hidden items-center justify-center mb-6">
            <img src="/mra-logo.png" alt="MRA Group Logo" className="h-11 w-auto object-contain" />
          </div>

          {/* VIEW: LOGIN FORM */}
          {view === 'login' && (
            <>
              <div className="text-center lg:text-left space-y-2">
                <h2 className="text-2xl font-black text-white tracking-tight">Sign In</h2>
                <p className="text-sm text-slate-400">
                  Access the IT dashboard console with your email.
                </p>
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/20 text-red-200 text-xs font-semibold flex items-start gap-3 animate-pulse">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="e.g. john@mragroup.co.id"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-900/40 border border-slate-800 focus:border-brand-500 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all text-xs"
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute left-4 top-4" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setView('forgot');
                        setError(null);
                      }}
                      className="text-xs text-brand-400 hover:text-brand-350 transition-colors font-bold focus:outline-none"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-10 py-3 bg-slate-900/40 border border-slate-800 focus:border-brand-500 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all text-xs"
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-4" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-500/10 flex items-center justify-center gap-2 text-xs"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </form>
            </>
          )}

          {/* VIEW: FORGOT PASSWORD */}
          {view === 'forgot' && (
            <>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setError(null);
                  }}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors font-bold mb-4 focus:outline-none"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
                <h2 className="text-2xl font-black text-white tracking-tight">Reset Password</h2>
                <p className="text-sm text-slate-400">
                  Enter your registered email address and we will generate a password reset link.
                </p>
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/20 text-red-200 text-xs font-semibold flex items-start gap-3 animate-pulse">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleForgotSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="e.g. john@mragroup.co.id"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-900/40 border border-slate-800 focus:border-brand-500 rounded-xl text-white placeholder-slate-655 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all text-xs"
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute left-4 top-4" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-500/10 flex items-center justify-center gap-2 text-xs"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating link...</span>
                    </>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>
              </form>
            </>
          )}

          {/* VIEW: FORGOT SUCCESS */}
          {view === 'forgot-success' && (
            <div className="text-center space-y-6 py-6">
              <div className="w-16 h-16 bg-brand-500/10 text-brand-400 rounded-full flex items-center justify-center mx-auto border border-brand-500/20">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Reset Link Sent!</h2>
                <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
                  If that email is registered, we have sent instructions to reset your password. 
                </p>
                {window.location.hostname === 'localhost' && (
                  <p className="text-xs text-amber-500/80 leading-relaxed max-w-sm mx-auto pt-2 bg-amber-500/5 p-3 border border-amber-500/10 rounded-2xl">
                    💡 <strong>Local Dev tip:</strong> Check the backend server terminal console logs to view the generated link!
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setView('login')}
                className="px-6 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold rounded-xl text-slate-200 transition-colors shadow-sm focus:outline-none"
              >
                Back to Sign In
              </button>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
