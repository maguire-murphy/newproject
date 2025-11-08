import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiService, User, Organization, LoginRequest, RegisterRequest } from '../services/api';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      if (apiService.isAuthenticated()) {
        const storedUser = apiService.getStoredUser();
        const storedOrg = apiService.getStoredOrganization();
        if (storedUser) {
          setUser(storedUser);
          setOrganization(storedOrg);
          try {
            const response = await apiService.getCurrentUser();
            setUser(response.user);
            if (response.organization) {
              setOrganization(response.organization);
              localStorage.setItem('organization', JSON.stringify(response.organization));
            }
            localStorage.setItem('user', JSON.stringify(response.user));
          } catch (error) {
            console.warn('Failed to refresh user data:', error);
          }
        }
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      apiService.logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      setLoading(true);
      const authResponse = await apiService.login(credentials);
      setUser(authResponse.user);
      if (authResponse.organization) {
        setOrganization(authResponse.organization);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterRequest): Promise<void> => {
    try {
      setLoading(true);
      const authResponse = await apiService.register(userData);
      setUser(authResponse.user);
      if (authResponse.organization) {
        setOrganization(authResponse.organization);
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await apiService.logout();
    setUser(null);
    setOrganization(null);
    window.location.href = '/login';
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const isAuthenticated = !!user && apiService.isAuthenticated();

  const value: AuthContextType = {
    user,
    organization,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;