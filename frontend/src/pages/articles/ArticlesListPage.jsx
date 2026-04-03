import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../utils/api';
import { MONTHS } from '../../utils/dateFormat';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const TYPES = ['RGL', 'PAR', 'VPP', 'VPL', 'COD', 'UMS', 'IRP'];

export default function ArticlesListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const isPostmaster = user?.role === 'postmaster';
  const now = new Date();

  const TABS = [t('dailyRegister'), t('vpCodRegister'), t('lateDelivery')];

  const [activeTab, setActiveTab] = useState(parseInt(searchParams.get('tab') || '0', 10));
  const [offices, setOffices] = useState([]);
  const [officeId, setOfficeId] = useState(
    isPostmaster ? String(user?.office_id || '') : (searchParams.get('office_id') || '')
  );
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  // Daily register
  const [dailyEntries, setDailyEntries] = useState([]);
  const [dailyLoading, setDailyLoading] = useState(false);

  // VP register
  const [vpEntries, setVPEntries] = useState([]);
  const [vpStatus, setVPStatus] = useState('');
  const [vpLoading, setVPLoading] = useState(false);

  // Late deliveries
  const [lateEntries, setLateEntries] = useState([]);
  const [lateLoading, setLateLoading] = useState(false);

  useEffect(() => {
    api.get('/offices', { params: { limit: 100 } }).then((res) => {
      const delivery = res.data.data.filter((o) => o.type === 'Delivery' && o.is_active);
      setOffices(delivery);
      if (!isPostmaster && !officeId && delivery.length) setOfficeId(String(delivery[0].id));
    });
  }, [isPostmaster, officeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Daily register fetch
  useEffect(() => {
    if (!officeId || activeTab !== 0) return;
    setDailyLoading(true);
    const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const dateTo = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
    api.get('/articles', { params: { office_id: officeId, date_from: dateFrom, date_to: dateTo } })
      .then((res) => setDailyEntries(res.data.data))
      .finally(() => setDailyLoading(false));
  }, [officeId, month, year, activeTab]);

  // VP register fetch
  useEffect(() => {
    if (!officeId || activeTab !== 1) return;
    setVPLoading(true);
    const params = { office_id: officeId };
    if (vpStatus) params.status = vpStatus;
    api.get('/articles/vp', { params })
      .then((res) => setVPEntries(res.data.data))
      .finally(() => setVPLoading(false));
  }, [officeId, vpStatus, activeTab]);

  // Late delivery fetch
  useEffect(() => {
    if (!officeId || activeTab !== 2) return;
    setLateLoading(true);
    const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const dateTo = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
    api.get('/articles/late', { params: { office_id: officeId, date_from: dateFrom, date_to: dateTo } })
      .then((res) => setLateEntries(res.data.data))
      .finally(() => setLateLoading(false));
  }, [officeId, month, year, activeTab]);

  function switchTab(i) {
    setActiveTab(i);
    setSearchParams({ tab: i, office_id: officeId });
  }

  async function handleDeleteLate(id) {
    if (!window.confirm('Remove this late delivery record?')) return;
    await api.delete(`/articles/late/${id}`);
    setLateEntries((p) => p.filter((r) => r.id !== id));
  }

  async function handleDeleteVP(id) {
    if (!window.confirm('Remove this VP/COD article record?')) return;
    await api.delete(`/articles/vp/${id}`);
    setVPEntries((p) => p.filter((r) => r.id !== id));
  }

  const selectedOffice = offices.find((o) => String(o.id) === String(officeId));

  const addAction = () => {
    if (activeTab === 0) navigate(`/articles/new${officeId ? `?office_id=${officeId}` : ''}`);
    if (activeTab === 1) navigate(`/articles/vp/new${officeId ? `?office_id=${officeId}` : ''}`);
    if (activeTab === 2) navigate(`/articles/late/new${officeId ? `?office_id=${officeId}` : ''}`);
  };

  return (
    <div>
      <PageHeader
        title={t('articles')}
        action={t('addEntry')}
        onAction={addAction}
      />

      {/* Office + period filters */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label htmlFor="filter-office" className="block text-xs font-medium text-gray-600 mb-1">{t('office')}</label>
          {isPostmaster ? (
            <div className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700 min-w-48">
              {offices.find((o) => String(o.id) === String(officeId))?.name || t('yourOffice')}
            </div>
          ) : (
            <select id="filter-office" name="filter-office" value={officeId} onChange={(e) => { setOfficeId(e.target.value); setSearchParams({ tab: activeTab, office_id: e.target.value }); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white min-w-48">
              {offices.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          )}
        </div>
        {activeTab !== 1 && (
          <>
            <div>
              <label htmlFor="filter-month" className="block text-xs font-medium text-gray-600 mb-1">{t('month')}</label>
              <select id="filter-month" name="filter-month" value={month} onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                {Object.entries(MONTHS).filter(([k]) => k !== '0').map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filter-year" className="block text-xs font-medium text-gray-600 mb-1">{t('year')}</label>
              <input id="filter-year" name="filter-year" type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-24" />
            </div>
          </>
        )}
        {activeTab === 1 && (
          <div>
            <label htmlFor="filter-status" className="block text-xs font-medium text-gray-600 mb-1">{t('status')}</label>
            <select id="filter-status" name="filter-status" value={vpStatus} onChange={(e) => setVPStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">All</option>
              <option value="In Deposit">{t('inDeposit')}</option>
              <option value="Delivered">{t('delivered')}</option>
              <option value="Returned">{t('returned')}</option>
            </select>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {TABS.map((tab, i) => (
          <button key={i} onClick={() => switchTab(i)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === i ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab 0: Daily Register */}
      {activeTab === 0 && (
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-5">
          {selectedOffice && <p className="text-xs text-gray-500 mb-3">{selectedOffice.name} — {MONTHS[month]} {year}</p>}
          {dailyLoading ? <div className="py-10 flex justify-center"><LoadingSpinner /></div>
            : dailyEntries.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">{t('noEntriesForPeriod')}</p>
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('date')}</th>
                      {TYPES.map((type) => <th key={type} className="text-center py-2 text-xs text-gray-500 font-medium">{type}</th>)}
                      <th className="text-center py-2 text-xs text-gray-500 font-medium">{t('total')}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dailyEntries.map((row) => (
                      <tr key={row.record_date} className="hover:bg-surface cursor-pointer"
                        onClick={() => navigate(`/articles/entry?office_id=${officeId}&date=${row.record_date.split('T')[0]}`)}>
                        <td className="py-2 font-medium">{(row.record_date)}</td>
                        {TYPES.map((type) => (
                          <td key={type} className="py-2 text-center text-gray-700">{parseInt(row[type.toLowerCase()]) || '—'}</td>
                        ))}
                        <td className="py-2 text-center font-semibold text-primary">{parseInt(row.total_received) || 0}</td>
                        <td className="py-2 text-right">
                          <button onClick={(e) => { e.stopPropagation(); navigate(`/articles/entry?office_id=${officeId}&date=${row.record_date.split('T')[0]}`); }}
                            className="text-xs text-primary hover:underline">{t('edit')}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      )}

      {/* Tab 1: VP / COD Register */}
      {activeTab === 1 && (
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-5">
          {vpLoading ? <div className="py-10 flex justify-center"><LoadingSpinner /></div>
            : vpEntries.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">{t('noVpCodFound')}</p>
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('trackingId')}</th>
                      <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('type')}</th>
                      <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('dateReceived')}</th>
                      <th className="text-right py-2 text-xs text-gray-500 font-medium">{t('valuePKR')}</th>
                      <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('bookingCity')}</th>
                      <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('addressee')}</th>
                      <th className="text-center py-2 text-xs text-gray-500 font-medium">{t('days')}</th>
                      <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('status')}</th>
                      <th className="text-left py-2 text-xs text-gray-500 font-medium">MO No.</th>
                      <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {vpEntries.map((v) => {
                      const days = parseInt(v.days_since_received) || 0;
                      const overdue = v.status === 'In Deposit' && days > 7;
                      return (
                        <tr key={v.id} className={overdue ? 'bg-red-50' : ''}>
                          <td className="py-2 font-mono text-xs font-medium">{v.tracking_id}</td>
                          <td className="py-2"><span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">{v.article_type}</span></td>
                          <td className="py-2">{(v.date_received)}</td>
                          <td className="py-2 text-right font-medium">{parseFloat(v.value_amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 text-gray-600">{v.booking_city || '—'}</td>
                          <td className="py-2 text-gray-600 text-xs">{v.addressee_name || '—'}</td>
                          <td className={`py-2 text-center text-xs font-medium ${overdue ? 'text-danger' : days > 5 ? 'text-amber-600' : 'text-gray-500'}`}>
                            {overdue
                              ? t('overdueInDeposit').replace('{days}', days)
                              : `${days}d`}
                          </td>
                          <td className="py-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              v.status === 'Delivered' ? 'bg-green-100 text-green-700'
                              : v.status === 'Returned' ? 'bg-gray-100 text-gray-600'
                              : overdue ? 'bg-red-100 text-danger' : 'bg-amber-100 text-amber-700'
                            }`}>{v.status}</span>
                          </td>
                          <td className="py-2 text-xs font-mono text-gray-600">{v.mo_number || '—'}</td>
                          <td className="py-2 text-right">
                            <button onClick={() => navigate(`/articles/vp/${v.id}/edit`)}
                              className="text-xs text-primary hover:underline mr-3">{t('edit')}</button>
                            <button onClick={() => handleDeleteVP(v.id)}
                              className="text-xs text-gray-300 hover:text-danger">{t('remove')}</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      )}

      {/* Tab 2: Late Delivery */}
      {activeTab === 2 && (
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-5">
          {lateLoading ? <div className="py-10 flex justify-center"><LoadingSpinner /></div>
            : lateEntries.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">{t('noLateDeliveryFound')}</p>
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('trackingId')}</th>
                      <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('type')}</th>
                      <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('dateReceived')}</th>
                      <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('dateDelivered')}</th>
                      <th className="text-center py-2 text-xs text-gray-500 font-medium">{t('daysHeld')}</th>
                      <th className="text-center py-2 text-xs text-gray-500 font-medium">{t('demurrageDays')}</th>
                      <th className="text-right py-2 text-xs text-gray-500 font-medium">{t('fee')}</th>
                      <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('addressee')}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lateEntries.map((r) => (
                      <tr key={r.id}>
                        <td className="py-2 font-mono text-xs font-medium">{r.tracking_id}</td>
                        <td className="py-2"><span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">{r.article_type}</span></td>
                        <td className="py-2">{(r.date_received)}</td>
                        <td className="py-2">{(r.date_delivered)}</td>
                        <td className="py-2 text-center font-medium">{r.days_held}</td>
                        <td className="py-2 text-center text-danger font-medium">{r.demurrage_days}</td>
                        <td className="py-2 text-right font-bold text-danger">
                          {parseFloat(r.demurrage_amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 text-xs text-gray-600">{r.addressee_name || '—'}</td>
                        <td className="py-2 text-right">
                          <button onClick={() => handleDeleteLate(r.id)}
                            className="text-xs text-gray-300 hover:text-danger">{t('remove')}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200">
                      <td colSpan={6} className="py-2 text-xs font-semibold text-gray-500">{t('totalDemurrageCollected')}</td>
                      <td className="py-2 text-right font-bold text-danger">
                        PKR {lateEntries.reduce((s, r) => s + parseFloat(r.demurrage_amount), 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
