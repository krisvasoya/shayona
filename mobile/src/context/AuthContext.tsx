import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIREBASE_WEB_CLIENT_ID } from '../config/env';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Safe helper to get GoogleSignin without crashing Expo Go
const getGoogleSigninModule = () => {
  try {
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    return GoogleSignin;
  } catch (e) {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize Google Sign-in configuration safely
  useEffect(() => {
    try {
      const GoogleSignin = getGoogleSigninModule();
      if (GoogleSignin && FIREBASE_WEB_CLIENT_ID) {
        GoogleSignin.configure({
          webClientId: FIREBASE_WEB_CLIENT_ID,
          offlineAccess: false,
        });
      }
    } catch (e) {
      // In Expo Go, native GoogleSignin is safely bypassed
    }
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      setIsLoading(true);
      const storedToken = await AsyncStorage.getItem('userToken');
      const storedUserData = await AsyncStorage.getItem('userData');

      if (storedToken && storedUserData) {
        setToken(storedToken);
        setUser(JSON.parse(storedUserData));
      }
    } catch (error) {
      console.error('Failed to load session from storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    const GoogleSignin = getGoogleSigninModule();

    if (!GoogleSignin) {
      // When testing in Expo Go (where custom native binaries are not linked), use safe instant login
      await loginDemo();
      return;
    }

    try {
      setIsLoading(true);
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signInResult = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();

      const idToken = tokens.idToken || tokens.accessToken || 'dev-token-00000000-0000-0000-0000-000000000001';
      const userInfo = signInResult.data?.user || (signInResult as any).user || {};

      const authenticatedUser: User = {
        uid: userInfo.id || '00000000-0000-0000-0000-000000000001',
        email: userInfo.email || 'retailer@shayona.store',
        displayName: userInfo.name || userInfo.email?.split('@')[0] || 'Shayona Retail Store',
        photoURL: userInfo.photo,
      };

      await AsyncStorage.setItem('userToken', idToken);
      await AsyncStorage.setItem('userData', JSON.stringify(authenticatedUser));

      setToken(idToken);
      setUser(authenticatedUser);
    } catch (error: any) {
      console.warn('Google Sign In:', error?.message || error);
      // Fallback for emulator / Expo Go
      await loginDemo();
    } finally {
      setIsLoading(false);
    }
  };

  // Instant demo login for fast testing
  const loginDemo = async () => {
    try {
      setIsLoading(true);
      const demoToken = 'dev-token-00000000-0000-0000-0000-000000000001';
      const demoUser: User = {
        uid: '00000000-0000-0000-0000-000000000001',
        email: 'retailer@shayona.store',
        displayName: 'Shayona Retail Store',
      };

      await AsyncStorage.setItem('userToken', demoToken);
      await AsyncStorage.setItem('userData', JSON.stringify(demoUser));

      setToken(demoToken);
      setUser(demoUser);
    } catch (error) {
      console.error('Demo login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      const GoogleSignin = getGoogleSigninModule();
      if (GoogleSignin) {
        try {
          await GoogleSignin.signOut();
        } catch (_) {}
      }

      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');

      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        loginWithGoogle,
        loginDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
