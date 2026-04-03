import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { MONTHS } from '../../utils/dateFormat';

// Format PKR amounts
function fmt(n) {
  if (!n && n !== 0) return '—';
  const num = parseFloat(n);
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

// Only show the key amount totals in the summary card
const AMOUNT_HIGHLIGHTS = [
  'Money Orders',
  'Speed Post',
  'Stamps',
  'Savings Bank',
];

function TotalsCard({ month, year, submittedCount }) {
  const [totals, setTotals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!month || !year) return;
    setLoading(true);
    api.get('/revenue/monthly-totals', { params: { month, year } })
      .then((res) => setTotals(res.data.data))
      .finally(() => setLoading(false));
  }, [month, year]);

  // Sum amounts for each amount-type category
  const amountRows = totals.filter((r) => r.unit === 'amount');
  const totalRevenue = amountRows.reduce((sum, r) => sum + parseFloat(r.total || 0), 0);
  const countRows = totals.filter((r) => r.unit === 'count');
  const totalTransactions = countRows.reduce((sum, r) => sum + parseFloat(r.total || 0), 0);

  // Group by category for display
  const byCategory = {};
  for (const row of amountRows) {
    if (!byCategory[row.category]) byCategory[row.category] = 0;
    byCategory[row.category] += parseFloat(row.total || 0);
  }

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-primary">
          {MONTHS[month]} {year} — Division Totals
        </h3>
        <span className="text-xs text-gray-500">{submittedCount} office{submittedCount !== 1 ? 's' : ''} submitted</span>
      </div>

      {loading ? (
        <p className="text-xs text-gray-400">Loading totals...</p>
      ) : totals.length === 0 ? (
        <p className="text-xs text-gray-400">No submitted entries for this period.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-primary/5 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
            <p className="text-xl font-bold text-primary">PKR {fmt(totalRevenue)}</p>
          </div>
          <div className="bg-surface rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Total Transactions</p>
            <p className="text-xl font-bold text-gray-700">{fmt(totalTransactions)}</p>
          </div>
          {Object.entries(byCategory)
            .filter(([cat]) => AMOUNT_HIGHLIGHTS.some((h) => cat.includes(h)))
            .slice(0, 2)
            .map(([cat, total]) => (
              <div key={cat} className="bg-surface rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1 truncate">{cat}</p>
                <p className="text-lg font-bold text-gray-700">PKR {fmt(total)}</p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default function RevenueListPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPostmaster = user?.role === 'postmaster';
  const now = new Date();
  const [entries, setEntries] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offices, setOffices] = useState([]);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [filters, setFilters] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    office_id: isPostmaster ? String(user?.office_id || '') : '',
    page: 1,
  });

  useEffect(() => {
    api.get('/offices', { params: { limit: 100 } }).then((res) => setOffices(res.data.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { month: filters.month, year: filters.year, page: filters.page };
    if (filters.office_id) params.office_id = filters.office_id;
    api.get('/revenue', { params })
      .then((res) => {
        setEntries(res.data.data);
        setPagination(res.data.pagination);
        setSubmittedCount(res.data.data.filter((e) => !e.is_draft).length);
      })
      .finally(() => setLoading(false));
  }, [filters]);

  const columns = [
    { key: 'office_name', label: t('office') },
    { key: 'month', label: t('month'), render: (r) => MONTHS[r.month] },
    { key: 'year', label: t('year') },
    { key: 'submitted_by', label: 'Submitted By' },
    {
      key: 'status', label: t('status'),
      render: (r) => <StatusBadge status={r.is_draft ? 'Draft' : 'Submitted'} />,
    },
    {
      key: 'actions', label: '',
      render: (r) => (
        <button onClick={() => navigate(`/revenue/${r.id}`)} className="text-primary text-xs hover:underline">
          View →
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={t('revenue')} action="Enter Revenue" onAction={() => navigate('/revenue/new')} />
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filters.month}
          onChange={(e) => setFilters({ ...filters, month: e.target.value, page: 1 })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
        <input
          type="number"
          value={filters.year}
          onChange={(e) => setFilters({ ...filters, year: e.target.value, page: 1 })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-24"
        />
        {isPostmaster ? (
          <div className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700 flex-1 min-w-40">
            {offices.find((o) => String(o.id) === String(filters.office_id))?.name || 'Your Office'}
          </div>
        ) : (
          <select
            value={filters.office_id}
            onChange={(e) => setFilters({ ...filters, office_id: e.target.value, page: 1 })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white flex-1 min-w-40"
          >
            <option value="">All Offices</option>
            {offices.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        )}
      </div>

      {/* Monthly totals card — only shown for admin when not filtering by a single office */}
      {!isPostmaster && !filters.office_id && (
        <TotalsCard month={filters.month} year={filters.year} submittedCount={submittedCount} />
      )}

      <DataTable
        columns={columns}
        data={entries}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => setFilters({ ...filters, page: p })}
      />
    </div>
  );
}
