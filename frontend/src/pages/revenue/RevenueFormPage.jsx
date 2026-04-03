import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import FormField, { Select, Input } from '../../components/common/FormField';
import api from '../../utils/api';
import { MONTHS } from '../../utils/dateFormat';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_ROWS = [
  { category: 'Money Orders', sub_category: 'Issued — Count', value: '', unit: 'count' },
  { category: 'Money Orders', sub_category: 'Issued — Amount (PKR)', value: '', unit: 'amount' },
  { category: 'Money Orders', sub_category: 'Paid — Count', value: '', unit: 'count' },
  { category: 'Money Orders', sub_category: 'Paid — Amount (PKR)', value: '', unit: 'amount' },
  { category: 'Speed Post', sub_category: 'Booked — Count', value: '', unit: 'count' },
  { category: 'Speed Post', sub_category: 'Revenue (PKR)', value: '', unit: 'amount' },
  { category: 'Registered Articles', sub_category: 'Booked — Count', value: '', unit: 'count' },
  { category: 'Parcel Post', sub_category: 'Booked — Count', value: '', unit: 'count' },
  { category: 'Stamps', sub_category: 'Sold (PKR)', value: '', unit: 'amount' },
  { category: 'Savings Bank', sub_category: 'Deposits (PKR)', value: '', unit: 'amount' },
  { category: 'Savings Bank', sub_category: 'Withdrawals (PKR)', value: '', unit: 'amount' },
  { category: 'Postal Orders', sub_category: 'Issued — Count', value: '', unit: 'count' },
  { category: 'Postal Orders', sub_category: 'Issued — Amount (PKR)', value: '', unit: 'amount' },
];

export default function RevenueFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const now = new Date();
  const { user } = useAuth();
  const isPostmaster = user?.role === 'postmaster';

  const [offices, setOffices] = useState([]);
  const [header, setHeader] = useState({
    office_id: isPostmaster ? String(user.office_id || '') : '',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    submitted_by: '',
  });
  const [rows, setRows] = useState(DEFAULT_ROWS.map((r) => ({ ...r })));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/offices', { params: { limit: 100 } }).then((res) => setOffices(res.data.data));
    if (isEdit) {
      api.get(`/revenue/${id}`).then((res) => {
        const e = res.data.data;
        setHeader({
          office_id: e.office_id,
          month: e.month,
          year: e.year,
          submitted_by: e.submitted_by || '',
        });
        if (e.data && e.data.length > 0) {
          setRows(e.data.map((d) => ({
            category: d.category,
            sub_category: d.sub_category || '',
            value: d.value || '',
            unit: d.unit,
          })));
        }
      });
    }
  }, [id, isEdit]);

  function setRow(index, field, value) {
    setRows((prev) => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  }

  function addRow() {
    setRows((prev) => [...prev, { category: '', sub_category: '', value: '', unit: 'amount' }]);
  }

  function removeRow(index) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave(is_draft) {
    setError('');
    if (!header.office_id) { setError('Please select an office.'); return; }
    setSaving(true);
    try {
      const payload = {
        office_id: parseInt(header.office_id, 10),
        month: parseInt(header.month, 10),
        year: parseInt(header.year, 10),
        submitted_by: header.submitted_by,
        is_draft,
        data: rows
          .filter((r) => r.category && r.value !== '')
          .map((r) => ({ ...r, value: parseFloat(r.value) || 0 })),
      };

      if (isEdit) {
        await api.put(`/revenue/${id}`, { ...payload, data: payload.data });
      } else {
        await api.post('/revenue', payload);
      }
      navigate('/revenue');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <PageHeader title={isEdit ? 'Edit Revenue Entry' : 'Enter Revenue'} backTo="/revenue" />

      {/* Header */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-6 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="col-span-2 md:col-span-1">
            <FormField label="Office" required>
              {isPostmaster ? (
                <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700">
                  {offices.find((o) => String(o.id) === String(header.office_id))?.name || 'Your Office'}
                </div>
              ) : (
                <Select value={header.office_id} onChange={(e) => setHeader({ ...header, office_id: e.target.value })} required>
                  <option value="">— Select —</option>
                  {offices.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </Select>
              )}
            </FormField>
          </div>
          <FormField label="Month">
            <Select value={header.month} onChange={(e) => setHeader({ ...header, month: e.target.value })}>
              {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </Select>
          </FormField>
          <FormField label="Year">
            <Input type="number" value={header.year} onChange={(e) => setHeader({ ...header, year: e.target.value })} />
          </FormField>
          <FormField label="Submitted By">
            <Input value={header.submitted_by} onChange={(e) => setHeader({ ...header, submitted_by: e.target.value })} placeholder="Postmaster name" />
          </FormField>
        </div>
      </div>

      {/* Data Rows */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-6 mb-4">
        <h3 className="text-sm font-semibold text-primary mb-4">Revenue Data</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium w-1/3">Category</th>
                <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium w-1/3">Sub-Category</th>
                <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium w-24">Value</th>
                <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium w-24">Unit</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-1.5 px-2">
                    <input
                      name={`row-${i}-category`}
                      value={row.category}
                      onChange={(e) => setRow(i, 'category', e.target.value)}
                      className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
                      placeholder="Category"
                    />
                  </td>
                  <td className="py-1.5 px-2">
                    <input
                      name={`row-${i}-sub_category`}
                      value={row.sub_category}
                      onChange={(e) => setRow(i, 'sub_category', e.target.value)}
                      className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
                      placeholder="Sub-category"
                    />
                  </td>
                  <td className="py-1.5 px-2">
                    <input
                      name={`row-${i}-value`}
                      type="number"
                      value={row.value}
                      onChange={(e) => setRow(i, 'value', e.target.value)}
                      className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
                      min="0"
                      placeholder="0"
                    />
                  </td>
                  <td className="py-1.5 px-2">
                    <select
                      name={`row-${i}-unit`}
                      value={row.unit}
                      onChange={(e) => setRow(i, 'unit', e.target.value)}
                      className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none"
                    >
                      <option value="amount">PKR</option>
                      <option value="count">Count</option>
                    </select>
                  </td>
                  <td className="py-1.5 px-2">
                    <button onClick={() => removeRow(i)} className="text-gray-300 hover:text-danger text-lg leading-none" title="Remove row">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={addRow} className="mt-3 text-sm text-primary hover:underline font-medium">
          + Add Row
        </button>
      </div>

      {error && <p className="text-sm text-danger mb-4">{error}</p>}

      <div className="flex gap-3">
        <button onClick={() => handleSave(false)} disabled={saving}
          className="bg-success text-white px-6 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60">
          {saving ? 'Saving...' : 'Submit'}
        </button>
        <button onClick={() => handleSave(true)} disabled={saving}
          className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60">
          {saving ? 'Saving...' : 'Save as Draft'}
        </button>
        <button onClick={() => navigate('/revenue')}
          className="border border-gray-300 px-6 py-2 rounded-lg text-sm hover:bg-gray-100">
          Cancel
        </button>
      </div>
    </div>
  );
}
