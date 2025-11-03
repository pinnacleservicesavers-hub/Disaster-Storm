import { Link, useLocation } from "react-router-dom";
import ContractorGuard from "@/components/ContractorGuard";

const links = [
  { href: "/contractor/jobs", label: "Jobs" },
  { href: "/contractor/profile", label: "Profile" },
];

export default function ContractorLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <ContractorGuard>
      <div className="min-h-screen grid grid-cols-1 md:grid-cols-[220px_1fr] bg-white dark:bg-gray-950">
        <aside className="border-r border-gray-200 dark:border-gray-800 p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Contractor Portal
          </div>
          <nav className="space-y-1" data-testid="contractor-nav">
            {links.map((l) => {
              const active = location.pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  to={l.href}
                  data-testid={`link-contractor-${l.label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`block px-3 py-2 rounded transition-colors ${
                    active
                      ? "bg-black dark:bg-white text-white dark:text-black font-medium"
                      : "hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-500">
            <div>
              Access as: <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">contractor</code> or <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">admin</code>
            </div>
            <Link to="/admin/auth-stub" className="text-blue-600 dark:text-blue-400 underline mt-2 block">
              Change role
            </Link>
          </div>
        </aside>
        <section className="min-h-screen bg-white dark:bg-gray-950">{children}</section>
      </div>
    </ContractorGuard>
  );
}
