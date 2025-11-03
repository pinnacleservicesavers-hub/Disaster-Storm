import { Link, useLocation } from "react-router-dom";
import AdminGuard from "@/components/AdminGuard";

const links = [
  { href: "/admin/legal/zipmap", label: "ZIP → State Map" },
  { href: "/admin/legal/welcome", label: "Welcome Templates" },
  { href: "/admin/jobs/fill-states", label: "Bulk Fill States" },
  { href: "/admin/smtp", label: "SMTP Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <AdminGuard>
      <div className="min-h-screen grid grid-cols-1 md:grid-cols-[240px_1fr] bg-white dark:bg-gray-950">
        <aside className="border-r border-gray-200 dark:border-gray-800 p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Admin Portal
          </div>
          <nav className="space-y-1" data-testid="admin-nav">
            {links.map((l) => {
              const active = location.pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  to={l.href}
                  data-testid={`link-admin-${l.label.toLowerCase().replace(/\s+/g, '-')}`}
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
              Role is read from <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">localStorage.role</code>
            </div>
            <Link to="/admin/auth-stub" className="text-blue-600 dark:text-blue-400 underline mt-2 block">
              Change role
            </Link>
          </div>
        </aside>
        <section className="min-h-screen bg-white dark:bg-gray-950">{children}</section>
      </div>
    </AdminGuard>
  );
}
