import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import api from '../../utils/api';
import { MONTHS } from '../../utils/dateFormat';
import { INSPECTING_OFFICERS } from '../../utils/constants';
import { useLanguage } from '../../context/LanguageContext';

export default function InspectionProgrammeFormPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const defaultHalf = currentMonth <= 6 ? 'First' : 'Second';

  const [year, setYear] = useState(currentYear);
  const [half, setHalf] = useState(defaultHalf);
  const [entries, setEntries] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const halfMonths = half === 'First'
    ? [1, 2, 3, 4, 5, 6]
    : [7, 8, 9, 10, 11, 12];

  useEffect(() => {
    api.get('/offices', { params: { limit: 100 } }).then((res) => {
      const officeList = res.data.data;
      setEntries(officeList.map((o) => ({
        office_id: o.id,
        office_name: o.name,
        tehsil: o.tehsil,
        allotted_month: halfMonths[0],
        inspecting_officer: 'ASPO',
        include: true,
      })));
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setEntries((prev) =>
      prev.map((e) => ({
        ...e,
        allotted_month: halfMonths.includes(e.allotted_month) ? e.allotted_month : halfMonths[0],
      }))
    );
  }, [half]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateEntry(index, field, value) {
    setEntries((prev) => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    const toSubmit = entries.filter((e) => e.include);
    if (!toSubmit.length) { setError(t('selectAtLeastOne')); return; }
    setSaving(true);
    try {
      const res = await api.post('/inspections/programme', {
        year: parseInt(year, 10),
        half,
        entries: toSubmit.map(({ office_id, allotted_month, inspecting_officer }) => ({
          office_id,
          allotted_month: parseInt(allotted_month, 10),
          inspecting_officer,
        })),
      });
      setSuccess(`${res.data.data.length} ${t('officesSaved')}`);
      setTimeout(() => navigate('/inspections'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save programme.');
    } finally {
      setSaving(false);
    }
  }

  function selectAll(val) {
    setEntries((prev) => prev.map((e) => ({ ...e, include: val })));
  }

  const grouped = entries.reduce((acc, e) => {
    const t = e.tehsil || 'Other';
    if (!acc[t]) acc[t] = [];
    acc[t].push(e);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl">
      <PageHeader title={t('enterInspectionProgramme')} backTo="/inspections" />

      <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-5 mb-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('year')}</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-24"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('halfYear')}</label>
            <select
              value={half}
              onChange={(e) => setHalf(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="First">{t('firstHalf')}</option>
              <option value="Second">{t('secondHalf')}</option>
            </select>
          </div>
          <div className="flex gap-2 ml-auto">
            <button type="button" onClick={() => selectAll(true)} className="text-xs text-primary hover:underline">{t('selectAll')}</button>
            <button type="button" onClick={() => selectAll(false)} className="text-xs text-gray-400 hover:underline">{t('deselectAll')}</button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {Object.entries(grouped).map(([tehsil, officeEntries]) => (
          <div key={tehsil} className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-5 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{tehsil} {t('tehsil')}</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-xs text-gray-500 font-medium w-8">
                    <input type="checkbox" checked={officeEntries.every((e) => e.include)}
                      onChange={(ev) => officeEntries.forEach((_, i) => {
                        const globalIdx = entries.findIndex((e) => e.office_id === officeEntries[i].office_id);
                        updateEntry(globalIdx, 'include', ev.target.checked);
                      })}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('office')}</th>
                  <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('allottedMonth')}</th>
                  <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('inspectingOfficer')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {officeEntries.map((entry) => {
                  const globalIdx = entries.findIndex((e) => e.office_id === entry.office_id);
                  return (
                    <tr key={entry.office_id} className={entry.include ? '' : 'opacity-40'}>
                      <td className="py-2">
                        <input
                          type="checkbox"
                          checked={entry.include}
                          onChange={(e) => updateEntry(globalIdx, 'include', e.target.checked)}
                          className="rounded"
                        />
                      </td>
                      <td className="py-2 font-medium text-gray-700">{entry.office_name}</td>
                      <td className="py-2">
                        <select
                          value={entry.allotted_month}
                          onChange={(e) => updateEntry(globalIdx, 'allotted_month', parseInt(e.target.value, 10))}
                          disabled={!entry.include}
                          className="border border-gray-200 rounded px-2 py-1 text-sm bg-white"
                        >
                          {halfMonths.map((m) => <option key={m} value={m}>{MONTHS[m]}</option>)}
                        </select>
                      </td>
                      <td className="py-2">
                        <select
                          value={entry.inspecting_officer}
                          onChange={(e) => updateEntry(globalIdx, 'inspecting_officer', e.target.value)}
                          disabled={!entry.include}
                          className="border border-gray-200 rounded px-2 py-1 text-sm bg-white"
                        >
                          {INSPECTING_OFFICERS.map((o) => <option key={o}>{o}</option>)}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}

        {error && <p className="text-sm text-danger mb-4">{error}</p>}
        {success && <p className="text-sm text-success mb-4 font-medium">{success}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60">
            {saving ? t('saving') : `${t('saveProgramme')} (${entries.filter((e) => e.include).length})`}
          </button>
          <button type="button" onClick={() => navigate('/inspections')}
            className="border border-gray-300 px-6 py-2 rounded-lg text-sm hover:bg-gray-100">
            {t('cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
