'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/users/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'privacy', label: 'Privacy' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'billing', label: 'Billing' },
    { id: 'preferences', label: 'Preferences' },
    { id: 'sessions', label: 'Sessions' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-0">
                <nav className="space-y-1 p-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && <ProfileTab user={user} onUpdate={fetchUserData} />}
            {activeTab === 'security' && <SecurityTab user={user} />}
            {activeTab === 'privacy' && <PrivacyTab user={user} />}
            {activeTab === 'notifications' && <NotificationsTab user={user} />}
            {activeTab === 'billing' && <BillingTab user={user} />}
            {activeTab === 'preferences' && <PreferencesTab user={user} />}
            {activeTab === 'sessions' && <SessionsTab user={user} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Profile Tab
function ProfileTab({ user, onUpdate }: { user: any; onUpdate: () => void }) {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, avatarUrl }),
      });

      if (response.ok) {
        setMessage('Profile updated successfully');
        onUpdate();
      } else {
        setMessage('Failed to update profile');
      }
    } catch (error) {
      setMessage('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your personal information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <div className={`p-3 rounded ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo</label>
            <div className="flex items-center gap-4">
              {avatarUrl && (
                <img src={avatarUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
              )}
              <input
                type="url"
                placeholder="Image URL"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
            />
            <p className="text-xs text-gray-500 mt-1">Changing email requires verification</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
            />
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Security Tab
function SecurityTab({ user }: { user: any }) {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('Passwords do not match');
      setSaving(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        setMessage('Password changed successfully');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to change password');
      }
    } catch (error) {
      setMessage('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {message && (
              <div className={`p-3 rounded ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 text-sm text-gray-600"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              />
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Multi-Factor Authentication</CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">MFA Status</p>
              <p className="text-sm text-gray-500">
                {mfaEnabled ? 'Enabled' : 'Not enabled'}
              </p>
            </div>
            <Button variant="outline" onClick={() => setMfaEnabled(!mfaEnabled)}>
              {mfaEnabled ? 'Disable' : 'Enable'} MFA
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password Recovery</CardTitle>
          <CardDescription>Set up password recovery options</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/forgot-password">
            <Button variant="outline">Reset Password</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

// Privacy Tab
function PrivacyTab({ user }: { user: any }) {
  const [settings, setSettings] = useState({
    profileVisibility: 'public',
    showEmail: true,
    showPhone: false,
    allowDataExport: true,
  });
  const [saving, setSaving] = useState(false);

  const handleExport = async () => {
    try {
      const response = await fetch('/api/users/export-data');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'my-data.json';
      a.click();
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/users/delete-account', {
        method: 'DELETE',
      });

      if (response.ok) {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
          <CardDescription>Control who can see your information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Profile Visibility</p>
              <p className="text-sm text-gray-500">Who can see your profile</p>
            </div>
            <select
              value={settings.profileVisibility}
              onChange={(e) => setSettings({ ...settings, profileVisibility: e.target.value })}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Show Email</p>
              <p className="text-sm text-gray-500">Display email on profile</p>
            </div>
            <input
              type="checkbox"
              checked={settings.showEmail}
              onChange={(e) => setSettings({ ...settings, showEmail: e.target.checked })}
              className="rounded border-gray-300"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Show Phone</p>
              <p className="text-sm text-gray-500">Display phone on profile</p>
            </div>
            <input
              type="checkbox"
              checked={settings.showPhone}
              onChange={(e) => setSettings({ ...settings, showPhone: e.target.checked })}
              className="rounded border-gray-300"
            />
          </div>

          <Button onClick={() => setSaving(true)} disabled={saving}>
            {saving ? 'Saving...' : 'Save Privacy Settings'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Export</CardTitle>
          <CardDescription>Download all your data</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleExport}>
            Export My Data
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delete Account</CardTitle>
          <CardDescription>Permanently delete your account and all data</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleDelete}>
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Notifications Tab
function NotificationsTab({ user }: { user: any }) {
  const [settings, setSettings] = useState({
    emailMarketing: true,
    emailTransactional: true,
    emailUpdates: true,
    pushNotifications: false,
    inAppNotifications: true,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Choose how you want to be notified</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Email Marketing</p>
            <p className="text-sm text-gray-500">Promotional emails and updates</p>
          </div>
          <input
            type="checkbox"
            checked={settings.emailMarketing}
            onChange={(e) => setSettings({ ...settings, emailMarketing: e.target.checked })}
            className="rounded border-gray-300"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Email Transactional</p>
            <p className="text-sm text-gray-500">Booking confirmations and receipts</p>
          </div>
          <input
            type="checkbox"
            checked={settings.emailTransactional}
            onChange={(e) => setSettings({ ...settings, emailTransactional: e.target.checked })}
            className="rounded border-gray-300"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Email Updates</p>
            <p className="text-sm text-gray-500">Platform updates and news</p>
          </div>
          <input
            type="checkbox"
            checked={settings.emailUpdates}
            onChange={(e) => setSettings({ ...settings, emailUpdates: e.target.checked })}
            className="rounded border-gray-300"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Push Notifications</p>
            <p className="text-sm text-gray-500">Mobile push notifications</p>
          </div>
          <input
            type="checkbox"
            checked={settings.pushNotifications}
            onChange={(e) => setSettings({ ...settings, pushNotifications: e.target.checked })}
            className="rounded border-gray-300"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">In-App Notifications</p>
            <p className="text-sm text-gray-500">Notifications within the app</p>
          </div>
          <input
            type="checkbox"
            checked={settings.inAppNotifications}
            onChange={(e) => setSettings({ ...settings, inAppNotifications: e.target.checked })}
            className="rounded border-gray-300"
          />
        </div>

        <Button>Save Notification Settings</Button>
      </CardContent>
    </Card>
  );
}

// Billing Tab
function BillingTab({ user }: { user: any }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Manage your payment methods</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 mb-4">No payment methods on file</p>
          <Button variant="outline">Add Payment Method</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>View your past invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No billing history</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Preferences Tab
function PreferencesTab({ user }: { user: any }) {
  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'en',
    timezone: 'America/New_York',
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>App Preferences</CardTitle>
        <CardDescription>Customize your experience</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
          <select
            value={preferences.theme}
            onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
          <select
            value={preferences.language}
            onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
          <select
            value={preferences.timezone}
            onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
          >
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
          </select>
        </div>

        <Button>Save Preferences</Button>
      </CardContent>
    </Card>
  );
}

// Sessions Tab
function SessionsTab({ user }: { user: any }) {
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/auth/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchSessions();
      }
    } catch (error) {
      console.error('Error revoking session:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Sessions</CardTitle>
        <CardDescription>Manage your active login sessions</CardDescription>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-gray-500">No active sessions</p>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{session.device || 'Unknown Device'}</p>
                  <p className="text-sm text-gray-500">
                    Last active: {new Date(session.lastActive).toLocaleString()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => revokeSession(session.id)}
                >
                  Revoke
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

