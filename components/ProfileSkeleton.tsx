import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Title */}
          <Skeleton height={36} width={200} className="mb-8" />

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              {/* Profile Header */}
              <div className="flex items-center space-x-6 mb-6">
                <Skeleton circle height={96} width={96} />
                <div className="space-y-2">
                  <Skeleton height={32} width={150} />
                  <Skeleton height={20} width={120} />
                  <Skeleton height={16} width={80} />
                </div>
              </div>

              {/* Personal Information Section */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <Skeleton height={24} width={180} />
                  <Skeleton height={40} width={120} />
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Name */}
                  <div>
                    <Skeleton height={16} width={60} className="mb-1" />
                    <Skeleton height={40} />
                  </div>

                  {/* Email */}
                  <div>
                    <Skeleton height={16} width={60} className="mb-1" />
                    <Skeleton height={40} />
                  </div>

                  {/* Company Name */}
                  <div>
                    <Skeleton height={16} width={120} className="mb-1" />
                    <Skeleton height={40} />
                  </div>

                  {/* Role */}
                  <div>
                    <Skeleton height={16} width={40} className="mb-1" />
                    <Skeleton height={20} width={80} />
                  </div>

                  {/* PassCode */}
                  <div>
                    <Skeleton height={16} width={80} className="mb-1" />
                    <Skeleton height={40} />
                  </div>

                  {/* Primary Color */}
                  <div>
                    <Skeleton height={16} width={100} className="mb-1" />
                    <Skeleton height={40} />
                  </div>

                  {/* Secondary Color */}
                  <div>
                    <Skeleton height={16} width={120} className="mb-1" />
                    <Skeleton height={40} />
                  </div>

                  {/* Company Role */}
                  <div>
                    <Skeleton height={16} width={100} className="mb-1" />
                    <Skeleton height={40} />
                  </div>

                  {/* Profile Image URL */}
                  <div>
                    <Skeleton height={16} width={130} className="mb-1" />
                    <Skeleton height={40} />
                  </div>
                </div>

                {/* Company Logo */}
                <div className="mt-6">
                  <Skeleton height={16} width={120} className="mb-2" />
                  <Skeleton height={64} width={96} />
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex space-x-3">
                  <Skeleton height={40} width={140} />
                  <Skeleton height={40} width={100} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}