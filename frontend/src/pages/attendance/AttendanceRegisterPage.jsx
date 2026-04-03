import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { useIsAdmin } from '../../context/AuthContext';

const STATUS_COLORS = {
  Present:   'bg-green-100 text-green-700 border-green-300',
  Absent:    'bg-red-100 text-red-700 border-red-300',
  'On Leave':'bg-amber-100 text-amber-700 border-amber-300',
  'On Duty': 'bg-blue-100 text-blue-700 border-blue-300',
  Holiday:   'bg-gray-100 text-gray-500 border-gray-300',
};

const STATUS_ABBR = {
  Present: 'P', Absent: 'A', 'On Leave': 'L', 'On Duty': 'D', Holiday: 'H',
};

const STATUSES = ['Present', 'Absent', 'On Leave', 'On Duty', 'Holiday'];

// Hard-coded ASPO Larkana office — known from the seeded data
// Fetched dynamically by searching for offices with name containing 'ASPO'
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export default function AttendanceRegisterPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isAdmin = useIsAdmin();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());
  const [offices, setOffices] = useState([]);
  const [officeId, setOfficeId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // cell interaction
  const [activeCell, setActiveCell] = useState(null); // { staffId, date }
  const [leaveMemos, setLeaveMemos] = useState({}); // staffId → []
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/offices', { params: { limit: 200 } }).then(r => setOffices(r.data.data));
  }, []);

  const load = useCallback(() => {
    if (!officeId) return;
    setLoading(true);
    api.get('/attendance', { params: { month, year, office_id: officeId } })
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false));
  }, [month, year, officeId]);

  useEffect(() => { load(); }, [load]);

  // Days in the selected month
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  function dateStr(day) {
    return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  }

  function openCell(staffId, date) {
    if (!isAdmin) return;
    setActiveCell({ staffId, date });
    // Load leave memos for this staff if not yet loaded
    if (!leaveMemos[staffId]) {
      api.get('/attendance/leave-memos', { params: { staff_id: staffId } })
        .then(r => setLeaveMemos(prev => ({ ...prev, [staffId]: r.data.data })));
    }
  }

  async function markStatus(status, leaveId) {
    if (!activeCell) return;
    setSaving(true);
    try {
      await api.post('/attendance', {
        staff_id: activeCell.staffId,
        date: activeCell.date,
        status,
        leave_id: leaveId || null,
      });
      setActiveCell(null);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to mark attendance.');
    } finally { setSaving(false); }
  }

  return (
    <div>
      <PageHeader
        title={t('attendanceRegister')}
        action={t('attendanceReport')}
        onAction={() => navigate('/attendance/report')}
      />

      {/* Controls */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-none border border-transparent dark:border-dark-border p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t('office')}</label>
          <select value={officeId} onChange={e => setOfficeId(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
            <option value="">— {t('select')} —</option>
            {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t('month')}</label>
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
            className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
            {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t('year')}</label>
          <select value={year} onChange={e => setYear(parseInt(e.target.value))}
            className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {isAdmin && (
          <button onClick={() => navigate('/attendance/leave-memo/new')}
            className="btn-primary text-sm">
            {t('registerLeaveMemo')}
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-3">
        {STATUSES.map(s => (
          <span key={s} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[s]}`}>
            {STATUS_ABBR[s]} = {t(s === 'On Leave' ? 'onLeave' : s === 'On Duty' ? 'onDuty' : s.toLowerCase())}
          </span>
        ))}
        <span className="text-xs px-2 py-0.5 rounded-full border border-gray-200 text-gray-400">· = {t('notMarked')}</span>
      </div>

      {!officeId && (
        <div className="text-center py-12 text-gray-400">{t('selectOfficeFirst') || 'Select an office to view the register.'}</div>
      )}

      {officeId && loading && <div className="py-16 flex justify-center"><LoadingSpinner /></div>}

      {officeId && !loading && data && (
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-none border border-transparent dark:border-dark-border overflow-x-auto">
          <table className="text-xs min-w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-500 sticky left-0 bg-white min-w-[160px]">
                  {t('staff')}
                </th>
                {days.map(d => (
                  <th key={d} className="px-1 py-3 font-medium text-gray-400 text-center min-w-[28px]">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.staff.length === 0 ? (
                <tr><td colSpan={days.length + 1} className="text-center py-8 text-gray-400">{t('noAttendanceMarked')}</td></tr>
              ) : data.staff.map(s => (
                <tr key={s.id} className="hover:bg-surface">
                  <td className="px-4 py-2 sticky left-0 bg-white">
                    <p className="font-medium text-gray-800">{s.full_name}</p>
                    <p className="text-gray-400 text-xs">{s.designation}</p>
                  </td>
                  {days.map(d => {
                    const date = dateStr(d);
                    const att = s.days[date];
                    const isActive = activeCell?.staffId === s.id && activeCell?.date === date;
                    return (
                      <td key={d} className="px-0.5 py-2 text-center">
                        <button
                          onClick={() => isActive ? setActiveCell(null) : openCell(s.id, date)}
                          className={`w-6 h-6 rounded-full border text-xs font-bold transition-all
                            ${att ? STATUS_COLORS[att.status] : 'border-gray-200 text-gray-300'}
                            ${isActive ? 'ring-2 ring-primary ring-offset-1' : ''}
                            ${isAdmin ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}`}
                          title={att?.status || t('notMarked')}
                        >
                          {att ? STATUS_ABBR[att.status] : '·'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cell action popover */}
      {activeCell && (
        <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setActiveCell(null)}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl p-4 w-64"
            onClick={e => e.stopPropagation()}>
            <p className="text-xs font-medium text-gray-500 mb-3">{activeCell.date}</p>
            <div className="space-y-1.5">
              {STATUSES.filter(s => s !== 'On Leave').map(s => (
                <button key={s} disabled={saving}
                  onClick={() => markStatus(s)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium border ${STATUS_COLORS[s]} hover:opacity-80 disabled:opacity-50`}>
                  {STATUS_ABBR[s]} — {t(s === 'On Duty' ? 'onDuty' : s.toLowerCase())}
                </button>
              ))}
              {/* On Leave — needs memo selection */}
              <div>
                <p className="text-xs text-gray-400 mt-2 mb-1">{t('leaveMemo')}:</p>
                {(leaveMemos[activeCell.staffId] || []).length === 0 ? (
                  <p className="text-xs text-gray-400 italic">{t('noData')}</p>
                ) : (leaveMemos[activeCell.staffId] || []).map(l => (
                  <button key={l.id} disabled={saving}
                    onClick={() => markStatus('On Leave', l.id)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs border border-amber-300 bg-amber-50 text-amber-700 hover:opacity-80 mb-1 disabled:opacity-50">
                    {l.dsps_memo_no} · {l.leave_type}<br />
                    <span className="text-amber-500">{l.start_date?.slice(0,10)} – {l.end_date?.slice(0,10)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
