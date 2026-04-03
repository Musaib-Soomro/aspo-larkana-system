import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import FormField, { Input, Select } from '../../components/common/FormField';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';

const LATE_TYPES = ['RGL', 'PAR', 'IRP', 'UMS'];
const TYPE_LABELS = { RGL: 'Registered Letter', PAR: 'Parcel', IRP: 'Insured Parcel', UMS: 'Ordinary / Unmanifested' };

export default function LateDeliveryFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const initOfficeId = searchParams.get('office_id') || '';

  const [offices, setOffices] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    office_id: initOfficeId,
    article_type: 'RGL',
    tracking_id: '',
    date_received: '',
    date_delivered: new Date().toISOString().split('T')[0],
    addressee_name: '',
    notes: '',
  });

  useEffect(() => {
    api.get('/offices', { params: { limit: 100 } }).then((res) => {
      const delivery = res.data.data.filter((o) => o.type === 'Delivery' && o.is_active);
      setOffices(delivery);
      if (!form.office_id && delivery.length) setForm((p) => ({ ...p, office_id: String(delivery[0].id) }));
    });
  }, []);

  function set(field, value) { setForm((p) => ({ ...p, [field]: value })); }

  // Compute preview
  const daysHeld = (() => {
    if (!form.date_received || !form.date_delivered) return null;
    return Math.max(0, Math.floor((new Date(form.date_delivered) - new Date(form.date_received)) / 86400000));
  })();
  const demurrageDays = daysHeld !== null ? Math.max(0, daysHeld - 7) : 0;
  const demurrageAmount = demurrageDays * 10;

  async function handleSubmit(e) {
    e.preventDefault();
    if (daysHeld === null || daysHeld <= 7) {
      setError('Delivery date must be more than 7 days after receipt date for a late delivery record.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await api.post('/articles/late', {
        ...form,
        office_id: parseInt(form.office_id, 10),
      });
      navigate(`/articles?tab=2&office_id=${form.office_id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <PageHeader
        title={t('recordLateDelivery')}
        backTo={`/articles?tab=2&office_id=${form.office_id}`}
      />

      <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-5">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('office')}>
              <Select value={form.office_id} onChange={(e) => set('office_id', e.target.value)}>
                {offices.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </Select>
            </FormField>
            <FormField label={t('articleType')}>
              <Select value={form.article_type} onChange={(e) => set('article_type', e.target.value)}>
                {LATE_TYPES.map((type) => <option key={type} value={type}>{type} — {TYPE_LABELS[type]}</option>)}
              </Select>
            </FormField>
            <FormField label={t('trackingId')} required>
              <Input value={form.tracking_id} onChange={(e) => set('tracking_id', e.target.value.toUpperCase())}
                placeholder="e.g. RGL123456789PK" required />
            </FormField>
            <FormField label={t('addresseeName')}>
              <Input value={form.addressee_name} onChange={(e) => set('addressee_name', e.target.value)} />
            </FormField>
            <FormField label={t('dateReceived')} required>
              <Input type="date" value={form.date_received} onChange={(e) => set('date_received', e.target.value)} required />
            </FormField>
            <FormField label={t('dateDelivered')} required>
              <Input type="date" value={form.date_delivered} onChange={(e) => set('date_delivered', e.target.value)} required />
            </FormField>
          </div>

          <FormField label={t('notes')}>
            <Input value={form.notes} onChange={(e) => set('notes', e.target.value)}
              placeholder="Reason for late delivery, addressee's request reference..." />
          </FormField>

          {/* Live demurrage calculation */}
          {daysHeld !== null && (
            <div className={`mt-2 p-3 rounded-lg text-sm ${demurrageDays > 0 ? 'bg-red-50 text-danger' : 'bg-green-50 text-success'}`}>
              {demurrageDays > 0 ? (
                <>
                  {t('daysHeld')}: <strong>{daysHeld}</strong> &nbsp;|&nbsp;
                  {t('demurrageDays')}: <strong>{demurrageDays}</strong> (×10) &nbsp;|&nbsp;
                  {t('fee')}: <strong>PKR {demurrageAmount}</strong>
                </>
              ) : (
                t('within7Days')
              )}
            </div>
          )}

          {error && <p className="text-xs text-danger mt-3">{error}</p>}

          <div className="flex gap-3 mt-4">
            <button type="submit" disabled={saving}
              className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60">
              {saving ? t('saving') : t('saveRecord')}
            </button>
            <button type="button" onClick={() => navigate(`/articles?tab=2&office_id=${form.office_id}`)}
              className="border border-gray-300 px-5 py-2 rounded-lg text-sm hover:bg-gray-100">
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
