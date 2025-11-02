
'use client';

import { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Mail, Lock } from 'lucide-react';

export default function SigninPage() {
  const [formData, setFormData] = useState({
    email: '',
    passCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post('/api/auth/login', formData);

      if (response.data.success) {
        // Redirect based on role
        const userRole = response.data.role;
        if (userRole === 'ADMIN') {
          window.location.href = '/dashboard';
        } else {
          window.location.href = '/';
        }
      } else {
        setMessage(response.data.error || 'Login failed');
      }
    } catch (error) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      setMessage(axiosError.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="max-w-lg w-full space-y-10 relative z-10">
        <div className="backdrop-blur-lg bg-white/10 rounded-3xl p-10 shadow-2xl border border-white/20">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <h2 className="text-5xl font-extrabold bg-linear-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3 tracking-tight">
              Sign In
            </h2>
            <p className="text-slate-300 text-base font-medium">
              Welcome back to Pipeline Conversation
            </p>
          </div>
        <form className="mt-10 space-y-8" onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm transition-all duration-300"
                placeholder="Email address"
                value={formData.email}
                onChange={handleInputChange}
              />
              <div className="absolute inset-0 rounded-xl bg-linear-to-r from-cyan-400/20 to-purple-400/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                id="passCode"
                name="passCode"
                type="password"
                autoComplete="current-password"
                required
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm transition-all duration-300"
                placeholder="Passcode"
                value={formData.passCode}
                onChange={handleInputChange}
              />
              <div className="absolute inset-0 rounded-xl bg-linear-to-r from-cyan-400/20 to-purple-400/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center">
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </button>
          </div>

          {message && (
            <div className="text-center">
              <p className={`text-sm ${message.includes('successful') ? 'text-green-400' : 'text-red-400'}`}>
                {message}
              </p>
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-slate-300">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors duration-300">
                Sign up here
              </Link>
            </p>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
