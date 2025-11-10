"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { useUpdateProfile } from "@/lib/hooks";
import axios from "axios";
import Image from "next/image";
import toast from "react-hot-toast";
import { UpdateProfileData } from "@/validation/update-profile.validation";
import { CustomButton } from "@/components/common";

export default function ProfilePage() {
  const { user } = useUser();
  const router = useRouter();
  const updateProfileMutation = useUpdateProfile();
  const [message, setMessage] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    passCode: "",
    companyName: "",
    primaryColor:  "#456987",
    secondaryColor: "#F7AF41",
    profileImageUrl: "",
    companyLogoUrl: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        passCode: "",
        companyName: user.company?.name || "",
        primaryColor: user.primaryColor || "#456987",
        secondaryColor: user.secondaryColor || "#F7AF41",
        profileImageUrl: user.profileImageUrl || "",
        companyLogoUrl: user.company?.logoUrl || "",
      });
      if (user.profileImageUrl) {
        setProfilePreview(user.profileImageUrl);
      }
      if (user.company?.logoUrl) {
        setLogoPreview(user.company.logoUrl);
      }
    }
  }, [user]);

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

    // Store file for later upload
    if (type === "profile") {
      setProfileImage(file);
    } else {
      setCompanyLogo(file);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === "profile") setProfilePreview(result);
      else setLogoPreview(result);
    };
    reader.readAsDataURL(file);
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
    setMessage("");

    try {
      let profileImageUrl = formData.profileImageUrl;
      let companyLogoUrl = formData.companyLogoUrl;

      // Upload new images if files are selected
      if (profileImage) {
        setUploadingProfile(true);
        try {
          profileImageUrl = await uploadToCloudinary(profileImage);
          setFormData((prev) => ({ ...prev, profileImageUrl }));
        } catch (error) {
          console.error("Profile image upload failed:", error);
          toast.error("Failed to upload profile image");
        } finally {
          setUploadingProfile(false);
        }
      }

      if (companyLogo) {
        setUploadingLogo(true);
        try {
          companyLogoUrl = await uploadToCloudinary(companyLogo);
          setFormData((prev) => ({ ...prev, companyLogoUrl }));
        } catch (error) {
          console.error("Company logo upload failed:", error);
          toast.error("Failed to upload company logo");
        } finally {
          setUploadingLogo(false);
        }
      }

      const dataToSend: Partial<UpdateProfileData> = {
        name: formData.name,
        companyName: formData.companyName,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
      };

      // Only include passCode if it's provided
      if (formData.passCode) {
        dataToSend.passCode = formData.passCode;
      }

      // Only include image URLs if they exist
      if (profileImageUrl) {
        dataToSend.profileImageUrl = profileImageUrl;
      }
      if (companyLogoUrl) {
        dataToSend.companyLogoUrl = companyLogoUrl;
      }

      await updateProfileMutation.mutateAsync(dataToSend);
      toast.success("Profile updated successfully!");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      const errorMessage = axiosError.response?.data?.error || "An error occurred";
      setMessage(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleBack = () => {
    router.push("/");
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-full p-8 bg-white">
      {/* Form Card */}
      <div className="max-w-[764px] w-full bg-white rounded-2xl shadow p-8 border border-gray-200">
        <h2 className="text-2xl text-[#2d3e50] mb-8 tracking-wide">
          EDIT YOUR PROFILE
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
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              disabled
              className="w-full bg-[#f5f5f5] border-0 rounded-md p-2 text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 cursor-not-allowed"
            />
          </div>

          {/* Passcode */}
          <div>
            <label htmlFor="passCode" className="block text-sm text-[#2d3e50] mb-2">
              Passcode
            </label>
            <div className="relative">
              <input
                id="passCode"
                name="passCode"
                type={showPassword ? "text" : "password"}
                value={formData.passCode}
                onChange={handleInputChange}
                placeholder="Enter new passcode (leave empty to keep current)"
                className="w-full bg-[#f5f5f5] border-0 rounded-md pl-10 pr-10 p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
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
            <input
              id="companyName"
              name="companyName"
              type="text"
              value={formData.companyName}
              onChange={handleInputChange}
              className="w-full bg-[#f5f5f5] border-0 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
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
                    <span className="text-gray-800">{formData.primaryColor}</span>
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
                    <span className="text-gray-800">{formData.secondaryColor}</span>
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
              {logoPreview && !uploadingLogo && (
                <div className="mt-2">
                  <Image
                    src={logoPreview}
                    alt="Company Logo"
                    width={64}
                    height={64}
                    className="h-16 w-auto object-contain"
                  />
                </div>
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
              {profilePreview && !uploadingProfile && (
                <div className="mt-2">
                  <Image
                    src={profilePreview}
                    alt="Profile"
                    width={100}
                    height={100}
                    className="h-24 w-24 rounded object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={handleBack}
              className="w-[200px] bg-gray-300 text-black py-3 cursor-pointer rounded-full font-medium  transition-all shadow-md"
            >
              No, Back
            </button>
            <CustomButton
              variant="primary"
              size="md"
              className="flex-1"
              fullRounded={true}
              disabled={updateProfileMutation.isPending || uploadingProfile || uploadingLogo}
              onClick={handleSubmit}
            >
              {updateProfileMutation.isPending || uploadingProfile || uploadingLogo ? "Saving..." : "Save it"}
            </CustomButton>
          </div>

          {message && (
            <p
              className={`text-center text-sm mt-3 ${
                message.includes("success") ? "text-green-600" : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
