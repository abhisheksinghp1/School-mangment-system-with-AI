import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { studentAPI, teacherAPI, attendanceAPI, marksAPI } from '../services/api';
import { Users, TrendingUp, Award, Calendar, AlertCircle, BarChart3, RefreshCw } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, sub, color = 'blue', trend }) => {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {trend >= 0 ? '+' : ''}{trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
};

const ProgressBar = ({ label, value, color = 'bg-blue-500' }) => (
  <div>
    <div className="flex justify-between text-sm mb-1">
      <span className="text-gray-700 font-medium">{label}</span>
      <span className="text-gray-600 font-semibold">{value}%</span>
    </div>
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  </div>
);

const ManagementDashboard = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentsRes, teachersRes, attendanceRes, marksRes] = await Promise.allSettled([
        studentAPI.getStudents(0, 500),
        teacherAPI.getTeachers(0, 200),
        attendanceAPI.getAttendance({ limit: 500 }),
        marksAPI.getMarks({ limit: 500 }),
      ]);

      const students   = studentsRes.status   === 'fulfilled' ? studentsRes.value.data   : [];
      const teachers   = teachersRes.status   === 'fulfilled' ? teachersRes.value.data   : [];
      const attendance = attendanceRes.status === 'fulfilled' ? attendanceRes.value.data : [];
      const marks      = marksRes.status      === 'fulfilled' ? marksRes.value.data      : [];

      // Attendance rate
      const presentCount = attendance.filter(a => a.status === 'PRESENT').length;
      const attendanceRate = attendance.length > 0
        ? Math.round((presentCount / attendance.length) * 100) : 0;

      // Average performance
      const avgPerf = marks.length > 0
        ? Math.round(marks.reduce((s, m) => s + (m.marks_obtained / m.max_marks) * 100, 0) / marks.length)
        : 0;

      // Avg salary
      const salaries = teachers.filter(t => t.salary).map(t => t.salary);
      const avgSalary = salaries.length > 0
        ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length) : 0;

      setData({ students, teachers, attendanceRate, avgPerf, avgSalary, marks });
    } catch (e) {
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
        <span className="text-red-700 text-sm">{error}</span>
        <button onClick={fetchData} className="ml-auto flex items-center gap-1 text-sm text-red-600 hover:text-red-800">
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Management Dashboard</h1>
              <p className="text-indigo-200 text-sm mt-1">School overview & analytics</p>
            </div>
            <button onClick={fetchData} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
              <RefreshCw className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users}    label="Total Students"  value={data.students.length}  color="blue"   trend={data.students.length} />
          <StatCard icon={Users}    label="Total Teachers"  value={data.teachers.length}  color="green"  trend={data.teachers.length} />
          <StatCard icon={Calendar} label="Attendance Rate" value={`${data.attendanceRate}%`} color="purple" />
          <StatCard icon={Award}    label="Avg Performance" value={`${data.avgPerf}%`}    color="orange" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              <h3 className="font-semibold text-gray-900">School Performance</h3>
            </div>
            <div className="space-y-4">
              <ProgressBar label="Attendance Rate"    value={data.attendanceRate} color="bg-blue-500" />
              <ProgressBar label="Academic Average"   value={data.avgPerf}        color="bg-green-500" />
              <ProgressBar label="Teacher Assignment" value={data.teachers.length > 0 ? 100 : 0} color="bg-purple-500" />
            </div>
          </div>

          {/* Quick stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              <h3 className="font-semibold text-gray-900">Key Metrics</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Total Students',        value: data.students.length },
                { label: 'Total Teachers',         value: data.teachers.length },
                { label: 'Student:Teacher Ratio',  value: data.teachers.length > 0 ? `${(data.students.length / data.teachers.length).toFixed(1)}:1` : 'N/A' },
                { label: 'Avg Teacher Salary',     value: data.avgSalary > 0 ? `$${data.avgSalary.toLocaleString()}` : 'Not set' },
                { label: 'Total Assessments',      value: data.marks.length },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-600">{label}</span>
                  <span className="text-sm font-semibold text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent students & teachers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Students</h3>
            {data.students.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No students enrolled yet</p>
            ) : (
              <div className="space-y-2">
                {data.students.slice(0, 5).map(s => (
                  <div key={s.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                        {s.first_name?.[0]}{s.last_name?.[0]}
                      </div>
                      <span className="text-sm font-medium text-gray-800">{s.first_name} {s.last_name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{s.admission_number}</span>
                  </div>
                ))}
                {data.students.length > 5 && (
                  <p className="text-xs text-center text-gray-400 pt-1">+{data.students.length - 5} more students</p>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Teaching Staff</h3>
            {data.teachers.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No teachers added yet</p>
            ) : (
              <div className="space-y-2">
                {data.teachers.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-600">
                        {t.first_name?.[0]}{t.last_name?.[0]}
                      </div>
                      <span className="text-sm font-medium text-gray-800">{t.first_name} {t.last_name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{t.employee_id}</span>
                  </div>
                ))}
                {data.teachers.length > 5 && (
                  <p className="text-xs text-center text-gray-400 pt-1">+{data.teachers.length - 5} more teachers</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* AI Assistant CTA */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-5 text-white flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">AI Management Assistant</h3>
            <p className="text-indigo-200 text-sm mt-0.5">Generate reports, predict trends, identify at-risk students</p>
          </div>
          <a href="/ai-chat" className="px-5 py-2.5 bg-white text-indigo-600 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors whitespace-nowrap">
            Open AI Chat
          </a>
        </div>
      </div>
    </Layout>
  );
};

export default ManagementDashboard;
