import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, authToken, LoginRequest } from '@/lib/api';
import { toast } from 'sonner';

const ROLE_KEY = 'auth_role';

export const authRole = {
  get: (): string | null => localStorage.getItem(ROLE_KEY),
  set: (role: string): void => localStorage.setItem(ROLE_KEY, role),
  remove: (): void => localStorage.removeItem(ROLE_KEY),
};

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  role: string | null;
  isAdmin: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [role, setRole] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      const token = authToken.get();
      const savedRole = authRole.get();
      setIsAuthenticated(!!token);
      setRole(savedRole);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const isAdmin = role === 'admin';

  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await api.auth.login(credentials);

      // Store token and role
      authToken.set(response.access_token);
      authRole.set(response.role);
      setIsAuthenticated(true);
      setRole(response.role);

      const roleLabel = response.role === 'kepala_desa' ? 'Kepala Desa' : 'Admin';
      toast.success('Login berhasil', {
        description: `Selamat datang di panel ${roleLabel}`,
      });

      // Redirect to admin dashboard
      navigate('/admin');
    } catch (error) {
      console.error('Login error:', error);

      const errorMessage = (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Username atau password salah';

      toast.error('Login gagal', {
        description: errorMessage,
      });

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    authToken.remove();
    authRole.remove();
    setIsAuthenticated(false);
    setRole(null);

    toast.info('Logout berhasil', {
      description: 'Anda telah keluar dari sistem',
    });

    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        role,
        isAdmin,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

// Protected Route Component
interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast.warning('Akses ditolak', {
        description: 'Silakan login terlebih dahulu',
      });
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  // Show nothing if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Render children if authenticated
  return <>{children}</>;
};
