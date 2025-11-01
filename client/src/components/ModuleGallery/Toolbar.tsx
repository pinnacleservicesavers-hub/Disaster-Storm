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
    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
      {/* Search */}
      <div className="relative flex-1 w-full md:w-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search modules..."
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/15 transition-all"
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
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              cat === c.id
                ? 'bg-white text-gray-900 shadow-lg'
                : 'bg-white/10 text-white/70 hover:bg-white/15'
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
        className={`px-4 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-2 transition-all ${
          highOnly
            ? 'bg-orange-500 text-white shadow-lg'
            : 'bg-white/10 text-white/70 hover:bg-white/15'
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
