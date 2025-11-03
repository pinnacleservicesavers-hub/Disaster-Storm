import { Link, useLocation } from 'react-router-dom';
import { useMemo } from 'react';

function labelize(seg: string) {
  if (!seg) return '';
  try {
    return decodeURIComponent(seg)
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, s => s.toUpperCase());
  } catch {
    return seg;
  }
}

export default function Breadcrumbs() {
  const location = useLocation();
  const pathname = location.pathname || '/';
  const parts = useMemo(() => pathname.split('/').filter(Boolean), [pathname]);
  
  if (parts.length === 0) return null;
  
  let href = '';
  
  return (
    <nav className="text-xs text-gray-600 dark:text-gray-400 py-2" data-testid="breadcrumbs">
      <ol className="flex items-center gap-1 flex-wrap">
        <li>
          <Link to="/" className="hover:underline" data-testid="breadcrumb-home">
            Home
          </Link>
        </li>
        {parts.map((p, i) => {
          href += '/' + p;
          const isLast = i === parts.length - 1;
          return (
            <li key={href} className="flex items-center gap-1">
              <span className="opacity-50">/</span>
              {isLast ? (
                <span className="font-medium" data-testid={`breadcrumb-current`}>
                  {labelize(p)}
                </span>
              ) : (
                <Link 
                  to={href} 
                  className="hover:underline"
                  data-testid={`breadcrumb-${p}`}
                >
                  {labelize(p)}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
