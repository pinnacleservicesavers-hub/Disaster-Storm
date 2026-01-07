import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '@/lib/auth';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

export default function SignOut() {
  const navigate = useNavigate();
  
  useEffect(() => {
    auth.clear();
    const timer = setTimeout(() => navigate('/'), 500);
    return () => clearTimeout(timer);
  }, [navigate]);
  
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-10">
      <div className="max-w-xl mx-auto text-center space-y-4">
        <div className="animate-pulse">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Signing out...
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Clearing your session and redirecting to home.
          </p>
        </div>
      </div>
      <ModuleAIAssistant 
        moduleName="Sign Out"
        moduleContext="Session termination page. Evelyn can answer questions about session management, authentication flow, and next steps after signing out."
      />
    </main>
  );
}
