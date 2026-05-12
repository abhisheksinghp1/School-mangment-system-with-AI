import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { teacherAPI } from '../services/api';
import api from '../services/api';
import { DollarSign, RefreshCw, AlertCircle } from 'lucide-react';

const STATUS_STYLES = {
  PAID:      'bg-green-100 text-green-700',
  PENDING:   'bg-yellow-100 text-yellow-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const SalaryPage = () => {
  const [salaries, setSalaries] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [showForm,   setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formMsg,    setFormMsg]    = useState(null);
  const [formData,   setFormData]   = useState({
    teacher_id: '', amount: '', month: new Date().getMonth() + 1,
    year: new Date().getFullYear(), deductions: 0, bonuses: 0,
    status: 'PENDING', remarks: '',
  });

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const [tchRes, salRes] = await Promise.allSettled([
        teacherAPI.getTeachers(0, 200),
        api.get('/api/salary/?limit=200'),
      ]);
      if (tchRes.status === 'fulfilled') setTeachers(tchRes.value.data);
      if (salRes.status === 'fulfilled') setSalaries(salRes.value.data);
    } catch (e) {
      setError('Failed to load salary data');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setFormMsg(null);
    try {
      await api.post('/api/salary/', {
        teacher_id: parseInt(formData.teacher_id),
        amount:     parseFloat(formData.amount),
        month:      parseInt(formData.month),
        year:       parseInt(formData.year),
        deductions: parseFloat(formData.deductions) || 0,
        bonuses:    parseFloat(formData.bonuses) || 0,
        status:     formData.status,
        remarks:    formData.remarks,
      });
      setFormMsg({ type: 'success', text: 'Salary record created!' });
      fetchData();
    } catch (e) {
      setFormMsg({ type: 'error', text: e.response?.data?.detail || 'Failed to create salary record' });
    } finally { setSubmitting(false); }
  };

  const totalPaid    = salaries.filter(s => s.status === 'PAID').reduce((sum, s) => sum + (s.amount - s.deductions + s.bonuses), 0);
  const totalPending = salaries.filter(s => s.status === 'PENDING').reduce((sum, s) => sum + s.amount, 0);

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Salary Management</h1>
            <p className="text-sm text-gray-500">{salaries.length} records</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(v => !v)}
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors">
              {showForm ? 'Hide Form' : '+ Add Salary Record'}
            </button>
            <button onClick={fetchData} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <RefreshCw className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Paid',    value: `$${totalPaid.toLocaleString()}`,    color: 'text-green-600 bg-green-50' },
            { label: 'Total Pending', value: `$${totalPending.toLocaleString()}`, color: 'text-yellow-600 bg-yellow-50' },
            { label: 'Total Records', value: salaries.length,                     color: 'text-blue-600 bg-blue-50' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${color}`}><DollarSign className="h-5 w-5" /></div>
              <div>
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Add Salary Record</h3>
            {formMsg && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${formMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {formMsg.text}
              </div>
            )}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Teacher</label>
                <select required value={formData.teacher_id}
                  onChange={e => setFormData(f => ({ ...f, teacher_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">Select teacher</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                  ))}
                </select>
              </div>
              {[
                { label: 'Amount ($)',   key: 'amount',     type: 'number', placeholder: 'e.g. 5000' },
                { label: 'Deductions',  key: 'deductions', type: 'number', placeholder: '0' },
                { label: 'Bonuses',     key: 'bonuses',    type: 'number', placeholder: '0' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input type={type} value={formData[key]} placeholder={placeholder}
                    required={key === 'amount'}
                    onChange={e => setFormData(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
                <select value={formData.month}
                  onChange={e => setFormData(f => ({ ...f, month: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                <input type="number" value={formData.year}
                  onChange={e => setFormData(f => ({ ...f, year: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select value={formData.status}
                  onChange={e => setFormData(f => ({ ...f, status: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="md:col-span-3 flex gap-3">
                <button type="submit" disabled={submitting}
                  className="px-6 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {submitting ? 'Saving...' : 'Save Record'}
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : salaries.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No salary records yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['#', 'Teacher', 'Month/Year', 'Amount', 'Deductions', 'Bonuses', 'Net', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {salaries.map((s, i) => {
                    const net = s.amount - (s.deductions || 0) + (s.bonuses || 0);
                    return (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">Teacher #{s.teacher_id}</td>
                        <td className="px-4 py-3 text-gray-600">{MONTHS[s.month - 1]} {s.year}</td>
                        <td className="px-4 py-3 text-gray-800">${s.amount?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-red-600">-${(s.deductions || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-green-600">+${(s.bonuses || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 font-bold text-gray-900">${net.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[s.status] || 'bg-gray-100 text-gray-600'}`}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SalaryPage;
