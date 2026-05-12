import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { homeworkAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BookOpen, RefreshCw, AlertCircle, Clock, CheckCircle } from 'lucide-react';

const HomeworkPage = () => {
  const { role } = useAuth();
  const [homework,   setHomework]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [showForm,   setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formMsg,    setFormMsg]    = useState(null);
  const [formData,   setFormData]   = useState({
    teacher_id: '', class_id: '', subject_id: '',
    title: '', description: '',
    due_date: '', assigned_date: new Date().toISOString().split('T')[0],
    max_marks: 100,
  });

  const fetchHomework = async () => {
    setLoading(true); setError(null);
    try {
      const res = await homeworkAPI.getHomework({ limit: 100 });
      setHomework(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load homework');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchHomework(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setFormMsg(null);
    try {
      await homeworkAPI.assignHomework({
        ...formData,
        teacher_id: parseInt(formData.teacher_id),
        class_id:   parseInt(formData.class_id),
        subject_id: parseInt(formData.subject_id),
        max_marks:  parseInt(formData.max_marks),
      });
      setFormMsg({ type: 'success', text: 'Homework assigned successfully!' });
      setFormData(f => ({ ...f, title: '', description: '', due_date: '' }));
      fetchHomework();
    } catch (e) {
      setFormMsg({ type: 'error', text: e.response?.data?.detail || 'Failed to assign homework' });
    } finally { setSubmitting(false); }
  };

  const today   = new Date().toISOString().split('T')[0];
  const pending = homework.filter(h => h.due_date >= today);
  const past    = homework.filter(h => h.due_date < today);

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Homework</h1>
            <p className="text-sm text-gray-500">{pending.length} pending · {past.length} past due</p>
          </div>
          <div className="flex gap-2">
            {(role === 'TEACHER' || role === 'MANAGEMENT') && (
              <button onClick={() => setShowForm(v => !v)}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
                {showForm ? 'Hide Form' : '+ Assign Homework'}
              </button>
            )}
            <button onClick={fetchHomework} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <RefreshCw className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Assign Form */}
        {showForm && (role === 'TEACHER' || role === 'MANAGEMENT') && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Assign New Homework</h3>
            {formMsg && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${formMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {formMsg.text}
              </div>
            )}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Teacher ID', key: 'teacher_id', type: 'number', placeholder: 'e.g. 1' },
                { label: 'Class ID',   key: 'class_id',   type: 'number', placeholder: 'e.g. 1' },
                { label: 'Subject ID', key: 'subject_id', type: 'number', placeholder: 'e.g. 1' },
                { label: 'Max Marks',  key: 'max_marks',  type: 'number', placeholder: '100' },
                { label: 'Due Date',   key: 'due_date',   type: 'date',   placeholder: '' },
                { label: 'Assigned Date', key: 'assigned_date', type: 'date', placeholder: '' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input type={type} required value={formData[key]} placeholder={placeholder}
                    onChange={e => setFormData(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
              ))}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                <input type="text" required value={formData.title}
                  onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Homework title" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea required value={formData.description} rows={3}
                  onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none"
                  placeholder="Describe the homework task..." />
              </div>
              <div className="md:col-span-2">
                <button type="submit" disabled={submitting}
                  className="px-6 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                  {submitting ? 'Assigning...' : 'Assign Homework'}
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
          </div>
        ) : homework.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No homework found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {homework.map(hw => {
              const isPending = hw.due_date >= today;
              return (
                <div key={hw.id} className={`bg-white rounded-xl border shadow-sm p-4 ${isPending ? 'border-yellow-200' : 'border-gray-100'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm">{hw.title}</h3>
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${isPending ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {isPending ? <Clock className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                      {isPending ? 'Pending' : 'Past Due'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{hw.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Due: <span className="font-medium text-gray-600">{hw.due_date}</span></span>
                    <span>Max: <span className="font-medium text-gray-600">{hw.max_marks} marks</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HomeworkPage;
