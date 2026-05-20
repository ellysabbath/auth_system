import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.43.32:8000/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      this.token = savedToken;
    }
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('auth_token');
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }

  // ============ AUTHENTICATION METHODS ============
  
  async register(userData: any) {
    const response = await axios.post(`${API_BASE_URL}/register/`, userData, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (response.data.token) {
      this.setToken(response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async login(identifier: string, password: string) {
    const response = await axios.post(`${API_BASE_URL}/login/`, { identifier, password });
    if (response.data.token) {
      this.setToken(response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async googleLogin(accessToken: string) {
    const response = await axios.post(`${API_BASE_URL}/google-auth/`, { access_token: accessToken });
    if (response.data.token) {
      this.setToken(response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async logout() {
    try {
      await axios.post(`${API_BASE_URL}/logout/`, {}, {
        headers: { Authorization: `Bearer ${this.getToken()}` }
      });
    } finally {
      this.clearToken();
    }
  }

  // ============ PROFILE METHODS ============

  async getProfile() {
    const response = await axios.get(`${API_BASE_URL}/profile/`, {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
    return response.data;
  }

  async updateProfile(data: any) {
    const response = await axios.put(`${API_BASE_URL}/profile/update/`, data, {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async uploadProfilePicture(profilePicture: string) {
    const response = await axios.post(`${API_BASE_URL}/upload-profile-picture/`, 
      { profile_picture: profilePicture },
      {
        headers: { 
          Authorization: `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        }
      }
    );
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async changePassword(data: any) {
    const response = await axios.post(`${API_BASE_URL}/change-password/`, data, {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
    return response.data;
  }

  // ============ ADDRESS METHODS ============

  async getAddress() {
    const response = await axios.get(`${API_BASE_URL}/address/`, {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
    return response.data;
  }

  async createAddress(addressData: any) {
    const response = await axios.post(`${API_BASE_URL}/address/create/`, addressData, {
      headers: { 
        Authorization: `Bearer ${this.getToken()}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  }

  async updateAddress(addressData: any) {
    const response = await axios.put(`${API_BASE_URL}/address/update/`, addressData, {
      headers: { 
        Authorization: `Bearer ${this.getToken()}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  }

  async deleteAddress() {
    const response = await axios.delete(`${API_BASE_URL}/address/delete/`, {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
    return response.data;
  }

  // ============ SESSION METHODS ============

  async getSessions() {
    const response = await axios.get(`${API_BASE_URL}/sessions/`, {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
    return response.data;
  }

  async revokeSession(sessionId: string) {
    const response = await axios.delete(`${API_BASE_URL}/sessions/${sessionId}/revoke/`, {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
    return response.data;
  }

  // ============ PQC METHODS ============

  async pqcEncrypt(data: string) {
    const response = await axios.post(`${API_BASE_URL}/pqc-encrypt/`, { data }, {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
    return response.data;
  }
}

export default new ApiService();