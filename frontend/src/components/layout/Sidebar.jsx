import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

const Icons = {
  dashboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  offices: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
    </svg>
  ),
  staff: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  ),
  leave: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
    </svg>
  ),
  inspections: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  ),
  articles: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776" />
    </svg>
  ),
  complaints: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
    </svg>
  ),
  revenue: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
  ),
  inquiries: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v8.25m9.75-4.5h6m-6 0a1.5 1.5 0 0 1-1.5 1.5h-1.5a1.5 1.5 0 0 1-1.5-1.5m4.5 0v.75m6 0h-6m0 0v-.75" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  ),
  auditLog: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
    </svg>
  ),
  transfers: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  ),
  lookAfter: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  ),
  attendance: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
    </svg>
  ),
  edbo: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
    </svg>
  ),
  diary: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  assignments: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
    </svg>
  ),
  vpDelivery: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  ),
  chevronDown: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  ),
};

// Always-visible standalone item
const STANDALONE = [
  { to: '/dashboard', postmasterTo: '/postmaster-dashboard', icon: 'dashboard', key: 'dashboard' },
];

// Accordion groups — items with no `roles` are visible to all authenticated users
const GROUPS = [
  {
    id: 'personnel',
    labelKey: 'personnel',
    icon: 'staff',
    items: [
      { to: '/offices',    icon: 'offices',    key: 'offices',         roles: ['admin', 'viewer'] },
      { to: '/staff',      icon: 'staff',      key: 'staff',           roles: ['admin', 'viewer'] },
      { to: '/leave',      icon: 'leave',      key: 'leave',           roles: ['admin', 'viewer'] },
      { to: '/transfers',  icon: 'transfers',  key: 'transfers',       roles: ['admin', 'viewer'] },
      { to: '/look-after', icon: 'lookAfter',  key: 'lookAfterDuties', roles: ['admin'] },
    ],
  },
  {
    id: 'aspoOffice',
    labelKey: 'aspoOffice',
    icon: 'offices',
    items: [
      { to: '/attendance',       icon: 'attendance',  key: 'attendanceRegister', roles: ['admin'] },
      { to: '/edbo-programme',   icon: 'edbo',        key: 'edboProgramme',      roles: ['admin'] },
      { to: '/overseer-diary',   icon: 'diary',       key: 'overseerDiary',      roles: ['admin'] },
      { to: '/work-assignments', icon: 'assignments', key: 'workAssignments',    roles: ['admin'] },
      { to: '/vp-delivery',      icon: 'vpDelivery',  key: 'vpDelivery',         roles: ['admin'] },
    ],
  },
  {
    id: 'operations',
    labelKey: 'operations',
    icon: 'articles',
    items: [
      { to: '/inspections', icon: 'inspections', key: 'inspections', roles: ['admin', 'viewer'] },
      { to: '/articles',    icon: 'articles',    key: 'articles' },
      { to: '/complaints',  icon: 'complaints',  key: 'complaints',  roles: ['admin', 'viewer'] },
      { to: '/revenue',     icon: 'revenue',     key: 'revenue' },
      { to: '/inquiries',   icon: 'inquiries',   key: 'inquiries',   roles: ['admin', 'viewer'] },
    ],
  },
  {
    id: 'admin',
    labelKey: 'admin',
    icon: 'settings',
    items: [
      { to: '/settings',       icon: 'settings',  key: 'settings',  roles: ['admin'] },
      { to: '/settings/users', icon: 'users',     key: 'users',     roles: ['admin'] },
      { to: '/audit-log',      icon: 'auditLog',  key: 'auditLog',  roles: ['admin'] },
    ],
  },
];

// Notification badge sources
const BADGE_KEYS = {
  '/complaints':  'complaints',
  '/inspections': 'inspections',
};

function findGroupForPath(pathname, role) {
  for (const group of GROUPS) {
    const visible = group.items.filter(i => !i.roles || i.roles.includes(role));
    if (visible.some(i => pathname === i.to || pathname.startsWith(i.to + '/'))) {
      return group.id;
    }
  }
  return null;
}

