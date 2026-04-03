import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import FormField, { Input, Select } from '../../components/common/FormField';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../utils/api';
import {  } from '../../utils/dateFormat';
import { useLanguage } from '../../context/LanguageContext';

export default function VPArticleFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const isEdit = !!id;

  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [article, setArticle] = useState(null);

  const [form, setForm] = useState({
    office_id: searchParams.get('office_id') || '',
    article_type: 'VPP',
    tracking_id: '',
    date_received: new Date().toISOString().split('T')[0],
    value_amount: '',
    booking_city: '',
    addressee_name: '',
    notes: '',
  });

  const [deliverForm, setDeliverForm] = useState({
    status: '',
    date_delivered: '',
    mo_type: '',
    mo_number: '',
  });

  const [showDeliverForm, setShowDeliverForm] = useState(false);

  useEffect(() => {
    api.get('/offices', { params: { limit: 100 } }).then((res) => {
      const delivery = res.data.data.filter((o) => o.type === 'Delivery' && o.is_active);
      setOffices(delivery);
      if (!form.office_id && delivery.length) setForm((p) => ({ ...p, office_id: String(delivery[0].id) }));
    });
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/articles/vp/${id}`).then((res) => {
      const d = res.data.data;
      setArticle(d);
      setForm({
        office_id: String(d.office_id),
        article_type: d.article_type,
        tracking_id: d.tracking_id,
        date_received: d.date_received.split('T')[0],
        value_amount: d.value_amount,
        booking_city: d.booking_city || '',
        addressee_name: d.addressee_name || '',
        notes: d.notes || '',
      });
      setDeliverForm({
        status: d.status,
        date_delivered: d.date_delivered ? d.date_delivered.split('T')[0] : '',
        mo_type: d.mo_type || '',
        mo_number: d.mo_number || '',
      });
    }).finally(() => setLoading(false));
  }, [id]);

  function set(field, value) { setForm((p) => ({ ...p, [field]: value })); }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/articles/vp/${id}`, {
          value_amount: parseFloat(form.value_amount) || 0,
          booking_city: form.booking_city || null,
          addressee_name: form.addressee_name || null,
          notes: form.notes || null,
        });
      } else {
        await api.post('/articles/vp', {
          ...form,
          office_id: parseInt(form.office_id, 10),
          value_amount: parseFloat(form.value_amount) || 0,
        });
      }
      navigate(`/articles?tab=1&office_id=${form.office_id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeliver(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.put(`/articles/vp/${id}`, {
        status: deliverForm.status,
        date_delivered: deliverForm.date_delivered || null,
        mo_type: deliverForm.mo_type || null,
        mo_number: deliverForm.mo_number || null,
      });
      navigate(`/articles?tab=1&office_id=${form.office_id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update.');
    } finally {
      setSaving(false);
    }
  }

  // Auto-set MO type based on article type
  useEffect(() => {
    if (deliverForm.status === 'Delivered' && !deliverForm.mo_type) {
      const moType = form.article_type === 'COD' ? 'UMO' : 'MO';
      setDeliverForm((p) => ({ ...p, mo_type: moType }));
    }
  }, [deliverForm.status, form.article_type]);

  // Compute demurrage preview
  const demurrageDays = (() => {
    if (!deliverForm.date_delivered || !form.date_received) return 0;
    const diff = Math.floor((new Date(deliverForm.date_delivered) - new Date(form.date_received)) / 86400000);
    return Math.max(0, diff - 7);
  })();

  const daysHeld = (() => {
    if (!isEdit || !article) return null;
    const ref = deliverForm.date_delivered ? new Date(deliverForm.date_delivered) : new Date();
    return Math.floor((ref - new Date(form.date_received)) / 86400000);
  })();

  if (loading) return <div className="py-20 flex justify-center"><LoadingSpinner /></div>;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={isEdit ? `${article?.tracking_id} — ${t('vpCodArticle')}` : t('addVpCodArticle')}
        backTo={`/articles?tab=1&office_id=${form.office_id}`}
      />

      {/* Article info / create form */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-5 mb-4">
        <h3 className="text-sm font-semibold text-primary mb-3">{isEdit ? t('articleDetails') : t('newArticle')}</h3>
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('deliveryOffice')}>
              <Select value={form.office_id} onChange={(e) => set('office_id', e.target.value)} disabled={isEdit}>
                {offices.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </Select>
            </FormField>
            <FormField label={t('articleType')}>
              <Select value={form.article_type} onChange={(e) => set('article_type', e.target.value)} disabled={isEdit}>
                <option value="VPP">VPP — Value Payable Parcel</option>
                <option value="VPL">VPL — Value Payable Letter</option>
                <option value="COD">COD — Cash on Delivery</option>
              </Select>
            </FormField>
            <FormField label={t('trackingId')} required>
              <Input value={form.tracking_id} onChange={(e) => set('tracking_id', e.target.value.toUpperCase())}
                placeholder="e.g. VPP123456789PK" disabled={isEdit} required />
            </FormField>
            <FormField label={t('dateReceived')} required>
              <Input type="date" value={form.date_received} onChange={(e) => set('date_received', e.target.value)} disabled={isEdit} required />
            </FormField>
            <FormField label={t('vpValue')} required>
              <Input type="number" min="0" step="0.01" value={form.value_amount}
                onChange={(e) => set('value_amount', e.target.value)} placeholder="0.00" required />
            </FormField>
            <FormField label={t('bookedFrom')}>
              <Input value={form.booking_city} onChange={(e) => set('booking_city', e.target.value)}
                placeholder="e.g. Karachi, Lahore, or Dubai UAE" />
            </FormField>
            <FormField label={t('addresseeName')}>
              <Input value={form.addressee_name} onChange={(e) => set('addressee_name', e.target.value)} />
            </FormField>
            <FormField label={t('notes')}>
              <Input value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </FormField>
          </div>

          {isEdit && daysHeld !== null && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${daysHeld > 7 ? 'bg-red-50 text-danger' : daysHeld > 5 ? 'bg-amber-50 text-amber-700' : 'bg-surface text-gray-600'}`}>
              {daysHeld > 7
                ? `⚠ ${t('overdueInDeposit').replace('{days}', daysHeld)} (${daysHeld - 7} ${t('days')})`
                : `${daysHeld} ${t('days')} — ${t('inDeposit')}`}
            </div>
          )}

          {error && <p className="text-xs text-danger mt-3">{error}</p>}
          <button type="submit" disabled={saving}
            className="mt-4 bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60">
            {saving ? t('saving') : isEdit ? t('updateDetails') : t('addArticle')}
          </button>
        </form>
      </div>

      {/* Deliver / Return section (edit only) */}
      {isEdit && article?.status === 'In Deposit' && (
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-primary">{t('recordDeliveryReturn')}</h3>
            <button onClick={() => setShowDeliverForm((p) => !p)}
              className="text-sm text-primary hover:underline">
              {showDeliverForm ? t('cancel') : t('updateStatus')}
            </button>
          </div>

          {showDeliverForm && (
            <form onSubmit={handleDeliver}>
              <div className="grid grid-cols-2 gap-4">
                <FormField label={t('status')} required>
                  <Select value={deliverForm.status} onChange={(e) => setDeliverForm((p) => ({ ...p, status: e.target.value }))} required>
                    <option value="">Select...</option>
                    <option value="Delivered">{t('delivered')}</option>
                    <option value="Returned">{t('returnedToSender')}</option>
                  </Select>
                </FormField>
                <FormField label={t('date')} required>
                  <Input type="date" value={deliverForm.date_delivered}
                    onChange={(e) => setDeliverForm((p) => ({ ...p, date_delivered: e.target.value }))} required />
                </FormField>
                {deliverForm.status === 'Delivered' && (
                  <>
                    <FormField label={`${form.article_type === 'COD' ? 'UMO' : 'MO'} ${t('type')}`}>
                      <Select value={deliverForm.mo_type} onChange={(e) => setDeliverForm((p) => ({ ...p, mo_type: e.target.value }))}>
                        <option value="MO">MO (Money Order)</option>
                        <option value="UMO">UMO (Urgent Money Order)</option>
                      </Select>
                    </FormField>
                    <FormField label={`${form.article_type === 'COD' ? 'UMO' : 'MO'} ${t('number')}`} required>
                      <Input value={deliverForm.mo_number}
                        onChange={(e) => setDeliverForm((p) => ({ ...p, mo_number: e.target.value }))}
                        placeholder={t('moNumberPlaceholder')} required />
                    </FormField>
                  </>
                )}
              </div>

              {demurrageDays > 0 && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg text-sm text-danger">
                  ⚠ {t('demurrageApplicable')}: {demurrageDays} {t('days')} × PKR 10 = <strong>PKR {demurrageDays * 10}</strong>
                </div>
              )}
              {demurrageDays === 0 && deliverForm.date_delivered && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg text-sm text-success">
                  {t('within7Days')}
                </div>
              )}

              <button type="submit" disabled={saving}
                className="mt-4 bg-success text-white px-5 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60">
                {saving ? t('saving') : t('confirm')}
              </button>
            </form>
          )}

          {!showDeliverForm && (
            <dl className="divide-y divide-gray-100 text-sm">
              {[
                [t('status'), article.status],
                [t('value'), `PKR ${parseFloat(article.value_amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`],
                article.date_delivered && [t('deliveredOn'), (article.date_delivered)],
                article.mo_number && [`${article.mo_type} ${t('number')}`, article.mo_number],
                article.demurrage_days > 0 && [t('demurrage'), `${article.demurrage_days} ${t('days')} — PKR ${parseFloat(article.demurrage_amount).toFixed(2)}`],
              ].filter(Boolean).map(([label, value]) => (
                <div key={label} className="py-2 flex justify-between">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}

      {/* Delivered/Returned summary */}
      {isEdit && article?.status !== 'In Deposit' && (
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-5">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">{t('deliverySummary')}</h3>
          <dl className="divide-y divide-gray-100 text-sm">
            {[
              [t('status'), article.status],
              [t('deliveredOn'), (article.date_delivered)],
              article.mo_number && [`${article.mo_type} ${t('number')}`, article.mo_number],
              article.demurrage_days > 0 && [t('demurrage'), `${article.demurrage_days} ${t('days')} — PKR ${parseFloat(article.demurrage_amount).toFixed(2)}`],
            ].filter(Boolean).map(([label, value]) => (
              <div key={label} className="py-2 flex justify-between">
                <dt className="text-gray-500">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
