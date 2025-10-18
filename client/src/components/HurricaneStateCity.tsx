import { useState, useMemo } from 'react';

// Hurricane-prone states and their major cities
const HURRICANE_DATA: Record<string, string[]> = {
  "Florida": [
    "Miami",
    "Tampa",
    "Orlando",
    "Jacksonville",
    "Fort Lauderdale",
    "Key West",
    "Naples",
    "Pensacola",
    "Fort Myers",
    "Sarasota"
  ],
  "Texas": [
    "Houston",
    "Galveston",
    "Corpus Christi",
    "Beaumont",
    "Port Arthur",
    "South Padre Island",
    "Brownsville"
  ],
  "Louisiana": [
    "New Orleans",
    "Baton Rouge",
    "Lake Charles",
    "Lafayette",
    "Houma",
    "Slidell"
  ],
  "North Carolina": [
    "Wilmington",
    "Outer Banks",
    "New Bern",
    "Morehead City",
    "Jacksonville"
  ],
  "South Carolina": [
    "Charleston",
    "Myrtle Beach",
    "Hilton Head",
    "Georgetown",
    "Beaufort"
  ],
  "Georgia": [
    "Savannah",
    "Brunswick",
    "St. Simons Island",
    "Jekyll Island"
  ],
  "Alabama": [
    "Mobile",
    "Gulf Shores",
    "Orange Beach"
  ],
  "Mississippi": [
    "Biloxi",
    "Gulfport",
    "Bay St. Louis",
    "Pascagoula"
  ],
  "New York": [
    "New York City",
    "Long Island",
    "Staten Island",
    "Brooklyn"
  ],
  "New Jersey": [
    "Atlantic City",
    "Cape May",
    "Ocean City"
  ],
  "Virginia": [
    "Norfolk",
    "Virginia Beach",
    "Hampton"
  ],
  "Maryland": [
    "Ocean City",
    "Baltimore"
  ]
};

export interface HurricaneDropdownValue {
  state: string | null;
  city: string | null;
}

interface HurricaneStateCityProps {
  value?: HurricaneDropdownValue;
  onChange?: (value: HurricaneDropdownValue) => void;
  showLabels?: boolean;
  className?: string;
}

export default function HurricaneStateCity({
  value,
  onChange,
  showLabels = true,
  className
}: HurricaneStateCityProps) {
  const [internal, setInternal] = useState<HurricaneDropdownValue>({
    state: null,
    city: null
  });

  const stateOptions = useMemo(() => Object.keys(HURRICANE_DATA).sort(), []);

  const current = value ?? internal;

  const setValue = (next: HurricaneDropdownValue) => {
    if (onChange) onChange(next);
    setInternal(next);
  };

  const onStateChange = (newState: string | null) => {
    // When state changes, reset city to null (all cities)
    setValue({ state: newState, city: null });
  };

  const onCityChange = (newCity: string | null) => {
    setValue({ state: current.state, city: newCity });
  };

  const cityOptions = useMemo(() => {
    return current.state ? (HURRICANE_DATA[current.state] ?? []) : [];
  }, [current.state]);

  return (
    <div className={"w-full max-w-2xl " + (className ?? "")}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          {showLabels && <label className="text-sm font-medium text-orange-200">State</label>}
          <select
            className="w-full rounded-lg border border-white/30 bg-white/10 backdrop-blur-sm px-4 py-2.5 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            value={current.state ?? ""}
            onChange={(e) => onStateChange(e.target.value || null)}
            data-testid="hurricane-state-select"
          >
            <option value="" disabled className="bg-gray-800">
              Select a state…
            </option>
            {stateOptions.map((s) => (
              <option key={s} value={s} className="bg-gray-800">
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          {showLabels && <label className="text-sm font-medium text-orange-200">City</label>}
          <select
            className="w-full rounded-lg border border-white/30 bg-white/10 backdrop-blur-sm px-4 py-2.5 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-50 disabled:cursor-not-allowed"
            value={current.city ?? ""}
            onChange={(e) => onCityChange(e.target.value || null)}
            disabled={!current.state}
            data-testid="hurricane-city-select"
          >
            {!current.state ? (
              <option value="" className="bg-gray-800">Select a state first…</option>
            ) : cityOptions.length ? (
              <>
                <option value="" className="bg-gray-800">All Cities</option>
                {cityOptions.map((c) => (
                  <option key={c} value={c} className="bg-gray-800">
                    {c}
                  </option>
                ))}
              </>
            ) : (
              <option value="" className="bg-gray-800">No cities available</option>
            )}
          </select>
        </div>
      </div>

      {/* Selected location indicator */}
      {current.state && (
        <div className="mt-3 text-sm text-orange-200 flex items-center gap-2">
          <span className="font-medium">Monitoring:</span>
          <span className="bg-white/10 px-3 py-1 rounded-full">
            {current.state}{current.city ? ` • ${current.city}` : ""}
          </span>
        </div>
      )}
    </div>
  );
}
