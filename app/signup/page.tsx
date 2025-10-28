"use client";

import { useState } from "react";
import axios from "axios";
import Image from "next/image";


export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    passCode: "",
    companyName: "",
    primaryColor: "#000000",
    secondaryColor: "#000000",
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
  const [showPassword, setShowPassword] = useState(false);

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
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === "profile") setProfilePreview(result);
      else setLogoPreview(result);
    };
    reader.readAsDataURL(file);

    const setter = type === "profile" ? setUploadingProfile : setUploadingLogo;
    setter(true);
    try {
      const url = await uploadToCloudinary(file);
      setFormData((prev) => ({
        ...prev,
        [type === "profile" ? "profileImageUrl" : "companyLogoUrl"]: url,
      }));
    } catch (error) {
      console.error(`${type} image upload failed:`, error);
    } finally {
      setter(false);
    }
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
    );

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      uploadData
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

      if (profileImage)
        profileImageUrl = await uploadToCloudinary(profileImage);
      if (companyLogo)
        companyLogoUrl = await uploadToCloudinary(companyLogo);

      const dataToSend = {
        ...formData,
        profileImageUrl: formData.profileImageUrl || profileImageUrl,
        companyLogoUrl: formData.companyLogoUrl || companyLogoUrl,
      };

      const response = await axios.post("/api/auth/register", dataToSend);

      if (response.data.success) {
        setMessage("Registration successful!");
        const role = response.data.data.role;
        window.location.href = role === "ADMIN" ? "/dashboard" : "/";
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
    <div
      className="relative min-h-screen flex items-center justify-center"
      style={{
        backgroundImage: 'url(/bg-img.png)',
        backgroundSize: 'contain'
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-[rgba(43,64,85,0.70)] z-0"></div>

      <div className="flex flex-col items-center relative z-10 p-16">
        {/* Logo */}
        <Image
          src="/logo.png"
          alt="Pipeline Conversions"
          width={180}
          height={60}
          className="mb-4"
        />
        {/* Form Card */}
        <div className="max-w-[764px] bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl text-[#2d3e50] mb-8 tracking-wide">
            CREATE YOUR ACCOUNT
          </h2>

          <form onSubmit={handleSubmit} className="space-y-0.5">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm text-[#2d3e50] mb-2">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full bg-[#f5f5f5] border-0 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm text-[#2d3e50] mb-2">
                Email Address
              </label>
              <div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-[#f5f5f5] border-0 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </div>
            </div>

            {/* Passcode */}
            <div>
              <label htmlFor="passCode" className="block text-sm text-[#2d3e50] mb-2">
                Passcode
              </label>
              <div className="relative">

                {/* Input field */}
                <input
                  id="passCode"
                  name="passCode"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.passCode}
                  onChange={handleInputChange}
                  className="w-full bg-[#f5f5f5] border-0 rounded-md pl-10 p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
                />

                {/* Show/Hide password toggle button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    // Eye-off SVG (when password is visible)
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a21.59 21.59 0 014.29-5.94M9.53 9.53A3 3 0 0114.47 14.47M1 1l22 22" />
                    </svg>
                  ) : (
                    // Eye SVG (when password is hidden)
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>


            {/* Company Name */}
            <div>
              <label htmlFor="companyName" className="block text-sm text-[#2d3e50] mb-2">
                Company Name
              </label>
              <div>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full bg-[#f5f5f5] border-0 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </div>
            </div>

            {/* Colors and Images Row */}
            <div className="grid grid-cols-2 gap-2">
              {/* Primary Color */}
              <div>
                <label className="block text-sm text-[#2d3e50] mb-2">
                  Primary Color
                </label>
                <div className="relative">
                  <input
                    id="primaryColor"
                    name="primaryColor"
                    type="color"
                    value={formData.primaryColor}
                    onChange={handleInputChange}
                    className="absolute opacity-0 w-full h-full cursor-pointer"
                  />
                  <div className="w-full bg-[#f5f5f5] border-0 rounded-md px-4 py-3 text-gray-500 text-sm flex items-center justify-between cursor-pointer">
                    <span className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded border border-gray-300"
                        style={{ backgroundColor: formData.primaryColor }}
                      />
                      Chosen primary color
                    </span>
                  </div>
                </div>
              </div>

              {/* Secondary Color */}
              <div>
                <label className="block text-sm text-[#2d3e50] mb-2">
                  Secondary Color
                </label>
                <div className="relative">
                  <input
                    id="secondaryColor"
                    name="secondaryColor"
                    type="color"
                    value={formData.secondaryColor}
                    onChange={handleInputChange}
                    className="absolute opacity-0 w-full h-full cursor-pointer"
                  />
                  <div className="w-full bg-[#f5f5f5] border-0 rounded-md px-4 py-3 text-gray-500 text-sm flex items-center justify-between cursor-pointer">
                    <span className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded border border-gray-300"
                        style={{ backgroundColor: formData.secondaryColor }}
                      />
                      Chosen secondary color
                    </span>
                  </div>
                </div>
              </div>

              {/* Company Logo */}
              <div>
                <label className="block text-sm text-[#2d3e50] mb-2">
                  Company Logo
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "company")}
                    className="absolute opacity-0 w-full h-full cursor-pointer"
                    id="companyLogo"
                  />
                  <label
                    htmlFor="companyLogo"
                    className="w-full bg-[#f5f5f5] border-0 rounded-md px-4 py-3 text-gray-500 text-sm flex items-center justify-between cursor-pointer"
                  >
                    <span className="truncate">
                      {logoPreview ? "File selected" : "No files chosen"}
                    </span>
                    <span className="bg-white px-3 py-1 rounded text-xs border border-gray-300 ml-2 whitespace-nowrap">
                      Choose File
                    </span>
                  </label>
                </div>
                {uploadingLogo && (
                  <p className="text-xs text-[#2d3e50] mt-1">Uploading...</p>
                )}
              </div>

              {/* Profile Photo */}
              <div>
                <label className="block text-sm text-[#2d3e50] mb-2">
                  Profile Photo
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "profile")}
                    className="absolute opacity-0 w-full h-full cursor-pointer"
                    id="profilePhoto"
                  />
                  <label
                    htmlFor="profilePhoto"
                    className="w-full bg-[#f5f5f5] border-0 rounded-md px-4 py-3 text-gray-500 text-sm flex items-center justify-between cursor-pointer"
                  >
                    <span className="truncate">
                      {profilePreview ? "File selected" : "No files chosen"}
                    </span>
                    <span className="bg-white px-3 py-1 rounded text-xs border border-gray-300 ml-2 whitespace-nowrap">
                      Choose File
                    </span>
                  </label>
                </div>
                {uploadingProfile && (
                  <p className="text-xs text-[#2d3e50] mt-1">Uploading...</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 bg-[#ff9d00] text-white py-3 rounded-full font-medium hover:bg-[rgb(255,189,66)] transition-all shadow-md disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Signup"}
            </button>

            {message && (
              <p
                className={`text-center text-sm mt-3 ${message.includes("success") ? "text-green-600" : "text-red-600"
                  }`}
              >
                {message}
              </p>
            )}

            {/* Login Link */}
            <p className="text-center text-sm text-gray-600 mt-4">
              Dont have an account?{" "}
              <a href="/signin" className="text-[#2d3e50] hover:underline font-medium">
                Login
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}