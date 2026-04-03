import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import FormField, { Input } from '../../components/common/FormField';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../utils/api';

export default function SettingsPage() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState({});
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  useEffect(() => {
    api.get('/settings').then((res) => setSettings(res.data.data));
  }, []);

  async function saveSettings(e) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await api.put('/settings', {
        officer_name: settings.officer_name,
        officer_designation: settings.officer_designation,
        office_name: settings.office_name,
      });
      setMsg('Settings saved successfully.');
    } catch {
      setMsg('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) {
      setPwMsg('New passwords do not match.');
      return;
    }
    setPwSaving(true);
    setPwMsg('');
    try {
      await api.post('/auth/change-password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      setPwMsg('Password changed successfully.');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      setPwMsg(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title={t('settings')} />

      {/* Letterhead Settings */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-6 mb-6">
        <h3 className="text-base font-semibold text-primary mb-4">Letterhead / Office Details</h3>
        <form onSubmit={saveSettings}>
          <FormField label="Officer Name">
            <Input value={settings.officer_name || ''} onChange={(e) => setSettings({ ...settings, officer_name: e.target.value })} />
          </FormField>
          <FormField label="Designation">
            <Input value={settings.officer_designation || ''} onChange={(e) => setSettings({ ...settings, officer_designation: e.target.value })} />
          </FormField>
          <FormField label="Office Name">
            <Input value={settings.office_name || ''} onChange={(e) => setSettings({ ...settings, office_name: e.target.value })} />
          </FormField>
          {msg && <p className={`text-sm mb-3 ${msg.includes('success') ? 'text-success' : 'text-danger'}`}>{msg}</p>}
          <button type="submit" disabled={saving}
            className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-light disabled:opacity-60">
            {saving ? t('loading') : t('save')}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-6 mb-6">
        <h3 className="text-base font-semibold text-primary mb-4">{t('changePassword')}</h3>
        <form onSubmit={changePassword}>
          <FormField label={t('currentPassword')}>
            <Input type="password" value={pwForm.current_password}
              onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })} required />
          </FormField>
          <FormField label={t('newPassword')}>
            <Input type="password" value={pwForm.new_password}
              onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
              required minLength={8} />
          </FormField>
          <FormField label="Confirm New Password">
            <Input type="password" value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} required />
          </FormField>
          {pwMsg && <p className={`text-sm mb-3 ${pwMsg.includes('success') ? 'text-success' : 'text-danger'}`}>{pwMsg}</p>}
          <button type="submit" disabled={pwSaving}
            className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-light disabled:opacity-60">
            {pwSaving ? t('loading') : t('changePassword')}
          </button>
        </form>
      </div>

      {/* User Accounts */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-6 mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-primary">User Accounts</h3>
          <p className="text-sm text-gray-500 mt-1">Manage postmaster and viewer login accounts.</p>
        </div>
        <Link to="/settings/users"
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark">
          Manage Users
        </Link>
      </div>

      {/* About */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-dark-border p-6">
        <h3 className="text-base font-semibold text-primary mb-3">About</h3>
        <p className="text-sm text-gray-600">ASPO Larkana Sub Division Management System</p>
        <p className="text-sm text-gray-500 mt-1">{t('version')}: {settings.system_version || '1.0.0'}</p>
        <p className="text-xs text-gray-400 mt-2">Pakistan Post — Larkana Sub-Division</p>
      </div>
    </div>
  );
}
