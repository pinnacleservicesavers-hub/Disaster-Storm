import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ContractorGuard({ children }: { children: React.ReactNode }) {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const role = (localStorage.getItem('role') || '').toLowerCase();
      if (role === 'contractor' || role === 'admin') {
        setAllowed(true);
      } else {
        setAllowed(false);
      }
    } catch {
      setAllowed(false);
    }
  }, []);

  if (allowed === null) {
    return (
      <div className="p-8 text-sm text-gray-600 dark:text-gray-400">
        Checking access…
      </div>
    );
  }

  if (!allowed) {
    return (
      <main className="p-8 max-w-xl mx-auto space-y-3">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Access restricted
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Only contractors (or admins) can view this page.
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Visit{" "}
          <button
            onClick={() => navigate("/admin/auth-stub")}
            className="text-blue-600 dark:text-blue-400 underline"
          >
            /admin/auth-stub
          </button>{" "}
          to set your role to contractor.
        </p>
      </main>
    );
  }

  return <>{children}</>;
}
