import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// US States and major cities data
export const US_STATES_CITIES: Record<string, string[]> = {
  'Alabama': ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville', 'Tuscaloosa'],
  'Alaska': ['Anchorage', 'Fairbanks', 'Juneau', 'Sitka', 'Ketchikan'],
  'Arizona': ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale'],
  'Arkansas': ['Little Rock', 'Fort Smith', 'Fayetteville', 'Springdale', 'Jonesboro'],
  'California': ['Los Angeles', 'San Diego', 'San Jose', 'San Francisco', 'Fresno', 'Sacramento', 'Long Beach', 'Oakland', 'Bakersfield', 'Anaheim'],
  'Colorado': ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Lakewood'],
  'Connecticut': ['Bridgeport', 'New Haven', 'Hartford', 'Stamford', 'Waterbury'],
  'Delaware': ['Wilmington', 'Dover', 'Newark', 'Middletown', 'Smyrna'],
  'Florida': ['Jacksonville', 'Miami', 'Tampa', 'Orlando', 'St. Petersburg', 'Hialeah', 'Tallahassee', 'Fort Lauderdale', 'Port St. Lucie', 'Cape Coral'],
  'Georgia': ['Atlanta', 'Augusta', 'Columbus', 'Macon', 'Savannah', 'Athens', 'Sandy Springs', 'Roswell', 'Albany', 'Johns Creek'],
  'Hawaii': ['Honolulu', 'Pearl City', 'Hilo', 'Kailua', 'Waipahu'],
  'Idaho': ['Boise', 'Meridian', 'Nampa', 'Idaho Falls', 'Pocatello'],
  'Illinois': ['Chicago', 'Aurora', 'Naperville', 'Joliet', 'Rockford'],
  'Indiana': ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel'],
  'Iowa': ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City', 'Iowa City'],
  'Kansas': ['Wichita', 'Overland Park', 'Kansas City', 'Olathe', 'Topeka'],
  'Kentucky': ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro', 'Covington'],
  'Louisiana': ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette', 'Lake Charles'],
  'Maine': ['Portland', 'Lewiston', 'Bangor', 'South Portland', 'Auburn'],
  'Maryland': ['Baltimore', 'Frederick', 'Rockville', 'Gaithersburg', 'Bowie'],
  'Massachusetts': ['Boston', 'Worcester', 'Springfield', 'Cambridge', 'Lowell'],
  'Michigan': ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Ann Arbor'],
  'Minnesota': ['Minneapolis', 'St. Paul', 'Rochester', 'Duluth', 'Bloomington'],
  'Mississippi': ['Jackson', 'Gulfport', 'Southaven', 'Hattiesburg', 'Biloxi'],
  'Missouri': ['Kansas City', 'St. Louis', 'Springfield', 'Columbia', 'Independence'],
  'Montana': ['Billings', 'Missoula', 'Great Falls', 'Bozeman', 'Butte'],
  'Nebraska': ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island', 'Kearney'],
  'Nevada': ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas', 'Sparks'],
  'New Hampshire': ['Manchester', 'Nashua', 'Concord', 'Derry', 'Dover'],
  'New Jersey': ['Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Edison'],
  'New Mexico': ['Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe', 'Roswell'],
  'New York': ['New York City', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse'],
  'North Carolina': ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem', 'Fayetteville', 'Cary', 'Wilmington', 'High Point', 'Asheville'],
  'North Dakota': ['Fargo', 'Bismarck', 'Grand Forks', 'Minot', 'West Fargo'],
  'Ohio': ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron'],
  'Oklahoma': ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow', 'Lawton'],
  'Oregon': ['Portland', 'Salem', 'Eugene', 'Gresham', 'Hillsboro'],
  'Pennsylvania': ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading'],
  'Rhode Island': ['Providence', 'Warwick', 'Cranston', 'Pawtucket', 'East Providence'],
  'South Carolina': ['Charleston', 'Columbia', 'North Charleston', 'Mount Pleasant', 'Rock Hill', 'Greenville', 'Summerville', 'Sumter', 'Goose Creek', 'Hilton Head Island'],
  'South Dakota': ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Brookings', 'Watertown'],
  'Tennessee': ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Clarksville', 'Murfreesboro', 'Franklin', 'Johnson City', 'Bartlett', 'Hendersonville'],
  'Texas': ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi', 'Plano', 'Laredo'],
  'Utah': ['Salt Lake City', 'West Valley City', 'Provo', 'West Jordan', 'Orem'],
  'Vermont': ['Burlington', 'South Burlington', 'Rutland', 'Barre', 'Montpelier'],
  'Virginia': ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond', 'Newport News'],
  'Washington': ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue'],
  'West Virginia': ['Charleston', 'Huntington', 'Morgantown', 'Parkersburg', 'Wheeling'],
  'Wisconsin': ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha', 'Racine'],
  'Wyoming': ['Cheyenne', 'Casper', 'Laramie', 'Gillette', 'Rock Springs']
};

// Priority states for Disaster Direct
export const PRIORITY_STATES = ['Florida', 'Georgia', 'South Carolina', 'North Carolina', 'Tennessee', 'Alabama'];

// City coordinates for major cities (lat, lon)
export const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  // Florida
  'Jacksonville': { lat: 30.3322, lon: -81.6557 },
  'Miami': { lat: 25.7617, lon: -80.1918 },
  'Tampa': { lat: 27.9506, lon: -82.4572 },
  'Orlando': { lat: 28.5384, lon: -81.3789 },
  'St. Petersburg': { lat: 27.7676, lon: -82.6403 },
  'Tallahassee': { lat: 30.4383, lon: -84.2807 },
  'Fort Lauderdale': { lat: 26.1224, lon: -80.1373 },
  'Port St. Lucie': { lat: 27.2730, lon: -80.3582 },
  'Cape Coral': { lat: 26.5629, lon: -81.9495 },
  'Hialeah': { lat: 25.8576, lon: -80.2781 },
  // Georgia
  'Atlanta': { lat: 33.7490, lon: -84.3880 },
  'Augusta': { lat: 33.4735, lon: -82.0105 },
  'Columbus': { lat: 32.4610, lon: -84.9877 },
  'Macon': { lat: 32.8407, lon: -83.6324 },
  'Savannah': { lat: 32.0809, lon: -81.0912 },
  'Athens': { lat: 33.9519, lon: -83.3576 },
  'Sandy Springs': { lat: 33.9304, lon: -84.3733 },
  'Roswell': { lat: 34.0234, lon: -84.3616 },
  'Albany': { lat: 31.5785, lon: -84.1557 },
  'Johns Creek': { lat: 34.0289, lon: -84.1986 },
  // South Carolina
  'Charleston': { lat: 32.7765, lon: -79.9311 },
  'Columbia': { lat: 34.0007, lon: -81.0348 },
  'North Charleston': { lat: 32.8854, lon: -80.0166 },
  'Mount Pleasant': { lat: 32.8323, lon: -79.8284 },
  'Rock Hill': { lat: 34.9249, lon: -81.0251 },
  'Greenville': { lat: 34.8526, lon: -82.3940 },
  // North Carolina
  'Charlotte': { lat: 35.2271, lon: -80.8431 },
  'Raleigh': { lat: 35.7796, lon: -78.6382 },
  'Greensboro': { lat: 36.0726, lon: -79.7920 },
  'Durham': { lat: 35.9940, lon: -78.8986 },
  'Winston-Salem': { lat: 36.0999, lon: -80.2442 },
  'Fayetteville': { lat: 35.0527, lon: -78.8784 },
  'Wilmington': { lat: 34.2257, lon: -77.9447 },
  'Asheville': { lat: 35.5951, lon: -82.5515 },
  // Tennessee
  'Nashville': { lat: 36.1627, lon: -86.7816 },
  'Memphis': { lat: 35.1495, lon: -90.0490 },
  'Knoxville': { lat: 35.9606, lon: -83.9207 },
  'Chattanooga': { lat: 35.0456, lon: -85.3097 },
  'Clarksville': { lat: 36.5298, lon: -87.3595 },
  // Alabama
  'Birmingham': { lat: 33.5186, lon: -86.8104 },
  'Montgomery': { lat: 32.3792, lon: -86.3077 },
  'Mobile': { lat: 30.6954, lon: -88.0399 },
  'Huntsville': { lat: 34.7304, lon: -86.5861 },
  'Tuscaloosa': { lat: 33.2098, lon: -87.5692 },
  // Other major cities
  'New York City': { lat: 40.7128, lon: -74.0060 },
  'Los Angeles': { lat: 34.0522, lon: -118.2437 },
  'Houston': { lat: 29.7604, lon: -95.3698 },
  'Phoenix': { lat: 33.4484, lon: -112.0740 },
  'San Antonio': { lat: 29.4241, lon: -98.4936 },
  'Dallas': { lat: 32.7767, lon: -96.7970 },
  'Denver': { lat: 39.7392, lon: -104.9903 },
  'Seattle': { lat: 47.6062, lon: -122.3321 },
  'New Orleans': { lat: 29.9511, lon: -90.0715 },
  'Las Vegas': { lat: 36.1699, lon: -115.1398 },
};

