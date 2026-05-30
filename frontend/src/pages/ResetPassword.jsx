import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Reset token is missing in the URL.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
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
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
            <span className="font-black text-xl text-white">M</span>
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            MRA Group
          </span>
        </div>

        {/* Center Slogan */}
        <div className="space-y-6 relative z-10 max-w-md my-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full w-fit block">
            IT Operations & SLA
          </span>
          <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-none">
            Choose Your New Password
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Ensure your account security by selecting a robust password that is at least 6 characters long.
          </p>
        </div>

        {/* Footer Credit */}
        <div className="text-[10px] text-slate-500 relative z-10 font-medium">
          © {new Date().getFullYear()} PT Mugi Rekso Abadi (Group). All rights reserved.
        </div>
      </div>

      {/* Right side: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 md:px-16 lg:px-24 bg-slate-950 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(70,98,193,0.03),transparent)] pointer-events-none"></div>

        <div className="w-full max-w-md mx-auto space-y-8 animate-fade-in relative z-10">
          
          {/* Logo on Mobile Only */}
          <div className="flex lg:hidden items-center gap-2.5 justify-center mb-6">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="font-black text-sm text-white">M</span>
            </div>
            <span className="font-extrabold text-lg tracking-tight">MRA Group Helpdesk</span>
          </div>

          {success ? (
            <div className="text-center space-y-6 py-6">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Password Reset Complete!</h2>
                <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Your password has been updated successfully. Redirecting you to the Login page...
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center lg:text-left space-y-2">
                <h2 className="text-2xl font-black text-white tracking-tight">New Password</h2>
                <p className="text-sm text-slate-400">
                  Please enter and confirm your new password below.
                </p>
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/20 text-red-200 text-xs font-semibold flex items-start gap-3 animate-pulse">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {!token ? (
                <div className="p-4 rounded-2xl bg-amber-955/20 border border-amber-500/20 text-amber-200 text-xs font-semibold flex flex-col gap-3">
                  <p>⚠️ <strong>Missing Reset Token:</strong> The link you followed is invalid or incomplete.</p>
                  <Link
                    to="/login"
                    className="text-brand-400 hover:text-brand-350 transition-colors font-bold text-xs"
                  >
                    Go Back to Login Page
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* New Password */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-900/40 border border-slate-800 focus:border-brand-500 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all text-xs"
                      />
                      <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-4" />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        placeholder="Re-type your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-900/40 border border-slate-800 focus:border-brand-500 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all text-xs"
                      />
                      <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-4" />
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
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <span>Reset Password</span>
                    )}
                  </button>
                </form>
              )}
            </>
          )}

        </div>
      </div>

    </div>
  );
}
