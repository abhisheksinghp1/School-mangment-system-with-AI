import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { attendanceAPI, homeworkAPI, marksAPI, notificationsAPI } from '../services/api';
import { Calendar, BookOpen, Bell, AlertCircle, RefreshCw, Award } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, sub, color = 'blue' }) => {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className={`inline-flex p-2.5 rounded-lg ${colors[color]} mb-3`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
};

const StudentDashboard = () => {
  const [attendance,     setAttendance]     = useState([]);
  const [homework,       setHomework]       = useState([]);
  const [marks,          setMarks]          = useState([]);
  const [notifications,  setNotifications]  = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [attRes, hwRes, mrkRes, notifRes] = await Promise.allSettled([
        attendanceAPI.getAttendance({ limit: 200 }),
        homeworkAPI.getHomework({ limit: 50 }),
        marksAPI.getMarks({ limit: 200 }),
        notificationsAPI.getNotifications({ limit: 10 }),
      ]);
      if (attRes.status   === 'fulfilled') setAttendance(attRes.value.data);
      if (hwRes.status    === 'fulfilled') setHomework(hwRes.value.data);
      if (mrkRes.status   === 'fulfilled') setMarks(mrkRes.value.data);
      if (notifRes.status === 'fulfilled') setNotifications(notifRes.value.data);
    } catch {
      setError('Failed to load your data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Computed stats
  const present  = attendance.filter(a => a.status === 'PRESENT').length;
  const absent   = attendance.filter(a => a.status === 'ABSENT').length;
  const attRate  = attendance.length > 0 ? Math.round((present / attendance.length) * 100) : 0;

  const today    = new Date().toISOString().split('T')[0];
  const pending  = homework.filter(h => h.due_date >= today);
  const overdue  = homework.filter(h => h.due_date < today);

  const avgMark  = marks.length > 0
    ? Math.round(marks.reduce((s, m) => s + (m.marks_obtained / m.max_marks) * 100, 0) / marks.length)
    : 0;

  const unread   = notifications.filter(n => !n.is_read).length;

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-red-500" />
        <span className="text-red-700 text-sm">{error}</span>
        <button onClick={fetchData} className="ml-auto flex items-center gap-1 text-sm text-red-600">
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Student Dashboard</h1>
              <p className="text-blue-200 text-sm mt-1">Track your academic progress</p>
            </div>
            <button onClick={fetchData} className="p-2 bg-white/20 rounded-lg hover:bg-white/30">
              <RefreshCw className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Calendar}  label="Attendance"   value={`${attRate}%`}  sub={`${present} present, ${absent} absent`}  color="blue" />
          <StatCard icon={BookOpen}  label="Homework"     value={pending.length} sub={`${overdue.length} overdue`}              color="green" />
          <StatCard icon={Award}     label="Avg Marks"    value={`${avgMark}%`}  sub={`${marks.length} assessments`}            color="purple" />
          <StatCard icon={Bell}      label="Notifications" value={unread}        sub={`${notifications.length} total`}          color="orange" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Homework */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-green-600" /> Pending Homework
            </h3>
            {pending.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">🎉 No pending homework!</p>
            ) : (
              <div className="space-y-2">
                {pending.slice(0, 5).map(hw => (
                  <div key={hw.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{hw.title}</p>
                      <p className="text-xs text-gray-500">Due: {hw.due_date}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      hw.due_date === today ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {hw.due_date === today ? 'Due Today' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Marks */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-600" /> Recent Marks
            </h3>
            {marks.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No marks recorded yet</p>
            ) : (
              <div className="space-y-2">
                {marks.slice(0, 5).map(m => {
                  const pct = Math.round((m.marks_obtained / m.max_marks) * 100);
                  return (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Subject #{m.subject_id}</p>
                        <p className="text-xs text-gray-500">{m.marks_obtained} / {m.max_marks}</p>
                      </div>
                      <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${
                        pct >= 80 ? 'bg-green-100 text-green-700' :
                        pct >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {m.grade || `${pct}%`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Bell className="h-4 w-4 text-orange-600" /> Recent Notifications
            </h3>
            <div className="space-y-2">
              {notifications.slice(0, 4).map(n => (
                <div key={n.id} className={`flex items-start gap-3 p-3 rounded-lg ${n.is_read ? 'bg-gray-50' : 'bg-blue-50 border border-blue-100'}`}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.is_read ? 'bg-gray-300' : 'bg-blue-500'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 text-white flex items-center justify-between">
          <div>
            <h3 className="font-semibold">AI Study Assistant</h3>
            <p className="text-blue-200 text-sm mt-0.5">Ask about homework, weak subjects, exam schedule</p>
          </div>
          <a href="/ai-chat" className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors">
            Chat Now
          </a>
        </div>
      </div>
    </Layout>
  );
};

export default StudentDashboard;
