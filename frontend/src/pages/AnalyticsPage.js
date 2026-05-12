import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { studentAPI, teacherAPI, attendanceAPI, marksAPI } from '../services/api';
import { BarChart3, TrendingUp, Users, Calendar, Award, RefreshCw, AlertCircle } from 'lucide-react';

const ProgressBar = ({ label, value, max = 100, color = 'bg-blue-500', showValue = true }) => {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-gray-700">{label}</span>
        {showValue && <span className="font-semibold text-gray-900">{pct}%</span>}
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div className={`${color} h-2.5 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const AnalyticsPage = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const [stuRes, tchRes, attRes, mrkRes] = await Promise.allSettled([
        studentAPI.getStudents(0, 500),
        teacherAPI.getTeachers(0, 200),
        attendanceAPI.getAttendance({ limit: 500 }),
        marksAPI.getMarks({ limit: 500 }),
      ]);

      const students   = stuRes.status === 'fulfilled' ? stuRes.value.data : [];
      const teachers   = tchRes.status === 'fulfilled' ? tchRes.value.data : [];
      const attendance = attRes.status === 'fulfilled' ? attRes.value.data : [];
      const marks      = mrkRes.status === 'fulfilled' ? mrkRes.value.data : [];

      const present      = attendance.filter(a => a.status === 'PRESENT').length;
      const absent       = attendance.filter(a => a.status === 'ABSENT').length;
      const late         = attendance.filter(a => a.status === 'LATE').length;
      const attRate      = attendance.length > 0 ? Math.round((present / attendance.length) * 100) : 0;

      const avgMark      = marks.length > 0
        ? Math.round(marks.reduce((s, m) => s + (m.marks_obtained / m.max_marks) * 100, 0) / marks.length) : 0;

      // Grade distribution
      const gradeDist = marks.reduce((acc, m) => {
        acc[m.grade || 'N/A'] = (acc[m.grade || 'N/A'] || 0) + 1;
        return acc;
      }, {});

      // Attendance by status
      const attDist = { PRESENT: present, ABSENT: absent, LATE: late };

      setData({ students, teachers, attendance, marks, attRate, avgMark, gradeDist, attDist });
    } catch {
      setError('Failed to load analytics data.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <Layout>
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
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

  const gradeOrder = ['A+', 'A', 'B+', 'B', 'C', 'D', 'F'];
  const gradeColors = { 'A+': 'bg-green-500', 'A': 'bg-green-400', 'B+': 'bg-blue-500', 'B': 'bg-blue-400', 'C': 'bg-yellow-500', 'D': 'bg-orange-500', 'F': 'bg-red-500' };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">School Analytics</h1>
            <p className="text-sm text-gray-500">Real-time overview of school performance</p>
          </div>
          <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Users,    label: 'Total Students',  value: data.students.length,  color: 'bg-blue-50 text-blue-600' },
            { icon: Users,    label: 'Total Teachers',  value: data.teachers.length,  color: 'bg-green-50 text-green-600' },
            { icon: Calendar, label: 'Attendance Rate', value: `${data.attRate}%`,    color: 'bg-purple-50 text-purple-600' },
            { icon: Award,    label: 'Avg Performance', value: `${data.avgMark}%`,    color: 'bg-orange-50 text-orange-600' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className={`inline-flex p-2.5 rounded-lg ${color} mb-3`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-600 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance Breakdown */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-5">
              <Calendar className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Attendance Breakdown</h3>
            </div>
            <div className="space-y-4">
              <ProgressBar label="Present" value={data.attDist.PRESENT} max={data.attendance.length} color="bg-green-500" />
              <ProgressBar label="Absent"  value={data.attDist.ABSENT}  max={data.attendance.length} color="bg-red-500" />
              <ProgressBar label="Late"    value={data.attDist.LATE}    max={data.attendance.length} color="bg-yellow-500" />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Present', value: data.attDist.PRESENT, color: 'text-green-600' },
                { label: 'Absent',  value: data.attDist.ABSENT,  color: 'text-red-600' },
                { label: 'Late',    value: data.attDist.LATE,    color: 'text-yellow-600' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Grade Distribution */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-5">
              <Award className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold text-gray-900">Grade Distribution</h3>
            </div>
            {data.marks.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No marks data available</p>
            ) : (
              <div className="space-y-3">
                {gradeOrder.filter(g => data.gradeDist[g]).map(grade => (
                  <div key={grade} className="flex items-center gap-3">
                    <span className="w-8 text-sm font-bold text-gray-700">{grade}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div
                        className={`${gradeColors[grade] || 'bg-gray-400'} h-5 rounded-full flex items-center justify-end pr-2 transition-all duration-700`}
                        style={{ width: `${Math.max(((data.gradeDist[grade] || 0) / data.marks.length) * 100, 8)}%` }}
                      >
                        <span className="text-white text-xs font-bold">{data.gradeDist[grade]}</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">
                      {Math.round(((data.gradeDist[grade] || 0) / data.marks.length) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Summary Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            <h3 className="font-semibold text-gray-900">Summary Statistics</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Students',       value: data.students.length },
              { label: 'Total Teachers',        value: data.teachers.length },
              { label: 'Total Attendance Recs', value: data.attendance.length },
              { label: 'Total Assessments',     value: data.marks.length },
              { label: 'Attendance Rate',        value: `${data.attRate}%` },
              { label: 'Academic Average',       value: `${data.avgMark}%` },
              { label: 'Student:Teacher Ratio',  value: data.teachers.length > 0 ? `${(data.students.length / data.teachers.length).toFixed(1)}:1` : 'N/A' },
              { label: 'Grades Recorded',        value: Object.values(data.gradeDist).reduce((a, b) => a + b, 0) },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-lg font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AnalyticsPage;
