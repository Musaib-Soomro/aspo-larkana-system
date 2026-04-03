import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import FormField, { Input, Select, Textarea } from '../../components/common/FormField';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';

export default function WorkAssignmentFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  const isEdit = Boolean(id);

  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({
    staff_id: '', assigned_date: '', title: '', description: '',
    order_type: 'Written', order_reference: '', due_date: '',
    status: 'Open', completion_date: '', completion_notes: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    api.get('/staff', { params: { limit: 200, is_active: true } }).then(r => setStaff(r.data.data));
    if (isEdit) {
      api.get(`/work-assignments/${id}`)
        .then(r => {
          const d = r.data.data;
          setForm({
            staff_id:        String(d.staff_id),
            assigned_date:   d.assigned_date?.slice(0,10) || '',
            title:           d.title || '',
            description:     d.description || '',
            order_type:      d.order_type || 'Written',
            order_reference: d.order_reference || '',
            due_date:        d.due_date?.slice(0,10) || '',
            status:          d.status || 'Open',
            completion_date: d.completion_date?.slice(0,10) || '',
            completion_notes: d.completion_notes || '',
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
      const payload = {
        ...form,
        staff_id: parseInt(form.staff_id),
        order_reference: form.order_type === 'Written' ? form.order_reference : null,
        completion_date:  form.status === 'Completed' ? form.completion_date : null,
        completion_notes: form.status === 'Completed' ? form.completion_notes : null,
      };
      if (isEdit) {
        await api.put(`/work-assignments/${id}`, payload);
      } else {
        await api.post('/work-assignments', payload);
      }
      navigate('/work-assignments');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save.');
    } finally { setSaving(false); }
  }

  if (loading) return <div className="py-16 flex justify-center"><LoadingSpinner /></div>;

  return (
    <div>
      <PageHeader
        title={isEdit ? t('workAssignments') : t('newAssignment')}
        backTo="/work-assignments"
      />
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-none border border-transparent dark:border-dark-border p-5 max-w-lg">
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-danger">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">

          <FormField label={t('staff')} required>
            <Select value={form.staff_id} onChange={set('staff_id')} required>
              <option value="">— {t('select')} —</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.full_name} — {s.designation}</option>)}
            </Select>
          </FormField>

          <FormField label={t('title')} required>
            <Input type="text" value={form.title} onChange={set('title')} required />
          </FormField>

          <FormField label={t('description')}>
            <Textarea value={form.description} onChange={set('description')} rows={3} />
          </FormField>

          <FormField label={t('orderType')} required>
            <div className="flex gap-4">
              {['Written','Verbal'].map(ot => (
                <label key={ot} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="order_type" value={ot}
                    checked={form.order_type === ot} onChange={set('order_type')} />
                  {t(ot.toLowerCase())}
                </label>
              ))}
            </div>
          </FormField>

          {form.order_type === 'Written' && (
            <FormField label={t('orderReference')}>
              <Input type="text" value={form.order_reference} onChange={set('order_reference')}
                placeholder="e.g. ASPO/LRK/123/2026" />
            </FormField>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('assignedDate')} required>
              <Input type="date" value={form.assigned_date} onChange={set('assigned_date')} required />
            </FormField>
            <FormField label={t('dueDate')}>
              <Input type="date" value={form.due_date} onChange={set('due_date')} />
            </FormField>
          </div>

          {isEdit && (
            <>
              <FormField label={t('status')} required>
                <Select value={form.status} onChange={set('status')} required>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </Select>
              </FormField>

              {form.status === 'Completed' && (
                <>
                  <FormField label={t('completionDate')} required>
                    <Input type="date" value={form.completion_date} onChange={set('completion_date')} required />
                  </FormField>
                  <FormField label={t('completionNotes')}>
                    <Textarea value={form.completion_notes} onChange={set('completion_notes')} rows={2} />
                  </FormField>
                </>
              )}
            </>
          )}

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? t('saving') : t('save')}
          </button>
        </form>
      </div>
    </div>
  );
}
