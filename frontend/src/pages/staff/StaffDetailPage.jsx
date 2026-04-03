import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../utils/api';
import {  } from '../../utils/dateFormat';
import { useLanguage } from '../../context/LanguageContext';

function InfoRow({ label, value }) {
  return (
    <div className="py-2 flex justify-between text-sm border-b border-gray-100 last:border-0">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-800 text-right">{value ?? '—'}</dd>
    </div>
  );
}

function getRetirementInfo(date_of_birth) {
  if (!date_of_birth) return null;
  const dob = new Date(date_of_birth);
  const retirementDate = new Date(dob);
  retirementDate.setFullYear(retirementDate.getFullYear() + 60);
  const now = new Date();
  const monthsLeft =
    (retirementDate.getFullYear() - now.getFullYear()) * 12 +
    (retirementDate.getMonth() - now.getMonth());
  const age = Math.floor((now - dob) / (365.25 * 24 * 60 * 60 * 1000));
  return {
    retirementDateStr: retirementDate.toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' }),
    monthsLeft,
    age,
    isRetired: monthsLeft <= 0,
  };
}

function getPostingStatus(current_posting_date) {
  if (!current_posting_date) return null;
  const posted = new Date(current_posting_date);
  const now = new Date();
  const totalMonths =
    (now.getFullYear() - posted.getFullYear()) * 12 +
    (now.getMonth() - posted.getMonth());
  return { totalMonths, years: Math.floor(totalMonths / 12), months: totalMonths % 12 };
}

