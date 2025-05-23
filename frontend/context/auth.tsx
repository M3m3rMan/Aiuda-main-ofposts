// app/context/auth.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { Alert } from 'react-native';

interface User {
  email: string;
  id: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  signUp: (email: string, password: string) => Promise<void>;
  backendConnected: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);
  const BACKEND_URL = 'http://192.168.1.78:3001';

  const checkBackendConnection = async () => {
    try {
      await axios.get(`${BACKEND_URL}/api/schools`, { timeout: 5000 });
      setBackendConnected(true);
      return true;
    } catch (error) {
      console.error('Backend connection failed:', error);
      setBackendConnected(false);
      return false;
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      const isConnected = await checkBackendConnection();
      if (!isConnected) {
        setIsLoading(false);
        return;
      }

      try {
        const userJson = await SecureStore.getItemAsync('user');
        if (userJson) {
          setUser(JSON.parse(userJson));
          router.replace('/(tabs)');
        } else {
          router.replace('/signup');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        router.replace('/signup');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${BACKEND_URL}/api/login`, {
        email,
        password
      }, { timeout: 10000 });
      
      const userData = response.data.user;
      await SecureStore.setItemAsync('user', JSON.stringify(userData));
      setUser(userData);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = (error as any).response?.data?.message || 'Login failed';
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await SecureStore.deleteItemAsync('user');
      setUser(null);
      router.replace('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${BACKEND_URL}/api/signup`, {
        email,
        password
      }, { timeout: 10000 });
      
      const userData = response.data.user;
      await SecureStore.setItemAsync('user', JSON.stringify(userData));
      setUser(userData);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = (error as any).response?.data?.message || 'Signup failed';
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      signIn, 
      signOut, 
      signUp,
      backendConnected
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}