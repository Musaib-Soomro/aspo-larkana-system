import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import FormField, { Input, Select, Textarea } from '../../components/common/FormField';
import StatusBadge from '../../components/common/StatusBadge';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../utils/api';
import { useIsAdmin } from '../../context/AuthContext';

export default function InquiryFormPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [offices, setOffices] = useState([]);
  const [inquiry, setInquiry] = useState(null);
  const [form, setForm] = useState({
    assigned_by: 'DSPS Larkana', dsps_letter_reference: '', dsps_letter_date: '',
    subject: '', office_id: '', date_received: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/offices', { params: { limit: 100 } }).then((res) => setOffices(res.data.data));
    if (isEdit) {
      api.get(`/inquiries/${id}`).then((res) => {
        const inq = res.data.data;
        setInquiry(inq);
        setForm({
          assigned_by: inq.assigned_by, dsps_letter_reference: inq.dsps_letter_reference || '',
          dsps_letter_date: inq.dsps_letter_date?.split('T')[0] || '',
          subject: inq.subject, office_id: inq.office_id || '',
          date_received: inq.date_received?.split('T')[0] || '', notes: inq.notes || '',
        });
      });
    }
  }, [id, isEdit]);

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) { await api.put(`/inquiries/${id}`, form); }
      else { await api.post('/inquiries', form); }
      navigate('/inquiries');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(status, extra = {}) {
    try {
      await api.put(`/inquiries/${id}`, { status, ...extra });
      const res = await api.get(`/inquiries/${id}`);
      setInquiry(res.data.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Update failed.');
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title={isEdit ? `Inquiry: ${inquiry?.inquiry_number || ''}` : 'New Inquiry'} backTo="/inquiries" />

      {isEdit && inquiry && (
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Status</span>
            <StatusBadge status={inquiry.status} />
          </div>
          {isAdmin && (
            <div className="flex flex-wrap gap-2">
              {inquiry.status === 'Pending' && (
                <button onClick={() => updateStatus('In Progress')}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded">Mark In Progress</button>
              )}
              {!inquiry.report_submitted && (
                <button onClick={() => updateStatus('Report Submitted', {
                  report_submitted: true,
                  report_submission_date: new Date().toISOString().split('T')[0],
                })}
                  className="px-3 py-1 text-xs bg-success text-white rounded">Mark Report Submitted</button>
              )}
              {inquiry.status !== 'Closed' && (
                <button onClick={() => updateStatus('Closed')}
                  className="px-3 py-1 text-xs bg-gray-600 text-white rounded">Close</button>
              )}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <FormField label={t('assignedBy')}>
            <Input value={form.assigned_by} onChange={set('assigned_by')} />
          </FormField>
          <FormField label={t('dspsReference')}>
            <Input value={form.dsps_letter_reference} onChange={set('dsps_letter_reference')} />
          </FormField>
          <FormField label={t('dspsLetterDate')}>
            <Input type="date" value={form.dsps_letter_date} onChange={set('dsps_letter_date')} />
          </FormField>
          <FormField label={t('dateReceived')} required>
            <Input type="date" value={form.date_received} onChange={set('date_received')} required />
          </FormField>
          <FormField label={t('office')}>
            <Select value={form.office_id} onChange={set('office_id')}>
              <option value="">— Select Office —</option>
              {offices.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </Select>
          </FormField>
        </div>
        <FormField label={t('subject')} required>
          <Textarea value={form.subject} onChange={set('subject')} rows={2} required />
        </FormField>
        <FormField label="Notes">
          <Textarea value={form.notes} onChange={set('notes')} rows={3} />
        </FormField>

        {error && <p className="text-sm text-danger mb-4">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-light disabled:opacity-60">
            {saving ? t('loading') : t('save')}
          </button>
          <button type="button" onClick={() => navigate('/inquiries')}
            className="border border-gray-300 px-6 py-2 rounded-lg text-sm hover:bg-gray-100">
            {t('cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
