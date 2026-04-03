import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import FormField, { Input, Select } from '../../components/common/FormField';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../utils/api';
import { DESIGNATIONS } from '../../utils/constants';

function getPostingStatus(current_posting_date) {
  if (!current_posting_date) return null;
  const posted = new Date(current_posting_date);
  const now = new Date();
  const totalMonths =
    (now.getFullYear() - posted.getFullYear()) * 12 +
    (now.getMonth() - posted.getMonth());
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  return { totalMonths, years, months };
}

function getRetirementInfo(date_of_birth) {
  if (!date_of_birth) return null;
  const dob = new Date(date_of_birth);
  const retirementDate = new Date(dob);
  retirementDate.setFullYear(retirementDate.getFullYear() + 60);
  const now = new Date();
  const totalMonths =
    (retirementDate.getFullYear() - now.getFullYear()) * 12 +
    (retirementDate.getMonth() - now.getMonth());
  const age = Math.floor(
    (now - dob) / (365.25 * 24 * 60 * 60 * 1000)
  );
  return {
    retirementDate,
    retirementDateStr: retirementDate.toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' }),
    monthsLeft: totalMonths,
    age,
    isRetired: totalMonths <= 0,
  };
}

export default function StaffFormPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [offices, setOffices] = useState([]);
  const [form, setForm] = useState({
    office_id: '', full_name: '', designation: 'Postmaster',
    bps: '', employee_id: '', date_of_joining: '', current_posting_date: '', date_of_birth: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/offices', { params: { limit: 100 } }).then((res) => setOffices(res.data.data));
    if (isEdit) {
      api.get(`/staff/${id}`).then((res) => {
        const s = res.data.data;
        setForm({
          office_id: s.office_id,
          full_name: s.full_name,
          designation: s.designation,
          bps: s.bps || '',
          employee_id: s.employee_id || '',
          date_of_joining: s.date_of_joining ? s.date_of_joining.split('T')[0] : '',
          current_posting_date: s.current_posting_date ? s.current_posting_date.split('T')[0] : '',
          date_of_birth: s.date_of_birth ? s.date_of_birth.split('T')[0] : '',
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
      const payload = {
        ...form,
        bps: form.bps ? parseInt(form.bps, 10) : null,
        current_posting_date: form.current_posting_date || null,
        date_of_birth: form.date_of_birth || null,
      };
      if (isEdit) { await api.put(`/staff/${id}`, payload); }
      else { await api.post('/staff', payload); }
      navigate('/staff');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  const postingStatus = form.designation === 'Postmaster'
    ? getPostingStatus(form.current_posting_date)
    : null;

  const retirementInfo = getRetirementInfo(form.date_of_birth);

  return (
    <div className="max-w-2xl">
      <PageHeader title={isEdit ? 'Edit Staff' : 'Add Staff Member'} backTo="/staff" />
      <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <FormField label={t('office')} required>
            <Select value={form.office_id} onChange={set('office_id')} required>
              <option value="">— Select Office —</option>
              {offices.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </Select>
          </FormField>
          <FormField label={t('fullName')} required>
            <Input value={form.full_name} onChange={set('full_name')} required />
          </FormField>
          <FormField label={t('designation')} required>
            <Select value={form.designation} onChange={set('designation')}>
              {DESIGNATIONS.map((d) => <option key={d}>{d}</option>)}
            </Select>
          </FormField>
          <FormField label={t('bps')}>
            <Input type="number" value={form.bps} onChange={set('bps')} min={1} max={22} />
          </FormField>
          <FormField label={t('employeeId')}>
            <Input value={form.employee_id} onChange={set('employee_id')} />
          </FormField>
          <FormField label={t('dateOfJoining')}>
            <Input type="date" value={form.date_of_joining} onChange={set('date_of_joining')} />
          </FormField>
          <FormField
            label="Current Posting Date"
            hint={form.designation === 'Postmaster' ? 'Date posted to this specific office (for 3-year transfer tracking)' : 'Date posted to current office'}
          >
            <Input type="date" value={form.current_posting_date} onChange={set('current_posting_date')} />
          </FormField>
          <FormField label="Date of Birth" hint="Used to calculate retirement date (age 60)">
            <Input type="date" value={form.date_of_birth} onChange={set('date_of_birth')} />
          </FormField>
        </div>

        {/* Retirement info */}
        {retirementInfo && (
          retirementInfo.isRetired ? (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
              <span className="text-danger text-base mt-0.5">⚠</span>
              <div>
                <p className="text-sm font-semibold text-danger">Retirement Age Reached</p>
                <p className="text-xs text-red-600 mt-0.5">
                  This staff member has reached the retirement age of 60. Retirement date was <strong>{retirementInfo.retirementDateStr}</strong>.
                </p>
              </div>
            </div>
          ) : retirementInfo.monthsLeft <= 3 ? (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
              <span className="text-danger text-base mt-0.5">⚠</span>
              <div>
                <p className="text-sm font-semibold text-danger">Retiring in {retirementInfo.monthsLeft} month{retirementInfo.monthsLeft !== 1 ? 's' : ''}</p>
                <p className="text-xs text-red-600 mt-0.5">
                  Current age: <strong>{retirementInfo.age} years</strong>. Retirement date: <strong>{retirementInfo.retirementDateStr}</strong>.
                </p>
              </div>
            </div>
          ) : retirementInfo.monthsLeft <= 12 ? (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
              <span className="text-alert text-base mt-0.5">⚠</span>
              <div>
                <p className="text-sm font-semibold text-alert">Retiring in {retirementInfo.monthsLeft} months</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Current age: <strong>{retirementInfo.age} years</strong>. Retirement date: <strong>{retirementInfo.retirementDateStr}</strong>.
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-4 p-3 rounded-lg bg-gray-50 border border-gray-200 flex items-center gap-2">
              <span className="text-gray-400 text-base">ℹ</span>
              <p className="text-xs text-gray-600">
                Age: <strong>{retirementInfo.age} years</strong>. Retirement date: <strong>{retirementInfo.retirementDateStr}</strong> ({retirementInfo.monthsLeft} months away).
              </p>
            </div>
          )
        )}

        {/* Transfer warning for Postmaster */}
        {postingStatus && form.current_posting_date && (
          postingStatus.totalMonths >= 36 ? (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
              <span className="text-danger text-base mt-0.5">⚠</span>
              <div>
                <p className="text-sm font-semibold text-danger">Transfer Overdue</p>
                <p className="text-xs text-red-600 mt-0.5">
                  This Postmaster has been at this office for{' '}
                  <strong>{postingStatus.years} year{postingStatus.years !== 1 ? 's' : ''}{postingStatus.months > 0 ? ` ${postingStatus.months} month${postingStatus.months !== 1 ? 's' : ''}` : ''}</strong>.
                  Transfer is required under Pakistan Post rules (3-year limit).
                </p>
              </div>
            </div>
          ) : postingStatus.totalMonths >= 30 ? (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
              <span className="text-alert text-base mt-0.5">⚠</span>
              <div>
                <p className="text-sm font-semibold text-alert">Transfer Due Soon</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  This Postmaster has been at this office for{' '}
                  <strong>{postingStatus.years} year{postingStatus.years !== 1 ? 's' : ''}{postingStatus.months > 0 ? ` ${postingStatus.months} month${postingStatus.months !== 1 ? 's' : ''}` : ''}</strong>.
                  Transfer required in <strong>{36 - postingStatus.totalMonths} month{36 - postingStatus.totalMonths !== 1 ? 's' : ''}</strong>.
                </p>
              </div>
            </div>
          ) : null
        )}

        {error && <p className="text-sm text-danger mb-4">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60">
            {saving ? t('loading') : t('save')}
          </button>
          <button type="button" onClick={() => navigate('/staff')}
            className="border border-gray-300 px-6 py-2 rounded-lg text-sm hover:bg-gray-100">
            {t('cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
