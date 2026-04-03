import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import FormField, { Input, Select, Textarea } from '../../components/common/FormField';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';

export default function TransferFormPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [staff, setStaff] = useState([]);
  const [offices, setOffices] = useState([]);
  const [form, setForm] = useState({
    staff_id: '',
    directed_by: '',
    reference_letter_no: '',
    reference_letter_date: '',
    transfer_order_date: '',
    from_office_id: '',
    to_office_id: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Searchable staff state
  const [staffSearch, setStaffSearch] = useState('');
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [selectedStaffName, setSelectedStaffName] = useState('');
  const staffInputRef = useRef(null);

  useEffect(() => {
    api.get('/staff', { params: { limit: 200 } }).then((res) => setStaff(res.data.data));
    api.get('/offices', { params: { limit: 200 } }).then((res) => setOffices(res.data.data));
  }, []);

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  function selectStaff(s) {
    setSelectedStaffName(`${s.full_name} — ${s.designation}`);
    setStaffSearch('');
    setShowStaffDropdown(false);
    // auto-fill from_office_id
    setForm((f) => ({ ...f, staff_id: String(s.id), from_office_id: '' }));
    api.get('/staff/' + s.id).then((res) => {
      const detail = res.data.data;
      setForm((f) => ({ ...f, staff_id: String(s.id), from_office_id: String(detail.office_id || '') }));
    });
  }

  const filteredStaff = staffSearch.trim()
    ? staff.filter((s) =>
        s.full_name.toLowerCase().includes(staffSearch.toLowerCase()) ||
        s.designation.toLowerCase().includes(staffSearch.toLowerCase())
      ).slice(0, 8)
    : [];

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.staff_id) {
      setError('Please select a staff member.');
      return;
    }
    if (form.from_office_id && form.to_office_id && form.from_office_id === form.to_office_id) {
      setError('From Office and To Office cannot be the same.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/transfers', {
        staff_id: parseInt(form.staff_id, 10),
        directed_by: form.directed_by,
        reference_letter_no: form.reference_letter_no,
        reference_letter_date: form.reference_letter_date,
        transfer_order_date: form.transfer_order_date,
        from_office_id: parseInt(form.from_office_id, 10),
        to_office_id: parseInt(form.to_office_id, 10),
        notes: form.notes || undefined,
      });
      navigate('/transfers');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save transfer record.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title={t('newTransfer')} backTo="/transfers" />
      <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">

          {/* Searchable staff field */}
          <FormField label={t('staffMember')} required>
            <div className="relative">
              {form.staff_id ? (
                <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                  <span className="flex-1 text-gray-800">{selectedStaffName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, staff_id: '', from_office_id: '' }));
                      setSelectedStaffName('');
                      setTimeout(() => staffInputRef.current?.focus(), 50);
                    }}
                    className="text-gray-400 hover:text-gray-600 text-xs font-medium"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <input
                  ref={staffInputRef}
                  type="text"
                  value={staffSearch}
                  onChange={(e) => { setStaffSearch(e.target.value); setShowStaffDropdown(true); }}
                  onFocus={() => setShowStaffDropdown(true)}
                  onBlur={() => setTimeout(() => setShowStaffDropdown(false), 150)}
                  placeholder="Type name or designation..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  autoComplete="off"
                />
              )}
              {showStaffDropdown && filteredStaff.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                  {filteredStaff.map((s) => (
                    <li
                      key={s.id}
                      onMouseDown={() => selectStaff(s)}
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-surface"
                    >
                      <span className="font-medium text-gray-800">{s.full_name}</span>
                      <span className="text-gray-400 ml-2 text-xs">{s.designation}</span>
                      {s.office_name && <span className="text-gray-400 ml-1 text-xs">· {s.office_name}</span>}
                    </li>
                  ))}
                </ul>
              )}
              {showStaffDropdown && staffSearch.trim() && filteredStaff.length === 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-400">
                  No staff found.
                </div>
              )}
            </div>
          </FormField>

          <FormField label={t('directedBy')} required>
            <Input
              type="text"
              value={form.directed_by}
              onChange={set('directed_by')}
              placeholder="e.g. DSPS Larkana"
              required
            />
          </FormField>

          <FormField label={t('refLetterNo')} required>
            <Input type="text" value={form.reference_letter_no} onChange={set('reference_letter_no')} required />
          </FormField>

          <FormField label={t('refLetterDate')} required>
            <Input type="date" value={form.reference_letter_date} onChange={set('reference_letter_date')} required />
          </FormField>

          <FormField label={t('transferOrderDate')} required>
            <Input type="date" value={form.transfer_order_date} onChange={set('transfer_order_date')} required />
          </FormField>

          <div />

          <FormField label={t('fromOffice')} required>
            <Select value={form.from_office_id} onChange={set('from_office_id')} required>
              <option value="">— {t('select')} —</option>
              {offices.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </Select>
          </FormField>

          <FormField label={t('toOffice')} required>
            <Select value={form.to_office_id} onChange={set('to_office_id')} required>
              <option value="">— {t('select')} —</option>
              {offices.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField label={t('notes')}>
          <Textarea value={form.notes} onChange={set('notes')} rows={3} />
        </FormField>

        {error && <p className="text-sm text-danger mb-4">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60"
          >
            {saving ? t('saving') : t('newTransfer')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/transfers')}
            className="border border-gray-300 px-6 py-2 rounded-lg text-sm hover:bg-gray-100"
          >
            {t('cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
