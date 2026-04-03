import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import FormField, { Input, Select, Textarea } from '../../components/common/FormField';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../utils/api';
import { OFFICE_TYPES, OFFICE_SHIFTS } from '../../utils/constants';

const TEHSILS = ['Larkana', 'Ratodero', 'Dokri', 'Bakrani'];

export default function OfficeFormPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '', short_name: '', type: 'Delivery', shift: 'Day', has_edbos: false,
    tehsil: '', district: 'Larkana', account_office: '', bps_category: 'BPS-09', address: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/offices/${id}`).then((res) => {
        const o = res.data.data;
        setForm({
          name: o.name, short_name: o.short_name || '', type: o.type, shift: o.shift,
          has_edbos: o.has_edbos, tehsil: o.tehsil || '', district: o.district,
          account_office: o.account_office || '', bps_category: o.bps_category || '',
          address: o.address || '',
        });
      });
    }
  }, [id, isEdit]);

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/offices/${id}`, form);
      } else {
        await api.post('/offices', form);
      }
      navigate('/offices');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save office.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title={isEdit ? 'Edit Office' : 'Add New Office'} backTo="/offices" />
      <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <FormField label={t('officeName')} required>
            <Input value={form.name} onChange={set('name')} required />
          </FormField>
          <FormField label="Short Name">
            <Input value={form.short_name} onChange={set('short_name')} />
          </FormField>
          <FormField label={t('type')} required>
            <Select value={form.type} onChange={set('type')}>
              {OFFICE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </Select>
          </FormField>
          <FormField label={t('shift')} required>
            <Select value={form.shift} onChange={set('shift')}>
              {OFFICE_SHIFTS.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </FormField>
          <FormField label={t('tehsil')}>
            <Select value={form.tehsil} onChange={set('tehsil')}>
              <option value="">— Select —</option>
              {TEHSILS.map((t) => <option key={t}>{t}</option>)}
            </Select>
          </FormField>
          <FormField label={t('accountOffice')}>
            <Input value={form.account_office} onChange={set('account_office')} />
          </FormField>
          <FormField label={t('bpsCategory')}>
            <Input value={form.bps_category} onChange={set('bps_category')} placeholder="BPS-09" />
          </FormField>
          <FormField label="Has EDBOs">
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input type="checkbox" name="has_edbos" checked={form.has_edbos} onChange={set('has_edbos')} className="w-4 h-4 text-primary" />
              <span className="text-sm">This office has Extra Departmental Branch Offices</span>
            </label>
          </FormField>
        </div>
        <FormField label={t('address')}>
          <Textarea value={form.address} onChange={set('address')} rows={2} />
        </FormField>

        {error && <p className="text-sm text-danger mb-4">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-light disabled:opacity-60">
            {saving ? t('loading') : t('save')}
          </button>
          <button type="button" onClick={() => navigate('/offices')}
            className="border border-gray-300 px-6 py-2 rounded-lg text-sm hover:bg-gray-100">
            {t('cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
