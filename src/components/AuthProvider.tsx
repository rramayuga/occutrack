
import { AuthContext } from '@/lib/auth';
import { useAuthProvider } from '@/hooks/useAuthProvider';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const authState = useAuthProvider();
  
  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
};
