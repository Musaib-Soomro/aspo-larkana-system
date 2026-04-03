import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';

const LEAVE_TYPES = ['Casual Leave', 'Earned Leave', 'Medical Leave', 'Special Leave'];
const CL_LIMIT = 20;

function BalanceBar({ used, limit }) {
  if (!limit) return <span className="text-xs text-gray-400">Unlimited</span>;
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const color = pct >= 90 ? 'bg-danger' : pct >= 60 ? 'bg-alert' : 'bg-success';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-1.5 min-w-12">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-600 whitespace-nowrap">{used}/{limit}</span>
    </div>
  );
}

export default function LeaveBalancePage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/leave/balances', { params: { year } })
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  }, [year]);

  const filtered = data.filter((s) =>
    !search ||
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.office_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title={t('leaveBalanceSummary')} backTo="/leave" />

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder={t('searchStaffOrOffice')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48"
        />
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-medium">{t('year')}:</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-24"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><LoadingSpinner /></div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-surface">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{t('staff')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{t('office')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{t('designation')}</th>
                {LEAVE_TYPES.map((lt) => (
                  <th key={lt} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                    {lt.replace(' Leave', '')}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={LEAVE_TYPES.length + 4} className="px-4 py-10 text-center text-gray-400">
                    {t('noStaffFound')}
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{s.full_name}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{s.office_name}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{s.designation}</td>
                    {LEAVE_TYPES.map((lt) => {
                      const bal = s.leave_balance[lt];
                      const used = bal?.used || 0;
                      const limit = lt === 'Casual Leave' ? CL_LIMIT : (bal?.annual_limit || null);
                      return (
                        <td key={lt} className="px-4 py-3">
                          {used === 0 && !limit ? (
                            <span className="text-xs text-gray-300">—</span>
                          ) : (
                            <BalanceBar used={used} limit={limit} />
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/staff/${s.id}`)}
                        className="text-primary text-xs hover:underline"
                      >
                        {t('view')} →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3 text-right">{filtered.length} {t('staff')} • {year}</p>
    </div>
  );
}
