import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import FormField, { Input, Select, Textarea } from '../../components/common/FormField';
import StatusBadge from '../../components/common/StatusBadge';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../utils/api';
import { useIsAdmin } from '../../context/AuthContext';
import { ARTICLE_TYPES, COMPLAINT_SOURCES } from '../../utils/constants';

export default function ComplaintFormPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [offices, setOffices] = useState([]);
  const [complaint, setComplaint] = useState(null);
  const [form, setForm] = useState({
    office_id: '', complainant_name: '', complainant_contact: '',
    article_number: '', article_type: 'Registered Letter',
    date_received: new Date().toISOString().split('T')[0],
    source: 'In Person', complaint_description: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/offices', { params: { limit: 100 } }).then((res) => setOffices(res.data.data));
    if (isEdit) {
      api.get(`/complaints/${id}`).then((res) => {
        const c = res.data.data;
        setComplaint(c);
        setForm({
          office_id: c.office_id || '', complainant_name: c.complainant_name,
          complainant_contact: c.complainant_contact || '',
          article_number: c.article_number || '', article_type: c.article_type,
          date_received: c.date_received?.split('T')[0] || '',
          source: c.source, complaint_description: c.complaint_description,
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
      if (isEdit) { await api.put(`/complaints/${id}`, form); }
      else { await api.post('/complaints', form); }
      navigate('/complaints');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  async function quickAction(updates) {
    try {
      await api.put(`/complaints/${id}`, updates);
      const res = await api.get(`/complaints/${id}`);
      setComplaint(res.data.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed.');
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title={isEdit ? `Complaint: ${complaint?.complaint_number || ''}` : 'New Complaint'} backTo="/complaints" />

      {isEdit && complaint && (
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Current Status</span>
            <StatusBadge status={complaint.status} />
          </div>
          {isAdmin && (
            <div className="flex flex-wrap gap-2">
              {complaint.status === 'Active' && (
                <button onClick={() => quickAction({ status: 'Proof Shared', proof_shared_date: new Date().toISOString().split('T')[0] })}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
                  Mark Proof Shared
                </button>
              )}
              {complaint.status === 'Proof Shared' && (
                <button onClick={() => quickAction({ status: 'Memo Generated', memo_generated_date: new Date().toISOString().split('T')[0] })}
                  className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700">
                  Generate Memo
                </button>
              )}
              {complaint.status === 'Memo Generated' && (
                <button onClick={() => quickAction({ status: 'Memo Sent to DSPS', memo_sent_to_dsps_date: new Date().toISOString().split('T')[0] })}
                  className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700">
                  Mark Memo Sent
                </button>
              )}
              {complaint.status === 'Memo Sent to DSPS' && (
                <button onClick={() => quickAction({ status: 'Reply Received', dsps_reply_received: true, dsps_reply_date: new Date().toISOString().split('T')[0] })}
                  className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700">
                  Mark Reply Received
                </button>
              )}
              {complaint.status !== 'Closed' && (
                <button onClick={() => quickAction({ status: 'Closed' })}
                  className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700">
                  Close Complaint
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <FormField label={t('office')}>
            <Select value={form.office_id} onChange={set('office_id')}>
              <option value="">— Select Office —</option>
              {offices.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </Select>
          </FormField>
          <FormField label={t('complainant')} required>
            <Input value={form.complainant_name} onChange={set('complainant_name')} required />
          </FormField>
          <FormField label={t('contact')}>
            <Input value={form.complainant_contact} onChange={set('complainant_contact')} />
          </FormField>
          <FormField label={t('articleNo')}>
            <Input value={form.article_number} onChange={set('article_number')} />
          </FormField>
          <FormField label={t('articleType')} required>
            <Select value={form.article_type} onChange={set('article_type')}>
              {ARTICLE_TYPES.map((a) => <option key={a}>{a}</option>)}
            </Select>
          </FormField>
          <FormField label={t('dateReceived')} required>
            <Input type="date" value={form.date_received} onChange={set('date_received')} required />
          </FormField>
          <FormField label={t('source')} required>
            <Select value={form.source} onChange={set('source')}>
              {COMPLAINT_SOURCES.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </FormField>
        </div>
        <FormField label={t('description')} required>
          <Textarea value={form.complaint_description} onChange={set('complaint_description')} rows={4} required />
        </FormField>

        {error && <p className="text-sm text-danger mb-4">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-light disabled:opacity-60">
            {saving ? t('loading') : t('save')}
          </button>
          <button type="button" onClick={() => navigate('/complaints')}
            className="border border-gray-300 px-6 py-2 rounded-lg text-sm hover:bg-gray-100">
            {t('cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
