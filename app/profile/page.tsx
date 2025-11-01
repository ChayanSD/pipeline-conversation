'use client';

import { useUser } from '@/contexts/UserContext';
import { useLoading } from '@/contexts/LoadingContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ProfileSkeleton from '@/components/ProfileSkeleton';

export default function ProfilePage() {
  const { user } = useUser();
  const { setIsLoading, setLoadingMessage } = useLoading();
  const router = useRouter();
  const [pageLoading, setPageLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    companyName: user?.company?.name || '',
    passCode: '',
    primaryColor: user?.primaryColor || '',
    secondaryColor: user?.secondaryColor || '',
    companyRole: user?.companyRole || '',
    profileImageUrl: user?.profileImageUrl || '',
    profileImageFile: null as File | null,
  });

  useEffect(() => {
    // Manual authentication check
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();

        if (!data.authenticated) {
          router.push('/signin');
          return;
        }

        setPageLoading(false);
      } catch (error) {
        console.error(error);
        router.push('/signin');
      }
    };

    checkAuth();
  }, [router]);

  if (pageLoading) {
    return <ProfileSkeleton />;
  }

  if (!user) {
    return <div>Loading...</div>;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setLoadingMessage('Uploading profile image...');

      let profileImageUrl = formData.profileImageUrl;

      // Upload image to Cloudinary if file is selected
      if (formData.profileImageFile) {
        const cloudinaryFormData = new FormData();
        cloudinaryFormData.append('file', formData.profileImageFile);
        cloudinaryFormData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
        cloudinaryFormData.append('folder', 'profile-images');

        const cloudinaryResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: cloudinaryFormData,
          }
        );

        const cloudinaryData = await cloudinaryResponse.json();

        if (cloudinaryResponse.ok) {
          profileImageUrl = cloudinaryData.secure_url;
        } else {
          throw new Error('Failed to upload image to Cloudinary');
        }
      }

      setLoadingMessage('Updating profile...');

      // Send update request to API
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          companyName: formData.companyName,
          passCode: formData.passCode || undefined,
          primaryColor: formData.primaryColor || undefined,
          secondaryColor: formData.secondaryColor || undefined,
          companyRole: formData.companyRole || undefined,
          profileImageUrl: profileImageUrl || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setLoadingMessage('Profile updated successfully!');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        alert(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('An error occurred while updating your profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      companyName: user.company?.name || '',
      passCode: '',
      primaryColor: user.primaryColor || '',
      secondaryColor: user.secondaryColor || '',
      companyRole: user.companyRole || '',
      profileImageUrl: user.profileImageUrl || '',
      profileImageFile: null,
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center space-x-6 mb-6">
                <div className="shrink-0">
                  {user.profileImageUrl ? (
                    <Image
                      className="h-24 w-24 rounded-full object-cover"
                      src={user.profileImageUrl}
                      alt="Profile"
                      width={96}
                      height={96}
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-2xl font-medium text-gray-700">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                  <p className="text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{user.name}</p>
                    )}
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{user?.company?.name || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{user.role}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">PassCode</label>
                    {isEditing ? (
                      <input
                        type="password"
                        name="passCode"
                        value={formData.passCode}
                        onChange={handleInputChange}
                        placeholder="Enter new passcode (leave empty to keep current)"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">••••••</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Primary Color</label>
                    {isEditing ? (
                      <input
                        type="color"
                        name="primaryColor"
                        value={formData.primaryColor}
                        onChange={handleInputChange}
                        className="mt-1 block w-full h-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <div className="mt-1 flex items-center space-x-2">
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: user.primaryColor || '#000000' }}
                        ></div>
                        <p className="text-sm text-gray-900">{user.primaryColor}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Secondary Color</label>
                    {isEditing ? (
                      <input
                        type="color"
                        name="secondaryColor"
                        value={formData.secondaryColor}
                        onChange={handleInputChange}
                        className="mt-1 block w-full h-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <div className="mt-1 flex items-center space-x-2">
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: user.secondaryColor || '#ffffff' }}
                        ></div>
                        <p className="text-sm text-gray-900">{user.secondaryColor}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company Role</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="companyRole"
                        value={formData.companyRole}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{user.companyRole || 'Not specified'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Profile Image</label>
                    {isEditing ? (
                      <div className="mt-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setFormData(prev => ({ ...prev, profileImageFile: file }));
                            }
                          }}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <p className="mt-1 text-xs text-gray-500">Or enter URL below:</p>
                        <input
                          type="url"
                          name="profileImageUrl"
                          value={formData.profileImageUrl}
                          onChange={handleInputChange}
                          placeholder="https://example.com/image.jpg"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    ) : (
                      <div className="mt-1">
                        {user.profileImageUrl ? (
                          <Image
                            src={user.profileImageUrl}
                            alt="Profile"
                            className="h-16 w-16 rounded-full object-cover"
                            width={64}
                            height={64}
                          />
                        ) : (
                          <p className="text-sm text-gray-900">No profile image</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {user.company?.logoUrl && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700">Company Logo</label>
                    <Image
                      src={user.company.logoUrl}
                      alt="Company Logo"
                      className="mt-2 h-16 w-auto"
                      height={22}
                      width={33}
                    />
                  </div>
                )}

                {isEditing && (
                  <div className="mt-6 flex space-x-3">
                    <button
                      onClick={handleSave}
                      className="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}