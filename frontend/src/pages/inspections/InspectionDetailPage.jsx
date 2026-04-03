import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import FormField, { Input, Select, Textarea } from '../../components/common/FormField';
import api from '../../utils/api';
import { MONTHS,  } from '../../utils/dateFormat';
import { INSPECTION_STATUSES } from '../../utils/constants';
import { useLanguage } from '../../context/LanguageContext';

const DAY_TYPES = ['Full Day', 'Half Day', 'Ordinary'];

// Pakistan Post standard inspection checklist
const CHECKLIST_ITEMS = [
  'Cash balance verified and tallied with account',
  'Stamp inventory checked and balanced',
  'Money Order register examined (issued & paid)',
  'Registered articles register examined',
  'Delivery register checked (ordinary & registered)',
  'Speed Post register examined',
  'Parcel register examined',
  'Savings Bank passbooks and account register verified',
  'Postal Orders register examined',
  'VP/COD articles register checked',
  'Staff attendance register examined',
  'Official seal and stamp in proper custody',
  'Lock and key in proper custody',
  'Complaint register maintained',
  'Last inspection remarks complied with',
  'Office cleanliness and condition satisfactory',
  'Reply to previous inspection memo received',
];

const RESULT_OPTIONS = ['OK', 'Issue Found', 'N/A'];
const RESULT_COLORS = {
  'OK':           'bg-success/10 text-success border-success/30',
  'Issue Found':  'bg-danger/10 text-danger border-danger/30',
  'N/A':          'bg-gray-100 text-gray-400 border-gray-200',
};

function buildDefaultChecklist() {
  return CHECKLIST_ITEMS.map((item) => ({ item, result: 'OK', remarks: '' }));
}

