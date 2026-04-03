import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../utils/api';
import { DESIGNATIONS } from '../../utils/constants';
import {  } from '../../utils/dateFormat';

export default function StaffListPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [staff, setStaff] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    designation: '',
    office_id: searchParams.get('office_id') || '',
    page: 1,
  });

  useEffect(() => {
    setLoading(true);
    const params = { page: filters.page };
    if (filters.search) params.search = filters.search;
    if (filters.designation) params.designation = filters.designation;
    if (filters.office_id) params.office_id = filters.office_id;

    api.get('/staff', { params })
      .then((res) => { setStaff(res.data.data); setPagination(res.data.pagination); })
      .finally(() => setLoading(false));
  }, [filters]);

  function getRetirementCell(r) {
    if (!r.date_of_birth) return <span className="text-gray-300 text-xs">—</span>;
    const dob = new Date(r.date_of_birth);
    const retirementDate = new Date(dob);
    retirementDate.setFullYear(retirementDate.getFullYear() + 60);
    const now = new Date();
    const monthsLeft =
      (retirementDate.getFullYear() - now.getFullYear()) * 12 +
      (retirementDate.getMonth() - now.getMonth());
    const age = Math.floor((now - dob) / (365.25 * 24 * 60 * 60 * 1000));
    if (monthsLeft <= 0) {
      return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-danger">Retired (age {age})</span>;
    }
    if (monthsLeft <= 3) {
      return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-danger">In {monthsLeft}m (age {age})</span>;
    }
    if (monthsLeft <= 12) {
      return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-alert">In {monthsLeft}m (age {age})</span>;
    }
    return <span className="text-xs text-gray-500">Age {age}</span>;
  }

  function getTransferCell(r) {
    if (r.designation !== 'Postmaster') return <span className="text-gray-300 text-xs">—</span>;
    if (!r.current_posting_date) return <span className="text-gray-300 text-xs">—</span>;
    const posted = new Date(r.current_posting_date);
    const now = new Date();
    const totalMonths =
      (now.getFullYear() - posted.getFullYear()) * 12 +
      (now.getMonth() - posted.getMonth());
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    const label = years > 0 ? `${years}y ${months}m` : `${months}m`;
    if (totalMonths >= 36) {
      return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-danger">Due ({label})</span>;
    }
    if (totalMonths >= 30) {
      return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-alert">Soon ({label})</span>;
    }
    return <span className="text-xs text-gray-500">{label}</span>;
  }

  const columns = [
    { key: 'full_name', label: t('fullName') },
    { key: 'designation', label: t('designation') },
    { key: 'office_name', label: t('office') },
    { key: 'bps', label: t('bps') },
    {
      key: 'status', label: t('status'),
      render: (r) => r.is_on_leave
        ? <StatusBadge status="On Leave" />
        : r.is_on_lookafter
        ? <StatusBadge status="Look-After" />
        : <StatusBadge status="Active" />,
    },
    { key: 'transfer',   label: 'Transfer',   render: (r) => getTransferCell(r) },
    { key: 'retirement', label: 'Retirement', render: (r) => getRetirementCell(r) },
    {
      key: 'actions', label: '',
      render: (r) => (
        <button onClick={() => navigate(`/staff/${r.id}`)} className="text-primary text-xs hover:underline">
          View →
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={t('staff')} action={t('addNew')} onAction={() => navigate('/staff/new')} />

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder={t('search')}
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48"
        />
        <select
          value={filters.designation}
          onChange={(e) => setFilters({ ...filters, designation: e.target.value, page: 1 })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All Designations</option>
          {DESIGNATIONS.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={staff}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => setFilters({ ...filters, page: p })}
      />
    </div>
  );
}
