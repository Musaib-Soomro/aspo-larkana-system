import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, Calendar, FileText, TrendingUp, ArrowRight,
  FileBarChart, Clock, CheckCircle2, Search, User
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';
import { RevenueChart, ArticlesChart } from './DashboardCharts';
import PageTransition from '../../components/common/PageTransition';
import api from '../../utils/api';
import { MONTHS } from '../../utils/dateFormat';

function SummaryCard({ title, value, color = 'primary', onClick, children, icon: Icon, delay = 0 }) {
  const { t } = useLanguage();
  const accent =
    color === 'danger' ? '#DC2626' :
    color === 'alert'  ? '#D97706' :
    color === 'success'? '#067034' : '#E8192C';
  
  const bgAccent =
    color === 'danger' ? 'rgba(220,38,38,0.1)' :
    color === 'alert'  ? 'rgba(217,119,6,0.1)' :
    color === 'success'? 'rgba(6,112,52,0.1)'  : 'rgba(232,25,44,0.1)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4 }}
      className={`bg-white dark:bg-dark-card rounded-2xl shadow-card dark:shadow-none p-5 border border-border dark:border-dark-border relative overflow-hidden group ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full transition-all group-hover:scale-110" style={{ background: bgAccent }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-extrabold text-gray-400 dark:text-dark-muted uppercase tracking-[0.15em] mb-1.5">{title}</p>
          <p className="text-3xl font-display font-semibold dark:text-dark-text" style={{ color: value === 0 ? undefined : accent }}>{value}</p>
        </div>
        {Icon && <Icon className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: accent }} />}
      </div>
      {onClick && (
        <div className="flex items-center gap-1.5 mt-4 text-[10px] font-bold text-gray-400 dark:text-dark-muted transition-colors group-hover:text-primary uppercase tracking-widest">
          {t('viewDetail') || 'View Details'} <ArrowRight size={10} className="mt-0.5" />
        </div>
      )}
      {children}
    </motion.div>
  );
}

// ─── PDF Modal ────────────────────────────────────────────────────────────────
function PdfModal({ type, onClose }) {
  const now = new Date();
  const [form, setForm] = useState({
    week_number: 1,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    start_date: '',
    end_date: '',
    reference_date: new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleGenerate() {
    setError('');
    setLoading(true);
    try {
      const payload =
        type === 'weekly'
          ? { week_number: form.week_number, month: form.month, year: form.year, start_date: form.start_date, end_date: form.end_date }
          : { month: form.month, year: form.year, reference_date: form.reference_date };

      const endpoint = type === 'weekly' ? '/pdf/weekly-diary' : '/pdf/monthly-statement';
      const res = await api.post(endpoint, payload, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = type === 'weekly'
        ? `weekly-diary-week${form.week_number}-${form.month}-${form.year}.pdf`
        : `monthly-statement-${MONTHS[form.month]}-${form.year}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white dark:bg-dark-card rounded-2xl shadow-modal border border-border dark:border-dark-border w-full max-w-sm p-6"
      >
        <h2 className="font-display text-lg font-bold text-gray-900 dark:text-dark-text mb-4">
          {type === 'weekly' ? 'Generate Weekly Diary' : 'Generate Monthly Statement'}
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 dark:text-dark-muted uppercase tracking-wider">Month</label>
              <select
                value={form.month}
                onChange={(e) => set('month', parseInt(e.target.value))}
                className="input-field mt-1.5"
              >
                {MONTHS.slice(1).map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 dark:text-dark-muted uppercase tracking-wider">Year</label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => set('year', parseInt(e.target.value))}
                className="input-field mt-1.5"
              />
            </div>
          </div>

          {type === 'weekly' && (
            <>
              <div>
                <label className="text-[10px] font-bold text-gray-400 dark:text-dark-muted uppercase tracking-wider">Week Number</label>
                <input
                  type="number" min="1" max="5"
                  value={form.week_number}
                  onChange={(e) => set('week_number', parseInt(e.target.value))}
                  className="input-field mt-1.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-dark-muted uppercase tracking-wider">Start Date</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => set('start_date', e.target.value)}
                    className="input-field mt-1.5"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-dark-muted uppercase tracking-wider">End Date</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => set('end_date', e.target.value)}
                    className="input-field mt-1.5"
                  />
                </div>
              </div>
            </>
          )}

          {type === 'monthly' && (
            <div>
              <label className="text-[10px] font-bold text-gray-400 dark:text-dark-muted uppercase tracking-wider">Reference Date</label>
              <input
                type="date"
                value={form.reference_date}
                onChange={(e) => set('reference_date', e.target.value)}
                className="input-field mt-1.5"
              />
            </div>
          )}
        </div>

        {error && <p className="text-xs text-danger font-semibold mt-4 text-center">{error}</p>}

        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="btn-outline flex-1">Cancel</button>
          <button onClick={handleGenerate} disabled={loading} className="btn-primary flex-1">
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfModal, setPdfModal] = useState(null);

  useEffect(() => {
    api.get('/dashboard/summary')
      .then((res) => setSummary(res.data.data))
      .catch(() => setError('Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>;
  if (error) return <div className="py-10 text-center text-danger">{error}</div>;
  if (!summary) return null;

  return (
    <PageTransition>
      <div className="pb-10">
        {pdfModal && <PdfModal type={pdfModal} onClose={() => setPdfModal(null)} />}

        <div className="flex items-center justify-between mb-8">
          <PageHeader title={t('dashboard')} />
          
          <div className="hidden sm:flex items-center gap-2 bg-white dark:bg-dark-card px-3 py-1.5 rounded-full border border-border dark:border-dark-border text-[10px] font-bold text-gray-400 tracking-[0.1em] uppercase">
            <Clock size={12} className="text-primary" />
            {new Date().toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
        </div>

        {/* Primary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            title={t('staffOnLeave')}
            value={summary.staff_on_leave.length}
            color={summary.staff_on_leave.length > 0 ? 'alert' : 'primary'}
            icon={Calendar}
            delay={0.05}
            onClick={() => navigate('/leave')}
          />
          <SummaryCard
            title={t('activeComplaints')}
            value={summary.active_complaints_count}
            color={summary.active_complaints_count > 0 ? 'danger' : 'primary'}
            icon={AlertTriangle}
            delay={0.1}
            onClick={() => navigate('/complaints')}
          />
          <SummaryCard
            title={t('pendingInquiries')}
            value={summary.pending_inquiries_count}
            color={summary.pending_inquiries_count > 0 ? 'alert' : 'primary'}
            icon={Search}
            delay={0.15}
            onClick={() => navigate('/inquiries')}
          />
          <SummaryCard
            title={t('daysRemaining')}
            value={summary.days_remaining_in_month}
            color={summary.days_remaining_in_month <= 5 ? 'danger' : 'primary'}
            icon={Clock}
            delay={0.2}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Analytics */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2 card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="section-title text-lg flex items-center gap-2">
                  <TrendingUp size={18} className="text-success" />
                  {t('revenueTrends') || 'Revenue Trends'}
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Larkana Sub Division</p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="text-gray-500">{t('current') || 'Current'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/30" />
                  <span className="text-gray-400">{t('previous') || 'Previous'}</span>
                </div>
              </div>
            </div>
            <RevenueChart />
          </motion.div>

          {/* Quick Lists */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="space-y-6"
          >
            <div className="card p-5 h-full">
              <h3 className="section-title mb-4 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-success" />
                {t('revenueStatus')}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-success/5 border border-success/10">
                  <span className="text-xs font-semibold text-success/80">{t('submitted')}</span>
                  <span className="text-sm font-bold text-success">{summary.revenue_submitted_offices.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-alert/5 border border-alert/10">
                  <span className="text-xs font-semibold text-alert/80">{t('pending')}</span>
                  <span className="text-sm font-bold text-alert">{summary.revenue_pending_offices.length}</span>
                </div>
                <div className="pt-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{t('pendingOffices') || 'Action Required'}</p>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {summary.revenue_pending_offices.slice(0, 8).map(o => (
                      <span key={o.id} className="px-2 py-1 text-[10px] bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-md text-gray-500 dark:text-dark-muted font-medium">
                        {o.name}
                      </span>
                    ))}
                    {summary.revenue_pending_offices.length > 8 && (
                      <span className="text-[10px] text-gray-400 font-bold ml-1">+{summary.revenue_pending_offices.length - 8} more</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Delivery Analytics */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="section-title text-lg flex items-center gap-2">
                  <FileBarChart size={18} className="text-primary" />
                  {t('deliveryVolume') || 'Article Delivery Volume'}
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 text-left">Daily Cumulative</p>
              </div>
            </div>
            <ArticlesChart />
          </motion.div>

          {/* Dynamic Lists */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="space-y-6"
          >
            {summary.inspections_overdue.length > 0 && (
              <div className="card p-5 border-l-4 border-l-danger">
                <h3 className="text-sm font-bold text-danger mb-4 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  {t('inspectionsOverdue')} ({summary.inspections_overdue.length})
                </h3>
                <div className="space-y-2.5">
                  {summary.inspections_overdue.slice(0, 3).map(i => (
                    <div key={i.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-dark-text font-medium">{i.office_name}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Month {i.allotted_month}</span>
                    </div>
                  ))}
                  {summary.inspections_overdue.length > 3 && (
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest text-right mt-2 cursor-pointer" onClick={() => navigate('/inspections')}>
                      {t('viewAll')} →
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="card p-5">
              <h3 className="section-title mb-4 flex items-center gap-2">
                <Calendar size={16} className="text-primary" />
                {t('staffOnLeave')}
              </h3>
              {summary.staff_on_leave.length > 0 ? (
                <div className="space-y-3">
                  {summary.staff_on_leave.slice(0, 4).map(s => (
                    <div key={s.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface dark:bg-dark-surface flex items-center justify-center shrink-0">
                        <User size={14} className="text-gray-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-dark-text truncate">{s.full_name}</p>
                        <p className="text-[10px] text-gray-400 dark:text-dark-muted font-medium">{s.leave_type} • {(s.start_date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic py-4">{t('noData')}</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="card p-6"
        >
          <h3 className="section-title mb-6">{t('quickActions')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { id: 'newComplaint', path: '/complaints/new', icon: AlertTriangle },
              { id: 'newInquiry', path: '/inquiries/new', icon: Search },
              { id: 'weeklyDiary', action: () => setPdfModal('weekly'), icon: FileText },
              { id: 'monthlyStatement', action: () => setPdfModal('monthly'), icon: FileBarChart },
            ].map((action, idx) => (
              <motion.button
                key={action.id}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={action.path ? () => navigate(action.path) : action.action}
                className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-surface dark:bg-dark-surface border border-border dark:border-dark-border hover:border-primary/30 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-dark-card shadow-sm flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <action.icon size={20} />
                </div>
                <span className="text-[11px] font-bold text-gray-600 dark:text-dark-muted group-hover:text-primary transition-colors text-center uppercase tracking-wider">
                  {t(action.id)}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
