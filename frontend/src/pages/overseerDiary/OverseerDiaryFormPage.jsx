import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import FormField, { Input, Textarea } from '../../components/common/FormField';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';

export default function OverseerDiaryFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  const isEdit = Boolean(id);

  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({
    staff_id: '', week_start_date: '', week_end_date: '',
    places_visited: '', work_summary: '', observations: '', submitted_date: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    api.get('/staff', { params: { limit: 200, is_active: true } }).then(r => setStaff(r.data.data));
    if (isEdit) {
      api.get(`/overseer-diaries/${id}`)
        .then(r => {
          const d = r.data.data;
          setForm({
            staff_id: String(d.staff_id),
            week_start_date: d.week_start_date?.slice(0,10) || '',
            week_end_date:   d.week_end_date?.slice(0,10)   || '',
            places_visited:  d.places_visited  || '',
            work_summary:    d.work_summary    || '',
            observations:    d.observations    || '',
            submitted_date:  d.submitted_date?.slice(0,10) || '',
          });
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  function set(field) { return e => setForm({ ...form, [field]: e.target.value }); }

  // Auto-fill week_end_date = start + 6 days
  function handleStartDate(e) {
    const val = e.target.value;
    if (!val) { setForm({ ...form, week_start_date: '', week_end_date: '' }); return; }
    const end = new Date(val);
    end.setDate(end.getDate() + 6);
    const endStr = end.toISOString().split('T')[0];
    setForm({ ...form, week_start_date: val, week_end_date: endStr });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...form, staff_id: parseInt(form.staff_id) };
      if (isEdit) {
        await api.put(`/overseer-diaries/${id}`, payload);
      } else {
        await api.post('/overseer-diaries', payload);
      }
      navigate('/overseer-diary');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save.');
    } finally { setSaving(false); }
  }

  if (loading) return <div className="py-16 flex justify-center"><LoadingSpinner /></div>;

  return (
    <div>
      <PageHeader title={isEdit ? t('overseerDiary') : t('submitDiary')} backTo="/overseer-diary" />
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-none border border-transparent dark:border-dark-border p-5 max-w-lg">
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-danger">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">

          {!isEdit && (
            <FormField label={t('staff')} required>
              <select value={form.staff_id} onChange={set('staff_id')} required
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary bg-white">
                <option value="">— {t('select')} —</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.full_name} — {s.designation}</option>)}
              </select>
            </FormField>
          )}

          <FormField label={t('weekStartDate')} required>
            <Input type="date" value={form.week_start_date} onChange={handleStartDate} required />
          </FormField>

          <FormField label={t('weekEndDate')}>
            <Input type="date" value={form.week_end_date} readOnly
              className="bg-surface cursor-not-allowed" />
          </FormField>

          <FormField label={t('placesVisited')}>
            <Textarea value={form.places_visited} onChange={set('places_visited')} rows={2}
              placeholder="e.g. EDBO Faiz Ganj, EDBO Tando, GPO Larkana" />
          </FormField>

          <FormField label={t('workSummary')} required>
            <Textarea value={form.work_summary} onChange={set('work_summary')} rows={4} required />
          </FormField>

          <FormField label={t('observationsIssues')}>
            <Textarea value={form.observations} onChange={set('observations')} rows={3} />
          </FormField>

          <FormField label={t('submittedDate')}>
            <Input type="date" value={form.submitted_date} onChange={set('submitted_date')} />
          </FormField>

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? t('saving') : t('save')}
          </button>
        </form>
      </div>
    </div>
  );
}
