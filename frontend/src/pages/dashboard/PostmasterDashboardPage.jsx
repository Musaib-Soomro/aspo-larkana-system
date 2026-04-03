import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';

const MONTHS_EN = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const LEAVE_COLORS = {
  CL: 'bg-blue-50 border-blue-200 text-blue-700',
  EL: 'bg-purple-50 border-purple-200 text-purple-700',
  Medical: 'bg-amber-50 border-amber-200 text-amber-700',
  Special: 'bg-green-50 border-green-200 text-green-700',
};

function fmt(n) {
  if (!n && n !== 0) return '—';
  const num = parseFloat(n);
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

function ProgressBar({ used, limit }) {
  const { t } = useLanguage();
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const barColor = pct >= 80 ? 'bg-danger' : pct >= 60 ? 'bg-amber-400' : 'bg-success';
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{used} {t('used')}</span>
        <span>{limit - used} {t('remaining')}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className={`${barColor} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function PostmasterDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/postmaster-summary')
      .then((res) => setData(res.data.data))
      .catch(() => setError(t('failedToLoadDashboard')))
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) return <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>;
  if (error) return <div className="py-20 text-center text-danger text-sm">{error}</div>;

  const { office, leave_balance, monthly_revenue, yearly_revenue_total,
          current_month, current_year, today, today_register_filled,
          today_totals, pending_articles, total_pending_articles } = data;

  const dateLocale = lang === 'ur' ? 'ur-PK' : 'en-PK';
  const monthName = lang === 'ur'
    ? new Date(current_year, current_month - 1).toLocaleDateString('ur-PK', { month: 'long' })
    : MONTHS_EN[current_month];
  const todayFormatted = new Date(today).toLocaleDateString(dateLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const ARTICLE_LABELS = {
    RGL: t('registered'), PAR: t('parcel'), VPP: t('vpParcel'),
    VPL: t('vpLetter'), COD: 'COD', UMS: t('ordinary'), IRP: t('insured'),
  };

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">
          {t('welcome')} {user?.full_name?.split(' ')[0] || t('postmaster')}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{office?.name} &mdash; {office?.tehsil} Tehsil</p>
        <p className="text-xs text-gray-400 mt-0.5">{todayFormatted}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => navigate('/revenue/new')}
          className="bg-primary text-white rounded-xl p-4 text-left hover:bg-primary-dark transition-colors shadow-sm"
        >
          <div className="text-lg mb-1">📊</div>
          <div className="text-sm font-semibold">{t('enterRevenueCta')}</div>
          <div className="text-xs opacity-80">{monthName} {current_year}</div>
        </button>
        <button
          onClick={() => navigate(`/articles/entry?office_id=${user?.office_id}&date=${today}`)}
          className="bg-success text-white rounded-xl p-4 text-left hover:opacity-90 transition-colors shadow-sm"
        >
          <div className="text-lg mb-1">📦</div>
          <div className="text-sm font-semibold">{t('articleRegisterCta')}</div>
          <div className="text-xs opacity-80">{t('todaysEntry')}</div>
        </button>
      </div>

      {/* Revenue Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Monthly */}
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border border border-gray-100 p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('monthlyRevenue')}</p>
              <p className="text-sm text-gray-600">{monthName} {current_year}</p>
            </div>
            {monthly_revenue ? (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                monthly_revenue.submitted
                  ? 'bg-success/10 text-success border-success/30'
                  : 'bg-amber-50 text-amber-600 border-amber-200'
              }`}>
                {monthly_revenue.submitted ? t('submitted') : t('draft')}
              </span>
            ) : (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-red-50 text-danger border-red-200">
                {t('notEntered')}
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-800">
            PKR {monthly_revenue ? fmt(monthly_revenue.amount) : '—'}
          </p>
          {!monthly_revenue && (
            <button onClick={() => navigate('/revenue/new')}
              className="mt-3 text-xs text-primary font-medium hover:underline">
              {t('enterNow')}
            </button>
          )}
        </div>

        {/* Yearly */}
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('yearlyRevenueTotal')}</p>
          <p className="text-sm text-gray-600">{current_year} ({t('submittedEntries')})</p>
          <p className="text-2xl font-bold text-gray-800 mt-3">PKR {fmt(yearly_revenue_total)}</p>
          <button onClick={() => navigate('/revenue')}
            className="mt-3 text-xs text-primary font-medium hover:underline">
            {t('viewAllEntries')}
          </button>
        </div>
      </div>

      {/* Today's Article Register */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border border border-gray-100 p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('todaysArticleRegister')}</p>
            <p className="text-sm text-gray-600">{new Date(today).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
              today_register_filled
                ? 'bg-success/10 text-success border-success/30'
                : 'bg-red-50 text-danger border-red-200'
            }`}>
              {today_register_filled ? t('filled') : t('notFilled')}
            </span>
            <button
              onClick={() => navigate(`/articles/entry?office_id=${user?.office_id}&date=${today}`)}
              className="text-xs text-primary font-medium hover:underline">
              {today_register_filled ? t('edit') : t('fillNow')} →
            </button>
          </div>
        </div>
        {today_register_filled && (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-600 font-medium">{t('inDeposit')}</p>
              <p className="text-xl font-bold text-blue-700">{today_totals.in_deposit}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs text-green-600 font-medium">{t('received')}</p>
              <p className="text-xl font-bold text-green-700">{today_totals.received}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-xs text-amber-600 font-medium">{t('delivered')}</p>
              <p className="text-xl font-bold text-amber-700">{today_totals.delivered}</p>
            </div>
          </div>
        )}
      </div>

      {/* Pending Articles */}
      {total_pending_articles > 0 && (
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border border border-amber-100 p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('articlesInDeposit')}</p>
            <span className="text-sm font-bold text-amber-600">{total_pending_articles} {t('totalPendingArticles')}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {pending_articles.map((a) => (
              <div key={a.type} className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                <span className="text-xs font-mono text-amber-700 font-semibold">{a.type}</span>
                <span className="text-xs text-amber-600">{ARTICLE_LABELS[a.type] || a.type}</span>
                <span className="text-sm font-bold text-amber-700 ml-1">{a.count}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate(`/articles?office_id=${user?.office_id}`)}
            className="mt-3 text-xs text-primary font-medium hover:underline">
            {t('viewArticleRegister')}
          </button>
        </div>
      )}

      {/* Leave Balance */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border border border-gray-100 p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">{t('leaveBalanceTitle')} — {current_year}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {leave_balance.map((lb) => (
            <div key={lb.type} className={`border rounded-xl p-3 ${LEAVE_COLORS[lb.type] || 'bg-gray-50 border-gray-200'}`}>
              <p className="text-xs font-bold uppercase tracking-wide opacity-70">{lb.type}</p>
              <p className="text-2xl font-bold mt-1">{lb.remaining}</p>
              <p className="text-xs opacity-70">{t('daysRemainingOf').replace('{limit}', lb.limit)}</p>
              <ProgressBar used={lb.used} limit={lb.limit} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
