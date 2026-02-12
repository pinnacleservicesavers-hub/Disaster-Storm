export interface MaterialItem {
  name: string;
  unit: string;
  typicalQty: string;
  priceRange: { min: number; max: number };
  retailers: RetailerLink[];
}

export interface RetailerLink {
  name: string;
  searchUrl: string;
  affiliateTag: string;
  logo?: string;
}

export interface TradeMaterialsResult {
  trade: string;
  tradeName: string;
  materials: MaterialItem[];
  totalMaterialCostMin: number;
  totalMaterialCostMax: number;
  safetyWarnings: string[];
  diyDifficulty: 'easy' | 'moderate' | 'hard' | 'professional_only';
  diyNotes: string;
  disclaimer: string;
  affiliateDisclosure: string;
}

const AFFILIATE_DISCLOSURE = "As an affiliate, we may earn a commission from qualifying purchases at no extra cost to you. Prices shown are estimates and may vary.";

const ESTIMATE_DISCLAIMER = "This is an AI-generated preliminary estimate only. A licensed professional must inspect the project to determine final scope and pricing. Estimates may vary based on site conditions, local labor rates, permits, and material availability.";

const RETAILERS: Record<string, RetailerLink> = {
  homeDepot: { name: 'Home Depot', searchUrl: 'https://www.homedepot.com/s/', affiliateTag: 'disasterdirect-20' },
  lowes: { name: "Lowe's", searchUrl: 'https://www.lowes.com/search?searchTerm=', affiliateTag: 'disasterdirect-20' },
  amazon: { name: 'Amazon', searchUrl: 'https://www.amazon.com/s?k=', affiliateTag: 'disasterdirect-20' },
  autozone: { name: 'AutoZone', searchUrl: 'https://www.autozone.com/searchresult?searchText=', affiliateTag: '' },
  rockAuto: { name: 'RockAuto', searchUrl: 'https://www.rockauto.com/en/catalog/', affiliateTag: '' },
  oreilly: { name: "O'Reilly Auto", searchUrl: 'https://www.oreillyauto.com/shop/b/', affiliateTag: '' },
  grainger: { name: 'Grainger', searchUrl: 'https://www.grainger.com/search?searchQuery=', affiliateTag: '' },
  ferguson: { name: 'Ferguson', searchUrl: 'https://www.ferguson.com/search/', affiliateTag: '' },
  floorDecor: { name: 'Floor & Decor', searchUrl: 'https://www.flooranddecor.com/search?q=', affiliateTag: '' },
  acmeTools: { name: 'Acme Tools', searchUrl: 'https://www.acmetools.com/search?q=', affiliateTag: '' },
};

function buildRetailerUrl(retailer: RetailerLink, searchTerm: string): string {
  const encoded = encodeURIComponent(searchTerm);
  let url = `${retailer.searchUrl}${encoded}`;
  if (retailer.affiliateTag) {
    url += url.includes('?') ? `&tag=${retailer.affiliateTag}` : `?tag=${retailer.affiliateTag}`;
  }
  return url;
}

function makeRetailers(names: string[], searchTerm: string): RetailerLink[] {
  return names
    .map(n => RETAILERS[n])
    .filter(Boolean)
    .map(r => ({ ...r, searchUrl: buildRetailerUrl(r, searchTerm) }));
}

