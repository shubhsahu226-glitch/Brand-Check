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
        const refreshRes = await api.post('/auth/refresh');
        const token =
          refreshRes.data?.accessToken || refreshRes.data?.data?.accessToken;
        setAuthToken(token);

        // Fetch full profile and active workspace
        const meRes = await api.get('/auth/me');
        const meData = meRes.data?.data || meRes.data;

        setUser(meData.user);
        const wsList = meData.workspaces || (meData.workspace ? [meData.workspace] : []);
        setWorkspaces(wsList);
        if (meData.workspace) {
          setCurrentWorkspace(meData.workspace);
        } else if (wsList.length > 0) {
          setCurrentWorkspace(wsList[0]);
        }
      } catch (_err) {
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

  const signup = async ({ name, email, password, workspaceName }) => {
    try {
      const response = await api.post('/auth/signup', {
        name,
        email,
        password,
        workspaceName,
      });
      const data = response.data?.data || response.data;
      const { user: newUser, workspace, accessToken } = data;

      setAuthToken(accessToken);
      setUser(newUser);
      const ws = {
        id: workspace.id,
        name: workspace.name,
        role: workspace.role || 'ADMIN',
      };
      setWorkspaces([ws]);
      setCurrentWorkspace(ws);

      toast.success('Account and workspace created successfully!');
      return { success: true, user: newUser, workspace: ws };
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Failed to create account';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const login = async ({ email, password }) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const data = response.data?.data || response.data;
      const { user: loggedInUser, workspace, workspaces: userWorkspaces, accessToken } =
        data;

      setAuthToken(accessToken);
      setUser(loggedInUser);
      const wsList = userWorkspaces || (workspace ? [workspace] : []);
      setWorkspaces(wsList);
      if (workspace) {
        setCurrentWorkspace(workspace);
      } else if (wsList.length > 0) {
        setCurrentWorkspace(wsList[0]);
      }

      toast.success(`Welcome back, ${loggedInUser.name}!`);
      return {
        success: true,
        user: loggedInUser,
        workspace: workspace || wsList[0],
      };
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const demoLogin = async (role) => {
    try {
      const response = await api.post('/auth/demo-login', { role });
      const data = response.data?.data || response.data;
      const { user: demoUser, workspace, accessToken } = data;

      setAuthToken(accessToken);
      setUser(demoUser);
      const ws = {
        id: workspace.id,
        name: workspace.name,
        role: workspace.role || role,
      };
      setWorkspaces([ws]);
      setCurrentWorkspace(ws);

      toast.success(`Demo Access: Signed in as ${demoUser.name} (${role})!`);
      return { success: true, user: demoUser, workspace: ws };
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Demo login failed. Please ensure the backend server is running.';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const setSession = ({ user: newUser, workspace: newWorkspace, accessToken }) => {
    setAuthToken(accessToken);
    setUser(newUser);
    if (newWorkspace) {
      setCurrentWorkspace(newWorkspace);
      setWorkspaces([newWorkspace]);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (_error) {
      // Ignore logout errors
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
      const meRes = await api.get('/auth/me');
      const meData = meRes.data?.data || meRes.data;

      setUser(meData.user);
      const wsList =
        meData.workspaces || (meData.workspace ? [meData.workspace] : []);
      setWorkspaces(wsList);

      if (targetWorkspaceId) {
        const target = wsList.find((w) => w.id === targetWorkspaceId);
        if (target) {
          setCurrentWorkspace(target);
          return;
        }
      }

      if (meData.workspace) {
        setCurrentWorkspace(meData.workspace);
      } else if (wsList.length > 0) {
        if (
          !currentWorkspace ||
          !wsList.some((w) => w.id === currentWorkspace.id)
        ) {
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
    demoLogin,
    setSession,
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
