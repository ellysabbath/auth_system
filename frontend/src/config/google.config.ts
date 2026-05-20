// config/google.config.ts

// Google OAuth configuration
export const GoogleConfig = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  redirectUri: 'http://localhost:3000/auth/callback',
  scope: 'email profile openid',
  responseType: 'token',
};

// Initialize Google SDK
export const loadGoogleScript = (): Promise<void> => {
  return new Promise((resolve) => {
    if (document.getElementById('google-script')) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.id = 'google-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
};

export default GoogleConfig;