// Get coordinates for a city (with state fallback)
export function getCityCoordinates(city: string, state?: string): { lat: number; lon: number } {
  // Try direct city lookup
  if (CITY_COORDINATES[city]) {
    return CITY_COORDINATES[city];
  }
  
  // State capital fallbacks
  const stateCapitals: Record<string, { lat: number; lon: number }> = {
    'Florida': { lat: 30.4383, lon: -84.2807 },
    'Georgia': { lat: 33.7490, lon: -84.3880 },
    'South Carolina': { lat: 34.0007, lon: -81.0348 },
    'North Carolina': { lat: 35.7796, lon: -78.6382 },
    'Tennessee': { lat: 36.1627, lon: -86.7816 },
    'Alabama': { lat: 32.3792, lon: -86.3077 },
  };
  
  if (state && stateCapitals[state]) {
    return stateCapitals[state];
  }
  
  // Default to Atlanta if no match
  return { lat: 33.7490, lon: -84.3880 };
}

// Get all states sorted (priority states first)
export const ALL_STATES = [
  ...PRIORITY_STATES,
  ...Object.keys(US_STATES_CITIES).filter(state => !PRIORITY_STATES.includes(state)).sort()
];

// Custom hook for managing state/city selection
export function useStateCitySelector(defaultState: string = 'Florida', defaultCity?: string) {
  const [selectedState, setSelectedState] = useState(defaultState);
  const [selectedCity, setSelectedCity] = useState(defaultCity || US_STATES_CITIES[defaultState][0]);
  const [availableCities, setAvailableCities] = useState<string[]>(US_STATES_CITIES[defaultState]);

  useEffect(() => {
    if (selectedState && US_STATES_CITIES[selectedState]) {
      setAvailableCities(US_STATES_CITIES[selectedState]);
      setSelectedCity(US_STATES_CITIES[selectedState][0]);
    }
  }, [selectedState]);

  return {
    selectedState,
    setSelectedState,
    selectedCity,
    setSelectedCity,
    availableCities
  };
}

