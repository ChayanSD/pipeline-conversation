"use client";

import { useState } from "react";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    passCode: "",
    companyName: "",
    primaryColor: "",
    secondaryColor: "",
    profileImageUrl: "",
    companyLogoUrl: "",
    role: "USER",
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "profile" | "company"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (type === "profile") {
          setProfilePreview(result);
        } else {
          setLogoPreview(result);
        }
      };
      reader.readAsDataURL(file);

      // Store file
      if (type === "profile") {
        setProfileImage(file);
        setUploadingProfile(true);
        try {
          const url = await uploadToCloudinary(file);
          setFormData((prev) => ({ ...prev, profileImageUrl: url }));
        } catch (error) {
          console.error("Profile image upload failed:", error);
        } finally {
          setUploadingProfile(false);
        }
      } else {
        setCompanyLogo(file);
        setUploadingLogo(true);
        try {
          const url = await uploadToCloudinary(file);
          setFormData((prev) => ({ ...prev, companyLogoUrl: url }));
        } catch (error) {
          console.error("Company logo upload failed:", error);
        } finally {
          setUploadingLogo(false);
        }
      }
    }
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
    );

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      formData
    );
    return response.data.secure_url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      let profileImageUrl = "";
      let companyLogoUrl = "";

      if (profileImage) {
        profileImageUrl = await uploadToCloudinary(profileImage);
      }

      if (companyLogo) {
        companyLogoUrl = await uploadToCloudinary(companyLogo);
      }

      const dataToSend = {
        ...formData,
        profileImageUrl:
          formData.profileImageUrl || profileImageUrl || undefined,
        companyLogoUrl: formData.companyLogoUrl || companyLogoUrl || undefined,
      };

      const response = await axios.post("/api/auth/register", dataToSend);

      if (response.data.success) {
        setMessage("Registration successful!");
        // Redirect based on role after successful registration
        const userRole = response.data.data.role;
        if (userRole === "ADMIN") {
          window.location.href = "/dashboard";
        } else {
          window.location.href = "/";
        }
      } else {
        setMessage(response.data.message || "Registration failed");
      }
    } catch (error) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      setMessage(axiosError.response?.data?.error || "An error occurred");
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

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="backdrop-blur-lg bg-white/10 rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="text-center">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              Create Account
            </h2>
            <p className="text-slate-300 text-sm">
              Join Pipeline Conversation today
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-6">
            <div className="relative">
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm transition-all duration-300"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleInputChange}
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/20 to-purple-400/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm transition-all duration-300"
                placeholder="Email address"
                value={formData.email}
                onChange={handleInputChange}
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/20 to-purple-400/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
            <div className="relative">
              <input
                id="passCode"
                name="passCode"
                type="password"
                autoComplete="new-password"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm transition-all duration-300"
                placeholder="Passcode"
                value={formData.passCode}
                onChange={handleInputChange}
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/20 to-purple-400/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
            <div className="relative">
              <input
                id="companyName"
                name="companyName"
                type="text"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm transition-all duration-300"
                placeholder="Company Name (optional)"
                value={formData.companyName}
                onChange={handleInputChange}
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/20 to-purple-400/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>

            {/* Color Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white text-center">Choose Your Colors</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <label htmlFor="primaryColor" className="block text-sm font-medium text-slate-300 mb-3">
                    Primary Color
                  </label>
                  <div className="relative">
                    <input
                      id="primaryColor"
                      name="primaryColor"
                      type="color"
                      className="w-16 h-16 rounded-full border-4 border-cyan-400 shadow-lg cursor-pointer appearance-none"
                      value={formData.primaryColor}
                      onChange={handleInputChange}
                    />
                    <div
                      className="w-20 h-20 rounded-full border-2 border-cyan-400/50 mx-auto mt-2 backdrop-blur-sm"
                      style={{ backgroundColor: formData.primaryColor || '#3B82F6' }}
                    ></div>
                  </div>
                </div>
                <div className="text-center">
                  <label htmlFor="secondaryColor" className="block text-sm font-medium text-slate-300 mb-3">
                    Secondary Color
                  </label>
                  <div className="relative">
                    <input
                      id="secondaryColor"
                      name="secondaryColor"
                      type="color"
                      className="w-16 h-16 rounded-full border-4 border-purple-400 shadow-lg cursor-pointer appearance-none"
                      value={formData.secondaryColor}
                      onChange={handleInputChange}
                    />
                    <div
                      className="w-20 h-20 rounded-full border-2 border-purple-400/50 mx-auto mt-2 backdrop-blur-sm"
                      style={{ backgroundColor: formData.secondaryColor || '#10B981' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>



            {/* File Uploads */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white text-center">
                Upload Images
              </h3>

              {/* Profile Image Upload */}
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {profilePreview ? (
                    <Image
                      src={profilePreview}
                      alt="Profile preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      height={22}
                      width={22}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="profileImage"
                    className="block text-sm font-medium text-slate-300 mb-1"
                  >
                    Profile Image
                  </label>
                  <input
                    id="profileImage"
                    name="profileImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "profile")}
                    className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-500/20 file:text-cyan-300 hover:file:bg-cyan-500/30 disabled:opacity-50 backdrop-blur-sm"
                    disabled={uploadingProfile}
                  />
                  {uploadingProfile && (
                    <p className="text-sm text-cyan-400 mt-1">Uploading...</p>
                  )}
                </div>
              </div>

              {/* Company Logo Upload */}
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {logoPreview ? (
                    <Image
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200"
                      height={22}
                      width={22}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="companyLogo"
                    className="block text-sm font-medium text-slate-300 mb-1"
                  >
                    Company Logo
                  </label>
                  <input
                    id="companyLogo"
                    name="companyLogo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "company")}
                    className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500/20 file:text-purple-300 hover:file:bg-purple-500/30 disabled:opacity-50 backdrop-blur-sm"
                    disabled={uploadingLogo}
                  />
                  {uploadingLogo && (
                    <p className="text-sm text-purple-400 mt-1">Uploading...</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </div>

          {message && (
            <div className="text-center">
              <p
                className={`text-sm ${
                  message.includes("successful")
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {message}
              </p>
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-slate-300">
              Already have an account?{" "}
              <Link
                href="/signin"
                className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors duration-300"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
