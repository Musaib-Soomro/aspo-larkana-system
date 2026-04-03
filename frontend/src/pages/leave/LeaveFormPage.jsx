import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import FormField, { Input, Select, Textarea } from '../../components/common/FormField';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';

export default function LeaveFormPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [staff, setStaff] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [clBalance, setClBalance] = useState(null);
  const [form, setForm] = useState({
    staff_id: '', leave_type: '', start_date: '', end_date: '',
    reason: '', substitute_staff_id: '', notes: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/staff', { params: { limit: 200 } }).then((res) => setStaff(res.data.data));
    api.get('/leave/types').then((res) => setLeaveTypes(res.data.data.filter((lt) => lt.is_active)));
  }, []);

  useEffect(() => {
    if (form.staff_id && form.leave_type === 'Casual Leave') {
      api.get(`/leave/balance/${form.staff_id}`)
        .then((res) => setClBalance(res.data.data['Casual Leave'] || null))
        .catch(() => setClBalance(null));
    } else {
      setClBalance(null);
    }
  }, [form.staff_id, form.leave_type]);

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  const totalDays = form.start_date && form.end_date
    ? Math.max(0, Math.floor((new Date(form.end_date) - new Date(form.start_date)) / (1000 * 60 * 60 * 24)) + 1)
    : 0;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (totalDays < 1) { setError(t('endDateError')); return; }
    setSaving(true);
    try {
      await api.post('/leave', {
        ...form,
        staff_id: parseInt(form.staff_id, 10),
        substitute_staff_id: form.substitute_staff_id ? parseInt(form.substitute_staff_id, 10) : null,
      });
      navigate('/leave');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save leave record.');
    } finally {
      setSaving(false);
    }
  }

  const otherStaff = staff.filter((s) => s.id !== parseInt(form.staff_id, 10));

  return (
    <div className="max-w-2xl">
      <PageHeader title={t('grantLeave')} backTo="/leave" />
      <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <FormField label={t('staffMember')} required>
            <Select value={form.staff_id} onChange={set('staff_id')} required>
              <option value="">{t('selectStaff')}</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name} — {s.office_name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label={t('leaveType')} required>
            <Select value={form.leave_type} onChange={set('leave_type')} required>
              <option value="">{t('selectType')}</option>
              {leaveTypes.map((lt) => (
                <option key={lt.id} value={lt.type_name}>{lt.type_name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label={t('startDate')} required>
            <Input type="date" value={form.start_date} onChange={set('start_date')} required />
          </FormField>
          <FormField label={t('endDate')} required>
            <Input type="date" value={form.end_date} onChange={set('end_date')} required />
          </FormField>
        </div>

        {totalDays > 0 && (
          <div className="mb-4 p-3 bg-surface rounded-lg border border-gray-200 text-sm">
            {t('totalDays')}: <strong>{totalDays} {t('days')}</strong>
          </div>
        )}

        {clBalance !== null && (
          <div className={`mb-4 p-3 rounded-lg border text-sm ${
            clBalance.remaining !== null && clBalance.remaining < totalDays
              ? 'bg-red-50 border-red-200 text-danger'
              : 'bg-green-50 border-green-200 text-success'
          }`}>
            {t('clBalance')}: <strong>{clBalance.remaining ?? '∞'} {t('days')} {t('remaining')}</strong>
            {clBalance.annual_limit && ` (${clBalance.used}/${clBalance.annual_limit} ${t('used')})`}
            {clBalance.remaining !== null && clBalance.remaining < totalDays && (
              <span className="font-semibold"> — {t('insufficientBalance')}</span>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <FormField label={`${t('substitute')} (${t('none')})`}>
            <Select value={form.substitute_staff_id} onChange={set('substitute_staff_id')}>
              <option value="">— {t('none')} —</option>
              {otherStaff.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label={t('reason')}>
            <Input value={form.reason} onChange={set('reason')} placeholder="e.g. Medical treatment" />
          </FormField>
        </div>
        <FormField label={t('notes')}>
          <Textarea value={form.notes} onChange={set('notes')} rows={2} />
        </FormField>

        {error && <p className="text-sm text-danger mb-4">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60">
            {saving ? t('saving') : t('grantLeave')}
          </button>
          <button type="button" onClick={() => navigate('/leave')}
            className="border border-gray-300 px-6 py-2 rounded-lg text-sm hover:bg-gray-100">
            {t('cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
