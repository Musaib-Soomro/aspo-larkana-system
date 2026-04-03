import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import FormField, { Input, Select, Textarea } from '../../components/common/FormField';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';

const DESIGNATIONS = ['Postmaster', 'Postman', 'Mail Peon', 'Mail Runner'];

export default function LookAfterFormPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [form, setForm] = useState({
    staff_id: '',
    office_id: '',
    lookafter_designation: '',
    dsps_order_no: '',
    dsps_order_date: '',
    start_date: '',
    start_reason: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [offices, setOffices] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [staffSearch, setStaffSearch] = useState('');
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [selectedStaffLabel, setSelectedStaffLabel] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    api.get('/offices', { params: { limit: 200 } }).then(r => setOffices(r.data.data));
    api.get('/staff', { params: { limit: 500, is_active: true } }).then(r => setAllStaff(r.data.data));
  }, []);

  function set(field) { return (e) => setForm({ ...form, [field]: e.target.value }); }

  const filteredStaff = allStaff
    .filter(s => !s.is_on_lookafter)
    .filter(s =>
      !staffSearch.trim() ||
      s.full_name.toLowerCase().includes(staffSearch.toLowerCase()) ||
      s.designation.toLowerCase().includes(staffSearch.toLowerCase()) ||
      (s.office_name || '').toLowerCase().includes(staffSearch.toLowerCase())
    )
    .slice(0, 10);

  function selectStaff(s) {
    setForm({ ...form, staff_id: String(s.id) });
    setSelectedStaffLabel(`${s.full_name} — ${s.designation} (${s.office_name || ''})`);
    setStaffSearch('');
    setShowStaffDropdown(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/look-after', {
        ...form,
        staff_id: parseInt(form.staff_id),
        office_id: parseInt(form.office_id),
      });
      navigate('/look-after');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title={t('newLookAfter')} backTo="/look-after" />
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-none border border-transparent dark:border-dark-border p-5 max-w-lg">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-danger">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Staff searchable */}
          <FormField label={t('staff')} required>
            <div className="relative" ref={dropdownRef}>
              {form.staff_id ? (
                <div className="flex items-center justify-between border border-border rounded-lg px-3 py-2 text-sm bg-surface">
                  <span className="text-gray-800">{selectedStaffLabel}</span>
                  <button type="button" onClick={() => { setForm({ ...form, staff_id: '' }); setSelectedStaffLabel(''); }}
                    className="text-gray-400 hover:text-danger text-xs ml-2">✕</button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={staffSearch}
                    onChange={e => { setStaffSearch(e.target.value); setShowStaffDropdown(true); }}
                    onFocus={() => setShowStaffDropdown(true)}
                    onBlur={() => setTimeout(() => setShowStaffDropdown(false), 150)}
                    placeholder={t('searchByName')}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    autoComplete="off"
                  />
                  {showStaffDropdown && (
                    <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredStaff.length === 0 ? (
                        <li className="px-3 py-2 text-sm text-gray-400">{t('noData')}</li>
                      ) : filteredStaff.map(s => (
                        <li key={s.id} onMouseDown={() => selectStaff(s)}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-surface">
                          <span className="font-medium text-gray-800">{s.full_name}</span>
                          <span className="text-gray-400 ml-2 text-xs">{s.designation}</span>
                          {s.office_name && <span className="text-gray-400 ml-1 text-xs">· {s.office_name}</span>}
                          {s.is_on_lookafter && <span className="ml-2 text-xs text-amber-500">(on lookafter)</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </FormField>

          <FormField label={t('atOffice')} required>
            <Select value={form.office_id} onChange={set('office_id')} required>
              <option value="">— {t('select')} —</option>
              {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </Select>
          </FormField>

          <FormField label={t('coveringDesignation')} required>
            <Select value={form.lookafter_designation} onChange={set('lookafter_designation')} required>
              <option value="">— {t('select')} —</option>
              {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </Select>
          </FormField>

          <FormField label={t('dspsOrderNo')} required>
            <Input type="text" value={form.dsps_order_no} onChange={set('dsps_order_no')} required />
          </FormField>

          <FormField label={t('dspsOrderDate')} required>
            <Input type="date" value={form.dsps_order_date} onChange={set('dsps_order_date')} required />
          </FormField>

          <FormField label={t('startDate')} required>
            <Input type="date" value={form.start_date} onChange={set('start_date')} required />
          </FormField>

          <FormField label={t('startReason')} required>
            <Textarea value={form.start_reason} onChange={set('start_reason')} rows={3} required
              placeholder={t('startReason')} />
          </FormField>

          <button type="submit" disabled={saving || !form.staff_id} className="btn-primary w-full">
            {saving ? t('saving') : t('save')}
          </button>
        </form>
      </div>
    </div>
  );
}
