import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { onAuthChange } from '@/lib/firebase';

type Props = { children: ReactNode };

export default function ProtectedRoute({ children }: Props) {
  const [user, setUser] = useState<any>(null);
  const [checked, setChecked] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!onAuthChange) {
      // If auth isn't available, treat as unauthenticated
      setChecked(true);
      setUser(null);
      return;
    }
    const unsub = onAuthChange((u) => {
      setUser(u);
      setChecked(true);
    });
    return () => unsub && typeof unsub === 'function' && unsub();
  }, []);

  if (!checked) {
    // Can show a spinner while checking auth
    return null;
  }

  if (!user) {
    // Redirect to login and remember where we came from
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
