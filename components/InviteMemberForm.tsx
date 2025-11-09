'use client';

import { useState } from 'react';
import { useSendInvite } from '@/lib/hooks';

interface InviteMemberFormProps {
  companyId: string;
  invitedById: string;
}

export default function InviteMemberForm({ companyId, invitedById }: InviteMemberFormProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('USER');
  const [message, setMessage] = useState('');
  const sendInviteMutation = useSendInvite();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await sendInviteMutation.mutateAsync({
        email,
        companyId,
        invitedById,
        ...(role && { role }),
      });

      if (response.success) {
        setMessage('Invitation sent successfully!');
        setEmail('');
        setRole('USER');
      } else {
        setMessage(response.message || 'Failed to send invitation');
      }
    } catch (error: unknown) {
      const apiError = error as { message?: string };
      setMessage(apiError.message || 'An error occurred');
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Invite Team Member</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="member@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={sendInviteMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendInviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
          </button>

          {message && (
            <div className={`text-sm ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}