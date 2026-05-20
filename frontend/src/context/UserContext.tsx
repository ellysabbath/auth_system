import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiService from '../services/api';
import toast from 'react-hot-toast';

// ============ INTERFACES ============

export interface Address {
  id: string;
  country: string;
  street_address: string;
  apartment: string;
  city: string;
  state: string;
  postal_code: string;
  tax_id: string;
  is_billing_address: boolean;
  is_shipping_address: boolean;
  full_address: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  full_name: string;
  mobile_number?: string;
  profile_picture?: string;
  address?: Address;
  created_at: string;
  last_login?: string;
  is_active: boolean;
}

export interface RegistrationData {
  email: string;
  username?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  mobile_number?: string;
  profile_picture?: string;
  password: string;
  confirm_password: string;
}

export interface UpdateProfileData {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  mobile_number?: string;
  profile_picture?: string;
}

export interface UpdateAddressData {
  country?: string;
  street_address?: string;
  apartment?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  tax_id?: string;
  is_billing_address?: boolean;
  is_shipping_address?: boolean;
}

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

export interface Session {
  id: string;
  created_at: string;
  expires_at: string;
  last_used_at: string;
  is_active: boolean;
}

interface UserContextType {
  // State
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessions: Session[];
  error: string | null;
  
  // Authentication Methods
  login: (identifier: string, password: string) => Promise<void>;
  register: (userData: RegistrationData) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  
  // Profile Methods
  getProfile: () => Promise<User | null>;
  updateProfile: (data: UpdateProfileData) => Promise<User | null>;
  uploadProfilePicture: (profilePicture: string) => Promise<void>;
  changePassword: (data: ChangePasswordData) => Promise<void>;
  
  // Address Methods
  getAddress: () => Promise<Address | null>;
  createAddress: (data: UpdateAddressData) => Promise<Address | null>;
  updateAddress: (data: UpdateAddressData) => Promise<Address | null>;
  deleteAddress: () => Promise<void>;
  
  // Session Methods
  getSessions: () => Promise<Session[]>;
  
  // PQC Methods
  pqcEncrypt: (data: string) => Promise<any>;
  
  // Helper Methods
  clearError: () => void;
}

// ============ CREATE CONTEXT ============

const UserContext = createContext<UserContextType | undefined>(undefined);

// ============ PROVIDER PROPS ============

interface UserProviderProps {
  children: ReactNode;
}

