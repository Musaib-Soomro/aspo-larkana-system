import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import FormField, { Input, Select, Textarea } from '../../components/common/FormField';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';

export default function VPDeliveryFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  const isEdit = Boolean(id);

  const [staff, setStaff]   = useState([]);
  const [routes, setRoutes] = useState([]);
  const [form, setForm] = useState({
    staff_id: '', route_id: '', date: '', articles_received: '', articles_delivered: '',
    undelivered_reason: '', notes: '',
  });
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    api.get('/staff', { params: { limit: 200, is_active: true } }).then(r => setStaff(r.data.data));
    api.get('/vp-routes', { params: { is_active: true } }).then(r => setRoutes(r.data.data));
    if (isEdit) {
      api.get(`/vp-delivery?limit=1`).then(() => {}).catch(() => {});
      // Fetch the specific log — use list with id filter not available, so use edit via list
      api.get('/vp-delivery', { params: { limit: 200 } })
        .then(r => {
          const log = r.data.data.find(l => String(l.id) === String(id));
          if (log) setForm({
            staff_id:           String(log.staff_id),
            route_id:           String(log.route_id || ''),
            date:               log.date?.slice(0,10) || '',
            articles_received:  String(log.articles_received),
            articles_delivered: String(log.articles_delivered),
            undelivered_reason: log.undelivered_reason || '',
            notes:              log.notes || '',
          });
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  function set(field) { return e => setForm({ ...form, [field]: e.target.value }); }

  const undelivered = form.articles_received !== '' && form.articles_delivered !== ''
    ? Math.max(0, parseInt(form.articles_received || 0) - parseInt(form.articles_delivered || 0))
    : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        staff_id: parseInt(form.staff_id),
        route_id: form.route_id ? parseInt(form.route_id) : null,
        date: form.date,
        articles_received:  parseInt(form.articles_received),
        articles_delivered: parseInt(form.articles_delivered),
        undelivered_reason: undelivered > 0 ? form.undelivered_reason : null,
        notes: form.notes || null,
      };
      if (isEdit) {
        await api.put(`/vp-delivery/${id}`, payload);
      } else {
        await api.post('/vp-delivery', payload);
      }
      navigate('/vp-delivery');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save.');
    } finally { setSaving(false); }
  }

  if (loading) return <div className="py-16 flex justify-center"><LoadingSpinner /></div>;

  return (
    <div>
      <PageHeader title={isEdit ? t('vpDelivery') : `${t('add')} ${t('dailyLog')}`} backTo="/vp-delivery" />
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-none border border-transparent dark:border-dark-border p-5 max-w-lg">
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-danger">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">

          <FormField label={t('staff')} required>
            <Select value={form.staff_id} onChange={set('staff_id')} required>
              <option value="">— {t('select')} —</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </Select>
          </FormField>

          <FormField label={t('date')} required>
            <Input type="date" value={form.date} onChange={set('date')} required />
          </FormField>

          <FormField label={t('routeName')}>
            <Select value={form.route_id} onChange={set('route_id')}>
              <option value="">— {t('select')} —</option>
              {routes.map(r => <option key={r.id} value={r.id}>{r.route_name}</option>)}
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('articlesReceived')} required>
              <Input type="number" min="0" value={form.articles_received} onChange={set('articles_received')} required />
            </FormField>
            <FormField label={t('articlesDelivered')} required>
              <Input type="number" min="0" value={form.articles_delivered} onChange={set('articles_delivered')} required />
            </FormField>
          </div>

          {undelivered !== null && (
            <div className={`p-3 rounded-lg text-sm font-medium ${undelivered > 0 ? 'bg-red-50 text-danger' : 'bg-green-50 text-green-700'}`}>
              {t('articlesUndelivered')}: <span className="font-bold">{undelivered}</span>
            </div>
          )}

          {undelivered > 0 && (
            <FormField label={t('undeliveredReason')}>
              <Textarea value={form.undelivered_reason} onChange={set('undelivered_reason')} rows={2} />
            </FormField>
          )}

          <FormField label={t('notes')}>
            <Textarea value={form.notes} onChange={set('notes')} rows={2} />
          </FormField>

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? t('saving') : t('save')}
          </button>
        </form>
      </div>
    </div>
  );
}
