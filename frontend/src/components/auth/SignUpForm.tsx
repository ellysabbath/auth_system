import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { loadGoogleScript, GoogleConfig } from "../../config/google.config";
import toast from 'react-hot-toast';
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Checkbox from "../../components/form/input/Checkbox";
import Button from "../../components/ui/button/Button";

// Declare Google namespace
interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

interface GoogleAccountsId {
  initialize: (config: any) => void;
  prompt: () => void;
  renderButton: (element: HTMLElement, options: any) => void;
}

interface GoogleAccounts {
  id: GoogleAccountsId;
}

interface Window {
  google?: {
    accounts: GoogleAccounts;
  };
}

declare let window: Window & typeof globalThis;

export default function SignUpForm() {
  const navigate = useNavigate();
  const { register, googleLogin } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirm_password: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    mobile_number: "",
    profile_picture: "",
  });
  
  const [profilePreview, setProfilePreview] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    initializeGoogle();
  }, []);

  const initializeGoogle = async () => {
    await loadGoogleScript();
    
    if (window.google && GoogleConfig.clientId) {
      window.google.accounts.id.initialize({
        client_id: GoogleConfig.clientId,
        callback: (response: GoogleCredentialResponse) => {
          handleGoogleCredentialResponse(response);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        context: 'signup',
      });
    }
  };

  const handleGoogleCredentialResponse = async (response: GoogleCredentialResponse) => {
    setIsLoading(true);
    setError("");
    try {
      await googleLogin(response.credential);
      toast.success('Successfully signed up with Google!');
      navigate('/');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Google sign up failed';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    if (window.google) {
      window.google.accounts.id.prompt();
    } else {
      toast.error('Google service not loaded. Please refresh the page.');
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: "" }));
    }
    if (error) {
      setError("");
    }
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Profile picture must be less than 2MB");
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfilePreview(base64String);
        updateField("profile_picture", base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfilePicture = () => {
    setProfilePreview("");
    updateField("profile_picture", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    
    if (!formData.confirm_password) {
      errors.confirm_password = "Please confirm your password";
    } else if (formData.password !== formData.confirm_password) {
      errors.confirm_password = "Passwords do not match";
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.first_name.trim()) {
      errors.first_name = "First name is required";
    }
    
    if (!formData.last_name.trim()) {
      errors.last_name = "Last name is required";
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
      window.scrollTo(0, 0);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
      window.scrollTo(0, 0);
    } else if (currentStep === 3) {
      setCurrentStep(4);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
    setFieldErrors({});
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isChecked) {
      setError("Please agree to the Terms and Conditions");
      toast.error("Please agree to the Terms and Conditions");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      const randomNum = Math.floor(Math.random() * 90000) + 10000;
      const username = `AC-${randomNum}`;
      
      const registrationData = {
        email: formData.email,
        username: username,
        first_name: formData.first_name,
        middle_name: formData.middle_name || "",
        last_name: formData.last_name,
        mobile_number: formData.mobile_number || "",
        profile_picture: formData.profile_picture || "",
        password: formData.password,
        confirm_password: formData.confirm_password,
      };
      
      await register(registrationData);
      toast.success('Registration successful! Welcome aboard!');
      navigate('/');
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setFieldErrors(err.response.data.errors);
        if (err.response.data.errors.email || err.response.data.errors.username) {
          setCurrentStep(1);
        } else if (err.response.data.errors.first_name || err.response.data.errors.last_name) {
          setCurrentStep(2);
        }
        toast.error("Please fix the errors in the form");
      } else {
        setError(err.response?.data?.error || "Registration failed");
        toast.error(err.response?.data?.error || "Registration failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep >= step ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {step}
            </div>
            {step < 4 && <div className={`w-12 h-1 mx-1 ${currentStep > step ? 'bg-brand-500' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>Account</span>
        <span>Profile</span>
        <span>Picture</span>
        <span>Complete</span>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-5">
      <div>
        <Label>Email <span className="text-error-500">*</span></Label>
        <Input
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e) => updateField("email", e.target.value)}
          disabled={isLoading}
        />
        {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
      </div>
      
      <div>
        <Label>Password <span className="text-error-500">*</span></Label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Create a password (min. 8 characters)"
            value={formData.password}
            onChange={(e) => updateField("password", e.target.value)}
            disabled={isLoading}
          />
          <span
            onClick={() => !isLoading && setShowPassword(!showPassword)}
            className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
          >
            {showPassword ? <EyeIcon className="size-5" /> : <EyeCloseIcon className="size-5" />}
          </span>
        </div>
        {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
      </div>
      
      <div>
        <Label>Confirm Password <span className="text-error-500">*</span></Label>
        <div className="relative">
          <Input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            value={formData.confirm_password}
            onChange={(e) => updateField("confirm_password", e.target.value)}
            disabled={isLoading}
          />
          <span
            onClick={() => !isLoading && setShowConfirmPassword(!showConfirmPassword)}
            className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
          >
            {showConfirmPassword ? <EyeIcon className="size-5" /> : <EyeCloseIcon className="size-5" />}
          </span>
        </div>
        {fieldErrors.confirm_password && <p className="text-red-500 text-xs mt-1">{fieldErrors.confirm_password}</p>}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <Label>First Name <span className="text-error-500">*</span></Label>
          <Input
            type="text"
            placeholder="Enter your first name"
            value={formData.first_name}
            onChange={(e) => updateField("first_name", e.target.value)}
            disabled={isLoading}
          />
          {fieldErrors.first_name && <p className="text-red-500 text-xs mt-1">{fieldErrors.first_name}</p>}
        </div>
        
        <div>
          <Label>Last Name <span className="text-error-500">*</span></Label>
          <Input
            type="text"
            placeholder="Enter your last name"
            value={formData.last_name}
            onChange={(e) => updateField("last_name", e.target.value)}
            disabled={isLoading}
          />
          {fieldErrors.last_name && <p className="text-red-500 text-xs mt-1">{fieldErrors.last_name}</p>}
        </div>
      </div>
      
      <div>
        <Label>Middle Name (Optional)</Label>
        <Input
          type="text"
          placeholder="Enter your middle name"
          value={formData.middle_name}
          onChange={(e) => updateField("middle_name", e.target.value)}
          disabled={isLoading}
        />
      </div>
      
      <div>
        <Label>Mobile Number (Optional)</Label>
        <Input
          type="tel"
          placeholder="+1234567890"
          value={formData.mobile_number}
          onChange={(e) => updateField("mobile_number", e.target.value)}
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +1234567890)</p>
        {fieldErrors.mobile_number && <p className="text-red-500 text-xs mt-1">{fieldErrors.mobile_number}</p>}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          {profilePreview ? (
            <div className="relative">
              <img
                src={profilePreview}
                alt="Profile Preview"
                className="w-32 h-32 rounded-full object-cover border-4 border-brand-500"
              />
              <button
                type="button"
                onClick={removeProfilePicture}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-dashed border-gray-400">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>
        
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleProfilePictureUpload}
            className="hidden"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {profilePreview ? "Change Photo" : "Upload Photo"}
          </button>
        </div>
        
        <p className="text-xs text-gray-500 text-center">
          Upload a profile picture (optional).<br />
          Max size: 2MB. Supported formats: JPG, PNG, GIF
        </p>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-5">
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="font-semibold mb-3">Review Your Information</h3>
        <div className="space-y-2 text-sm">
          {profilePreview && (
            <div className="flex justify-center mb-3">
              <img src={profilePreview} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
            </div>
          )}
          <p><strong>Email:</strong> {formData.email}</p>
          <p><strong>Name:</strong> {formData.first_name} {formData.middle_name} {formData.last_name}</p>
          {formData.mobile_number && <p><strong>Mobile:</strong> {formData.mobile_number}</p>}
          <p className="text-xs text-gray-500 mt-2">
            <strong>Note:</strong> Your username will be automatically generated as AC-XXXXX (e.g., AC-12345)
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Checkbox checked={isChecked} onChange={setIsChecked} disabled={isLoading} />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          By creating an account, you agree to the Terms and Conditions and Privacy Policy
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link to="/" className="inline-flex items-center text-sm text-gray-500">
          <ChevronLeftIcon className="size-5" />
          Back to dashboard
        </Link>
      </div>
      
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto pb-10">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm sm:text-title-md">
              Create an Account
            </h1>
            <p className="text-sm text-gray-500">
              {currentStep === 1 && "Enter your email and password to get started!"}
              {currentStep === 2 && "Tell us about yourself"}
              {currentStep === 3 && "Add a profile picture (optional)"}
              {currentStep === 4 && "Review and complete registration"}
            </p>
          </div>

          {error && currentStep !== 4 && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}
          
          {renderStepIndicator()}
          
          <div>
            {currentStep === 1 && (
              <>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={handleGoogleSignUp}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-gray-700 bg-gray-100 rounded-lg px-7 hover:bg-gray-200 disabled:opacity-50"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M18.7511 10.1944C18.7511 9.47495 18.6915 8.94995 18.5626 8.40552H10.1797V11.6527H15.1003C15.0011 12.4597 14.4654 13.675 13.2749 14.4916L13.2582 14.6003L15.9087 16.6126L16.0924 16.6305C17.7788 15.1041 18.7511 12.8583 18.7511 10.1944Z" fill="#4285F4"/>
                      <path d="M10.1788 18.75C12.5895 18.75 14.6133 17.9722 16.0915 16.6305L13.274 14.4916C12.5201 15.0068 11.5081 15.3666 10.1788 15.3666C7.81773 15.3666 5.81379 13.8402 5.09944 11.7305L4.99473 11.7392L2.23868 13.8295L2.20264 13.9277C3.67087 16.786 6.68674 18.75 10.1788 18.75Z" fill="#34A853"/>
                      <path d="M5.10014 11.7305C4.91165 11.186 4.80257 10.6027 4.80257 9.99992C4.80257 9.3971 4.91165 8.81379 5.09022 8.26935L5.08523 8.1534L2.29464 6.02954L2.20333 6.0721C1.5982 7.25823 1.25098 8.5902 1.25098 9.99992C1.25098 11.4096 1.5982 12.7415 2.20333 13.9277L5.10014 11.7305Z" fill="#FBBC05"/>
                      <path d="M10.1789 4.63331C11.8554 4.63331 12.9864 5.34303 13.6312 5.93612L16.1511 3.525C14.6035 2.11528 12.5895 1.25 10.1789 1.25C6.68676 1.25 3.67088 3.21387 2.20264 6.07218L5.08953 8.26943C5.81381 6.15972 7.81776 4.63331 10.1789 4.63331Z" fill="#EB4335"/>
                    </svg>
                    {isLoading ? "Signing up..." : "Sign up with Google"}
                  </button>
                </div>
                
                <div className="relative py-3 sm:py-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="p-2 text-gray-400 bg-white">Or sign up with email</span>
                  </div>
                </div>
              </>
            )}
            
            <form onSubmit={(e) => e.preventDefault()}>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}
              
              <div className="flex gap-3 mt-6">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={isLoading}
                    className="flex items-center justify-center w-1/2 px-4 py-3 text-sm font-medium text-gray-700 rounded-lg bg-gray-100 hover:bg-gray-200"
                  >
                    Back
                  </button>
                )}
                
                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={isLoading}
                    className={`flex items-center justify-center px-4 py-3 text-sm font-medium text-white rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 ${currentStep > 1 ? 'w-1/2' : 'w-full'}`}
                  >
                    Continue
                  </button>
                ) : (
                  <Button className="w-full" size="sm" onClick={handleSubmit} disabled={isLoading}>
                    {isLoading ? "Creating Account..." : "Sign Up"}
                  </Button>
                )}
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700">
                Already have an account?{" "}
                <Link to="/signin" className="text-brand-500 hover:text-brand-600">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}