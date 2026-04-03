import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../utils/api';
import {  } from '../../utils/dateFormat';
import { useLanguage } from '../../context/LanguageContext';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export default function AttendanceReportPage() {
  const { t } = useLanguage();

  const now = new Date();
  const [staff, setStaff] = useState([]);
  const [staffId, setStaffId] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/staff', { params: { limit: 200, is_active: true } }).then(r => setStaff(r.data.data));
  }, []);

  function fetchReport() {
    if (!staffId) return;
    setLoading(true);
    const params = { staff_id: staffId, year };
    if (month) params.month = month;
    api.get('/attendance/report', { params })
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (staffId) fetchReport();
  }, [staffId, month, year]);

  return (
    <div>
      <PageHeader title={t('attendanceReport')} backTo="/attendance" />

      {/* Filters */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-none border border-transparent dark:border-dark-border p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t('staff')}</label>
          <select value={staffId} onChange={e => setStaffId(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
            <option value="">— {t('select')} —</option>
            {staff.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.designation})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t('month')} ({t('optional') || 'optional'})</label>
          <select value={month} onChange={e => setMonth(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
            <option value="">— {t('allYear')} —</option>
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
      </div>

      {!staffId && <div className="text-center py-12 text-gray-400">{t('selectStaffFirst') || 'Select a staff member to view the report.'}</div>}
      {staffId && loading && <div className="py-16 flex justify-center"><LoadingSpinner /></div>}

      {staffId && !loading && data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
            {[
              { label: t('present'),    val: data.present,    color: 'text-green-600' },
              { label: t('absent'),     val: data.absent,     color: 'text-danger' },
              { label: 'On Leave',      val: data.on_leave,   color: 'text-alert' },
              { label: t('onDuty'),     val: data.on_duty,    color: 'text-blue-600' },
              { label: t('holiday'),    val: data.holidays,   color: 'text-gray-500' },
              { label: t('attendancePct'), val: `${data.attendance_pct}%`, color: 'text-primary' },
            ].map(c => (
              <div key={c.label} className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-none border border-transparent dark:border-dark-border p-3 text-center">
                <p className={`text-xl font-bold ${c.color}`}>{c.val}</p>
                <p className="text-xs text-gray-400 mt-1">{c.label}</p>
              </div>
            ))}
          </div>

          {/* Working days summary */}
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-none border border-transparent dark:border-dark-border p-4 mb-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-800">{t('workingDays')}:</span> {data.working_days} &nbsp;·&nbsp;
              <span className="font-medium text-gray-800">{t('attendancePct')}:</span> <span className="text-primary font-bold">{data.attendance_pct}%</span>
            </p>
          </div>

          {/* Leave Records */}
          {data.leave_records?.length > 0 && (
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-none border border-transparent dark:border-dark-border p-5">
              <h3 className="text-sm font-semibold text-primary mb-3">{t('leaveMemo')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('dspsMemoNo')}</th>
                      <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('dspsMemoDate')}</th>
                      <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('type')}</th>
                      <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('from')}</th>
                      <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('to')}</th>
                      <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('days')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.leave_records.map(l => (
                      <tr key={l.id}>
                        <td className="py-2">{l.dsps_memo_no || '—'}</td>
                        <td className="py-2">{(l.dsps_memo_date)}</td>
                        <td className="py-2">{l.leave_type}</td>
                        <td className="py-2">{(l.start_date)}</td>
                        <td className="py-2">{(l.end_date)}</td>
                        <td className="py-2">{l.total_days}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