const TRADE_MATERIALS: Record<string, { materials: (issue?: string) => MaterialItem[]; diyDifficulty: TradeMaterialsResult['diyDifficulty']; diyNotes: string; safetyWarnings: string[] }> = {
  tree: {
    diyDifficulty: 'hard',
    diyNotes: 'Tree work can be extremely dangerous. Only tackle small trees under 15ft with no power line proximity. Always wear protective gear.',
    safetyWarnings: ['Never work near power lines', 'Wear hard hat, eye protection, and chaps', 'Have an escape route planned', 'Consider hiring a certified arborist for large trees'],
    materials: (issue) => [
      { name: 'Chainsaw (16-20")', unit: 'each', typicalQty: '1', priceRange: { min: 180, max: 450 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'chainsaw 18 inch') },
      { name: 'Chainsaw Chain', unit: 'each', typicalQty: '1-2', priceRange: { min: 15, max: 35 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'chainsaw replacement chain') },
      { name: 'Chain Oil / Bar Oil', unit: 'quart', typicalQty: '1-2', priceRange: { min: 8, max: 15 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'chainsaw bar oil') },
      { name: 'Safety Chaps', unit: 'pair', typicalQty: '1', priceRange: { min: 40, max: 90 }, retailers: makeRetailers(['homeDepot', 'amazon'], 'chainsaw safety chaps') },
      { name: 'Hard Hat with Face Shield', unit: 'each', typicalQty: '1', priceRange: { min: 25, max: 55 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'forestry hard hat face shield') },
      { name: 'Rope (100ft)', unit: 'roll', typicalQty: '1', priceRange: { min: 25, max: 60 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'arborist rope 100ft') },
      { name: 'Wedges (Felling)', unit: 'set', typicalQty: '1', priceRange: { min: 10, max: 25 }, retailers: makeRetailers(['homeDepot', 'amazon'], 'tree felling wedges') },
    ]
  },
  roofing: {
    diyDifficulty: 'hard',
    diyNotes: 'Roof work involves fall risk. Only attempt small repairs on low-pitch roofs. Use proper fall protection for any roof work.',
    safetyWarnings: ['Use fall protection harness and anchor', 'Never work on wet or icy roofs', 'Check for electrical hazards near roof edges', 'Permits may be required for major repairs'],
    materials: () => [
      { name: 'Architectural Shingles (bundle)', unit: 'bundle', typicalQty: '3-10', priceRange: { min: 30, max: 55 }, retailers: makeRetailers(['homeDepot', 'lowes'], 'architectural roof shingles bundle') },
      { name: 'Ridge Cap Shingles', unit: 'bundle', typicalQty: '1-2', priceRange: { min: 35, max: 65 }, retailers: makeRetailers(['homeDepot', 'lowes'], 'ridge cap shingles') },
      { name: 'Roofing Nails (1.25")', unit: '5lb box', typicalQty: '1-2', priceRange: { min: 8, max: 18 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'roofing nails 1.25 inch') },
      { name: 'Roofing Tar / Cement', unit: 'tube', typicalQty: '2-4', priceRange: { min: 5, max: 12 }, retailers: makeRetailers(['homeDepot', 'lowes'], 'roofing tar sealant') },
      { name: 'Underlayment (Ice & Water Shield)', unit: 'roll', typicalQty: '1-2', priceRange: { min: 45, max: 120 }, retailers: makeRetailers(['homeDepot', 'lowes'], 'ice water shield underlayment') },
      { name: 'Drip Edge Flashing', unit: '10ft piece', typicalQty: '2-4', priceRange: { min: 8, max: 15 }, retailers: makeRetailers(['homeDepot', 'lowes'], 'roof drip edge flashing') },
      { name: 'Roofing Safety Harness Kit', unit: 'kit', typicalQty: '1', priceRange: { min: 60, max: 150 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'roofing safety harness kit') },
    ]
  },
  hvac: {
    diyDifficulty: 'professional_only',
    diyNotes: 'Most HVAC work requires EPA certification for refrigerant handling and licensed electrician work. Only filter changes and thermostat installs are DIY-safe.',
    safetyWarnings: ['Refrigerant handling requires EPA certification', 'High voltage components present', 'Gas connections must be done by licensed professionals', 'Permits required in most jurisdictions'],
    materials: () => [
      { name: 'HVAC Air Filter (standard)', unit: 'each', typicalQty: '2-4', priceRange: { min: 8, max: 30 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'HVAC air filter 20x25x1') },
      { name: 'Smart Thermostat', unit: 'each', typicalQty: '1', priceRange: { min: 80, max: 250 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'smart thermostat wifi') },
      { name: 'Condensate Drain Line Cleaner', unit: 'bottle', typicalQty: '1', priceRange: { min: 8, max: 15 }, retailers: makeRetailers(['homeDepot', 'amazon'], 'AC condensate drain cleaner') },
      { name: 'Duct Tape (HVAC grade)', unit: 'roll', typicalQty: '1', priceRange: { min: 8, max: 18 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'HVAC aluminum foil duct tape') },
      { name: 'Capacitor (run/start)', unit: 'each', typicalQty: '1', priceRange: { min: 12, max: 35 }, retailers: makeRetailers(['amazon', 'grainger'], 'HVAC run capacitor') },
      { name: 'Contactor Relay', unit: 'each', typicalQty: '1', priceRange: { min: 15, max: 40 }, retailers: makeRetailers(['amazon', 'grainger'], 'AC contactor relay') },
    ]
  },
  plumbing: {
    diyDifficulty: 'moderate',
    diyNotes: 'Simple fixes like faucet replacements and toilet repairs are good DIY projects. Leave water heater installs and main line work to professionals.',
    safetyWarnings: ['Turn off water supply before starting', 'Know where your main shutoff valve is', 'Gas water heater work requires licensed plumber', 'Check local codes for permit requirements'],
    materials: () => [
      { name: 'PEX Tubing (10ft)', unit: '10ft', typicalQty: '1-3', priceRange: { min: 5, max: 15 }, retailers: makeRetailers(['homeDepot', 'lowes', 'ferguson'], 'PEX tubing 3/4 inch') },
      { name: 'SharkBite Fittings', unit: 'each', typicalQty: '2-6', priceRange: { min: 5, max: 15 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'SharkBite push fit fittings') },
      { name: 'Pipe Wrench (14")', unit: 'each', typicalQty: '1', priceRange: { min: 15, max: 40 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'pipe wrench 14 inch') },
      { name: "Plumber's Putty", unit: 'tub', typicalQty: '1', priceRange: { min: 3, max: 8 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'plumbers putty') },
      { name: 'Teflon Tape', unit: 'roll', typicalQty: '1-2', priceRange: { min: 2, max: 5 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'teflon tape plumbing') },
      { name: 'Faucet Repair Kit', unit: 'kit', typicalQty: '1', priceRange: { min: 8, max: 25 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'faucet repair kit universal') },
      { name: 'Toilet Repair Kit', unit: 'kit', typicalQty: '1', priceRange: { min: 12, max: 30 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'toilet repair kit flapper valve') },
    ]
  },
  electrical: {
    diyDifficulty: 'professional_only',
    diyNotes: 'Electrical work beyond changing outlets/switches requires a licensed electrician. Working with live wires is extremely dangerous. Always kill the breaker first.',
    safetyWarnings: ['Always turn off breaker before working', 'Use a voltage tester to confirm power is off', 'Permits required for most electrical work', 'Never work on the electrical panel yourself'],
    materials: () => [
      { name: 'GFCI Outlet', unit: 'each', typicalQty: '1-4', priceRange: { min: 12, max: 25 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'GFCI outlet 15 amp') },
      { name: 'Outlet / Switch (standard)', unit: 'each', typicalQty: '1-6', priceRange: { min: 1, max: 5 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'electrical outlet 15 amp') },
      { name: 'Romex Wire (25ft, 12/2)', unit: '25ft', typicalQty: '1', priceRange: { min: 25, max: 50 }, retailers: makeRetailers(['homeDepot', 'lowes'], 'romex wire 12-2 25ft') },
      { name: 'Wire Nuts (assorted)', unit: 'pack', typicalQty: '1', priceRange: { min: 3, max: 8 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'wire nuts assorted pack') },
      { name: 'Voltage Tester', unit: 'each', typicalQty: '1', priceRange: { min: 12, max: 30 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'non contact voltage tester') },
      { name: 'Electrical Tape', unit: 'roll', typicalQty: '1-2', priceRange: { min: 3, max: 7 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'electrical tape black') },
      { name: 'Circuit Breaker', unit: 'each', typicalQty: '1', priceRange: { min: 5, max: 25 }, retailers: makeRetailers(['homeDepot', 'lowes'], 'circuit breaker 20 amp') },
    ]
  },
  painting: {
    diyDifficulty: 'easy',
    diyNotes: 'Painting is one of the most rewarding DIY projects. Proper prep is key - clean, sand, prime, then paint. Use quality brushes and rollers for a professional finish.',
    safetyWarnings: ['Use a respirator for oil-based paints', 'Ensure proper ventilation', 'Test for lead paint in homes built before 1978', 'Use drop cloths to protect floors and furniture'],
    materials: () => [
      { name: 'Interior Paint (gallon)', unit: 'gallon', typicalQty: '2-5', priceRange: { min: 25, max: 65 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'interior paint gallon eggshell') },
      { name: 'Exterior Paint (gallon)', unit: 'gallon', typicalQty: '3-8', priceRange: { min: 30, max: 75 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'exterior paint gallon satin') },
      { name: 'Primer (gallon)', unit: 'gallon', typicalQty: '1-3', priceRange: { min: 15, max: 40 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'paint primer gallon') },
      { name: 'Roller Cover (9" 3-pack)', unit: 'pack', typicalQty: '1-2', priceRange: { min: 8, max: 18 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'paint roller cover 9 inch') },
      { name: 'Paint Brushes (set)', unit: 'set', typicalQty: '1', priceRange: { min: 10, max: 25 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'paint brush set angled') },
      { name: "Painter's Tape (3-pack)", unit: 'pack', typicalQty: '1-2', priceRange: { min: 10, max: 22 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'painters tape blue 3 pack') },
      { name: 'Drop Cloth (9x12)', unit: 'each', typicalQty: '2-4', priceRange: { min: 5, max: 15 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'canvas drop cloth 9x12') },
      { name: 'Caulk + Caulk Gun', unit: 'set', typicalQty: '1', priceRange: { min: 8, max: 18 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'paintable caulk and caulk gun') },
    ]
  },
  auto: {
    diyDifficulty: 'moderate',
    diyNotes: 'Many basic repairs like brake pads, oil changes, and air filters are great DIY projects. Leave transmission and engine internals to professionals.',
    safetyWarnings: ['Always use jack stands, never just a jack', 'Wear safety glasses when under the vehicle', 'Disconnect battery before electrical work', 'Dispose of fluids properly at recycling centers'],
    materials: () => [
      { name: 'Brake Pads (front set)', unit: 'set', typicalQty: '1', priceRange: { min: 25, max: 80 }, retailers: makeRetailers(['autozone', 'oreilly', 'rockAuto', 'amazon'], 'front brake pads ceramic') },
      { name: 'Brake Rotors (pair)', unit: 'pair', typicalQty: '1', priceRange: { min: 40, max: 120 }, retailers: makeRetailers(['autozone', 'oreilly', 'rockAuto', 'amazon'], 'front brake rotors pair') },
      { name: 'Motor Oil (5 qt)', unit: '5 qt', typicalQty: '1', priceRange: { min: 20, max: 40 }, retailers: makeRetailers(['autozone', 'oreilly', 'amazon'], 'full synthetic motor oil 5 quart') },
      { name: 'Oil Filter', unit: 'each', typicalQty: '1', priceRange: { min: 5, max: 15 }, retailers: makeRetailers(['autozone', 'oreilly', 'rockAuto', 'amazon'], 'oil filter') },
      { name: 'Air Filter', unit: 'each', typicalQty: '1', priceRange: { min: 10, max: 30 }, retailers: makeRetailers(['autozone', 'oreilly', 'rockAuto', 'amazon'], 'engine air filter') },
      { name: 'Spark Plugs (set of 4)', unit: 'set', typicalQty: '1', priceRange: { min: 15, max: 50 }, retailers: makeRetailers(['autozone', 'oreilly', 'rockAuto', 'amazon'], 'spark plugs iridium set') },
      { name: 'Jack Stands (pair)', unit: 'pair', typicalQty: '1', priceRange: { min: 25, max: 60 }, retailers: makeRetailers(['autozone', 'amazon', 'homeDepot'], 'jack stands 3 ton pair') },
    ]
  },
  general: {
    diyDifficulty: 'moderate',
    diyNotes: 'General contractor work varies widely. Simple repairs and cosmetic improvements are DIY-friendly. Structural work, load-bearing walls, and additions require permits and professionals.',
    safetyWarnings: ['Check for permits before starting work', 'Never modify load-bearing walls without an engineer', 'Wear appropriate PPE for demolition', 'Check for asbestos in older homes'],
    materials: () => [
      { name: 'Drywall Sheet (4x8)', unit: 'sheet', typicalQty: '2-10', priceRange: { min: 12, max: 20 }, retailers: makeRetailers(['homeDepot', 'lowes'], 'drywall sheet 4x8 half inch') },
      { name: 'Joint Compound (bucket)', unit: 'bucket', typicalQty: '1', priceRange: { min: 10, max: 20 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'drywall joint compound') },
      { name: 'Drywall Tape', unit: 'roll', typicalQty: '1', priceRange: { min: 4, max: 10 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'drywall mesh tape') },
      { name: '2x4 Lumber (8ft)', unit: 'each', typicalQty: '4-12', priceRange: { min: 4, max: 8 }, retailers: makeRetailers(['homeDepot', 'lowes'], '2x4 lumber 8 foot stud') },
      { name: 'Construction Screws (box)', unit: 'box', typicalQty: '1', priceRange: { min: 8, max: 18 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'construction screws 3 inch') },
      { name: 'Wood Glue', unit: 'bottle', typicalQty: '1', priceRange: { min: 5, max: 12 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'wood glue titebond') },
    ]
  },
  flooring: {
    diyDifficulty: 'moderate',
    diyNotes: 'LVP and laminate flooring are very DIY-friendly with click-lock installation. Hardwood and tile require more skill and specialized tools.',
    safetyWarnings: ['Wear knee pads to protect your knees', 'Use a respirator when cutting', 'Check for asbestos in old flooring before removal', 'Acclimate flooring materials 48 hours before install'],
    materials: () => [
      { name: 'LVP Flooring (per sq ft)', unit: 'sq ft', typicalQty: '100-500', priceRange: { min: 2, max: 5 }, retailers: makeRetailers(['homeDepot', 'lowes', 'floorDecor'], 'luxury vinyl plank flooring') },
      { name: 'Underlayment Roll', unit: 'roll', typicalQty: '1-3', priceRange: { min: 20, max: 50 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'flooring underlayment roll') },
      { name: 'Transition Strips', unit: 'each', typicalQty: '2-6', priceRange: { min: 8, max: 20 }, retailers: makeRetailers(['homeDepot', 'lowes'], 'flooring transition strip') },
      { name: 'Spacers', unit: 'bag', typicalQty: '1', priceRange: { min: 5, max: 10 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'flooring spacers') },
      { name: 'Tapping Block + Pull Bar Kit', unit: 'kit', typicalQty: '1', priceRange: { min: 15, max: 35 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'flooring installation tool kit') },
      { name: 'Utility Knife + Blades', unit: 'kit', typicalQty: '1', priceRange: { min: 8, max: 20 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'utility knife with blades') },
    ]
  },
  fence: {
    diyDifficulty: 'moderate',
    diyNotes: 'Fence building is a rewarding DIY project. The hardest parts are digging post holes and getting posts level. Rent a post hole digger to save time.',
    safetyWarnings: ['Call 811 to mark utility lines before digging', 'Check property lines and local setback requirements', 'Verify HOA restrictions on fence height/style', 'Wear gloves when handling pressure-treated lumber'],
    materials: () => [
      { name: 'Fence Posts (4x4x8)', unit: 'each', typicalQty: '8-20', priceRange: { min: 10, max: 25 }, retailers: makeRetailers(['homeDepot', 'lowes'], 'fence post 4x4 8ft pressure treated') },
      { name: 'Fence Pickets / Boards', unit: 'each', typicalQty: '50-150', priceRange: { min: 2, max: 6 }, retailers: makeRetailers(['homeDepot', 'lowes'], 'fence picket 1x6 6ft dog ear') },
      { name: 'Rails (2x4x8)', unit: 'each', typicalQty: '12-36', priceRange: { min: 5, max: 12 }, retailers: makeRetailers(['homeDepot', 'lowes'], '2x4 fence rail 8ft') },
      { name: 'Concrete Mix (50lb bag)', unit: 'bag', typicalQty: '8-20', priceRange: { min: 4, max: 7 }, retailers: makeRetailers(['homeDepot', 'lowes'], 'quikrete concrete mix 50lb') },
      { name: 'Fence Screws / Nails', unit: 'box', typicalQty: '2-4', priceRange: { min: 8, max: 18 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'fence screws exterior') },
      { name: 'Post Hole Digger (rental)', unit: 'day', typicalQty: '1', priceRange: { min: 40, max: 75 }, retailers: makeRetailers(['homeDepot', 'lowes'], 'post hole digger rental') },
      { name: 'Gate Hardware Kit', unit: 'kit', typicalQty: '1', priceRange: { min: 15, max: 40 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'fence gate hardware kit hinges latch') },
    ]
  },
  concrete: {
    diyDifficulty: 'hard',
    diyNotes: 'Small concrete pads and repairs are DIY-possible, but larger pours need experience. Concrete is unforgiving - once it sets, mistakes are permanent.',
    safetyWarnings: ['Concrete is caustic - wear gloves and long sleeves', 'Use knee pads for finishing work', 'Have all tools ready before mixing - concrete waits for no one', 'Check weather forecast - avoid rain and extreme temps'],
    materials: () => [
      { name: 'Concrete Mix (80lb bag)', unit: 'bag', typicalQty: '10-40', priceRange: { min: 5, max: 8 }, retailers: makeRetailers(['homeDepot', 'lowes'], 'quikrete concrete mix 80lb') },
      { name: 'Rebar (#4, 10ft)', unit: 'each', typicalQty: '4-12', priceRange: { min: 5, max: 12 }, retailers: makeRetailers(['homeDepot', 'lowes'], 'rebar half inch 10ft') },
      { name: 'Wire Mesh (5x10 sheet)', unit: 'sheet', typicalQty: '1-4', priceRange: { min: 8, max: 18 }, retailers: makeRetailers(['homeDepot', 'lowes'], 'concrete wire mesh sheet') },
      { name: 'Form Boards (2x4)', unit: 'each', typicalQty: '8-16', priceRange: { min: 4, max: 8 }, retailers: makeRetailers(['homeDepot', 'lowes'], '2x4 lumber form boards') },
      { name: 'Concrete Float', unit: 'each', typicalQty: '1', priceRange: { min: 15, max: 35 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'magnesium concrete float') },
      { name: 'Edger Tool', unit: 'each', typicalQty: '1', priceRange: { min: 10, max: 25 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'concrete edger tool') },
      { name: 'Concrete Sealer', unit: 'gallon', typicalQty: '1-2', priceRange: { min: 25, max: 50 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'concrete sealer waterproof') },
    ]
  },
  other: {
    diyDifficulty: 'moderate',
    diyNotes: 'Custom projects vary widely. Research your specific project thoroughly and consider consulting a professional for guidance even if you plan to DIY.',
    safetyWarnings: ['Research specific safety requirements for your project', 'Wear appropriate PPE', 'Check local building codes and permits', 'When in doubt, hire a professional'],
    materials: () => [
      { name: 'General Hardware Kit', unit: 'kit', typicalQty: '1', priceRange: { min: 15, max: 40 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'general purpose hardware kit') },
      { name: 'Measuring Tape (25ft)', unit: 'each', typicalQty: '1', priceRange: { min: 8, max: 20 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'measuring tape 25ft') },
      { name: 'Level (24")', unit: 'each', typicalQty: '1', priceRange: { min: 10, max: 30 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'spirit level 24 inch') },
      { name: 'Safety Glasses', unit: 'pair', typicalQty: '1', priceRange: { min: 5, max: 15 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'safety glasses clear') },
      { name: 'Work Gloves', unit: 'pair', typicalQty: '1', priceRange: { min: 8, max: 20 }, retailers: makeRetailers(['homeDepot', 'lowes', 'amazon'], 'work gloves leather') },
    ]
  }
};