// ============ USER PROVIDER COMPONENT ============

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ============ INITIALIZATION ============

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  const loadUser = async () => {
    const token = apiService.getToken();
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        await apiService.getProfile();
      } catch (error) {
        apiService.clearToken();
        setUser(null);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  };

  const loadSessions = async () => {
    try {
      const response = await apiService.getSessions();
      if (response.success && response.sessions) {
        setSessions(response.sessions);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const clearError = () => {
    setError(null);
  };

  // ============ AUTHENTICATION METHODS ============

  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.login(identifier, password);
      if (response.success && response.user) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        toast.success(response.message || 'Login successful!');
        await loadSessions();
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Login failed';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegistrationData) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!userData.username) {
        const randomNum = Math.floor(Math.random() * 90000) + 10000;
        userData.username = `AC-${randomNum}`;
      }
      
      const response = await apiService.register(userData);
      if (response.success && response.user) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        toast.success(response.message || 'Registration successful!');
        await loadSessions();
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.errors || err.response?.data?.error || err.message || 'Registration failed';
      setError(typeof errorMsg === 'string' ? errorMsg : 'Validation failed');
      if (typeof errorMsg !== 'string') {
        throw { response: { data: { errors: errorMsg } } };
      }
      toast.error(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (credential: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.googleLogin(credential);
      if (response.success && response.user) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        const message = response.is_new_user 
          ? 'Account created successfully with Google!' 
          : 'Login successful with Google!';
        toast.success(message);
        await loadSessions();
      } else {
        throw new Error(response.message || 'Google login failed');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Google login failed';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiService.logout();
      setUser(null);
      setSessions([]);
      localStorage.removeItem('user');
      toast.success('Logged out successfully');
    } catch (err: any) {
      console.error('Logout error:', err);
      setUser(null);
      setSessions([]);
      localStorage.removeItem('user');
      apiService.clearToken();
    } finally {
      setIsLoading(false);
    }
  };

  // ============ PROFILE METHODS ============

  const getProfile = async (): Promise<User | null> => {
    setIsLoading(true);
    try {
      const response = await apiService.getProfile();
      if (response.success && response.user) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        return response.user;
      }
      return null;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to load profile';
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: UpdateProfileData): Promise<User | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.updateProfile(data);
      if (response.success && response.user) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        toast.success('Profile updated successfully');
        return response.user;
      }
      return null;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to update profile';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadProfilePicture = async (profilePicture: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.uploadProfilePicture(profilePicture);
      if (response.success && response.user) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        toast.success('Profile picture updated successfully');
      } else {
        throw new Error(response.message || 'Failed to upload profile picture');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to upload profile picture';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (data: ChangePasswordData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.changePassword(data);
      if (response.success) {
        toast.success(response.message || 'Password changed successfully');
      } else {
        throw new Error(response.message || 'Failed to change password');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to change password';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ============ ADDRESS METHODS ============

  const getAddress = async (): Promise<Address | null> => {
    try {
      const response = await apiService.getAddress();
      if (response.success && response.address) {
        return response.address;
      }
      return null;
    } catch (err: any) {
      console.error('Failed to get address:', err);
      return null;
    }
  };

  const createAddress = async (data: UpdateAddressData): Promise<Address | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.createAddress(data);
      if (response.success && response.address) {
        if (user) {
          const updatedUser = { ...user, address: response.address };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        toast.success(response.message || 'Address saved successfully');
        return response.address;
      }
      return null;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to save address';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAddress = async (data: UpdateAddressData): Promise<Address | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.updateAddress(data);
      if (response.success && response.address) {
        if (user) {
          const updatedUser = { ...user, address: response.address };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        toast.success(response.message || 'Address updated successfully');
        return response.address;
      }
      return null;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to update address';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAddress = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.deleteAddress();
      if (response.success) {
        if (user) {
          const updatedUser = { ...user, address: undefined };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        toast.success(response.message || 'Address deleted successfully');
      } else {
        throw new Error(response.message || 'Failed to delete address');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to delete address';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ============ SESSION METHODS ============

  const getSessions = async (): Promise<Session[]> => {
    try {
      const response = await apiService.getSessions();
      if (response.success && response.sessions) {
        setSessions(response.sessions);
        return response.sessions;
      }
      return [];
    } catch (err: any) {
      console.error('Failed to get sessions:', err);
      return [];
    }
  };

  // ============ PQC METHODS ============

  const pqcEncrypt = async (data: string) => {
    try {
      const response = await apiService.pqcEncrypt(data);
      if (response.success) {
        return response.encrypted;
      }
      throw new Error(response.message || 'Encryption failed');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Encryption failed';
      toast.error(errorMsg);
      throw err;
    }
  };

  // ============ CONTEXT VALUE ============

  const value: UserContextType = {
    // State
    user,
    isLoading,
    isAuthenticated: !!user,
    sessions,
    error,
    
    // Authentication Methods
    login,
    register,
    googleLogin,
    logout,
    
    // Profile Methods
    getProfile,
    updateProfile,
    uploadProfilePicture,
    changePassword,
    
    // Address Methods
    getAddress,
    createAddress,
    updateAddress,
    deleteAddress,
    
    // Session Methods
    getSessions,
    
    // PQC Methods
    pqcEncrypt,
    
    // Helper Methods
    clearError,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// ============ CUSTOM HOOK ============

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};