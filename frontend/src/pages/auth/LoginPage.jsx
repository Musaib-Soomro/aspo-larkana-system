import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function LoginPage() {
  const { login } = useAuth();
  const { t, lang, toggleLang } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel: Pakistan Post branding ── */}
      <div
        className="hidden lg:flex lg:w-[42%] xl:w-[45%] flex-col justify-between p-10 relative overflow-hidden"
        style={{
          background: 'linear-gradient(155deg, #8B0010 0%, #C0121E 35%, #E8192C 65%, #C0121E 100%)',
        }}
      >
        {/* Geometric overlay pattern */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 24px, rgba(255,255,255,1) 24px, rgba(255,255,255,1) 25px),
                             repeating-linear-gradient(-45deg, transparent, transparent 24px, rgba(255,255,255,1) 24px, rgba(255,255,255,1) 25px)`,
          }}
        />
        {/* Glow orbs */}
        <div className="absolute top-[-10%] right-[-10%] w-80 h-80 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-5%] left-[-5%] w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)' }} />

        {/* Logo top */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2.5 border border-white/20">
            <img src="/pp-icon.png" alt="Pakistan Post" className="h-9 w-9 object-contain" />
          </div>
          <div>
            <p className="text-white font-display font-semibold text-lg leading-tight">Pakistan Post</p>
            <p className="text-white/60 text-[11px] uppercase tracking-[0.15em]">Government of Pakistan</p>
          </div>
        </div>

        {/* Centre content */}
        <div className="relative z-10 my-auto">
          <div className="bg-white rounded-2xl p-3 inline-block mb-8 shadow-lg">
            <img src="/pp-logo.jpg" alt="Pakistan Post" className="h-16 w-auto object-contain" />
          </div>
          <h1 className="font-display text-white text-3xl xl:text-4xl font-semibold leading-snug mb-4">
            ASPO Larkana<br />
            <span className="opacity-70 text-2xl xl:text-3xl">Sub Division</span>
          </h1>
          <p className="text-white/55 text-sm leading-relaxed max-w-64">
            Management system for postal offices, staff operations, inspections, and revenue in the Larkana Sub Division.
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex-1 h-px bg-white/15" />
          <p className="text-white/40 text-[10px] uppercase tracking-[0.2em]">Sindh · Pakistan</p>
          <div className="flex-1 h-px bg-white/15" />
        </div>
      </div>

      {/* ── Right panel: Login form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-surface relative">

        {/* Language toggle */}
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleLang}
            className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border border-border text-gray-500 rounded-lg hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all"
          >
            {lang === 'en' ? 'اردو' : 'English'}
          </button>
        </div>

        {/* Mobile logo (only shows on small screens) */}
        <div className="lg:hidden text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src="/pp-icon.png" alt="Pakistan Post Icon" className="h-12 w-12 object-contain" />
            <img src="/pp-logo.jpg" alt="Pakistan Post" className="h-10 w-auto object-contain" />
          </div>
          <h1 className="font-display text-lg font-semibold text-primary">ASPO Larkana</h1>
          <p className="text-xs text-gray-500 mt-0.5">Sub Division Management System</p>
        </div>

        {/* Form card */}
        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h2 className="font-display text-2xl font-semibold text-gray-900 tracking-tight">{t('login')}</h2>
            <p className="text-gray-500 text-sm mt-1">Sign in to your account to continue.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                {t('username')}
              </label>
              <input
                id="login-username"
                name="username"
                type="text"
                autoComplete="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full border border-border bg-white rounded-lg px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors shadow-sm"
                placeholder="aspo_larkana"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                {t('password')}
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-border bg-white rounded-lg px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors shadow-sm"
                required
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200/70 rounded-lg text-sm text-danger">
                <span className="shrink-0 mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-bold text-sm tracking-wide hover:bg-primary-dark transition-all duration-150 disabled:opacity-60 shadow-sm hover:shadow-md active:scale-[0.99] mt-2"
            >
              {loading ? t('loading') : t('login')}
            </button>
          </form>

          <p className="text-[10px] text-gray-400 text-center mt-8 uppercase tracking-[0.15em]">
            Pakistan Post · Larkana Sub-Division · v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