export function getDIYMaterials(trade: string, issue?: string): TradeMaterialsResult {
  const tradeKey = trade.toLowerCase().replace(/[^a-z]/g, '');
  const mapped = tradeKey === 'tree_removal' || tradeKey === 'treeservices' || tradeKey === 'treeservice' ? 'tree'
    : tradeKey === 'autorepair' ? 'auto'
    : tradeKey === 'generalcontractor' ? 'general'
    : tradeKey === 'fencing' ? 'fence'
    : TRADE_MATERIALS[tradeKey] ? tradeKey : 'other';

  const tradeData = TRADE_MATERIALS[mapped] || TRADE_MATERIALS.other;
  const materials = tradeData.materials(issue);

  const totalMin = materials.reduce((sum, m) => {
    const qty = parseInt(m.typicalQty.split('-')[0]) || 1;
    return sum + m.priceRange.min * qty;
  }, 0);
  const totalMax = materials.reduce((sum, m) => {
    const parts = m.typicalQty.split('-');
    const qty = parseInt(parts[parts.length - 1]) || 1;
    return sum + m.priceRange.max * qty;
  }, 0);

  const tradeNames: Record<string, string> = {
    tree: 'Tree Services', roofing: 'Roofing', hvac: 'HVAC', plumbing: 'Plumbing',
    electrical: 'Electrical', painting: 'Painting', auto: 'Auto Repair',
    general: 'General Contractor', flooring: 'Flooring', fence: 'Fencing',
    concrete: 'Concrete', other: 'Custom Project'
  };

  return {
    trade: mapped,
    tradeName: tradeNames[mapped] || 'Custom Project',
    materials,
    totalMaterialCostMin: totalMin,
    totalMaterialCostMax: totalMax,
    safetyWarnings: tradeData.safetyWarnings,
    diyDifficulty: tradeData.diyDifficulty,
    diyNotes: tradeData.diyNotes,
    disclaimer: ESTIMATE_DISCLAIMER,
    affiliateDisclosure: AFFILIATE_DISCLOSURE,
  };
}

export { ESTIMATE_DISCLAIMER, AFFILIATE_DISCLOSURE };
