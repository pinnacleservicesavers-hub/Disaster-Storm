import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '@/lib/auth';

export default function Callback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Accept ?token=... or #id_token=...
    const token =
      searchParams.get('token') ||
      (typeof window !== 'undefined'
        ? new URLSearchParams(window.location.hash.replace(/^#/, '')).get('id_token')
        : null);

    if (token) {
      auth.setSession({ role: 'contractor', userId: 'user', token });
      navigate('/', { replace: true });
    } else {
      navigate('/auth/login', { replace: true });
    }
  }, [navigate, searchParams]);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-10">
      <div className="max-w-xl mx-auto text-center space-y-4">
        <div className="animate-pulse">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Completing sign-in...
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Processing your authentication token
          </p>
        </div>
      </div>
    </main>
  );
}
