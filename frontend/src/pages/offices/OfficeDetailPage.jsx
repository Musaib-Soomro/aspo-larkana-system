import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';

export default function OfficeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [office, setOffice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/offices/${id}`)
      .then((res) => setOffice(res.data.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="py-20 flex justify-center"><LoadingSpinner /></div>;
  if (!office) return <div className="text-center py-10 text-gray-500">{t('officeNotFound')}</div>;

  const details = [
    [t('type'), office.type],
    [t('shift'), office.shift],
    [t('tehsil'), office.tehsil],
    [t('district'), office.district],
    [t('accountOffice'), office.account_office],
    [t('bpsCategory'), office.bps_category],
    [t('hasEdbos'), office.has_edbos ? t('yes') : t('no')],
    [t('staffCount'), office.staff_count],
    [t('activeComplaints'), office.active_complaints],
    [t('address'), office.address || '-'],
  ];

  return (
    <div>
      <PageHeader
        title={office.name}
        backTo="/offices"
        action={t('edit')}
        onAction={() => navigate(`/offices/${id}/edit`)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-5">
          <h3 className="text-sm font-semibold text-primary mb-3">{t('officeDetails')}</h3>
          <dl className="divide-y divide-gray-100">
            {details.map(([label, value]) => (
              <div key={label} className="py-2 flex justify-between text-sm">
                <dt className="text-gray-500">{label}</dt>
                <dd className="font-medium text-gray-800">{value ?? '-'}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex flex-col gap-3">
          {[
            { label: t('viewStaff'), to: `/staff?office_id=${id}` },
            { label: t('viewComplaints'), to: `/complaints?office_id=${id}` },
            { label: t('viewRevenue'), to: `/revenue?office_id=${id}` },
            { label: t('viewInspections'), to: `/inspections?office_id=${id}` },
          ].map((link) => (
            <button
              key={link.to}
              onClick={() => navigate(link.to)}
              className="bg-surface border border-gray-200 rounded-xl p-4 text-left hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <span className="text-sm font-medium text-primary">{link.label} →</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
