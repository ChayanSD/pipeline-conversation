
'use client';

import { useState } from 'react';
import axios from 'axios';

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
        setMessage('Login successful!');
        // Redirect based on role
        const userRole = response.data.role; // Assuming API returns role
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
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
      <h1 className="text-2xl font-bold">SignIn Page</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-md">
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleInputChange}
          required
          className="p-2 border border-gray-300 rounded"
        />
        <input
          type="password"
          name="passCode"
          placeholder="Passcode"
          value={formData.passCode}
          onChange={handleInputChange}
          required
          className="p-2 border border-gray-300 rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="p-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
      {message && <p className="text-center text-red-500">{message}</p>}
    </div>
  );
}
