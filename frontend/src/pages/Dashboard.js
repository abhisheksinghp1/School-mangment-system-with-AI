import React from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  TrendingUp,
  Award,
  Bell,
  MessageSquare
} from 'lucide-react';

const Dashboard = () => {
  const { role, user } = useAuth();

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    let greeting = 'Good morning';
    if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    else if (hour >= 17) greeting = 'Good evening';

    return `${greeting}, ${user?.username || 'User'}!`;
  };

  const getRoleSpecificContent = () => {
    switch (role) {
      case 'STUDENT':
        return {
          title: 'Student Dashboard',
          description: 'Access your academic information and interact with AI assistant',
          quickActions: [
            { name: 'View Attendance', icon: Calendar, color: 'bg-blue-500' },
            { name: 'Check Homework', icon: BookOpen, color: 'bg-green-500' },
            { name: 'View Marks', icon: Award, color: 'bg-purple-500' },
            { name: 'AI Assistant', icon: MessageSquare, color: 'bg-orange-500' }
          ],
          stats: [
            { label: 'Attendance Rate', value: '92%', change: '+2%' },
            { label: 'Pending Homework', value: '3', change: '-1' },
            { label: 'Average Marks', value: '85%', change: '+5%' },
            { label: 'Recent Notifications', value: '2', change: 'New' }
          ]
        };
      case 'TEACHER':
        return {
          title: 'Teacher Dashboard',
          description: 'Manage your classes and track student progress',
          quickActions: [
            { name: 'Mark Attendance', icon: Calendar, color: 'bg-blue-500' },
            { name: 'Assign Homework', icon: BookOpen, color: 'bg-green-500' },
            { name: 'Upload Marks', icon: Award, color: 'bg-purple-500' },
            { name: 'Send Notifications', icon: Bell, color: 'bg-red-500' }
          ],
          stats: [
            { label: 'Total Students', value: '45', change: '+2' },
            { label: 'Classes Today', value: '4', change: '0' },
            { label: 'Pending Grading', value: '12', change: '-3' },
            { label: 'Avg Class Performance', value: '78%', change: '+3%' }
          ]
        };
      case 'PARENT':
        return {
          title: 'Parent Dashboard',
          description: 'Monitor your child\'s academic progress and communicate with teachers',
          quickActions: [
            { name: 'View Children', icon: Users, color: 'bg-blue-500' },
            { name: 'Check Attendance', icon: Calendar, color: 'bg-green-500' },
            { name: 'View Reports', icon: Award, color: 'bg-purple-500' },
            { name: 'Messages', icon: MessageSquare, color: 'bg-orange-500' }
          ],
          stats: [
            { label: 'Children', value: '2', change: '0' },
            { label: 'Avg Attendance', value: '95%', change: '+1%' },
            { label: 'Avg Performance', value: '88%', change: '+2%' },
            { label: 'Unread Messages', value: '1', change: 'New' }
          ]
        };
      case 'MANAGEMENT':
        return {
          title: 'Management Dashboard',
          description: 'Oversee school operations and analytics',
          quickActions: [
            { name: 'View Students', icon: Users, color: 'bg-blue-500' },
            { name: 'View Teachers', icon: Users, color: 'bg-green-500' },
            { name: 'Analytics', icon: TrendingUp, color: 'bg-purple-500' },
            { name: 'Reports', icon: Award, color: 'bg-orange-500' }
          ],
          stats: [
            { label: 'Total Students', value: '485', change: '+15' },
            { label: 'Total Teachers', value: '32', change: '+2' },
            { label: 'School Attendance', value: '94%', change: '+1%' },
            { label: 'Avg Performance', value: '82%', change: '+4%' }
          ]
        };
      default:
        return {
          title: 'Dashboard',
          description: 'Welcome to School Management System',
          quickActions: [],
          stats: []
        };
    }
  };

  const content = getRoleSpecificContent();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">{getWelcomeMessage()}</h1>
          <p className="text-blue-100">{content.description}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {content.stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`text-sm font-medium ${
                  stat.change.startsWith('+') ? 'text-green-600' : 
                  stat.change.startsWith('-') ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {stat.change}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {content.quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <div className={`${action.color} p-3 rounded-lg text-white mb-3`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{action.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="text-sm text-gray-600">New homework assigned in Mathematics</p>
                <span className="text-xs text-gray-400">2 hours ago</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-sm text-gray-600">Attendance marked for Grade 10-A</p>
                <span className="text-xs text-gray-400">4 hours ago</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <p className="text-sm text-gray-600">Marks uploaded for Science exam</p>
                <span className="text-xs text-gray-400">1 day ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
