import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';

const ROLE_COLORS = {
  admin:       'bg-primary/10 text-primary border-primary/30',
  postmaster:  'bg-success/10 text-success border-success/30',
  viewer:      'bg-gray-100 text-gray-500 border-gray-200',
};

function emptyForm() {
  return { username: '', password: '', full_name: '', role: 'postmaster', office_id: '' };
}

export default function UsersPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  function load() {
    setLoading(true);
    Promise.all([
      api.get('/users'),
      api.get('/offices', { params: { limit: 100 } }),
    ]).then(([usersRes, officesRes]) => {
      setUsers(usersRes.data.data);
      setOffices(officesRes.data.data.filter((o) => o.is_active));
    }).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/users', {
        ...form,
        office_id: form.office_id ? parseInt(form.office_id) : null,
      });
      setForm(emptyForm());
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(user) {
    if (!window.confirm(`${user.is_active ? t('deactivate') : t('activate')} ${user.username}?`)) return;
    try {
      await api.put(`/users/${user.id}`, { is_active: !user.is_active });
      load();
    } catch {
      alert(t('failedToUpdate'));
    }
  }

  async function handleResetPassword(id) {
    const pw = window.prompt(t('enterNewPassword'));
    if (!pw) return;
    if (pw.length < 8) { alert(t('passwordTooShort')); return; }
    try {
      await api.put(`/users/${id}`, { password: pw });
      alert(t('passwordUpdated'));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update password.');
    }
  }

  async function handleUpdateOffice(id) {
    try {
      await api.put(`/users/${id}`, { office_id: editForm.office_id ? parseInt(editForm.office_id) : null });
      setEditId(null);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update.');
    }
  }

  if (loading) return <div className="py-16 flex justify-center"><LoadingSpinner /></div>;

  return (
    <div>
      <PageHeader
        title={t('userAccounts')}
        action={t('addUser')}
        onAction={() => { setShowForm((p) => !p); setError(''); }}
      />

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-5 mb-5 border border-primary/20">
          <h3 className="text-sm font-semibold text-primary mb-4">{t('newUserAccount')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="user-full-name" className="block text-xs font-medium text-gray-600 mb-1">{t('fullName')} <span className="text-danger">*</span></label>
              <input id="user-full-name" name="full_name" required value={form.full_name} onChange={set('full_name')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Muhammad Ali" />
            </div>
            <div>
              <label htmlFor="user-username" className="block text-xs font-medium text-gray-600 mb-1">{t('username')} <span className="text-danger">*</span></label>
              <input id="user-username" name="username" required value={form.username} onChange={set('username')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. pm_ratodero" />
            </div>
            <div>
              <label htmlFor="user-password" className="block text-xs font-medium text-gray-600 mb-1">{t('password')} <span className="text-danger">*</span></label>
              <input id="user-password" name="password" required type="password" value={form.password} onChange={set('password')} minLength={8}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Min 8 characters" />
            </div>
            <div>
              <label htmlFor="user-role" className="block text-xs font-medium text-gray-600 mb-1">{t('roleLabel')} <span className="text-danger">*</span></label>
              <select id="user-role" name="role" required value={form.role} onChange={set('role')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="postmaster">{t('postmaster')}</option>
                <option value="viewer">{t('viewer')}</option>
                <option value="admin">{t('admin')}</option>
              </select>
            </div>
            {form.role === 'postmaster' && (
              <div className="md:col-span-2">
                <label htmlFor="user-office" className="block text-xs font-medium text-gray-600 mb-1">{t('assignedOffice')} <span className="text-danger">*</span></label>
                <select id="user-office" name="office_id" required value={form.office_id} onChange={set('office_id')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">{t('selectOffice')}</option>
                  {offices.map((o) => <option key={o.id} value={o.id}>{o.name} ({o.tehsil})</option>)}
                </select>
              </div>
            )}
          </div>
          {error && <p className="text-xs text-danger mt-3">{error}</p>}
          <div className="flex gap-3 mt-4">
            <button type="submit" disabled={saving}
              className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60">
              {saving ? t('creating') : t('createAccount')}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="border border-gray-300 px-5 py-2 rounded-lg text-sm hover:bg-gray-50">
              {t('cancel')}
            </button>
          </div>
        </form>
      )}

      {/* Users table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-surface">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{t('name')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{t('username')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{t('roleLabel')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{t('office')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{t('status')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className={`hover:bg-gray-50 ${!u.is_active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 font-medium text-gray-800">{u.full_name}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{u.username}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-xs font-semibold border rounded-full ${ROLE_COLORS[u.role] || ''}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {editId === u.id ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={editForm.office_id || ''}
                        onChange={(e) => setEditForm({ office_id: e.target.value })}
                        className="border border-gray-300 rounded px-2 py-1 text-xs bg-white"
                      >
                        <option value="">{t('none')}</option>
                        {offices.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                      <button onClick={() => handleUpdateOffice(u.id)} className="text-xs text-success font-medium">{t('save')}</button>
                      <button onClick={() => setEditId(null)} className="text-xs text-gray-400">{t('cancel')}</button>
                    </div>
                  ) : (
                    <span
                      onClick={() => { setEditId(u.id); setEditForm({ office_id: u.office_id || '' }); }}
                      className="cursor-pointer hover:text-primary"
                      title={t('clickToChangeOffice')}
                    >
                      {u.office_name || <span className="text-gray-300">—</span>}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${u.is_active ? 'text-success' : 'text-gray-400'}`}>
                    {u.is_active ? t('active') : t('inactive')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleResetPassword(u.id)}
                      className="text-xs text-primary hover:underline"
                    >
                      {t('resetPw')}
                    </button>
                    <button
                      onClick={() => handleToggleActive(u)}
                      className={`text-xs hover:underline ${u.is_active ? 'text-danger' : 'text-success'}`}
                    >
                      {u.is_active ? t('deactivate') : t('activate')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-3">{users.length} {t('accountsCount')}</p>
    </div>
  );
}
