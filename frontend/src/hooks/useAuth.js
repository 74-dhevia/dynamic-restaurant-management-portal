import { useSelector } from 'react-redux';

export function useAuth() {
  const { currentUser, isAuthenticated } = useSelector(s => s.auth);
  return { user: currentUser, isAuthenticated, role: currentUser?.role || null };
}
