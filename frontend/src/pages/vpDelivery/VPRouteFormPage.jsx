import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import FormField, { Input, Select, Textarea } from '../../components/common/FormField';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';

export default function VPRouteFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  const isEdit = Boolean(id);

  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({
    staff_id: '', route_name: '', villages: '', frequency: '',
    source: 'Larkana GPO', effective_date: '', is_active: true, notes: '',
  });
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    api.get('/staff', { params: { limit: 200, is_active: true } }).then(r => setStaff(r.data.data));
    if (isEdit) {
      api.get(`/vp-routes/${id}`)
        .then(r => {
          const d = r.data.data;
          setForm({
            staff_id:       String(d.staff_id),
            route_name:     d.route_name     || '',
            villages:       d.villages       || '',
            frequency:      d.frequency      || '',
            source:         d.source         || 'Larkana GPO',
            effective_date: d.effective_date?.slice(0,10) || '',
            is_active:      d.is_active ?? true,
            notes:          d.notes          || '',
          });
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  function set(field) { return e => setForm({ ...form, [field]: e.target.value }); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...form, staff_id: parseInt(form.staff_id) };
      if (isEdit) {
        await api.put(`/vp-routes/${id}`, payload);
      } else {
        await api.post('/vp-routes', payload);
      }
      navigate('/vp-delivery');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save.');
    } finally { setSaving(false); }
  }

  if (loading) return <div className="py-16 flex justify-center"><LoadingSpinner /></div>;

  return (
    <div>
      <PageHeader title={isEdit ? t('updateRoute') : `${t('add')} ${t('routeName')}`} backTo="/vp-delivery" />
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-none border border-transparent dark:border-dark-border p-5 max-w-lg">
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-danger">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">

          <FormField label={t('staff')} required>
            <Select value={form.staff_id} onChange={set('staff_id')} required>
              <option value="">— {t('select')} —</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </Select>
          </FormField>

          <FormField label={t('routeName')} required>
            <Input type="text" value={form.route_name} onChange={set('route_name')} required />
          </FormField>

          <FormField label={t('villages')} required>
            <Textarea value={form.villages} onChange={set('villages')} rows={4} required
              placeholder="One village per line or comma-separated" />
          </FormField>

          <FormField label={t('frequency')}>
            <Input type="text" value={form.frequency} onChange={set('frequency')}
              placeholder="e.g. Weekly, Bi-weekly" />
          </FormField>

          <FormField label={t('source')} required>
            <Input type="text" value={form.source} onChange={set('source')} required />
          </FormField>

          <FormField label={t('effectiveDate')} required>
            <Input type="date" value={form.effective_date} onChange={set('effective_date')} required />
          </FormField>

          {isEdit && (
            <FormField label="">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_active}
                  onChange={e => setForm({...form, is_active: e.target.checked})} />
                Active Route
              </label>
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
