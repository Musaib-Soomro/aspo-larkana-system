import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import api from '../../utils/api';
import {  } from '../../utils/dateFormat';
import { useLanguage } from '../../context/LanguageContext';
import { useIsAdmin } from '../../context/AuthContext';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function VPDeliveryPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isAdmin = useIsAdmin();

  const now = new Date();
  const [tab, setTab] = useState('log');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());
  const [staff, setStaff] = useState([]);
  const [staffId, setStaffId] = useState('');

  const [logs, setLogs]         = useState([]);
  const [pagination, setPagination] = useState(null);
  const [monthly, setMonthly]   = useState(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [page, setPage]         = useState(1);

  const [routes, setRoutes]     = useState([]);
  const [routesLoading, setRoutesLoading] = useState(false);

  useEffect(() => {
    api.get('/staff', { params: { limit: 200, is_active: true } }).then(r => setStaff(r.data.data));
  }, []);

  useEffect(() => {
    if (tab !== 'log') return;
    setLogsLoading(true);
    const params = { page, limit: 20, month, year };
    if (staffId) params.staff_id = staffId;
    Promise.all([
      api.get('/vp-delivery', { params }),
      staffId ? api.get('/vp-delivery/monthly', { params: { staff_id: staffId, month, year } }) : Promise.resolve(null),
    ]).then(([logRes, monthlyRes]) => {
      setLogs(logRes.data.data);
      setPagination(logRes.data.pagination);
      setMonthly(monthlyRes?.data?.data || null);
    }).finally(() => setLogsLoading(false));
  }, [tab, page, month, year, staffId]);

  useEffect(() => {
    if (tab !== 'routes') return;
    setRoutesLoading(true);
    api.get('/vp-routes').then(r => setRoutes(r.data.data)).finally(() => setRoutesLoading(false));
  }, [tab]);

  const logColumns = [
    { key: 'date',               label: t('date'),               render: r => (r.date) },
    { key: 'route_name',         label: t('routeName'),          render: r => r.route_name || '—' },
    { key: 'articles_received',  label: t('articlesReceived'),   render: r => r.articles_received },
    { key: 'articles_delivered', label: t('articlesDelivered'),  render: r => r.articles_delivered },
    { key: 'articles_undelivered', label: t('articlesUndelivered'), render: r => (
      <span className={r.articles_undelivered > 0 ? 'text-danger font-medium' : 'text-gray-500'}>
        {r.articles_undelivered}
      </span>
    )},
    { key: 'actions', label: '', render: r => (
      isAdmin ? <button onClick={() => navigate(`/vp-delivery/log/${r.id}/edit`)} className="text-primary text-xs hover:underline">{t('edit')}</button> : null
    )},
  ];

  return (
    <div>
      <PageHeader title={t('vpDelivery')} />

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-border">
        {[['log', t('dailyLog')], ['routes', t('routeList')]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>{label}</button>
        ))}
      </div>

      {tab === 'log' && (
        <>
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-none border border-transparent dark:border-dark-border p-4 mb-4 flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('staff')}</label>
              <select value={staffId} onChange={e => setStaffId(e.target.value)}
                className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                <option value="">— {t('all')} —</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('month')}</label>
              <select value={month} onChange={e => { setMonth(parseInt(e.target.value)); setPage(1); }}
                className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                {MONTHS.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('year')}</label>
              <select value={year} onChange={e => { setYear(parseInt(e.target.value)); setPage(1); }}
                className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            {isAdmin && (
              <button onClick={() => navigate('/vp-delivery/log/new')} className="btn-primary text-sm">
                + {t('add')}
              </button>
            )}
          </div>

          {/* Monthly totals */}
          {monthly && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                [t('articlesReceived'),   monthly.total_received,   'text-gray-700'],
                [t('articlesDelivered'),  monthly.total_delivered,  'text-green-600'],
                [t('articlesUndelivered'),monthly.total_undelivered,'text-danger'],
              ].map(([l,v,c]) => (
                <div key={l} className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-none border border-transparent dark:border-dark-border p-3 text-center">
                  <p className={`text-2xl font-bold ${c}`}>{v || 0}</p>
                  <p className="text-xs text-gray-400 mt-1">{l}</p>
                </div>
              ))}
            </div>
          )}

          <DataTable columns={logColumns} data={logs} loading={logsLoading}
            pagination={pagination} onPageChange={setPage} emptyMessage={t('noData')} />
        </>
      )}

      {tab === 'routes' && (
        <>
          <div className="flex justify-end mb-4">
            {isAdmin && (
              <button onClick={() => navigate('/vp-routes/new')} className="btn-primary text-sm">
                + {t('add')}
              </button>
            )}
          </div>
          {routesLoading ? (
            <div className="py-12 flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : routes.length === 0 ? (
            <p className="text-center text-gray-400 py-8">{t('noData')}</p>
          ) : (
            <div className="space-y-3">
              {routes.map(r => (
                <div key={r.id} className={`bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-none border border-transparent dark:border-dark-border p-4 ${!r.is_active ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display font-semibold text-gray-800">{r.route_name}</h3>
                        {!r.is_active && <span className="text-xs text-gray-400 border border-gray-200 rounded-full px-2 py-0.5">Inactive</span>}
                      </div>
                      <p className="text-xs text-gray-400">{r.frequency} · {t('effectiveDate')}: {(r.effective_date)}</p>
                      <p className="text-xs text-gray-500 mt-1">{t('source')}: {r.source}</p>
                      <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{r.villages}</p>
                    </div>
                    {isAdmin && (
                      <button onClick={() => navigate(`/vp-routes/${r.id}/edit`)}
                        className="text-xs text-primary hover:underline shrink-0 ml-4">{t('edit')}</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
