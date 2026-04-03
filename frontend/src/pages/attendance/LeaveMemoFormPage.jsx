import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import FormField, { Input, Select, Textarea } from '../../components/common/FormField';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';

export default function LeaveMemoFormPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [staff, setStaff] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [form, setForm] = useState({
    staff_id: '', dsps_memo_no: '', dsps_memo_date: '',
    leave_type: '', start_date: '', end_date: '', notes: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/staff', { params: { limit: 200, is_active: true } }).then(r => setStaff(r.data.data));
    api.get('/leave/types').then(r => setLeaveTypes(r.data.data)).catch(() => {});
  }, []);

  function set(field) { return e => setForm({ ...form, [field]: e.target.value }); }

  // Auto-calculate total days (display only)
  const totalDays = form.start_date && form.end_date
    ? Math.max(0, Math.round((new Date(form.end_date) - new Date(form.start_date)) / (1000*60*60*24)) + 1)
    : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/attendance/leave-memo', {
        ...form,
        staff_id: parseInt(form.staff_id),
      });
      navigate('/attendance');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save.');
    } finally { setSaving(false); }
  }

  return (
    <div>
      <PageHeader title={t('registerLeaveMemo')} backTo="/attendance" />
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-none border border-transparent dark:border-dark-border p-5 max-w-lg">
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-danger">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">

          <FormField label={t('staff')} required>
            <Select value={form.staff_id} onChange={set('staff_id')} required>
              <option value="">— {t('select')} —</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.full_name} — {s.designation}</option>)}
            </Select>
          </FormField>

          <FormField label={t('dspsMemoNo')} required>
            <Input type="text" value={form.dsps_memo_no} onChange={set('dsps_memo_no')} required
              placeholder="e.g. DSPS/LRK/456/2026" />
          </FormField>

          <FormField label={t('dspsMemoDate')} required>
            <Input type="date" value={form.dsps_memo_date} onChange={set('dsps_memo_date')} required />
          </FormField>

          <FormField label={t('leaveType')} required>
            <Select value={form.leave_type} onChange={set('leave_type')} required>
              <option value="">— {t('select')} —</option>
              {leaveTypes.length > 0
                ? leaveTypes.map(lt => <option key={lt.id} value={lt.name}>{lt.name}</option>)
                : ['Casual Leave','Earned Leave','Medical Leave','Special Leave'].map(lt =>
                    <option key={lt} value={lt}>{lt}</option>
                  )
              }
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('startDate')} required>
              <Input type="date" value={form.start_date} onChange={set('start_date')} required />
            </FormField>
            <FormField label={t('endDate')} required>
              <Input type="date" value={form.end_date} onChange={set('end_date')} required />
            </FormField>
          </div>

          {totalDays !== null && (
            <p className="text-sm text-gray-600">
              {t('totalDays')}: <span className="font-bold text-primary">{totalDays}</span>
            </p>
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