interface StateCitySelectorProps {
  selectedState: string;
  selectedCity: string;
  availableCities: string[];
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
  className?: string;
  variant?: 'default' | 'dark';
  showAllStates?: boolean;
}

export function StateCitySelector({
  selectedState,
  selectedCity,
  availableCities,
  onStateChange,
  onCityChange,
  className = '',
  variant = 'default',
  showAllStates = false
}: StateCitySelectorProps) {
  const states = showAllStates ? ALL_STATES : PRIORITY_STATES;
  const baseClass = variant === 'dark' 
    ? 'bg-slate-900/80 backdrop-blur-sm border-cyan-500/30 text-white'
    : 'bg-white/80 backdrop-blur-sm border-blue-200';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select value={selectedState} onValueChange={onStateChange}>
        <SelectTrigger className={`w-40 ${baseClass}`} data-testid="select-state">
          <SelectValue placeholder="State" />
        </SelectTrigger>
        <SelectContent>
          {states.map(state => (
            <SelectItem key={state} value={state}>{state}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select value={selectedCity} onValueChange={onCityChange}>
        <SelectTrigger className={`w-40 ${baseClass}`} data-testid="select-city">
          <SelectValue placeholder="City" />
        </SelectTrigger>
        <SelectContent>
          {availableCities.map(city => (
            <SelectItem key={city} value={city}>{city}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