// ─── Checklist Component ──────────────────────────────────────────────────────
function ChecklistEditor({ value, onChange }) {
  const { t, lang } = useLanguage();

  function setResult(idx, result) {
    const updated = value.map((row, i) => i === idx ? { ...row, result } : row);
    onChange(updated);
  }
  function setRemarks(idx, remarks) {
    const updated = value.map((row, i) => i === idx ? { ...row, remarks } : row);
    onChange(updated);
  }

  const issues = value.filter((r) => r.result === 'Issue Found').length;
  const issueText = (n) => lang === 'ur'
    ? `${n} ${n === 1 ? 'مسئلہ ملا' : 'مسائل ملے'}`
    : `${n} issue${n > 1 ? 's' : ''} found`;

  const RESULT_DISPLAY = { 'OK': t('ok'), 'Issue Found': t('issueFound'), 'N/A': t('na') };

  return (
    <div>
      {issues > 0 && (
        <p className="text-xs text-danger font-medium mb-2">{issueText(issues)}</p>
      )}
      <div className="divide-y divide-gray-100">
        {value.map((row, idx) => (
          <div key={idx} className="py-2.5 flex flex-col sm:flex-row sm:items-start gap-2">
            <span className="text-xs text-gray-700 flex-1 pt-0.5">{idx + 1}. {row.item}</span>
            <div className="flex gap-1 shrink-0">
              {RESULT_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setResult(idx, opt)}
                  className={`px-2 py-0.5 text-xs border rounded-full font-medium transition-colors ${
                    row.result === opt ? RESULT_COLORS[opt] : 'border-gray-200 text-gray-400 hover:border-gray-300'
                  }`}
                >
                  {RESULT_DISPLAY[opt]}
                </button>
              ))}
            </div>
            {row.result === 'Issue Found' && (
              <input
                type="text"
                placeholder={t('describeIssue')}
                value={row.remarks}
                onChange={(e) => setRemarks(idx, e.target.value)}
                className="border border-danger/40 rounded-lg px-2 py-1 text-xs w-full sm:w-48"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Read-only Checklist View ─────────────────────────────────────────────────
function ChecklistView({ checklist }) {
  const { t, lang } = useLanguage();
  const RESULT_DISPLAY = { 'OK': t('ok'), 'Issue Found': t('issueFound'), 'N/A': t('na') };
  const issueLabel = (n) => lang === 'ur'
    ? `${n} ${n === 1 ? 'مسئلہ ملا' : 'مسائل ملے'}:`
    : `${n} Issue${n > 1 ? 's' : ''} Found:`;

  if (!checklist || checklist.length === 0) return <p className="text-xs text-gray-400">{t('noChecklistRecorded')}</p>;
  const issues = checklist.filter((r) => r.result === 'Issue Found');
  return (
    <div>
      {issues.length > 0 && (
        <div className="mb-2 p-2 bg-danger/5 border border-danger/20 rounded-lg">
          <p className="text-xs font-semibold text-danger mb-1">{issueLabel(issues.length)}</p>
          {issues.map((r, i) => (
            <p key={i} className="text-xs text-danger">• {r.item}{r.remarks ? ` — ${r.remarks}` : ''}</p>
          ))}
        </div>
      )}
      <div className="divide-y divide-gray-50">
        {checklist.map((row, i) => (
          <div key={i} className="py-1.5 flex items-center gap-2 text-xs">
            <span className={`px-1.5 py-0.5 border rounded-full font-medium shrink-0 ${RESULT_COLORS[row.result] || 'bg-gray-100 text-gray-400'}`}>
              {RESULT_DISPLAY[row.result] || row.result}
            </span>
            <span className="text-gray-600">{row.item}</span>
            {row.remarks && <span className="text-danger ml-1">({row.remarks})</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function InspectionDetailPage() {
  const { id } = useParams();
  const { t, lang } = useLanguage();
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [addingVisit, setAddingVisit] = useState(false);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [expandedVisit, setExpandedVisit] = useState(null);

  const [statusForm, setStatusForm] = useState({
    status: '', completed_date: '', order_book_remarks: '',
    remarks_submitted_to_dsps: '', remarks_submission_date: '',
  });
  const [visitForm, setVisitForm] = useState({
    visit_date: '', departure_time: '', arrival_time: '', return_time: '',
    distance_km: '', day_type: 'Full Day', notes: '',
    checklist: buildDefaultChecklist(),
  });
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    api.get(`/inspections/${id}`)
      .then((res) => {
        const data = res.data.data;
        setInspection(data);
        setStatusForm({
          status: data.status,
          completed_date: data.completed_date ? data.completed_date.split('T')[0] : '',
          order_book_remarks: data.order_book_remarks || '',
          remarks_submitted_to_dsps: data.remarks_submitted_to_dsps || '',
          remarks_submission_date: data.remarks_submission_date ? data.remarks_submission_date.split('T')[0] : '',
        });
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpdateStatus(e) {
    e.preventDefault();
    setError('');
    setUpdating(true);
    try {
      await api.put(`/inspections/${id}`, {
        ...statusForm,
        completed_date: statusForm.completed_date || null,
        remarks_submission_date: statusForm.remarks_submission_date || null,
      });
      load();
    } catch (err) {
      setError(err.response?.data?.error || t('updateFailed'));
    } finally {
      setUpdating(false);
    }
  }

  async function handleAddVisit(e) {
    e.preventDefault();
    setError('');
    setAddingVisit(true);
    try {
      await api.post(`/inspections/${id}/visits`, {
        ...visitForm,
        distance_km: visitForm.distance_km ? parseFloat(visitForm.distance_km) : null,
      });
      setVisitForm({
        visit_date: '', departure_time: '', arrival_time: '', return_time: '',
        distance_km: '', day_type: 'Full Day', notes: '',
        checklist: buildDefaultChecklist(),
      });
      setShowVisitForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || t('updateFailed'));
    } finally {
      setAddingVisit(false);
    }
  }

  async function handleDeleteVisit(visitId) {
    if (!window.confirm(t('removeVisitConfirm'))) return;
    try {
      await api.delete(`/inspections/visits/${visitId}`);
      load();
    } catch (err) {
      alert(t('failedToRemoveVisit'));
    }
  }

  if (loading) return <div className="py-20 flex justify-center"><LoadingSpinner /></div>;
  if (!inspection) return <div className="text-center py-10 text-gray-500">{t('inspectionNotFound')}</div>;

  return (
    <div>
      <PageHeader title={inspection.office_name} backTo="/inspections" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Programme Info */}
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-5">
          <h3 className="text-sm font-semibold text-primary mb-3">{t('inspectionProgramme')}</h3>
          <dl className="divide-y divide-gray-100">
            {[
              [t('office'), inspection.office_name],
              [t('year'), inspection.year],
              [t('halfYear'), inspection.half],
              [t('allottedMonth'), MONTHS[inspection.allotted_month]],
              [t('inspectingOfficer'), inspection.inspecting_officer],
              [t('tehsil'), inspection.tehsil],
            ].map(([label, value]) => (
              <div key={label} className="py-2 flex justify-between text-sm">
                <dt className="text-gray-500">{label}</dt>
                <dd className="font-medium text-gray-800">{value || '—'}</dd>
              </div>
            ))}
            <div className="py-2 flex justify-between text-sm">
              <dt className="text-gray-500">{t('status')}</dt>
              <dd><StatusBadge status={inspection.status} /></dd>
            </div>
          </dl>
        </div>

        {/* Update Status */}
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-5">
          <h3 className="text-sm font-semibold text-primary mb-3">{t('updateStatus')}</h3>
          <form onSubmit={handleUpdateStatus}>
            <FormField label={t('status')}>
              <Select value={statusForm.status} onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}>
                {INSPECTION_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </Select>
            </FormField>
            {statusForm.status === 'Completed' && (
              <FormField label={t('completedDate')}>
                <Input type="date" value={statusForm.completed_date} onChange={(e) => setStatusForm({ ...statusForm, completed_date: e.target.value })} />
              </FormField>
            )}
            <FormField label={t('orderBookRemarks')}>
              <Textarea value={statusForm.order_book_remarks} onChange={(e) => setStatusForm({ ...statusForm, order_book_remarks: e.target.value })} rows={2} />
            </FormField>
            <FormField label={t('remarksSubmittedToDsps')}>
              <Textarea value={statusForm.remarks_submitted_to_dsps} onChange={(e) => setStatusForm({ ...statusForm, remarks_submitted_to_dsps: e.target.value })} rows={2} />
            </FormField>
            {statusForm.remarks_submitted_to_dsps && (
              <FormField label={t('remarksSubmissionDate')}>
                <Input type="date" value={statusForm.remarks_submission_date} onChange={(e) => setStatusForm({ ...statusForm, remarks_submission_date: e.target.value })} />
              </FormField>
            )}
            {error && <p className="text-xs text-danger mb-3">{error}</p>}
            <button type="submit" disabled={updating}
              className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60 w-full">
              {updating ? t('saving') : t('saveChanges')}
            </button>
          </form>
        </div>
      </div>

      {/* Visits */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-primary">{t('visitRecords')} ({inspection.visits?.length || 0})</h3>
          <button onClick={() => setShowVisitForm((p) => !p)}
            className="text-sm bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-primary-dark">
            {showVisitForm ? t('cancel') : t('addVisit')}
          </button>
        </div>

        {showVisitForm && (
          <form onSubmit={handleAddVisit} className="mb-4 p-4 bg-surface rounded-lg border border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <FormField label={t('visitDate')} required>
                <Input type="date" value={visitForm.visit_date} onChange={(e) => setVisitForm({ ...visitForm, visit_date: e.target.value })} required />
              </FormField>
              <FormField label={t('dayType')}>
                <Select value={visitForm.day_type} onChange={(e) => setVisitForm({ ...visitForm, day_type: e.target.value })}>
                  {DAY_TYPES.map((d) => <option key={d}>{d}</option>)}
                </Select>
              </FormField>
              <FormField label={t('distance')}>
                <Input type="number" value={visitForm.distance_km} onChange={(e) => setVisitForm({ ...visitForm, distance_km: e.target.value })} min="0" step="0.1" />
              </FormField>
              <FormField label={t('departureTime')}>
                <Input type="time" value={visitForm.departure_time} onChange={(e) => setVisitForm({ ...visitForm, departure_time: e.target.value })} />
              </FormField>
              <FormField label={t('arrivalTime')}>
                <Input type="time" value={visitForm.arrival_time} onChange={(e) => setVisitForm({ ...visitForm, arrival_time: e.target.value })} />
              </FormField>
              <FormField label={t('returnTime')}>
                <Input type="time" value={visitForm.return_time} onChange={(e) => setVisitForm({ ...visitForm, return_time: e.target.value })} />
              </FormField>
            </div>
            <FormField label={t('notes')}>
              <Input value={visitForm.notes} onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })} placeholder={t('observations') + '...'} />
            </FormField>

            {/* Checklist */}
            <div className="mt-4 border-t border-gray-200 pt-4">
              <p className="text-xs font-semibold text-gray-700 mb-3">{t('inspectionChecklist')}</p>
              <ChecklistEditor
                value={visitForm.checklist}
                onChange={(cl) => setVisitForm({ ...visitForm, checklist: cl })}
              />
            </div>

            <div className="mt-4">
              <button type="submit" disabled={addingVisit}
                className="bg-success text-white px-5 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60">
                {addingVisit ? t('adding') : t('addVisitSubmit')}
              </button>
            </div>
          </form>
        )}

        {inspection.visits?.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">{t('noVisitRecords')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('date')}</th>
                  <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('dayType')}</th>
                  <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('departure')}</th>
                  <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('arrival')}</th>
                  <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('returnLabel')}</th>
                  <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('distKm')}</th>
                  <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('checklist')}</th>
                  <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('notes')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inspection.visits.map((v) => {
                  const checklist = v.checklist || [];
                  const issues = checklist.filter((c) => c.result === 'Issue Found').length;
                  const isExpanded = expandedVisit === v.id;
                  const issueBtn = lang === 'ur'
                    ? `${issues} ${issues === 1 ? 'مسئلہ' : 'مسائل'}`
                    : `${issues} issue${issues > 1 ? 's' : ''}`;
                  return (
                    <React.Fragment key={v.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="py-2">{(v.visit_date)}</td>
                        <td className="py-2">{v.day_type}</td>
                        <td className="py-2">{v.departure_time || '—'}</td>
                        <td className="py-2">{v.arrival_time || '—'}</td>
                        <td className="py-2">{v.return_time || '—'}</td>
                        <td className="py-2">{v.distance_km || '—'}</td>
                        <td className="py-2">
                          {checklist.length > 0 ? (
                            <button
                              onClick={() => setExpandedVisit(isExpanded ? null : v.id)}
                              className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                                issues > 0
                                  ? 'bg-danger/10 text-danger border-danger/30'
                                  : 'bg-success/10 text-success border-success/30'
                              }`}
                            >
                              {issues > 0 ? issueBtn : `✓ ${t('allOk')}`} {isExpanded ? '▲' : '▼'}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="py-2 text-gray-500 text-xs max-w-32 truncate">{v.notes || '—'}</td>
                        <td className="py-2">
                          <button onClick={() => handleDeleteVisit(v.id)} className="text-gray-300 hover:text-danger text-xs">{t('remove')}</button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} className="pb-3 px-3 bg-gray-50">
                            <div className="p-3 rounded-lg border border-gray-200 bg-white">
                              <ChecklistView checklist={checklist} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
