import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import FormField, { Input, Select, Textarea } from '../../components/common/FormField';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export default function EDBOProgrammeFormPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [overseers, setOverseers] = useState([]);
  const [form, setForm] = useState({ year: new Date().getFullYear(), staff_id: '', notes: '' });
  const [assignments, setAssignments] = useState([{ edbo_name: '', assigned_month: '' }]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/staff', { params: { designation: 'Mail Overseer', limit: 50, is_active: true } })
      .then(r => setOverseers(r.data.data))
      .catch(() => {
        // fallback: all active staff
        api.get('/staff', { params: { limit: 200, is_active: true } }).then(r => setOverseers(r.data.data));
      });
  }, []);

  function set(field) { return e => setForm({ ...form, [field]: e.target.value }); }

  function setRow(i, field, value) {
    const updated = [...assignments];
    updated[i] = { ...updated[i], [field]: value };
    setAssignments(updated);
  }

  function addRow() { setAssignments([...assignments, { edbo_name: '', assigned_month: '' }]); }
  function removeRow(i) { setAssignments(assignments.filter((_, idx) => idx !== i)); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const valid = assignments.filter(a => a.edbo_name.trim() && a.assigned_month);
    if (valid.length === 0) {
      return setError('Add at least one EDBO assignment.');
    }
    setSaving(true);
    try {
      const res = await api.post('/edbo-programmes', {
        year: parseInt(form.year),
        staff_id: parseInt(form.staff_id),
        notes: form.notes || null,
        assignments: valid.map(a => ({ edbo_name: a.edbo_name.trim(), assigned_month: parseInt(a.assigned_month) })),
      });
      navigate(`/edbo-programme/${res.data.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save.');
    } finally { setSaving(false); }
  }

  return (
    <div>
      <PageHeader title={t('newEdboProgramme')} backTo="/edbo-programme" />
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-none border border-transparent dark:border-dark-border p-5 max-w-2xl">
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-danger">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('year')} required>
              <Input type="number" value={form.year} onChange={set('year')} required min="2020" max="2099" />
            </FormField>
            <FormField label={t('staff')} required>
              <Select value={form.staff_id} onChange={set('staff_id')} required>
                <option value="">— {t('select')} —</option>
                {overseers.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </Select>
            </FormField>
          </div>

          <FormField label={t('notes')}>
            <Textarea value={form.notes} onChange={set('notes')} rows={2} />
          </FormField>

          {/* EDBO assignments table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">{t('edboAssignments')}</p>
              <button type="button" onClick={addRow}
                className="text-xs text-primary hover:underline font-medium">+ {t('add')}</button>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">{t('edboName')}</th>
                    <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium w-40">{t('assignedMonth')}</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {assignments.map((a, i) => (
                    <tr key={i}>
                      <td className="px-3 py-1.5">
                        <input type="text" value={a.edbo_name}
                          onChange={e => setRow(i, 'edbo_name', e.target.value)}
                          placeholder="EDBO Name / Location"
                          className="w-full border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-primary" />
                      </td>
                      <td className="px-3 py-1.5">
                        <select value={a.assigned_month} onChange={e => setRow(i, 'assigned_month', e.target.value)}
                          className="w-full border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-primary bg-white">
                          <option value="">— Month —</option>
                          {MONTHS.map((m, mi) => <option key={mi+1} value={mi+1}>{m}</option>)}
                        </select>
                      </td>
                      <td className="px-2">
                        {assignments.length > 1 && (
                          <button type="button" onClick={() => removeRow(i)}
                            className="text-gray-300 hover:text-danger text-xs">✕</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? t('saving') : t('save')}
          </button>
        </form>
      </div>
    </div>
  );
}
