import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { attendanceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Calendar, RefreshCw, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

const STATUS_STYLES = {
  PRESENT: 'bg-green-100 text-green-700',
  ABSENT:  'bg-red-100 text-red-700',
  LATE:    'bg-yellow-100 text-yellow-700',
};

const AttendancePage = () => {
  const { role } = useAuth();
  const [records,  setRecords]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');

  // Mark attendance form (teacher only)
  const [showForm,   setShowForm]   = useState(false);
  const [formData,   setFormData]   = useState({ student_id: '', teacher_id: '', date: new Date().toISOString().split('T')[0], status: 'PRESENT', remarks: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formMsg,    setFormMsg]    = useState(null);

  const fetchAttendance = async () => {
    setLoading(true); setError(null);
    try {
      const params = { limit: 300 };
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo)   params.date_to   = dateTo;
      const res = await attendanceAPI.getAttendance(params);
      setRecords(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load attendance');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAttendance(); }, []);

  const handleMark = async (e) => {
    e.preventDefault();
    setSubmitting(true); setFormMsg(null);
    try {
      await attendanceAPI.markAttendance({
        student_id: parseInt(formData.student_id),
        teacher_id: parseInt(formData.teacher_id),
        date: formData.date,
        status: formData.status,
        remarks: formData.remarks,
      });
      setFormMsg({ type: 'success', text: 'Attendance marked successfully!' });
      setFormData(f => ({ ...f, student_id: '', remarks: '' }));
      fetchAttendance();
    } catch (e) {
      setFormMsg({ type: 'error', text: e.response?.data?.detail || 'Failed to mark attendance' });
    } finally { setSubmitting(false); }
  };

  // Stats
  const present = records.filter(r => r.status === 'PRESENT').length;
  const absent  = records.filter(r => r.status === 'ABSENT').length;
  const late    = records.filter(r => r.status === 'LATE').length;
  const rate    = records.length > 0 ? Math.round((present / records.length) * 100) : 0;

  return (
    <Layout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Attendance</h1>
            <p className="text-sm text-gray-500">{records.length} records loaded</p>
          </div>
          <div className="flex gap-2">
            {(role === 'TEACHER' || role === 'MANAGEMENT') && (
              <button
                onClick={() => setShowForm(v => !v)}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                {showForm ? 'Hide Form' : '+ Mark Attendance'}
              </button>
            )}
            <button onClick={fetchAttendance} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <RefreshCw className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Mark Attendance Form */}
        {showForm && (role === 'TEACHER' || role === 'MANAGEMENT') && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Mark Attendance</h3>
            {formMsg && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${formMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {formMsg.text}
              </div>
            )}
            <form onSubmit={handleMark} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Student ID</label>
                <input type="number" required value={formData.student_id}
                  onChange={e => setFormData(f => ({ ...f, student_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. 1" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Teacher ID</label>
                <input type="number" required value={formData.teacher_id}
                  onChange={e => setFormData(f => ({ ...f, teacher_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. 1" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                <input type="date" required value={formData.date}
                  onChange={e => setFormData(f => ({ ...f, date: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select value={formData.status}
                  onChange={e => setFormData(f => ({ ...f, status: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="LATE">Late</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Remarks (optional)</label>
                <input type="text" value={formData.remarks}
                  onChange={e => setFormData(f => ({ ...f, remarks: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Optional note" />
              </div>
              <div className="flex items-end">
                <button type="submit" disabled={submitting}
                  className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {submitting ? 'Saving...' : 'Mark Attendance'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Present',  value: present, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
            { label: 'Absent',   value: absent,  icon: XCircle,     color: 'text-red-600 bg-red-50' },
            { label: 'Late',     value: late,    icon: Clock,       color: 'text-yellow-600 bg-yellow-50' },
            { label: 'Rate',     value: `${rate}%`, icon: Calendar, color: 'text-blue-600 bg-blue-50' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${color}`}><Icon className="h-5 w-5" /></div>
              <div>
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 font-medium">From:</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 font-medium">To:</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={fetchAttendance}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
            Filter
          </button>
          <button onClick={() => { setDateFrom(''); setDateTo(''); setTimeout(fetchAttendance, 0); }}
            className="px-4 py-1.5 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">
            Clear
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No attendance records found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['#', 'Student ID', 'Date', 'Status', 'Remarks'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {records.map((r, i) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">Student #{r.student_id}</td>
                      <td className="px-4 py-3 text-gray-600">{r.date}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[r.status] || 'bg-gray-100 text-gray-600'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{r.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AttendancePage;
