
"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

function labelize(seg: string){
  if(!seg) return '';
  try{
    return decodeURIComponent(seg).replace(/[-_]/g,' ').replace(/\b\w/g, s=>s.toUpperCase());
  }catch{ return seg; }
}

export default function Breadcrumbs(){
  const pathname = usePathname() || '/';
  const parts = useMemo(()=> pathname.split('/').filter(Boolean), [pathname]);
  if(parts.length === 0) return null;
  let href = '';
  return (
    <nav className="text-xs text-gray-600 py-2">
      <ol className="flex items-center gap-1 flex-wrap">
        <li><Link href="/" className="hover:underline">Home</Link></li>
        {parts.map((p, i)=>{
          href += '/' + p;
          const isLast = i === parts.length - 1;
          return (
            <li key={href} className="flex items-center gap-1">
              <span className="opacity-50">/</span>
              {isLast
                ? <span className="font-medium">{labelize(p)}</span>
                : <Link href={href} className="hover:underline">{labelize(p)}</Link>
              }
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
