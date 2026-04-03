const OFFICE_TYPES = ['Delivery', 'Non-Delivery'];
const OFFICE_SHIFTS = ['Day', 'Night'];

const DESIGNATIONS = ['Postmaster', 'Postman', 'Mail Peon', 'Mail Runner'];

const LEAVE_STATUSES = ['Active', 'Completed', 'Cancelled'];

const INSPECTION_HALVES = ['First', 'Second'];
const INSPECTING_OFFICERS = ['ASPO', 'DSPS', 'Overseer'];
const INSPECTION_STATUSES = ['Pending', 'Completed', 'Carried Forward'];
const INSPECTION_DAY_TYPES = ['Full Day', 'Half Day', 'Ordinary'];

const ARTICLE_TYPES = [
  'Registered Letter',
  'Speed Post',
  'Money Order',
  'Urgent Money Order',
  'Parcel',
  'Insured Parcel',
  'Value Payable Letter',
  'Value Payable Parcel',
  'Cash on Delivery',
  'Ordinary',
];

const COMPLAINT_SOURCES = ['WhatsApp', 'Post Letter', 'In Person'];

const COMPLAINT_STATUSES = [
  'Active',
  'Proof Shared',
  'Memo Generated',
  'Memo Sent to DSPS',
  'Reply Received',
  'Closed',
];

const INQUIRY_STATUSES = ['Pending', 'In Progress', 'Report Submitted', 'Closed'];

const USER_ROLES = ['admin', 'postmaster', 'viewer'];

const REVENUE_UNITS = ['amount', 'count'];

// Revenue categories sent to frontend to pre-populate the form structure
const REVENUE_CATEGORIES = [
  // Booking side — count + amount
  { category: 'Money Orders Issued', sub_categories: ['count', 'amount'] },
  { category: 'Money Orders Paid', sub_categories: ['count', 'amount'] },
  { category: 'Urgent Money Orders Issued', sub_categories: ['count', 'amount'] },
  { category: 'Urgent Money Orders Paid', sub_categories: ['count', 'amount'] },
  // Booking side — count only
  { category: 'Registered Articles Booked', sub_categories: ['count'] },
  { category: 'UMS Booked', sub_categories: ['count'] },
  { category: 'Utility Bills Collected - SEPCO', sub_categories: ['count'] },
  { category: 'Utility Bills Collected - SSGC', sub_categories: ['count'] },
  { category: 'Utility Bills Collected - PTCL', sub_categories: ['count'] },
  // Delivery side — Received, Delivered, In Deposit
  { category: 'Ordinary Articles', sub_categories: ['Received', 'Delivered', 'In Deposit'] },
  { category: 'Registered Letters', sub_categories: ['Received', 'Delivered', 'In Deposit'] },
  { category: 'UMS', sub_categories: ['Received', 'Delivered', 'In Deposit'] },
  { category: 'Parcels', sub_categories: ['Received', 'Delivered', 'In Deposit'] },
  { category: 'Insured Parcels', sub_categories: ['Received', 'Delivered', 'In Deposit'] },
  { category: 'Value Payable Letters (VPL)', sub_categories: ['Received', 'Delivered', 'In Deposit'] },
  { category: 'Value Payable Parcels (VPP)', sub_categories: ['Received', 'Delivered', 'In Deposit'] },
  { category: 'Cash on Delivery (COD)', sub_categories: ['Received', 'Delivered', 'In Deposit'] },
];

module.exports = {
  OFFICE_TYPES,
  OFFICE_SHIFTS,
  DESIGNATIONS,
  LEAVE_STATUSES,
  INSPECTION_HALVES,
  INSPECTING_OFFICERS,
  INSPECTION_STATUSES,
  INSPECTION_DAY_TYPES,
  ARTICLE_TYPES,
  COMPLAINT_SOURCES,
  COMPLAINT_STATUSES,
  INQUIRY_STATUSES,
  USER_ROLES,
  REVENUE_UNITS,
  REVENUE_CATEGORIES,
};
