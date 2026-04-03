import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../utils/api';
import {  } from '../../utils/dateFormat';
import { useLanguage } from '../../context/LanguageContext';
import { useIsAdmin } from '../../context/AuthContext';

const MONTHS = [
  '','January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export default function EDBOProgrammeDetailPage() {
  const { id } = useParams();
  const { t } = useLanguage();
  const isAdmin = useIsAdmin();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ status: '', completed_date: '', remarks: '' });
  const [saving, setSaving] = useState(false);

  function load() {
    api.get(`/edbo-programmes/${id}`).then(r => setRecord(r.data.data)).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  function startEdit(a) {
    setEditingId(a.id);
    setEditForm({ status: a.status, completed_date: a.completed_date?.slice(0,10) || '', remarks: a.remarks || '' });
  }

  async function saveEdit(assignmentId) {
    setSaving(true);
    try {
      await api.patch(`/edbo-programmes/assignments/${assignmentId}`, editForm);
      setEditingId(null);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed.');
    } finally { setSaving(false); }
  }

  if (loading) return <div className="py-16 flex justify-center"><LoadingSpinner /></div>;
  if (!record)  return <p className="text-center text-gray-400 py-12">{t('noData')}</p>;

  const months = [...new Set(record.assignments.map(a => a.assigned_month))].sort((a,b) => a-b);

  return (
    <div>
      <PageHeader title={`${t('edboProgramme')} ${record.year}`} backTo="/edbo-programme" />

      {/* Header stats */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-none border border-transparent dark:border-dark-border p-5 mb-4">
        <div className="flex flex-wrap gap-6 items-center">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">{t('staff')}</p>
            <p className="text-sm font-semibold text-gray-800">{record.staff_name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">{t('year')}</p>
            <p className="text-sm font-semibold text-gray-800">{record.year}</p>
          </div>
          {[
            ['Total', record.assignments.length, 'text-gray-700'],
            ['Completed', record.assignments.filter(a=>a.status==='Completed').length, 'text-green-600'],
            ['Pending',   record.assignments.filter(a=>a.status==='Pending').length,   'text-alert'],
            ['Carried Fwd', record.assignments.filter(a=>a.status==='Carried Forward').length, 'text-gray-400'],
          ].map(([l,v,c]) => (
            <div key={l} className="text-center">
              <p className={`text-2xl font-bold ${c}`}>{v}</p>
              <p className="text-xs text-gray-400">{l}</p>
            </div>
          ))}
        </div>
        {record.notes && <p className="mt-3 text-sm text-gray-500 italic">{record.notes}</p>}
      </div>

      {/* Assignments by month */}
      {months.map(m => (
        <div key={m} className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-none border border-transparent dark:border-dark-border p-5 mb-4">
          <h3 className="font-display text-sm font-semibold text-primary mb-3">{MONTHS[m]}</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('edboName')}</th>
                <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('status')}</th>
                <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('completionDate')}</th>
                <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('notes')}</th>
                {isAdmin && <th className="w-20" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(record.by_month[m] || []).map(a => (
                <tr key={a.id}>
                  <td className="py-2 font-medium text-gray-800">{a.edbo_name}</td>
                  <td className="py-2">
                    {editingId === a.id ? (
                      <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}
                        className="border border-border rounded px-2 py-1 text-xs">
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                        <option value="Carried Forward">Carried Forward</option>
                      </select>
                    ) : <StatusBadge status={a.status} />}
                  </td>
                  <td className="py-2">
                    {editingId === a.id ? (
                      <input type="date" value={editForm.completed_date}
                        onChange={e => setEditForm({...editForm, completed_date: e.target.value})}
                        className="border border-border rounded px-2 py-1 text-xs" />
                    ) : (a.completed_date)}
                  </td>
                  <td className="py-2 text-gray-500 max-w-xs">
                    {editingId === a.id ? (
                      <input type="text" value={editForm.remarks}
                        onChange={e => setEditForm({...editForm, remarks: e.target.value})}
                        className="border border-border rounded px-2 py-1 text-xs w-full" />
                    ) : a.remarks || '—'}
                  </td>
                  {isAdmin && (
                    <td className="py-2 text-right">
                      {editingId === a.id ? (
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => saveEdit(a.id)} disabled={saving}
                            className="text-xs text-white bg-primary px-2 py-1 rounded disabled:opacity-60">{t('save')}</button>
                          <button onClick={() => setEditingId(null)}
                            className="text-xs text-gray-500 border border-border px-2 py-1 rounded">{t('cancel')}</button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(a)} className="text-xs text-primary hover:underline">{t('edit')}</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
