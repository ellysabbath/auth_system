import { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useUser, Address } from "../../context/UserContext";
import toast from "react-hot-toast";

export default function UserAddressCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const { user, updateAddress, createAddress, deleteAddress, isLoading } = useUser();
  
  // Form state for editing
  const [formData, setFormData] = useState({
    country: "",
    street_address: "",
    apartment: "",
    city: "",
    state: "",
    postal_code: "",
    tax_id: "",
    is_billing_address: true,
    is_shipping_address: true,
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [address, setAddress] = useState<Address | null>(null);

  // Load address data when component mounts or user changes
  useEffect(() => {
    if (user?.address) {
      setAddress(user.address);
      setFormData({
        country: user.address.country || "",
        street_address: user.address.street_address || "",
        apartment: user.address.apartment || "",
        city: user.address.city || "",
        state: user.address.state || "",
        postal_code: user.address.postal_code || "",
        tax_id: user.address.tax_id || "",
        is_billing_address: user.address.is_billing_address !== undefined ? user.address.is_billing_address : true,
        is_shipping_address: user.address.is_shipping_address !== undefined ? user.address.is_shipping_address : true,
      });
    } else {
      // Reset form when no address exists
      setAddress(null);
      setFormData({
        country: "",
        street_address: "",
        apartment: "",
        city: "",
        state: "",
        postal_code: "",
        tax_id: "",
        is_billing_address: true,
        is_shipping_address: true,
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (formData.postal_code && !/^[A-Z0-9\s-]{3,10}$/i.test(formData.postal_code)) {
      errors.postal_code = "Please enter a valid postal code";
    }
    
    if (formData.tax_id && formData.tax_id.length < 5) {
      errors.tax_id = "Please enter a valid Tax ID";
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }
    
    setIsSaving(true);
    
    try {
      const addressData = {
        country: formData.country,
        street_address: formData.street_address,
        apartment: formData.apartment,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code,
        tax_id: formData.tax_id,
        is_billing_address: formData.is_billing_address,
        is_shipping_address: formData.is_shipping_address,
      };
      
      if (address) {
        // Update existing address
        await updateAddress(addressData);
      } else {
        // Create new address
        await createAddress(addressData);
      }
      
      toast.success(address ? "Address updated successfully!" : "Address saved successfully!");
      closeModal();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "Failed to save address";
      toast.error(errorMsg);
      
      // Handle field-specific errors
      if (error.response?.data?.errors) {
        setFieldErrors(error.response.data.errors);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!address) return;
    
    const confirmDelete = window.confirm("Are you sure you want to delete your address?");
    if (!confirmDelete) return;
    
    setIsDeleting(true);
    
    try {
      await deleteAddress();
      toast.success("Address deleted successfully!");
      closeModal();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "Failed to delete address";
      toast.error(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = () => {
    openModal();
  };

  // Get display values
  const getFullAddress = () => {
    if (address?.full_address) {
      return address.full_address;
    }
    const parts = [];
    if (formData.street_address) parts.push(formData.street_address);
    if (formData.apartment) parts.push(formData.apartment);
    if (formData.city) parts.push(formData.city);
    if (formData.state) parts.push(formData.state);
    if (formData.postal_code) parts.push(formData.postal_code);
    if (formData.country) parts.push(formData.country);
    return parts.length > 0 ? parts.join(", ") : "No address provided";
  };

  // Show loading state while user data is being fetched
  if (isLoading) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading address...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Address Information
            </h4>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div className="lg:col-span-2">
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Full Address
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {getFullAddress()}
                </p>
              </div>

              {address?.street_address && (
                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                    Street Address
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {address.street_address}
                  </p>
                </div>
              )}

              {address?.apartment && (
                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                    Apartment/Suite
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {address.apartment}
                  </p>
                </div>
              )}

              {address?.city && (
                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                    City
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {address.city}
                  </p>
                </div>
              )}

              {address?.state && (
                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                    State/Province
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {address.state}
                  </p>
                </div>
              )}

              {address?.country && (
                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                    Country
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {address.country}
                  </p>
                </div>
              )}

              {address?.postal_code && (
                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                    Postal Code
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {address.postal_code}
                  </p>
                </div>
              )}

              {address?.tax_id && (
                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                    Tax ID / VAT Number
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {address.tax_id}
                  </p>
                </div>
              )}

              {address && (
                <>
                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Billing Address
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {address.is_billing_address ? "Yes" : "No"}
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Shipping Address
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {address.is_shipping_address ? "Yes" : "No"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <button
            onClick={openEditModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                fill=""
              />
            </svg>
            {address ? "Edit Address" : "Add Address"}
          </button>
        </div>
      </div>

      {/* Edit/Create Address Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {address ? "Edit Address" : "Add Address"}
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              {address ? "Update your address details" : "Add your address information"}
            </p>
          </div>
          
          <form className="flex flex-col">
            <div className="px-2 overflow-y-auto custom-scrollbar max-h-[450px]">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <Label>Street Address</Label>
                  <Input
                    type="text"
                    placeholder="Street address"
                    value={formData.street_address}
                    onChange={(e) => handleInputChange("street_address", e.target.value)}
                  />
                </div>

                <div>
                  <Label>Apartment/Suite (Optional)</Label>
                  <Input
                    type="text"
                    placeholder="Apartment, suite, etc."
                    value={formData.apartment}
                    onChange={(e) => handleInputChange("apartment", e.target.value)}
                  />
                </div>

                <div>
                  <Label>City</Label>
                  <Input
                    type="text"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                  />
                </div>

                <div>
                  <Label>State/Province</Label>
                  <Input
                    type="text"
                    placeholder="State or Province"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                  />
                </div>

                <div>
                  <Label>Postal Code</Label>
                  <Input
                    type="text"
                    placeholder="Postal code"
                    value={formData.postal_code}
                    onChange={(e) => handleInputChange("postal_code", e.target.value)}
                    error={!!fieldErrors.postal_code}
                  />
                  {fieldErrors.postal_code && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.postal_code}</p>
                  )}
                </div>

                <div>
                  <Label>Country</Label>
                  <Input
                    type="text"
                    placeholder="Country"
                    value={formData.country}
                    onChange={(e) => handleInputChange("country", e.target.value)}
                  />
                </div>

                <div>
                  <Label>Tax ID / VAT Number (Optional)</Label>
                  <Input
                    type="text"
                    placeholder="Tax ID or VAT number"
                    value={formData.tax_id}
                    onChange={(e) => handleInputChange("tax_id", e.target.value)}
                    error={!!fieldErrors.tax_id}
                  />
                  {fieldErrors.tax_id && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.tax_id}</p>
                  )}
                </div>

                <div className="lg:col-span-2">
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_billing_address}
                        onChange={(e) => handleInputChange("is_billing_address", e.target.checked)}
                        className="w-4 h-4 text-brand-500 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Use as Billing Address
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_shipping_address}
                        onChange={(e) => handleInputChange("is_shipping_address", e.target.checked)}
                        className="w-4 h-4 text-brand-500 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Use as Shipping Address
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-3 px-2 mt-6">
              <div className="flex gap-3">
                <Button size="sm" variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : (address ? "Update Address" : "Save Address")}
                </Button>
              </div>
              {address && (
                <Button 
                  size="sm" 
                  variant="danger" 
                  onClick={handleDelete} 
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeleting ? "Deleting..." : "Delete Address"}
                </Button>
              )}
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}