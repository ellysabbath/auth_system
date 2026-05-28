// components/UserProfile/UserInfoCard.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useUserProfile } from "../../context/UserProfileContext";

export default function UserInfoCard() {
  const navigate = useNavigate();
  const { isOpen, openModal, closeModal } = useModal();
  const { user, profileData, isLoading, isAuthenticated, updateProfile, updateProfilePicture, deleteProfileField } = useUserProfile();
  
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    location: "",
  });
  const [profilePreview, setProfilePreview] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Log for debugging
  useEffect(() => {
    console.log('UserInfoCard mounted');
    console.log('isLoading:', isLoading);
    console.log('isAuthenticated:', isAuthenticated);
    console.log('user:', user);
    console.log('profileData:', profileData);
  }, [isLoading, isAuthenticated, user, profileData]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('Not authenticated, redirecting to signin');
      navigate('/signin');
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Load user data
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        bio: profileData?.bio || "",
        location: profileData?.location || "",
      });
    }
    if (profileData?.profile_picture) {
      setProfilePreview(profileData.profile_picture);
    }
  }, [user, profileData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errorMessage) setErrorMessage(null);
    if (successMessage) setSuccessMessage(null);
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage("Profile picture must be less than 2MB");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      setErrorMessage("Please upload an image file");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setProfilePreview(base64String);
      const success = await updateProfilePicture(base64String);
      if (!success) {
        setErrorMessage("Failed to upload profile picture");
        setTimeout(() => setErrorMessage(null), 3000);
        setProfilePreview(profileData?.profile_picture || '');
      } else {
        setSuccessMessage("Profile picture updated successfully");
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!formData.full_name.trim()) {
      setErrorMessage("Full name is required");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      const updateData: any = {};
      if (formData.full_name !== user?.full_name) updateData.full_name = formData.full_name;
      if (formData.bio !== profileData?.bio) updateData.bio = formData.bio;
      if (formData.location !== profileData?.location) updateData.location = formData.location;
      
      if (Object.keys(updateData).length > 0) {
        const success = await updateProfile(updateData);
        if (success) {
          setSuccessMessage("Profile updated successfully!");
          setTimeout(() => setSuccessMessage(null), 3000);
          closeModal();
        } else {
          setErrorMessage("Failed to update profile");
          setTimeout(() => setErrorMessage(null), 3000);
        }
      } else {
        setSuccessMessage("No changes to save");
        setTimeout(() => setSuccessMessage(null), 3000);
        closeModal();
      }
    } catch (error) {
      console.error('Update error:', error);
      setErrorMessage("Failed to update profile");
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteField = async (fieldName: string, currentValue: string) => {
    if (!currentValue) return;
    if (window.confirm(`Are you sure you want to delete your ${fieldName}?`)) {
      const success = await deleteProfileField(fieldName);
      if (success) {
        setSuccessMessage(`${fieldName} deleted successfully`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage(`Failed to delete ${fieldName}`);
        setTimeout(() => setErrorMessage(null), 3000);
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl lg:p-6 bg-white">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated - return null (redirect will happen)
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="p-5 border border-gray-200 rounded-2xl lg:p-6 bg-white">
      {successMessage && (
        <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 rounded-lg">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
          {errorMessage}
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          {/* Profile Picture */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              {profilePreview ? (
                <img src={profilePreview} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-green-500" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-2xl font-semibold text-green-600">
                    {user.full_name?.charAt(0) || user.mobile_number?.charAt(0) || 'U'}
                  </span>
                </div>
              )}
              <label htmlFor="profile-picture-upload" className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1 cursor-pointer hover:bg-green-600">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input id="profile-picture-upload" type="file" accept="image/*" className="hidden" onChange={handleProfilePictureUpload} />
              </label>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-green-600">{user.full_name || user.mobile_number}</h4>
              <p className="text-sm text-gray-500">Member since {new Date(user.date_joined).toLocaleDateString()}</p>
            </div>
          </div>

          <h4 className="text-lg font-semibold text-gray-800 lg:mb-6">Personal Information</h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs text-gray-500">Full Name</p>
              <p className="text-sm font-medium text-green-600">{user.full_name || "Not provided"}</p>
            </div>
            <div>
              <p className="mb-2 text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium text-green-600">{user.email || "Not provided"}</p>
            </div>
            <div>
              <p className="mb-2 text-xs text-gray-500">Phone</p>
              <p className="text-sm font-medium text-green-600">{user.mobile_number || "Not provided"}</p>
            </div>
            <div>
              <p className="mb-2 text-xs text-gray-500">Bio</p>
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-green-600">{profileData?.bio || "No bio added"}</p>
                <div className="flex gap-2">
                  <button onClick={() => openModal()} className="text-xs text-green-600 hover:text-green-700">Edit</button>
                  {profileData?.bio && <button onClick={() => handleDeleteField("bio", profileData.bio)} className="text-xs text-red-500 hover:text-red-600">Delete</button>}
                </div>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs text-gray-500">Location</p>
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-green-600">{profileData?.location || "No location added"}</p>
                <div className="flex gap-2">
                  <button onClick={() => openModal()} className="text-xs text-green-600 hover:text-green-700">Edit</button>
                  {profileData?.location && <button onClick={() => handleDeleteField("location", profileData.location)} className="text-xs text-red-500 hover:text-red-600">Delete</button>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <button onClick={openModal} className="flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 lg:w-auto">
          <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206Z" fill="currentColor"/>
          </svg>
          Edit
        </button>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="bg-white rounded-3xl p-4 lg:p-11">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800">Edit Personal Information</h4>
          <p className="mb-6 text-sm text-gray-500">Update your details to keep your profile up-to-date.</p>
          
          <div className="space-y-6">
            <div>
              <Label className="text-gray-700">Full Name <span className="text-red-500">*</span></Label>
              <Input 
                type="text" 
                value={formData.full_name} 
                onChange={(e) => handleInputChange("full_name", e.target.value)}
                className="text-gray-900 bg-white border-gray-300 placeholder:text-white focus:ring-green-500 focus:border-green-500"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <Label className="text-gray-700">Location</Label>
              <Input 
                type="text" 
                value={formData.location} 
                onChange={(e) => handleInputChange("location", e.target.value)} 
                placeholder="City, Country"
                className="text-gray-900 bg-white border-gray-300 placeholder:text-white focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <Label className="text-gray-700">Bio</Label>
              <textarea 
                value={formData.bio} 
                onChange={(e) => handleInputChange("bio", e.target.value)} 
                className="w-full px-3 py-2 text-sm border rounded-lg text-gray-900 bg-white border-gray-300 placeholder:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                rows={3} 
                placeholder="Tell something about yourself"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button size="sm" variant="outline" onClick={closeModal} className="text-gray-700">Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-green-500 hover:bg-green-600 text-white">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}