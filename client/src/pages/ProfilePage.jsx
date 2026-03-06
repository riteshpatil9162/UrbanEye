import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { updateProfile, changePassword, getMe } from '../services/authService';
import { User, Mail, Phone, MapPin, Lock, Save, Eye, EyeOff } from 'lucide-react';
import { AREAS } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user } = useAuth();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    area: user?.area || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile(profileForm);
      // Refresh stored user from server
      const meRes = await getMe();
      const updatedUser = meRes.data?.user || meRes.data;
      localStorage.setItem('urbaneye_user', JSON.stringify(updatedUser));
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setSavingPassword(false);
    }
  };

  const toggleShow = (field) =>
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Profile Settings</h1>

      {/* Avatar card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 mb-6 flex items-center gap-4"
      >
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
          <span className="text-2xl font-bold text-primary-600">
            {user?.name?.charAt(0)?.toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-800">{user?.name}</p>
          <p className="text-sm text-slate-500">{user?.email}</p>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
            user?.role === 'officer' ? 'bg-blue-100 text-blue-700'
            : user?.role === 'worker' ? 'bg-purple-100 text-purple-700'
            : 'bg-green-100 text-green-700'
          }`}>
            {user?.role}
          </span>
        </div>
        {user?.role === 'citizen' && (
          <div className="ml-auto text-right">
            <p className="text-xs text-slate-400">Reward Points</p>
            <p className="text-2xl font-bold text-primary-600">{user?.points ?? 0}</p>
          </div>
        )}
      </motion.div>

      {/* Profile form */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card p-6 mb-6"
      >
        <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-primary-500" />
          Personal Information
        </h2>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={profileForm.name}
                onChange={e => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                className="input-field pl-9"
                placeholder="Your full name"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={user?.email || ''}
                disabled
                className="input-field pl-9 bg-slate-50 text-slate-400 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={profileForm.phone}
                onChange={e => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                className="input-field pl-9"
                placeholder="Phone number"
                type="tel"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Area</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={profileForm.area}
                onChange={e => setProfileForm(prev => ({ ...prev, area: e.target.value }))}
                className="input-field pl-9"
              >
                <option value="">Select area</option>
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="btn-primary flex items-center gap-2 w-full justify-center"
          >
            {savingProfile
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
              : <><Save className="w-4 h-4" /> Save Profile</>}
          </button>
        </form>
      </motion.div>

      {/* Password form */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6"
      >
        <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary-500" />
          Change Password
        </h2>
        <form onSubmit={handlePasswordSave} className="space-y-4">
          {[
            { key: 'current', label: 'Current Password', field: 'currentPassword' },
            { key: 'new', label: 'New Password', field: 'newPassword' },
            { key: 'confirm', label: 'Confirm New Password', field: 'confirmPassword' },
          ].map(({ key, label, field }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPasswords[key] ? 'text' : 'password'}
                  value={passwordForm[field]}
                  onChange={e => setPasswordForm(prev => ({ ...prev, [field]: e.target.value }))}
                  className="input-field pl-9 pr-10"
                  placeholder={label}
                  required
                  minLength={field !== 'currentPassword' ? 6 : undefined}
                />
                <button
                  type="button"
                  onClick={() => toggleShow(key)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPasswords[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}

          <button
            type="submit"
            disabled={savingPassword}
            className="btn-primary flex items-center gap-2 w-full justify-center"
          >
            {savingPassword
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Changing...</>
              : <><Lock className="w-4 h-4" /> Change Password</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
