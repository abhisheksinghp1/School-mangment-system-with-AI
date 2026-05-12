import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { notificationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Bell, RefreshCw, AlertCircle, CheckCheck, Send } from 'lucide-react';

const PRIORITY_STYLES = {
  LOW:    'bg-gray-100 text-gray-600',
  NORMAL: 'bg-blue-100 text-blue-700',
  HIGH:   'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

const NotificationsPage = () => {
  const { role } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [showForm,      setShowForm]      = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [formMsg,       setFormMsg]       = useState(null);
  const [formData,      setFormData]      = useState({
    title: '', message: '', recipient_id: '', recipient_type: 'STUDENT', priority: 'NORMAL',
  });

  const fetchNotifications = async () => {
    setLoading(true); setError(null);
    try {
      const res = await notificationsAPI.getNotifications({ limit: 50 });
      setNotifications(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load notifications');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setSubmitting(true); setFormMsg(null);
    try {
      await notificationsAPI.sendNotification({
        ...formData,
        recipient_id: parseInt(formData.recipient_id),
      });
      setFormMsg({ type: 'success', text: 'Notification sent!' });
      setFormData(f => ({ ...f, title: '', message: '', recipient_id: '' }));
      fetchNotifications();
    } catch (e) {
      setFormMsg({ type: 'error', text: e.response?.data?.detail || 'Failed to send notification' });
    } finally { setSubmitting(false); }
  };

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500">{unread} unread · {notifications.length} total</p>
          </div>
          <div className="flex gap-2">
            {unread > 0 && (
              <button onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                <CheckCheck className="h-4 w-4" /> Mark all read
              </button>
            )}
            {(role === 'TEACHER' || role === 'MANAGEMENT') && (
              <button onClick={() => setShowForm(v => !v)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                <Send className="h-4 w-4" /> {showForm ? 'Hide' : 'Send Notification'}
              </button>
            )}
            <button onClick={fetchNotifications} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <RefreshCw className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Send Form */}
        {showForm && (role === 'TEACHER' || role === 'MANAGEMENT') && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Send Notification</h3>
            {formMsg && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${formMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {formMsg.text}
              </div>
            )}
            <form onSubmit={handleSend} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Recipient ID</label>
                <input type="number" required value={formData.recipient_id}
                  onChange={e => setFormData(f => ({ ...f, recipient_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. 1" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Recipient Type</label>
                <select value={formData.recipient_type}
                  onChange={e => setFormData(f => ({ ...f, recipient_type: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  {['STUDENT', 'TEACHER', 'PARENT', 'MANAGEMENT'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
                <select value={formData.priority}
                  onChange={e => setFormData(f => ({ ...f, priority: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                <input type="text" required value={formData.title}
                  onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Notification title" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Message</label>
                <textarea required value={formData.message} rows={3}
                  onChange={e => setFormData(f => ({ ...f, message: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Notification message..." />
              </div>
              <div className="md:col-span-2">
                <button type="submit" disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {submitting ? 'Sending...' : 'Send Notification'}
                </button>
              </div>
            </form>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div key={n.id}
                className={`bg-white rounded-xl border shadow-sm p-4 transition-colors ${n.is_read ? 'border-gray-100' : 'border-blue-200 bg-blue-50/30'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.is_read ? 'bg-gray-300' : 'bg-blue-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-gray-900 text-sm">{n.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[n.priority] || 'bg-gray-100 text-gray-600'}`}>
                          {n.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                      </p>
                    </div>
                  </div>
                  {!n.is_read && (
                    <button onClick={() => handleMarkRead(n.id)}
                      className="text-xs text-blue-600 hover:text-blue-800 whitespace-nowrap flex-shrink-0">
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NotificationsPage;