export default function Sidebar({ open, onClose }) {
  const { t } = useLanguage();
  const { badges } = useNotifications();
  const { user } = useAuth();
  const role = user?.role;
  const location = useLocation();

  const [openGroup, setOpenGroup] = useState(() => findGroupForPath(location.pathname, role));

  // Auto-expand the group that contains the currently active route
  useEffect(() => {
    const found = findGroupForPath(location.pathname, role);
    if (found) setOpenGroup(found);
  }, [location.pathname, role]);

  function toggleGroup(id) {
    setOpenGroup(prev => (prev === id ? null : id));
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <nav
        className={`
          fixed top-0 left-0 bottom-0 w-60 z-30 flex flex-col shadow-sidebar overflow-hidden
          transform transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
        style={{
          background: 'linear-gradient(180deg, #140A14 0%, #100810 60%, #0E0610 100%)',
        }}
      >
        {/* Branding strip */}
        <div className="h-14 px-4 flex items-center gap-2.5 border-b border-white/[0.07] shrink-0">
          <img src="/pp-icon.png" alt="" className="h-8 w-8 object-contain opacity-90" />
          <div>
            <p className="font-display text-white/90 text-[13px] font-semibold leading-tight">ASPO Larkana</p>
            <p className="text-white/35 text-[9px] uppercase tracking-[0.15em] leading-tight mt-0.5">Management System</p>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 pt-2 pb-4 overflow-hidden">

          {/* Standalone: Dashboard */}
          {STANDALONE.map(item => {
            const resolvedTo = (role === 'postmaster' && item.postmasterTo) ? item.postmasterTo : item.to;
            return (
              <NavLink
                key={item.to}
                to={resolvedTo}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-sidebar-active text-white shadow-sm'
                      : 'text-white/50 hover:bg-sidebar-hover hover:text-white/90'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`shrink-0 transition-opacity ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                      {Icons[item.icon]}
                    </span>
                    <span className="flex-1 truncate">{t(item.key)}</span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Accordion groups */}
          {GROUPS.map(group => {
            const visibleItems = group.items.filter(i => !i.roles || i.roles.includes(role));
            if (visibleItems.length === 0) return null;

            const isOpen = openGroup === group.id;
            const groupIsActive = visibleItems.some(
              i => location.pathname === i.to || location.pathname.startsWith(i.to + '/')
            );

            // Sum badges for collapsed header indicator
            const groupBadgeTotal = visibleItems.reduce((sum, item) => {
              const bk = BADGE_KEYS[item.to];
              return sum + (bk ? (badges[bk] || 0) : 0);
            }, 0);

            return (
              <div key={group.id} className="mx-2 mt-1">
                {/* Group header button */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                    isOpen
                      ? 'text-white/80 bg-white/[0.06]'
                      : groupIsActive
                      ? 'bg-sidebar-active/50 text-white/90'
                      : 'text-white/40 hover:bg-sidebar-hover hover:text-white/80'
                  }`}
                >
                  <span className={`shrink-0 transition-opacity ${isOpen || groupIsActive ? 'opacity-80' : 'opacity-50'}`}>
                    {Icons[group.icon]}
                  </span>
                  <span className="flex-1 text-left truncate">{t(group.labelKey)}</span>
                  {/* Show total badge on header only when collapsed */}
                  {!isOpen && groupBadgeTotal > 0 && (
                    <span className="bg-white text-primary text-[10px] font-extrabold rounded-full min-w-[1.1rem] h-[1.1rem] flex items-center justify-center px-1 leading-none">
                      {groupBadgeTotal}
                    </span>
                  )}
                  <span className={`shrink-0 opacity-35 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    {Icons.chevronDown}
                  </span>
                </button>

                {/* Collapsible items */}
                <div
                  className={`overflow-hidden transition-all duration-200 ease-in-out ${
                    isOpen ? 'max-h-[280px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="ml-4 border-l border-white/[0.07] pl-1.5 py-1 space-y-0.5">
                    {visibleItems.map(item => {
                      const badgeKey = BADGE_KEYS[item.to];
                      const badgeCount = badgeKey ? (badges[badgeKey] || 0) : 0;
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={onClose}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                              isActive
                                ? 'bg-sidebar-active text-white shadow-sm'
                                : 'text-white/45 hover:bg-sidebar-hover hover:text-white/85'
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <span className={`shrink-0 transition-opacity ${isActive ? 'opacity-100' : 'opacity-55'}`}>
                                {Icons[item.icon]}
                              </span>
                              <span className="flex-1 truncate">{t(item.key)}</span>
                              {badgeCount > 0 && (
                                <span className="bg-white text-primary text-[10px] font-extrabold rounded-full min-w-[1.1rem] h-[1.1rem] flex items-center justify-center px-1 leading-none">
                                  {badgeCount}
                                </span>
                              )}
                            </>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/[0.06] shrink-0">
          <p className="text-white/20 text-[9px] uppercase tracking-[0.18em] text-center">
            Pakistan Post · v1.0
          </p>
        </div>
      </nav>
    </>
  );
}
