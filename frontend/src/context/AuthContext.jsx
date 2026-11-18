import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { setAuthToken, getAuthToken } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session by attempting token refresh on initial load
  useEffect(() => {
    async function initAuth() {
      try {
        const { data: refreshData } = await api.post('/auth/refresh');
        const token = refreshData.data.accessToken;
        setAuthToken(token);

        // Fetch full profile and workspaces
        const { data: meData } = await api.get('/auth/me');
        setUser(meData.data.user);
        setWorkspaces(meData.data.workspaces || []);
        if (meData.data.workspaces && meData.data.workspaces.length > 0) {
          setCurrentWorkspace(meData.data.workspaces[0]);
        }
      } catch (err) {
        setAuthToken(null);
        setUser(null);
        setWorkspaces([]);
        setCurrentWorkspace(null);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const signup = async ({ name, email, password }) => {
    try {
      const response = await api.post('/auth/signup', { name, email, password });
      const { user: newUser, workspace, accessToken } = response.data.data;

      setAuthToken(accessToken);
      setUser(newUser);
      const wsList = [{ id: workspace.id, name: workspace.name, role: newUser.role }];
      setWorkspaces(wsList);
      setCurrentWorkspace(wsList[0]);

      toast.success('Account and workspace created successfully!');
      return { success: true, user: newUser, workspace };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create account';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const login = async ({ email, password }) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: loggedInUser, workspaces: userWorkspaces, accessToken } = response.data.data;

      setAuthToken(accessToken);
      setUser(loggedInUser);
      setWorkspaces(userWorkspaces || []);
      if (userWorkspaces && userWorkspaces.length > 0) {
        setCurrentWorkspace(userWorkspaces[0]);
      }

      toast.success(`Welcome back, ${loggedInUser.name}!`);
      return { success: true, user: loggedInUser, workspaces: userWorkspaces };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthToken(null);
      setUser(null);
      setWorkspaces([]);
      setCurrentWorkspace(null);
      toast.success('Logged out successfully');
    }
  };

  const refreshUser = async (targetWorkspaceId = null) => {
    try {
      const { data: meData } = await api.get('/auth/me');
      setUser(meData.data.user);
      const wsList = meData.data.workspaces || [];
      setWorkspaces(wsList);
      if (targetWorkspaceId) {
        const target = wsList.find((w) => w.id === targetWorkspaceId);
        if (target) {
          setCurrentWorkspace(target);
          return;
        }
      }
      if (wsList.length > 0) {
        if (!currentWorkspace || !wsList.some((w) => w.id === currentWorkspace.id)) {
          setCurrentWorkspace(wsList[0]);
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const value = {
    user,
    workspaces,
    currentWorkspace,
    setCurrentWorkspace,
    loading,
    signup,
    login,
    logout,
    refreshUser,
    getAccessToken: getAuthToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
