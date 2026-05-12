import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { marksAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Award, RefreshCw, AlertCircle } from 'lucide-react';

const GRADE_COLORS = {
  'A+': 'bg-green-100 text-green-700',
  'A':  'bg-green-100 text-green-700',
  'B+': 'bg-blue-100 text-blue-700',
  'B':  'bg-blue-100 text-blue-700',
  'C':  'bg-yellow-100 text-yellow-700',
  'D':  'bg-orange-100 text-orange-700',
  'F':  'bg-red-100 text-red-700',
};

const MarksPage = () => {
  const { role } = useAuth();
  const [marks,      setMarks]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [showForm,   setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formMsg,    setFormMsg]    = useState(null);
  const [formData,   setFormData]   = useState({
    student_id: '', exam_id: '', subject_id: '',
    marks_obtained: '', max_marks: 100, remarks: '',
  });

  const fetchMarks = async () => {
    setLoading(true); setError(null);
    try {
      const res = await marksAPI.getMarks({ limit: 200 });
      setMarks(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load marks');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchMarks(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setFormMsg(null);
    try {
      await marksAPI.uploadMarks({
        student_id:     parseInt(formData.student_id),
        exam_id:        parseInt(formData.exam_id),
        subject_id:     parseInt(formData.subject_id),
        marks_obtained: parseFloat(formData.marks_obtained),
        max_marks:      parseFloat(formData.max_marks),
        remarks:        formData.remarks,
      });
      setFormMsg({ type: 'success', text: 'Marks uploaded successfully!' });
      setFormData(f => ({ ...f, student_id: '', marks_obtained: '', remarks: '' }));
      fetchMarks();
    } catch (e) {
      setFormMsg({ type: 'error', text: e.response?.data?.detail || 'Failed to upload marks' });
    } finally { setSubmitting(false); }
  };

  const avgPct = marks.length > 0
    ? Math.round(marks.reduce((s, m) => s + (m.marks_obtained / m.max_marks) * 100, 0) / marks.length)
    : 0;

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Marks & Grades</h1>
            <p className="text-sm text-gray-500">{marks.length} records · Avg: {avgPct}%</p>
          </div>
          <div className="flex gap-2">
            {(role === 'TEACHER' || role === 'MANAGEMENT') && (
              <button onClick={() => setShowForm(v => !v)}
                className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors">
                {showForm ? 'Hide Form' : '+ Upload Marks'}
              </button>
            )}
            <button onClick={fetchMarks} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <RefreshCw className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Upload Form */}
        {showForm && (role === 'TEACHER' || role === 'MANAGEMENT') && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Upload Marks</h3>
            {formMsg && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${formMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {formMsg.text}
              </div>
            )}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Student ID',      key: 'student_id',     type: 'number', placeholder: 'e.g. 1' },
                { label: 'Exam ID',         key: 'exam_id',        type: 'number', placeholder: 'e.g. 1' },
                { label: 'Subject ID',      key: 'subject_id',     type: 'number', placeholder: 'e.g. 1' },
                { label: 'Marks Obtained',  key: 'marks_obtained', type: 'number', placeholder: 'e.g. 85' },
                { label: 'Max Marks',       key: 'max_marks',      type: 'number', placeholder: '100' },
                { label: 'Remarks',         key: 'remarks',        type: 'text',   placeholder: 'Optional' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input type={type} value={formData[key]} placeholder={placeholder}
                    required={key !== 'remarks'}
                    onChange={e => setFormData(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>
              ))}
              <div className="md:col-span-3">
                <button type="submit" disabled={submitting}
                  className="px-6 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
                  {submitting ? 'Uploading...' : 'Upload Marks'}
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : marks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <Award className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No marks recorded yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['#', 'Student', 'Subject', 'Exam', 'Marks', 'Max', 'Percentage', 'Grade', 'Remarks'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {marks.map((m, i) => {
                    const pct = Math.round((m.marks_obtained / m.max_marks) * 100);
                    return (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">#{m.student_id}</td>
                        <td className="px-4 py-3 text-gray-600">#{m.subject_id}</td>
                        <td className="px-4 py-3 text-gray-600">#{m.exam_id}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800">{m.marks_obtained}</td>
                        <td className="px-4 py-3 text-gray-500">{m.max_marks}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-100 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs font-medium text-gray-700">{pct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${GRADE_COLORS[m.grade] || 'bg-gray-100 text-gray-600'}`}>
                            {m.grade || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{m.remarks || '—'}</td>
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

export default MarksPage;
