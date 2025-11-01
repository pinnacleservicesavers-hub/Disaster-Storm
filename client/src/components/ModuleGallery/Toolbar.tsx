import { Search, Filter } from 'lucide-react';
import { Badge } from './Badge';

interface ToolbarProps {
  query: string;
  setQuery: (q: string) => void;
  cat: string;
  setCat: (c: string) => void;
  highOnly: boolean;
  setHighOnly: (h: boolean) => void;
}

export function Toolbar({ query, setQuery, cat, setCat, highOnly, setHighOnly }: ToolbarProps) {
  const categories = [
    { id: 'all', label: 'All Modules' },
    { id: 'operations', label: 'Operations' },
    { id: 'intelligence', label: 'Intelligence' },
    { id: 'customers', label: 'Customers' },
    { id: 'sales', label: 'Sales' },
    { id: 'management', label: 'Management' }
  ];

  return (
    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center backdrop-blur-sm bg-white/5 p-4 rounded-2xl border border-white/10 shadow-2xl">
      {/* Search */}
      <div className="relative flex-1 w-full md:w-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search modules..."
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:bg-white/15 focus:border-cyan-400/50 transition-all shadow-inner"
          data-testid="input-search"
        />
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-5 h-5 text-white/60" />
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all backdrop-blur-md ${
              cat === c.id
                ? 'bg-gradient-to-r from-cyan-400 to-purple-400 text-white shadow-lg shadow-cyan-500/30 ring-2 ring-white/30'
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:ring-1 hover:ring-white/20'
            }`}
            data-testid={`button-filter-${c.id}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Priority Toggle */}
      <button
        onClick={() => setHighOnly(!highOnly)}
        className={`px-4 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-2 transition-all backdrop-blur-md ${
          highOnly
            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/40 ring-2 ring-white/30'
            : 'bg-white/10 text-white/70 hover:bg-white/20 hover:ring-1 hover:ring-white/20'
        }`}
        data-testid="button-priority-toggle"
      >
        {highOnly ? (
          <>
            <Badge tone="orange" className="px-2">HIGH</Badge>
            Priority Only
          </>
        ) : (
          'Show High Priority'
        )}
      </button>
    </div>
  );
}
