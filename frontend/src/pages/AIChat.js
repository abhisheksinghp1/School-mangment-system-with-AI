import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { aiAPI } from '../services/api';
import { 
  Send, 
  Bot, 
  User, 
  Loader2,
  Copy,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const messagesEndRef = useRef(null);
  const { role } = useAuth();

  useEffect(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatHistory = async () => {
    try {
      const response = await aiAPI.getChatHistory(0, 20);
      setChatHistory(response.data);
      
      // Convert history to message format
      const historyMessages = response.data.map(log => ({
        id: log.id,
        text: log.query,
        sender: 'user',
        timestamp: new Date(log.created_at)
      })).concat(response.data.map(log => ({
        id: `response-${log.id}`,
        text: log.response,
        sender: 'ai',
        timestamp: new Date(log.created_at),
        executionTime: log.execution_time_ms
      }))).sort((a, b) => a.timestamp - b.timestamp);
      
      setMessages(historyMessages);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    const userMessage = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await aiAPI.chat(input);
      
      const aiMessage = {
        id: Date.now() + 1,
        text: response.data.response,
        sender: 'ai',
        timestamp: new Date(),
        executionTime: response.data.execution_time_ms
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Refresh chat history
      // fetchChatHistory();
      
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const getRoleSpecificGreeting = () => {
    switch (role) {
      case 'STUDENT':
        return "Hello! I'm your AI assistant. I can help you with homework, explain concepts, track your performance, and answer questions about your studies.";
      case 'TEACHER':
        return "Hello! I'm your AI teaching assistant. I can help you with lesson planning, student assessment, administrative tasks, and educational insights.";
      case 'PARENT':
        return "Hello! I'm your AI parent assistant. I can help you understand your child's performance, provide educational guidance, and answer questions about their academic journey.";
      case 'MANAGEMENT':
        return "Hello! I'm your AI management assistant. I can help you with school analytics, performance monitoring, report generation, and strategic insights.";
      default:
        return "Hello! I'm your AI assistant. How can I help you today?";
    }
  };

  const getRoleSpecificPrompts = () => {
    switch (role) {
      case 'STUDENT':
        return [
          "What's my attendance rate?",
          "Show me my recent homework",
          "How am I performing in Math?",
          "What are my weak subjects?"
        ];
      case 'TEACHER':
        return [
          "Mark attendance for my class",
          "Assign homework for Grade 10",
          "Show me student performance",
          "Generate class report"
        ];
      case 'PARENT':
        return [
          "How is my child performing?",
          "Show me my child's attendance",
          "What homework is pending?",
          "Generate performance report"
        ];
      case 'MANAGEMENT':
        return [
          "Show me school overview",
          "Generate performance analytics",
          "Identify at-risk students",
          "Create comprehensive report"
        ];
      default:
        return [
          "How can you help me?",
          "What features are available?",
          "Show me dashboard"
        ];
    }
  };

  return (
    <Layout>
      <div className="h-full flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Bot className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
              <p className="text-sm text-gray-600 capitalize">{role?.toLowerCase()} support</p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {/* Welcome Message */}
            {messages.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Bot className="h-8 w-8 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
                </div>
                <p className="text-gray-700 mb-6">{getRoleSpecificGreeting()}</p>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900 mb-3">Try asking:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {getRoleSpecificPrompts().map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => setInput(prompt)}
                        className="text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.sender === 'ai' && (
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bot className="h-5 w-5 text-blue-600" />
                    </div>
                  )}
                  
                  <div className={`max-w-2xl ${
                    message.sender === 'user' ? 'order-1' : 'order-2'
                  }`}>
                    <div className={`rounded-lg px-4 py-3 ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-900 shadow-sm'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                      
                      {message.sender === 'ai' && (
                        <div className="flex items-center space-x-2 mt-3 pt-2 border-t border-gray-100">
                          <button
                            onClick={() => copyToClipboard(message.text)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="Copy"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            className="text-gray-400 hover:text-green-600 transition-colors"
                            title="Helpful"
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </button>
                          <button
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            title="Not helpful"
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </button>
                          {message.executionTime && (
                            <span className="text-xs text-gray-400 ml-auto">
                              {message.executionTime}ms
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-1 px-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  
                  {message.sender === 'user' && (
                    <div className="w-8 h-8 bg-gray-300 rounded-lg flex items-center justify-center flex-shrink-0 order-2">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
              
              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Bot className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="bg-white rounded-lg px-4 py-3 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                      <span className="text-sm text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={1}
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default AIChat;
