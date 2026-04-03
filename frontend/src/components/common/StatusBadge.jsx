import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const STATUS_COLORS = {
  Active:             'bg-success/10 text-success border-success/30',
  Pending:            'bg-alert/10 text-alert border-alert/30',
  Completed:          'bg-success/10 text-success border-success/30',
  'Carried Forward':  'bg-blue-100 text-blue-700 border-blue-300',
  Closed:             'bg-gray-100 text-gray-600 border-gray-300',
  Cancelled:          'bg-red-100 text-red-600 border-red-300',
  'Proof Shared':     'bg-blue-100 text-blue-700 border-blue-300',
  'Memo Generated':   'bg-yellow-100 text-yellow-700 border-yellow-300',
  'Memo Sent to DSPS':'bg-orange-100 text-orange-700 border-orange-300',
  'Reply Received':   'bg-purple-100 text-purple-700 border-purple-300',
  'In Progress':      'bg-blue-100 text-blue-700 border-blue-300',
  'Report Submitted': 'bg-green-100 text-green-700 border-green-300',
  Draft:              'bg-gray-100 text-gray-600 border-gray-300',
  Submitted:          'bg-success/10 text-success border-success/30',
  Ordered:            'bg-blue-100 text-blue-700 border-blue-300',
  Relieved:           'bg-orange-100 text-orange-700 border-orange-300',
  Joined:             'bg-purple-100 text-purple-700 border-purple-300',
  'On Duty':          'bg-blue-100 text-blue-700 border-blue-300',
  Holiday:            'bg-gray-100 text-gray-500 border-gray-300',
  Open:               'bg-yellow-100 text-yellow-700 border-yellow-300',
  Ended:              'bg-gray-100 text-gray-500 border-gray-300',
};

const STATUS_KEY_MAP = {
  'Active':             'active',
  'Pending':            'pending',
  'Completed':          'completed',
  'Carried Forward':    'carriedForward',
  'Closed':             'closed',
  'Cancelled':          'cancelled',
  'Proof Shared':       'proofShared',
  'Memo Generated':     'memoGenerated',
  'Memo Sent to DSPS':  'memoSentToDsps',
  'Reply Received':     'replyReceived',
  'In Progress':        'inProgress',
  'Report Submitted':   'reportSubmitted',
  'Draft':              'draft',
  'Submitted':          'submitted',
  'Ordered':            'ordered',
  'Relieved':           'relieved',
  'Joined':             'joined',
  'On Duty':            'onDuty',
  'Holiday':            'holiday',
  'Open':               'open',
  'Ended':              'lookAfterEnded',
};

export default function StatusBadge({ status }) {
  const { t } = useLanguage();
  const cls = STATUS_COLORS[status] || 'bg-gray-100 text-gray-600 border-gray-300';
  const localeKey = STATUS_KEY_MAP[status];
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full border ${cls}`}>
      {localeKey ? t(localeKey) : status}
    </span>
  );
}
