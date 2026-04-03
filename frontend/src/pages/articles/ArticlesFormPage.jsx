import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const ARTICLE_TYPES = [
  { code: 'RGL', label: 'Registered Letter' },
  { code: 'PAR', label: 'Parcel' },
  { code: 'VPP', label: 'Value Payable Parcel' },
  { code: 'VPL', label: 'Value Payable Letter' },
  { code: 'COD', label: 'Cash on Delivery' },
  { code: 'UMS', label: 'Ordinary / Unmanifested' },
  { code: 'IRP', label: 'Insured Parcel' },
];

function emptyRows() {
  return ARTICLE_TYPES.map((t) => ({
    article_type: t.code,
    in_deposit: 0,
    received: 0,
    delivered: 0,
    returned: 0,
    notes: '',
  }));
}

export default function ArticlesFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const isPostmaster = user?.role === 'postmaster';
  const initOfficeId = isPostmaster ? String(user?.office_id || '') : (searchParams.get('office_id') || '');
  const initDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const [offices, setOffices] = useState([]);
  const [officeId, setOfficeId] = useState(initOfficeId);
  const [date, setDate] = useState(initDate);
  const [rows, setRows] = useState(emptyRows());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isExisting, setIsExisting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/offices', { params: { limit: 100 } }).then((res) => {
      const delivery = res.data.data.filter((o) => o.type === 'Delivery' && o.is_active);
      setOffices(delivery);
      if (!isPostmaster && !officeId && delivery.length > 0) {
        setOfficeId(String(delivery[0].id));
      }
    });
  }, [isPostmaster, officeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchEntry = useCallback(() => {
    if (!officeId || !date) return;
    setLoading(true);
    api.get('/articles/entry', { params: { office_id: officeId, date } })
      .then((res) => {
        const data = res.data.data;
        setRows(data);
        // If any row has non-zero values, it's an existing entry
        setIsExisting(data.some((r) => r.in_deposit > 0 || r.received > 0 || r.delivered > 0 || r.returned > 0));
      })
      .finally(() => setLoading(false));
  }, [officeId, date]);

  useEffect(() => { fetchEntry(); }, [fetchEntry]);

  function updateRow(index, field, value) {
    setRows((prev) => prev.map((r, i) => i === index ? { ...r, [field]: parseInt(value) || 0 } : r));
  }

  function closing(row) {
    return Math.max(0, row.in_deposit + row.received - row.delivered - row.returned);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/articles/entry', { office_id: parseInt(officeId, 10), record_date: date, rows });
      navigate(`/articles?office_id=${officeId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete all article records for this office on this date?')) return;
    setDeleting(true);
    try {
      await api.delete('/articles/entry', { params: { office_id: officeId, date } });
      navigate(`/articles?office_id=${officeId}`);
    } catch {
      alert('Failed to delete.');
    } finally {
      setDeleting(false);
    }
  }

  const selectedOffice = offices.find((o) => String(o.id) === String(officeId));

  return (
    <div>
      <PageHeader
        title={isExisting ? t('editDailyRegister') : t('newDailyRegisterEntry')}
        backTo={officeId ? `/articles?office_id=${officeId}` : '/articles'}
      />

      {/* Header selectors */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-4 mb-4 flex flex-wrap gap-4 items-end">
        <div>
          <label htmlFor="entry-office" className="block text-xs font-medium text-gray-600 mb-1">{t('office')}</label>
          {isPostmaster ? (
            <div className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700 min-w-56">
              {offices.find((o) => String(o.id) === String(officeId))?.name || t('yourOffice')}
            </div>
          ) : (
            <select
              id="entry-office"
              name="entry-office"
              value={officeId}
              onChange={(e) => setOfficeId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white min-w-56"
            >
              {offices.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          )}
        </div>
        <div>
          <label htmlFor="entry-date" className="block text-xs font-medium text-gray-600 mb-1">{t('date')}</label>
          <input
            id="entry-date"
            name="entry-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        {selectedOffice && (
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-500">{t('deliveryOffice')}</p>
            <p className="text-sm font-medium text-gray-700">{selectedOffice.tehsil} Tehsil</p>
          </div>
        )}
      </div>

      {/* Grid */}
      <form onSubmit={handleSave}>
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-5 mb-4">
          {loading ? (
            <div className="py-10 flex justify-center"><LoadingSpinner /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-4 text-xs text-gray-500 font-medium min-w-40">{t('articleType')}</th>
                    <th className="text-center py-2 px-2 text-xs text-gray-500 font-medium">{t('code')}</th>
                    <th className="text-center py-2 px-2 text-xs text-gray-500 font-medium">{t('inDeposit')}</th>
                    <th className="text-center py-2 px-2 text-xs text-gray-500 font-medium">{t('received')}</th>
                    <th className="text-center py-2 px-2 text-xs text-gray-500 font-medium">{t('delivered')}</th>
                    <th className="text-center py-2 px-2 text-xs text-gray-500 font-medium">{t('returned')}</th>
                    <th className="text-center py-2 px-2 text-xs font-semibold text-primary">{t('closing')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row, i) => {
                    const type = ARTICLE_TYPES[i];
                    const cl = closing(row);
                    return (
                      <tr key={row.article_type}>
                        <td className="py-2 pr-4 font-medium text-gray-700">{type.label}</td>
                        <td className="py-2 px-2 text-center">
                          <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">{row.article_type}</span>
                        </td>
                        {['in_deposit', 'received', 'delivered', 'returned'].map((field) => (
                          <td key={field} className="py-2 px-2">
                            <input
                              id={`${row.article_type}-${field}`}
                              name={`${row.article_type}-${field}`}
                              type="number"
                              min="0"
                              value={row[field]}
                              onChange={(e) => updateRow(i, field, e.target.value)}
                              className="w-20 text-center border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-primary"
                            />
                          </td>
                        ))}
                        <td className={`py-2 px-2 text-center font-semibold ${cl > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                          {cl}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200">
                    <td colSpan={2} className="py-2 text-xs font-semibold text-gray-500">{t('totals')}</td>
                    {['in_deposit', 'received', 'delivered', 'returned'].map((field) => (
                      <td key={field} className="py-2 px-2 text-center font-bold text-gray-700">
                        {rows.reduce((s, r) => s + (r[field] || 0), 0)}
                      </td>
                    ))}
                    <td className="py-2 px-2 text-center font-bold text-amber-600">
                      {rows.reduce((s, r) => s + closing(r), 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-danger mb-4">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={saving || loading}
            className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60">
            {saving ? t('saving') : t('saveEntry')}
          </button>
          <button type="button" onClick={() => navigate(officeId ? `/articles?office_id=${officeId}` : '/articles')}
            className="border border-gray-300 px-6 py-2 rounded-lg text-sm hover:bg-gray-100">
            {t('cancel')}
          </button>
          {isExisting && (
            <button type="button" onClick={handleDelete} disabled={deleting}
              className="ml-auto border border-danger text-danger px-4 py-2 rounded-lg text-sm hover:bg-red-50 disabled:opacity-60">
              {deleting ? t('deleting') : t('deleteEntry')}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
