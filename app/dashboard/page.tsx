'use client';

import { useUser } from '@/contexts/UserContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import InviteMemberForm from '@/components/InviteMemberForm';
import DashboardSkeleton from '@/components/DashboardSkeleton';
import CustomButton from '@/components/common/CustomButton';
import { useAuthCheck, useAllUsers, useAudits } from '@/lib/hooks';
import "react-loading-skeleton/dist/skeleton.css";
import { Users, FileText, FolderTree, UserPlus } from 'lucide-react';


export default function DashboardPage() {
  const { user } = useUser();
  const router = useRouter();
  const { data: authData, isLoading: authLoading } = useAuthCheck();
  const { data: usersData, isLoading: usersLoading } = useAllUsers(1);
  const { data: audits, isLoading: auditsLoading } = useAudits();
  const [showInviteForm, setShowInviteForm] = useState(false);

  useEffect(() => {
    if (!authLoading && authData) {
      if (!authData.authenticated) {
        router.push('/signin');
        return;
      }

      if (authData.user?.role !== 'ADMIN') {
        router.push('/');
        return;
      }
    }
  }, [authData, authLoading, router]);

  const isLoading = authLoading || !user;
  const loadingStats = usersLoading || auditsLoading;
  const currentUser = authData?.user || user;

  // Calculate stats
  const totalUsers = usersData?.total || 0;
  const totalAudits = audits?.length || 0;
  const totalCategories = audits?.reduce((acc, audit) => {
    return acc + (audit.categories?.length || 0);
  }, 0) || 0;

  if (isLoading || loadingStats) {
    return <DashboardSkeleton />;
  }

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="p-14 bg-white h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">Admin access required</p>
          <CustomButton onClick={() => router.push('/')}>
            Go to Home
          </CustomButton>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: totalUsers,
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Total Audits',
      value: totalAudits,
      icon: FileText,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Total Categories',
      value: totalCategories,
      icon: FolderTree,
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  return (
    <div className="p-14 bg-white h-full">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-[#2d3e50] text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 text-base">
          Manage users, audits, and system settings from this central dashboard.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className={`shrink-0 p-3 rounded-lg ${card.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="ml-5 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate mb-1">{card.title}</dt>
                  <dd className="text-2xl font-bold text-gray-900">{card.value}</dd>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Invite Member Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Invite Member</h3>
            <p className="text-sm text-gray-600">Invite new members to join your company</p>
          </div>
          <CustomButton
            variant="primary"
            size="lg"
            onClick={() => setShowInviteForm(!showInviteForm)}
            leftIcon={<UserPlus size={18} />}
          >
            {showInviteForm ? 'Hide Form' : 'Invite Member'}
          </CustomButton>
        </div>
        {showInviteForm && currentUser && 'company' in currentUser && currentUser.company && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <InviteMemberForm
              companyId={currentUser.company.id}
              invitedById={currentUser.id}
            />
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CustomButton
            variant="grayDark"
            size="lg"
            onClick={() => router.push('/')}
            className="w-full"
          >
            View All Audits
          </CustomButton>
          <CustomButton
            variant="green"
            size="lg"
            onClick={() => router.push('/add-new-audit/?category=1')}
            className="w-full"
          >
            Create New Audit
          </CustomButton>
          <CustomButton
            variant="primary"
            size="lg"
            onClick={() => {
              // Could navigate to a users management page if it exists
              window.location.href = '/api/admin/all-users';
            }}
            className="w-full"
          >
            Manage Users
          </CustomButton>
          <CustomButton
            variant="gray"
            size="lg"
            onClick={() => router.push('/profile')}
            className="w-full"
          >
            View Profile
          </CustomButton>
        </div>
      </div>
    </div>
  );
}