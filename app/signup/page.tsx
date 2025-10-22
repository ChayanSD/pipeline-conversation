
'use client';

import { useState } from 'react';
import axios from 'axios';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    passCode: '',
    companyName: '',
    primaryColor: '',
    secondaryColor: '',
    profileImageUrl: '',
    companyLogoUrl: '',
    role: 'USER',
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'company') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'profile') {
        setProfileImage(file);
      } else {
        setCompanyLogo(file);
      }
    }
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      formData
    );
    return response.data.secure_url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let profileImageUrl = '';
      let companyLogoUrl = '';

      if (profileImage) {
        profileImageUrl = await uploadToCloudinary(profileImage);
      }

      if (companyLogo) {
        companyLogoUrl = await uploadToCloudinary(companyLogo);
      }

      const dataToSend = {
        ...formData,
        profileImageUrl: profileImageUrl || undefined,
        companyLogoUrl: companyLogoUrl || undefined,
      };

      const response = await axios.post('/api/auth/register', dataToSend);

      if (response.data.success) {
        setMessage('Registration successful!');
        // Redirect to signin page after successful registration
        window.location.href = '/signin';
      } else {
        setMessage(response.data.message || 'Registration failed');
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
      <h1 className="text-2xl font-bold">Signup Page</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-md">
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleInputChange}
          required
          className="p-2 border border-gray-300 rounded"
        />
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
        <input
          type="text"
          name="companyName"
          placeholder="Company Name"
          value={formData.companyName}
          onChange={handleInputChange}
          className="p-2 border border-gray-300 rounded"
        />
        <input
          type="color"
          name="primaryColor"
          placeholder="Primary Color"
          value={formData.primaryColor}
          onChange={handleInputChange}
          className="p-2 border border-gray-300 rounded"
        />
        <input
          type="color"
          name="secondaryColor"
          placeholder="Secondary Color"
          value={formData.secondaryColor}
          onChange={handleInputChange}
          className="p-2 border border-gray-300 rounded"
        />
        <div>
          <label className="block text-sm font-medium mb-1">Profile Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'profile')}
            className="p-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Company Logo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'company')}
            className="p-2 border border-gray-300 rounded"
          />
        </div>
        <select
          name="role"
          value={formData.role}
          onChange={handleInputChange}
          className="p-2 border border-gray-300 rounded"
        >
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="p-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Signing Up...' : 'Sign Up'}
        </button>
      </form>
      {message && <p className="text-center text-red-500">{message}</p>}
    </div>
  );
}