export default function StaffDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transfers, setTransfers] = useState([]);
  const [activeLookAfter, setActiveLookAfter] = useState(null);

  useEffect(() => {
    api.get(`/staff/${id}`)
      .then((res) => setStaff(res.data.data))
      .finally(() => setLoading(false));
    api.get('/transfers', { params: { staff_id: id, limit: 10 } })
      .then((res) => setTransfers(res.data.data));
    api.get('/look-after', { params: { staff_id: id, is_active: 'true', limit: 1 } })
      .then((res) => setActiveLookAfter(res.data.data[0] || null));
  }, [id]);

  if (loading) return <div className="py-20 flex justify-center"><LoadingSpinner /></div>;
  if (!staff) return <div className="text-center py-10 text-gray-500">{t('staffNotFound')}</div>;

  const retirementInfo = getRetirementInfo(staff.date_of_birth);
  const postingStatus = staff.designation === 'Postmaster' ? getPostingStatus(staff.current_posting_date) : null;

  return (
    <div>
      <PageHeader
        title={staff.full_name}
        backTo="/staff"
        action={t('edit')}
        onAction={() => navigate(`/staff/${id}/edit`)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Basic Info */}
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-5">
          <h3 className="text-sm font-semibold text-primary mb-3">{t('staffDetails')}</h3>
          <dl>
            <InfoRow label={t('designation')} value={staff.designation} />
            <InfoRow label={t('office')} value={staff.office_name} />
            <InfoRow label={t('bps')} value={staff.bps ? `BPS-${staff.bps}` : null} />
            <InfoRow label={t('employeeId')} value={staff.employee_id} />
            <InfoRow label={t('dateOfJoiningService')} value={(staff.date_of_joining)} />
            <InfoRow label={t('currentPostingDate')} value={(staff.current_posting_date)} />
            <InfoRow label={t('dateOfBirth')} value={(staff.date_of_birth)} />
            <InfoRow
              label={t('status')}
              value={
                staff.is_on_leave ? <StatusBadge status="On Leave" /> :
                staff.is_on_lookafter ? <StatusBadge status="Look-After" /> :
                <StatusBadge status="Active" />
              }
            />
            {staff.is_on_lookafter && staff.lookafter_office_name && (
              <InfoRow label={t('lookAfterOffice')} value={staff.lookafter_office_name} />
            )}
          </dl>
        </div>

        {/* Active Look-After Duty */}
        {activeLookAfter && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-amber-700 mb-3">{t('activeLookAfterDuty')}</h3>
            <dl>
              <InfoRow label={t('coveringDesignation')} value={activeLookAfter.lookafter_designation} />
              <InfoRow label={t('atOffice')} value={activeLookAfter.lookafter_office_name} />
              <InfoRow label={t('since')} value={(activeLookAfter.start_date)} />
              <InfoRow label={t('dspsOrderNo')} value={`${activeLookAfter.dsps_order_no} (${(activeLookAfter.dsps_order_date)})`} />
            </dl>
            <p className="text-xs text-gray-500 mt-2 italic">{activeLookAfter.start_reason}</p>
            <button onClick={() => navigate(`/look-after/${activeLookAfter.id}`)}
              className="mt-3 text-xs text-amber-700 hover:underline font-medium">
              {t('viewAssignment')} →
            </button>
          </div>
        )}

        {/* Retirement & Transfer Status */}
        <div className="flex flex-col gap-4">

          {/* Retirement Card */}
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-5">
            <h3 className="text-sm font-semibold text-primary mb-3">{t('retirementStatus')}</h3>
            {retirementInfo ? (
              <>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">{t('currentAge')}</span>
                  <span className="font-semibold">{retirementInfo.age} {t('years')}</span>
                </div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-gray-500">{t('retirementDate')}</span>
                  <span className="font-semibold">{retirementInfo.retirementDateStr}</span>
                </div>
                {retirementInfo.isRetired ? (
                  <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-danger font-semibold text-center">
                    ⚠ {t('retirementAgeReached')}
                  </div>
                ) : retirementInfo.monthsLeft <= 3 ? (
                  <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-danger font-semibold text-center">
                    ⚠ {t('retiringIn').replace('{n}', retirementInfo.monthsLeft)}
                  </div>
                ) : retirementInfo.monthsLeft <= 12 ? (
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-alert font-semibold text-center">
                    ⚠ {t('retiringIn').replace('{n}', retirementInfo.monthsLeft)}
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-500 text-center">
                    {t('monthsUntilRetirement').replace('{n}', retirementInfo.monthsLeft)}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400">{t('dobNotRecorded')}</p>
            )}
          </div>

          {/* Transfer Card — Postmaster only */}
          {staff.designation === 'Postmaster' && (
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-5">
              <h3 className="text-sm font-semibold text-primary mb-3">{t('transferStatus')}</h3>
              {postingStatus ? (
                <>
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-gray-500">{t('timeAtCurrentOffice')}</span>
                    <span className="font-semibold">
                      {postingStatus.years > 0 ? `${postingStatus.years}y ` : ''}{postingStatus.months}m
                    </span>
                  </div>
                  {postingStatus.totalMonths >= 36 ? (
                    <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-danger font-semibold text-center">
                      ⚠ {t('transferOverdue')}
                    </div>
                  ) : postingStatus.totalMonths >= 30 ? (
                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-alert font-semibold text-center">
                      ⚠ {t('transferDueIn').replace('{n}', 36 - postingStatus.totalMonths)}
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-500 text-center">
                      {t('monthsUntilTransfer').replace('{n}', 36 - postingStatus.totalMonths)}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400">{t('postingDateNotRecorded')}</p>
              )}
            </div>
          )}

          {/* Leave Balance */}
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-5">
            <h3 className="text-sm font-semibold text-primary mb-3">
              {t('casualLeaveBalanceLabel')} ({staff.cl_balance?.year})
            </h3>
            <div className="flex gap-4 text-sm">
              <div className="flex-1 text-center p-2 bg-surface rounded-lg">
                <p className="text-2xl font-bold text-primary">{staff.cl_balance?.remaining ?? '—'}</p>
                <p className="text-xs text-gray-500 mt-1">{t('remaining')}</p>
              </div>
              <div className="flex-1 text-center p-2 bg-surface rounded-lg">
                <p className="text-2xl font-bold text-alert">{staff.cl_balance?.used ?? '—'}</p>
                <p className="text-xs text-gray-500 mt-1">{t('used')}</p>
              </div>
              <div className="flex-1 text-center p-2 bg-surface rounded-lg">
                <p className="text-2xl font-bold text-gray-400">20</p>
                <p className="text-xs text-gray-500 mt-1">{t('annual')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transfer History */}
        {transfers.length > 0 && (
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-5 md:col-span-2">
            <h3 className="text-sm font-semibold text-primary mb-3">{t('transferHistory')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('transferOrderDate')}</th>
                    <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('refLetterNo')}</th>
                    <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('fromOffice')} → {t('toOffice')}</th>
                    <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('status')}</th>
                    <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('transitDays')}</th>
                    <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transfers.map((tr) => (
                    <tr key={tr.id}>
                      <td className="py-2">{(tr.transfer_order_date)}</td>
                      <td className="py-2">{tr.reference_letter_no}</td>
                      <td className="py-2">{tr.from_office_name} → {tr.to_office_name}</td>
                      <td className="py-2"><StatusBadge status={tr.status} /></td>
                      <td className="py-2">{tr.transit_days != null ? `${tr.transit_days} ${t('days')}` : '—'}</td>
                      <td className="py-2">
                        <button onClick={() => navigate('/transfers/' + tr.id)} className="text-primary text-xs hover:underline">
                          {t('view')} →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Leaves */}
        {staff.recent_leaves?.length > 0 && (
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-5 md:col-span-2">
            <h3 className="text-sm font-semibold text-primary mb-3">{t('recentLeaveRecords')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('type')}</th>
                    <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('from')}</th>
                    <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('to')}</th>
                    <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('days')}</th>
                    <th className="text-left py-2 text-xs text-gray-500 font-medium">{t('status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {staff.recent_leaves.map((l) => (
                    <tr key={l.id}>
                      <td className="py-2">{l.leave_type}</td>
                      <td className="py-2">{(l.start_date)}</td>
                      <td className="py-2">{(l.end_date)}</td>
                      <td className="py-2">{l.total_days}</td>
                      <td className="py-2"><StatusBadge status={l.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
