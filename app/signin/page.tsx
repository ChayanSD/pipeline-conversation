'use client';

import { useState } from 'react';
import { useLogin } from '@/lib/hooks';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

export default function SigninPage() {
  const [formData, setFormData] = useState({
    email: '',
    passCode: '',
  });
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await loginMutation.mutateAsync(formData);

      if (response.success) {
        window.location.href = '/';
      } else {
        setMessage('Login failed');
      }
    } catch (error: unknown) {
      const apiError = error as { message?: string };
      setMessage(apiError.message || 'An error occurred');
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center"
      style={{
        backgroundImage: 'url(/bg-img.png)',
        backgroundSize: 'contain'
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-[rgba(43,64,85,0.70)] z-0"></div>

      {/* Content */}
      <div className="flex flex-col items-center relative z-10">
        {/* Logo */}
        <Image
          src="/logo.png"
          alt="Pipeline Conversions"
          width={180}
          height={60}
          className="mb-4"
        />
        <h2 className="text-white text-2xl font-semibold mb-6 tracking-wide">
          WELCOME BACK
        </h2>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl w-[380px] p-8">
          <h3 className="text-center text-lg font-semibold text-gray-800 mb-6">
            LOGIN INTO YOUR ACCOUNT
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Passcode
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="passCode"
                  required
                  value={formData.passCode}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="text-right mt-2">
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-500 hover:text-blue-600"
                >
                  Forgot Passcode?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-linear-to-b from-yellow-400 to-yellow-500 text-gray-800 font-semibold py-2 rounded-lg shadow-md hover:opacity-90 transition-all disabled:opacity-70"
            >
              {loginMutation.isPending ? 'Logging in...' : 'Login'}
            </button>
            <div className="text-center ">
              Create an account ? 
                <Link
                  href="/signup"
                  className="text-sm px-1 text-blue-500 hover:text-blue-600 underline"
                >
                   Signup
                </Link>
              </div>
            {message && (
              <p
                className={`text-center text-sm ${(message.includes('failed') || message.includes('Invalid')) ? 'text-red-500' : 'text-green-500'
                  }`}
              >
                {message}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
