import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { attendanceAPI, homeworkAPI, marksAPI, studentAPI } from '../services/api';
import { Users, Calendar, BookOpen, Award, AlertCircle, RefreshCw, CheckCircle, Clock } from 'lucide-react';

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

const TeacherDashboard = () => {
  const [students,   setStudents]   = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [homework,   setHomework]   = useState([]);
  const [marks,      setMarks]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stuRes, attRes, hwRes, mrkRes] = await Promise.allSettled([
        studentAPI.getStudents(0, 200),
        attendanceAPI.getAttendance({ limit: 200 }),
        homeworkAPI.getHomework({ limit: 50 }),
        marksAPI.getMarks({ limit: 200 }),
      ]);
      if (stuRes.status === 'fulfilled') setStudents(stuRes.value.data);
      if (attRes.status === 'fulfilled') setAttendance(attRes.value.data);
      if (hwRes.status  === 'fulfilled') setHomework(hwRes.value.data);
      if (mrkRes.status === 'fulfilled') setMarks(mrkRes.value.data);
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const today        = new Date().toISOString().split('T')[0];
  const todayAtt     = attendance.filter(a => a.date === today);
  const presentToday = todayAtt.filter(a => a.status === 'PRESENT').length;
  const pendingHW    = homework.filter(h => h.due_date >= today);
  const avgMark      = marks.length > 0
    ? Math.round(marks.reduce((s, m) => s + (m.marks_obtained / m.max_marks) * 100, 0) / marks.length)
    : 0;

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
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
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
              <p className="text-green-200 text-sm mt-1">Manage classes and track student progress</p>
            </div>
            <button onClick={fetchData} className="p-2 bg-white/20 rounded-lg hover:bg-white/30">
              <RefreshCw className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users}    label="Total Students"   value={students.length}   sub="in your classes"                    color="blue" />
          <StatCard icon={Calendar} label="Today Attendance" value={presentToday}       sub={`of ${todayAtt.length} marked`}     color="green" />
          <StatCard icon={BookOpen} label="Active Homework"  value={pendingHW.length}  sub={`${homework.length} total assigned`} color="purple" />
          <StatCard icon={Award}    label="Class Average"    value={`${avgMark}%`}      sub={`${marks.length} assessments`}      color="orange" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Mark Attendance', href: '/attendance', icon: Calendar, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
                { label: 'Assign Homework', href: '/homework',   icon: BookOpen, color: 'bg-green-50 text-green-700 hover:bg-green-100' },
                { label: 'Upload Marks',    href: '/marks',      icon: Award,    color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
                { label: 'View Students',   href: '/students',   icon: Users,    color: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
              ].map(({ label, href, icon: Icon, color }) => (
                <a key={href} href={href} className={`flex flex-col items-center p-4 rounded-xl transition-colors ${color}`}>
                  <Icon className="h-6 w-6 mb-2" />
                  <span className="text-xs font-medium text-center">{label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Today's Attendance Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-600" /> Today's Attendance
            </h3>
            {todayAtt.length === 0 ? (
              <div className="text-center py-6">
                <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No attendance marked today</p>
                <a href="/attendance" className="mt-3 inline-block text-sm text-blue-600 hover:underline">Mark Attendance →</a>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: 'Present', count: todayAtt.filter(a => a.status === 'PRESENT').length, color: 'text-green-600 bg-green-50' },
                  { label: 'Absent',  count: todayAtt.filter(a => a.status === 'ABSENT').length,  color: 'text-red-600 bg-red-50' },
                  { label: 'Late',    count: todayAtt.filter(a => a.status === 'LATE').length,    color: 'text-yellow-600 bg-yellow-50' },
                ].map(({ label, count, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{label}</span>
                    <span className={`text-sm font-bold px-3 py-0.5 rounded-full ${color}`}>{count}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Attendance Rate</span>
                    <span className="text-sm font-bold text-gray-900">
                      {todayAtt.length > 0 ? Math.round((presentToday / todayAtt.length) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Homework */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-purple-600" /> Recent Homework Assignments
          </h3>
          {homework.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No homework assigned yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {homework.slice(0, 4).map(hw => (
                <div key={hw.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{hw.title}</p>
                    <p className="text-xs text-gray-500">Due: {hw.due_date} • Max: {hw.max_marks} marks</p>
                  </div>
                  {hw.due_date >= today
                    ? <Clock className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    : <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  }
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI CTA */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-5 text-white flex items-center justify-between">
          <div>
            <h3 className="font-semibold">AI Teaching Assistant</h3>
            <p className="text-green-200 text-sm mt-0.5">Generate reports, find weak students, assign homework via AI</p>
          </div>
          <a href="/ai-chat" className="px-4 py-2 bg-white text-green-600 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors">
            Open AI Chat
          </a>
        </div>
      </div>
    </Layout>
  );
};

export default TeacherDashboard;
