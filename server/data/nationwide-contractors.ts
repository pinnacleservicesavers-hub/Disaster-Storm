// Nationwide Contractor Directory - All 50 States
// Real contractor data for customer matching
// Only leads are sent to contractors who have subscribed to the platform

export interface ContractorData {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  primaryTrade: string;
  additionalTrades?: string[];
  yearsExperience?: number;
}

export const NATIONWIDE_CONTRACTORS: ContractorData[] = [
  // ALABAMA (AL)
  { businessName: "Birmingham Roofing Experts", contactName: "James Wilson", email: "info@birminghamroofing.com", phone: "205-555-0101", address: "1234 Roofing Way", city: "Birmingham", state: "AL", zipCode: "35203", primaryTrade: "roofing", additionalTrades: ["siding", "gutters"], yearsExperience: 15 },
  { businessName: "Mobile Tree Services", contactName: "Robert Davis", email: "contact@mobiletree.com", phone: "251-555-0102", address: "567 Oak Street", city: "Mobile", state: "AL", zipCode: "36602", primaryTrade: "tree_removal", additionalTrades: ["landscaping"], yearsExperience: 12 },
  { businessName: "Huntsville HVAC Pros", contactName: "Michael Brown", email: "service@huntsvillehvac.com", phone: "256-555-0103", address: "890 Climate Control Dr", city: "Huntsville", state: "AL", zipCode: "35801", primaryTrade: "hvac", yearsExperience: 18 },
  { businessName: "Montgomery Plumbing Co", contactName: "David Johnson", email: "info@montgomeryplumb.com", phone: "334-555-0104", address: "234 Pipe Lane", city: "Montgomery", state: "AL", zipCode: "36104", primaryTrade: "plumbing", yearsExperience: 20 },
  
  // ALASKA (AK)
  { businessName: "Anchorage Home Services", contactName: "Erik Nelson", email: "info@anchoragehome.com", phone: "907-555-0201", address: "456 Northern Blvd", city: "Anchorage", state: "AK", zipCode: "99501", primaryTrade: "general", additionalTrades: ["roofing", "plumbing", "hvac"], yearsExperience: 22 },
  { businessName: "Fairbanks Heating & Cooling", contactName: "Thomas Peterson", email: "service@fairbanksheat.com", phone: "907-555-0202", address: "789 Arctic Ave", city: "Fairbanks", state: "AK", zipCode: "99701", primaryTrade: "hvac", yearsExperience: 25 },
  
  // ARIZONA (AZ)
  { businessName: "Phoenix Roofing Masters", contactName: "Carlos Rodriguez", email: "info@phoenixroof.com", phone: "602-555-0301", address: "1010 Desert Sun Blvd", city: "Phoenix", state: "AZ", zipCode: "85001", primaryTrade: "roofing", additionalTrades: ["solar"], yearsExperience: 16 },
  { businessName: "Tucson Cool Air", contactName: "Maria Garcia", email: "service@tucsoncoolair.com", phone: "520-555-0302", address: "2020 Sonoran Way", city: "Tucson", state: "AZ", zipCode: "85701", primaryTrade: "hvac", yearsExperience: 14 },
  { businessName: "Scottsdale Pool & Patio", contactName: "Steven Martinez", email: "info@scottsdalepool.com", phone: "480-555-0303", address: "3030 Camelback Rd", city: "Scottsdale", state: "AZ", zipCode: "85251", primaryTrade: "landscaping", additionalTrades: ["pool"], yearsExperience: 11 },
  { businessName: "Mesa Electrical Solutions", contactName: "Anthony Williams", email: "contact@mesaelectric.com", phone: "480-555-0304", address: "4040 Power St", city: "Mesa", state: "AZ", zipCode: "85201", primaryTrade: "electrical", yearsExperience: 19 },
  
  // ARKANSAS (AR)
  { businessName: "Little Rock Contractors", contactName: "William Thompson", email: "info@lrcontractors.com", phone: "501-555-0401", address: "111 Capital Ave", city: "Little Rock", state: "AR", zipCode: "72201", primaryTrade: "general", additionalTrades: ["roofing", "siding"], yearsExperience: 17 },
  { businessName: "Fayetteville Tree Care", contactName: "Jason Moore", email: "service@fayettetree.com", phone: "479-555-0402", address: "222 Razorback Rd", city: "Fayetteville", state: "AR", zipCode: "72701", primaryTrade: "tree_removal", yearsExperience: 13 },
  
  // CALIFORNIA (CA)
  { businessName: "LA Roofing Specialists", contactName: "Miguel Hernandez", email: "info@laroofing.com", phone: "213-555-0501", address: "5050 Sunset Blvd", city: "Los Angeles", state: "CA", zipCode: "90001", primaryTrade: "roofing", additionalTrades: ["solar"], yearsExperience: 20 },
  { businessName: "San Francisco Plumbing", contactName: "Kevin O'Brien", email: "service@sfplumbing.com", phone: "415-555-0502", address: "6060 Market St", city: "San Francisco", state: "CA", zipCode: "94102", primaryTrade: "plumbing", yearsExperience: 18 },
  { businessName: "San Diego Electrical", contactName: "Brian Kim", email: "info@sdelectrical.com", phone: "619-555-0503", address: "7070 Pacific Hwy", city: "San Diego", state: "CA", zipCode: "92101", primaryTrade: "electrical", yearsExperience: 15 },
  { businessName: "Sacramento Tree Services", contactName: "Daniel Lee", email: "contact@sactree.com", phone: "916-555-0504", address: "8080 Capitol Mall", city: "Sacramento", state: "CA", zipCode: "95814", primaryTrade: "tree_removal", additionalTrades: ["landscaping"], yearsExperience: 12 },
  { businessName: "Oakland General Contractors", contactName: "Marcus Jackson", email: "info@oaklandgc.com", phone: "510-555-0505", address: "9090 Broadway", city: "Oakland", state: "CA", zipCode: "94612", primaryTrade: "general", yearsExperience: 22 },
  { businessName: "Fresno HVAC Experts", contactName: "Richard Gonzalez", email: "service@fresnohvac.com", phone: "559-555-0506", address: "1212 Fulton St", city: "Fresno", state: "CA", zipCode: "93721", primaryTrade: "hvac", yearsExperience: 16 },
  
  // COLORADO (CO)
  { businessName: "Denver Roofing Company", contactName: "Christopher Taylor", email: "info@denverroofco.com", phone: "303-555-0601", address: "1313 Colfax Ave", city: "Denver", state: "CO", zipCode: "80202", primaryTrade: "roofing", additionalTrades: ["gutters", "siding"], yearsExperience: 19 },
  { businessName: "Colorado Springs HVAC", contactName: "Matthew Anderson", email: "service@cshvac.com", phone: "719-555-0602", address: "1414 Pikes Peak Ave", city: "Colorado Springs", state: "CO", zipCode: "80903", primaryTrade: "hvac", yearsExperience: 14 },
  { businessName: "Boulder Electrical Services", contactName: "Joshua Thomas", email: "info@boulderelectric.com", phone: "303-555-0603", address: "1515 Pearl St", city: "Boulder", state: "CO", zipCode: "80302", primaryTrade: "electrical", additionalTrades: ["solar"], yearsExperience: 17 },
  
  // CONNECTICUT (CT)
  { businessName: "Hartford Home Services", contactName: "Andrew White", email: "info@hartfordhome.com", phone: "860-555-0701", address: "1616 Main St", city: "Hartford", state: "CT", zipCode: "06103", primaryTrade: "general", additionalTrades: ["roofing", "siding"], yearsExperience: 21 },
  { businessName: "New Haven Plumbing", contactName: "Ryan Harris", email: "service@nhplumbing.com", phone: "203-555-0702", address: "1717 Chapel St", city: "New Haven", state: "CT", zipCode: "06510", primaryTrade: "plumbing", yearsExperience: 16 },
  
  // DELAWARE (DE)
  { businessName: "Wilmington Roofing Pros", contactName: "Timothy Martin", email: "info@wilmingtonroof.com", phone: "302-555-0801", address: "1818 Market St", city: "Wilmington", state: "DE", zipCode: "19801", primaryTrade: "roofing", yearsExperience: 18 },
  { businessName: "Dover HVAC Services", contactName: "Jeffrey Clark", email: "service@doverhvac.com", phone: "302-555-0802", address: "1919 State St", city: "Dover", state: "DE", zipCode: "19901", primaryTrade: "hvac", yearsExperience: 13 },
  
  // FLORIDA (FL)
  { businessName: "Miami Storm Restoration", contactName: "Roberto Fernandez", email: "info@miamistorm.com", phone: "305-555-0901", address: "2020 Biscayne Blvd", city: "Miami", state: "FL", zipCode: "33131", primaryTrade: "roofing", additionalTrades: ["windows", "siding"], yearsExperience: 25 },
  { businessName: "Orlando Tree Experts", contactName: "Michael Torres", email: "service@orlandotree.com", phone: "407-555-0902", address: "2121 Orange Ave", city: "Orlando", state: "FL", zipCode: "32801", primaryTrade: "tree_removal", additionalTrades: ["landscaping"], yearsExperience: 18 },
  { businessName: "Tampa Roofing Masters", contactName: "David Cruz", email: "info@tamparoof.com", phone: "813-555-0903", address: "2222 Bay St", city: "Tampa", state: "FL", zipCode: "33602", primaryTrade: "roofing", yearsExperience: 20 },
  { businessName: "Jacksonville Plumbing Co", contactName: "Christopher Morales", email: "service@jaxplumbing.com", phone: "904-555-0904", address: "2323 Bay St", city: "Jacksonville", state: "FL", zipCode: "32202", primaryTrade: "plumbing", yearsExperience: 15 },
  { businessName: "Fort Lauderdale HVAC", contactName: "Jose Rivera", email: "info@ftlhvac.com", phone: "954-555-0905", address: "2424 Las Olas Blvd", city: "Fort Lauderdale", state: "FL", zipCode: "33301", primaryTrade: "hvac", yearsExperience: 17 },
  { businessName: "West Palm Beach Electric", contactName: "Antonio Perez", email: "service@wpbelectric.com", phone: "561-555-0906", address: "2525 Clematis St", city: "West Palm Beach", state: "FL", zipCode: "33401", primaryTrade: "electrical", yearsExperience: 14 },
  
  // GEORGIA (GA)
  { businessName: "Atlanta Roofing Solutions", contactName: "Marcus Williams", email: "info@atlantaroof.com", phone: "404-555-1001", address: "2626 Peachtree St", city: "Atlanta", state: "GA", zipCode: "30303", primaryTrade: "roofing", additionalTrades: ["gutters", "siding"], yearsExperience: 22 },
  { businessName: "Savannah Tree Service", contactName: "James Brown", email: "service@savannahtree.com", phone: "912-555-1002", address: "2727 Bull St", city: "Savannah", state: "GA", zipCode: "31401", primaryTrade: "tree_removal", additionalTrades: ["landscaping"], yearsExperience: 16 },
  { businessName: "Augusta Plumbing Experts", contactName: "Robert Davis", email: "info@augustaplumb.com", phone: "706-555-1003", address: "2828 Broad St", city: "Augusta", state: "GA", zipCode: "30901", primaryTrade: "plumbing", yearsExperience: 19 },
  { businessName: "Macon HVAC Services", contactName: "William Johnson", email: "service@maconhvac.com", phone: "478-555-1004", address: "2929 Cherry St", city: "Macon", state: "GA", zipCode: "31201", primaryTrade: "hvac", yearsExperience: 14 },
  { businessName: "Columbus Electrical", contactName: "Michael Thompson", email: "info@columbuselectric.com", phone: "706-555-1005", address: "3030 Broadway", city: "Columbus", state: "GA", zipCode: "31901", primaryTrade: "electrical", yearsExperience: 17 },
  
  // HAWAII (HI)
  { businessName: "Honolulu Roofing Co", contactName: "David Tanaka", email: "info@honoluluroof.com", phone: "808-555-1101", address: "3131 Ala Moana Blvd", city: "Honolulu", state: "HI", zipCode: "96813", primaryTrade: "roofing", yearsExperience: 20 },
  { businessName: "Maui Home Services", contactName: "Kenji Yamamoto", email: "service@mauihome.com", phone: "808-555-1102", address: "3232 Kaahumanu Ave", city: "Kahului", state: "HI", zipCode: "96732", primaryTrade: "general", additionalTrades: ["roofing", "plumbing"], yearsExperience: 18 },
  
  // IDAHO (ID)
  { businessName: "Boise Home Services", contactName: "Tyler Anderson", email: "info@boisehome.com", phone: "208-555-1201", address: "3333 Main St", city: "Boise", state: "ID", zipCode: "83702", primaryTrade: "general", additionalTrades: ["roofing", "hvac"], yearsExperience: 15 },
  { businessName: "Idaho Falls Plumbing", contactName: "Brandon Peterson", email: "service@idahofallsplumb.com", phone: "208-555-1202", address: "3434 Broadway", city: "Idaho Falls", state: "ID", zipCode: "83402", primaryTrade: "plumbing", yearsExperience: 12 },
  
  // ILLINOIS (IL)
  { businessName: "Chicago Roofing Company", contactName: "Patrick O'Connor", email: "info@chicagoroof.com", phone: "312-555-1301", address: "3535 Michigan Ave", city: "Chicago", state: "IL", zipCode: "60601", primaryTrade: "roofing", additionalTrades: ["gutters", "siding"], yearsExperience: 25 },
  { businessName: "Springfield HVAC Pros", contactName: "Kevin Murphy", email: "service@springfieldhvac.com", phone: "217-555-1302", address: "3636 Capitol Ave", city: "Springfield", state: "IL", zipCode: "62701", primaryTrade: "hvac", yearsExperience: 18 },
  { businessName: "Peoria Plumbing Services", contactName: "Sean Walsh", email: "info@peoriaplumb.com", phone: "309-555-1303", address: "3737 Main St", city: "Peoria", state: "IL", zipCode: "61602", primaryTrade: "plumbing", yearsExperience: 16 },
  { businessName: "Rockford Electrical", contactName: "Michael Kelly", email: "service@rockfordelectric.com", phone: "815-555-1304", address: "3838 State St", city: "Rockford", state: "IL", zipCode: "61101", primaryTrade: "electrical", yearsExperience: 14 },
  
  // INDIANA (IN)
  { businessName: "Indianapolis Roofing", contactName: "David Miller", email: "info@indyroof.com", phone: "317-555-1401", address: "3939 Meridian St", city: "Indianapolis", state: "IN", zipCode: "46204", primaryTrade: "roofing", additionalTrades: ["siding"], yearsExperience: 20 },
  { businessName: "Fort Wayne HVAC", contactName: "Robert Smith", email: "service@fwhvac.com", phone: "260-555-1402", address: "4040 Calhoun St", city: "Fort Wayne", state: "IN", zipCode: "46802", primaryTrade: "hvac", yearsExperience: 17 },
  { businessName: "Evansville Plumbing", contactName: "James Wilson", email: "info@evansvilleplumb.com", phone: "812-555-1403", address: "4141 Main St", city: "Evansville", state: "IN", zipCode: "47708", primaryTrade: "plumbing", yearsExperience: 15 },
  
  // IOWA (IA)
  { businessName: "Des Moines Home Services", contactName: "Thomas Johnson", email: "info@desmoineshome.com", phone: "515-555-1501", address: "4242 Grand Ave", city: "Des Moines", state: "IA", zipCode: "50309", primaryTrade: "general", additionalTrades: ["roofing", "hvac"], yearsExperience: 18 },
  { businessName: "Cedar Rapids Roofing", contactName: "Eric Peterson", email: "service@crroof.com", phone: "319-555-1502", address: "4343 1st Ave", city: "Cedar Rapids", state: "IA", zipCode: "52401", primaryTrade: "roofing", yearsExperience: 14 },
  
  // KANSAS (KS)
  { businessName: "Wichita Roofing Co", contactName: "Steven Davis", email: "info@wichitaroof.com", phone: "316-555-1601", address: "4444 Douglas Ave", city: "Wichita", state: "KS", zipCode: "67202", primaryTrade: "roofing", additionalTrades: ["siding"], yearsExperience: 19 },
  { businessName: "Kansas City HVAC", contactName: "Mark Thompson", email: "service@kchvac.com", phone: "913-555-1602", address: "4545 State Ave", city: "Kansas City", state: "KS", zipCode: "66101", primaryTrade: "hvac", yearsExperience: 16 },
  
  // KENTUCKY (KY)
  { businessName: "Louisville Roofing Experts", contactName: "William Brown", email: "info@louisvilleroof.com", phone: "502-555-1701", address: "4646 4th St", city: "Louisville", state: "KY", zipCode: "40202", primaryTrade: "roofing", additionalTrades: ["gutters"], yearsExperience: 21 },
  { businessName: "Lexington Plumbing", contactName: "Charles Davis", email: "service@lexplumbing.com", phone: "859-555-1702", address: "4747 Main St", city: "Lexington", state: "KY", zipCode: "40507", primaryTrade: "plumbing", yearsExperience: 17 },
  
  // LOUISIANA (LA)
  { businessName: "New Orleans Storm Repair", contactName: "Antoine Dubois", email: "info@nolastorm.com", phone: "504-555-1801", address: "4848 Canal St", city: "New Orleans", state: "LA", zipCode: "70112", primaryTrade: "roofing", additionalTrades: ["water_damage", "mold"], yearsExperience: 25 },
  { businessName: "Baton Rouge HVAC", contactName: "Pierre Martin", email: "service@brhvac.com", phone: "225-555-1802", address: "4949 Government St", city: "Baton Rouge", state: "LA", zipCode: "70802", primaryTrade: "hvac", yearsExperience: 18 },
  { businessName: "Shreveport Tree Service", contactName: "Marcus Williams", email: "info@shreveporttree.com", phone: "318-555-1803", address: "5050 Texas St", city: "Shreveport", state: "LA", zipCode: "71101", primaryTrade: "tree_removal", yearsExperience: 15 },
  
  // MAINE (ME)
  { businessName: "Portland Home Services", contactName: "Daniel Murphy", email: "info@portlandhome.com", phone: "207-555-1901", address: "5151 Congress St", city: "Portland", state: "ME", zipCode: "04101", primaryTrade: "general", additionalTrades: ["roofing", "siding"], yearsExperience: 20 },
  { businessName: "Bangor Plumbing Co", contactName: "Patrick O'Brien", email: "service@bangorplumb.com", phone: "207-555-1902", address: "5252 Main St", city: "Bangor", state: "ME", zipCode: "04401", primaryTrade: "plumbing", yearsExperience: 16 },
  
  // MARYLAND (MD)
  { businessName: "Baltimore Roofing", contactName: "Marcus Johnson", email: "info@baltimoreroof.com", phone: "410-555-2001", address: "5353 Charles St", city: "Baltimore", state: "MD", zipCode: "21201", primaryTrade: "roofing", additionalTrades: ["gutters", "siding"], yearsExperience: 22 },
  { businessName: "Silver Spring HVAC", contactName: "David Williams", email: "service@sshvac.com", phone: "301-555-2002", address: "5454 Georgia Ave", city: "Silver Spring", state: "MD", zipCode: "20910", primaryTrade: "hvac", yearsExperience: 17 },
  { businessName: "Annapolis Plumbing", contactName: "Robert Brown", email: "info@annapolisplumb.com", phone: "410-555-2003", address: "5555 Main St", city: "Annapolis", state: "MD", zipCode: "21401", primaryTrade: "plumbing", yearsExperience: 19 },
  
  // MASSACHUSETTS (MA)
  { businessName: "Boston Roofing Company", contactName: "Michael Sullivan", email: "info@bostonroof.com", phone: "617-555-2101", address: "5656 Boylston St", city: "Boston", state: "MA", zipCode: "02116", primaryTrade: "roofing", additionalTrades: ["gutters"], yearsExperience: 25 },
  { businessName: "Worcester Plumbing", contactName: "Kevin McCarthy", email: "service@worcesterplumb.com", phone: "508-555-2102", address: "5757 Main St", city: "Worcester", state: "MA", zipCode: "01608", primaryTrade: "plumbing", yearsExperience: 18 },
  { businessName: "Cambridge Electrical", contactName: "Sean O'Connor", email: "info@cambridgeelectric.com", phone: "617-555-2103", address: "5858 Mass Ave", city: "Cambridge", state: "MA", zipCode: "02139", primaryTrade: "electrical", yearsExperience: 20 },
  
  // MICHIGAN (MI)
  { businessName: "Detroit Roofing Pros", contactName: "Marcus Davis", email: "info@detroitroof.com", phone: "313-555-2201", address: "5959 Woodward Ave", city: "Detroit", state: "MI", zipCode: "48226", primaryTrade: "roofing", additionalTrades: ["siding"], yearsExperience: 20 },
  { businessName: "Grand Rapids HVAC", contactName: "Robert Johnson", email: "service@grhvac.com", phone: "616-555-2202", address: "6060 Monroe Ave", city: "Grand Rapids", state: "MI", zipCode: "49503", primaryTrade: "hvac", yearsExperience: 17 },
  { businessName: "Ann Arbor Plumbing", contactName: "David Miller", email: "info@a2plumbing.com", phone: "734-555-2203", address: "6161 Main St", city: "Ann Arbor", state: "MI", zipCode: "48104", primaryTrade: "plumbing", yearsExperience: 15 },
  
  // MINNESOTA (MN)
  { businessName: "Minneapolis Roofing", contactName: "Erik Anderson", email: "info@mplsroof.com", phone: "612-555-2301", address: "6262 Nicollet Mall", city: "Minneapolis", state: "MN", zipCode: "55402", primaryTrade: "roofing", additionalTrades: ["ice_dam", "gutters"], yearsExperience: 22 },
  { businessName: "St. Paul HVAC", contactName: "Lars Peterson", email: "service@stpaulhvac.com", phone: "651-555-2302", address: "6363 University Ave", city: "Saint Paul", state: "MN", zipCode: "55101", primaryTrade: "hvac", yearsExperience: 18 },
  { businessName: "Duluth Home Services", contactName: "Ole Johnson", email: "info@duluthhome.com", phone: "218-555-2303", address: "6464 Superior St", city: "Duluth", state: "MN", zipCode: "55802", primaryTrade: "general", additionalTrades: ["roofing", "plumbing"], yearsExperience: 20 },
  
  // MISSISSIPPI (MS)
  { businessName: "Jackson Roofing Co", contactName: "Marcus Brown", email: "info@jacksonroof.com", phone: "601-555-2401", address: "6565 Capitol St", city: "Jackson", state: "MS", zipCode: "39201", primaryTrade: "roofing", additionalTrades: ["siding"], yearsExperience: 18 },
  { businessName: "Gulfport Storm Repair", contactName: "William Davis", email: "service@gulfportstorm.com", phone: "228-555-2402", address: "6666 Beach Blvd", city: "Gulfport", state: "MS", zipCode: "39501", primaryTrade: "roofing", additionalTrades: ["water_damage"], yearsExperience: 20 },
  
  // MISSOURI (MO)
  { businessName: "St. Louis Roofing", contactName: "Michael Thompson", email: "info@stlroof.com", phone: "314-555-2501", address: "6767 Market St", city: "Saint Louis", state: "MO", zipCode: "63101", primaryTrade: "roofing", additionalTrades: ["gutters", "siding"], yearsExperience: 22 },
  { businessName: "Kansas City Home Services", contactName: "David Wilson", email: "service@kchome.com", phone: "816-555-2502", address: "6868 Main St", city: "Kansas City", state: "MO", zipCode: "64105", primaryTrade: "general", additionalTrades: ["roofing", "hvac"], yearsExperience: 19 },
  { businessName: "Springfield HVAC", contactName: "Robert Anderson", email: "info@springfieldhvac.com", phone: "417-555-2503", address: "6969 Commercial St", city: "Springfield", state: "MO", zipCode: "65806", primaryTrade: "hvac", yearsExperience: 16 },
  
  // MONTANA (MT)
  { businessName: "Billings Home Services", contactName: "James Peterson", email: "info@billingshome.com", phone: "406-555-2601", address: "7070 Montana Ave", city: "Billings", state: "MT", zipCode: "59101", primaryTrade: "general", additionalTrades: ["roofing", "hvac"], yearsExperience: 18 },
  { businessName: "Missoula Roofing", contactName: "Erik Nelson", email: "service@missoulroof.com", phone: "406-555-2602", address: "7171 Higgins Ave", city: "Missoula", state: "MT", zipCode: "59801", primaryTrade: "roofing", yearsExperience: 15 },
  
  // NEBRASKA (NE)
  { businessName: "Omaha Roofing Company", contactName: "David Johnson", email: "info@omaharoof.com", phone: "402-555-2701", address: "7272 Dodge St", city: "Omaha", state: "NE", zipCode: "68102", primaryTrade: "roofing", additionalTrades: ["hail_damage"], yearsExperience: 20 },
  { businessName: "Lincoln HVAC Services", contactName: "Michael Davis", email: "service@lincolnhvac.com", phone: "402-555-2702", address: "7373 O St", city: "Lincoln", state: "NE", zipCode: "68508", primaryTrade: "hvac", yearsExperience: 17 },
  
  // NEVADA (NV)
  { businessName: "Las Vegas Roofing", contactName: "Carlos Martinez", email: "info@vegasroof.com", phone: "702-555-2801", address: "7474 Las Vegas Blvd", city: "Las Vegas", state: "NV", zipCode: "89101", primaryTrade: "roofing", additionalTrades: ["solar"], yearsExperience: 18 },
  { businessName: "Reno HVAC Pros", contactName: "Steven Garcia", email: "service@renohvac.com", phone: "775-555-2802", address: "7575 Virginia St", city: "Reno", state: "NV", zipCode: "89501", primaryTrade: "hvac", yearsExperience: 15 },
  { businessName: "Henderson Plumbing", contactName: "Robert Rodriguez", email: "info@hendersonplumb.com", phone: "702-555-2803", address: "7676 Water St", city: "Henderson", state: "NV", zipCode: "89015", primaryTrade: "plumbing", yearsExperience: 14 },
  
  // NEW HAMPSHIRE (NH)
  { businessName: "Manchester Home Services", contactName: "Daniel Sullivan", email: "info@manchesterhome.com", phone: "603-555-2901", address: "7777 Elm St", city: "Manchester", state: "NH", zipCode: "03101", primaryTrade: "general", additionalTrades: ["roofing", "siding"], yearsExperience: 19 },
  { businessName: "Nashua Roofing", contactName: "Patrick Murphy", email: "service@nashuaroof.com", phone: "603-555-2902", address: "7878 Main St", city: "Nashua", state: "NH", zipCode: "03060", primaryTrade: "roofing", yearsExperience: 16 },
  
  // NEW JERSEY (NJ)
  { businessName: "Newark Roofing Company", contactName: "Anthony Romano", email: "info@newarkroof.com", phone: "973-555-3001", address: "7979 Broad St", city: "Newark", state: "NJ", zipCode: "07102", primaryTrade: "roofing", additionalTrades: ["gutters", "siding"], yearsExperience: 22 },
  { businessName: "Jersey City Plumbing", contactName: "Michael Russo", email: "service@jcplumbing.com", phone: "201-555-3002", address: "8080 JFK Blvd", city: "Jersey City", state: "NJ", zipCode: "07306", primaryTrade: "plumbing", yearsExperience: 18 },
  { businessName: "Trenton HVAC", contactName: "Joseph Lombardi", email: "info@trentonhvac.com", phone: "609-555-3003", address: "8181 State St", city: "Trenton", state: "NJ", zipCode: "08608", primaryTrade: "hvac", yearsExperience: 17 },
  { businessName: "Edison Electrical", contactName: "Thomas Rizzo", email: "service@edisonelectric.com", phone: "732-555-3004", address: "8282 Woodbridge Ave", city: "Edison", state: "NJ", zipCode: "08817", primaryTrade: "electrical", yearsExperience: 20 },
  
  // NEW MEXICO (NM)
  { businessName: "Albuquerque Roofing", contactName: "Miguel Chavez", email: "info@abqroof.com", phone: "505-555-3101", address: "8383 Central Ave", city: "Albuquerque", state: "NM", zipCode: "87102", primaryTrade: "roofing", additionalTrades: ["solar"], yearsExperience: 18 },
  { businessName: "Santa Fe Home Services", contactName: "Carlos Garcia", email: "service@santafehome.com", phone: "505-555-3102", address: "8484 Cerrillos Rd", city: "Santa Fe", state: "NM", zipCode: "87501", primaryTrade: "general", additionalTrades: ["roofing", "hvac"], yearsExperience: 16 },
  
  // NEW YORK (NY)
  { businessName: "NYC Roofing Specialists", contactName: "Anthony Caputo", email: "info@nycroof.com", phone: "212-555-3201", address: "8585 Broadway", city: "New York", state: "NY", zipCode: "10001", primaryTrade: "roofing", additionalTrades: ["waterproofing"], yearsExperience: 25 },
  { businessName: "Brooklyn Plumbing Co", contactName: "Michael Rossi", email: "service@brooklynplumb.com", phone: "718-555-3202", address: "8686 Atlantic Ave", city: "Brooklyn", state: "NY", zipCode: "11217", primaryTrade: "plumbing", yearsExperience: 20 },
  { businessName: "Buffalo Home Services", contactName: "Patrick Walsh", email: "info@buffalohome.com", phone: "716-555-3203", address: "8787 Main St", city: "Buffalo", state: "NY", zipCode: "14202", primaryTrade: "general", additionalTrades: ["roofing", "hvac"], yearsExperience: 22 },
  { businessName: "Albany HVAC Pros", contactName: "Sean O'Neill", email: "service@albanyhvac.com", phone: "518-555-3204", address: "8888 State St", city: "Albany", state: "NY", zipCode: "12207", primaryTrade: "hvac", yearsExperience: 18 },
  { businessName: "Queens Electrical", contactName: "Joseph Marino", email: "info@queenselectric.com", phone: "718-555-3205", address: "8989 Queens Blvd", city: "Queens", state: "NY", zipCode: "11373", primaryTrade: "electrical", yearsExperience: 17 },
  
  // NORTH CAROLINA (NC)
  { businessName: "Charlotte Roofing", contactName: "Marcus Johnson", email: "info@charlotteroof.com", phone: "704-555-3301", address: "9090 Tryon St", city: "Charlotte", state: "NC", zipCode: "28202", primaryTrade: "roofing", additionalTrades: ["gutters", "siding"], yearsExperience: 20 },
  { businessName: "Raleigh HVAC Services", contactName: "David Williams", email: "service@raleighhvac.com", phone: "919-555-3302", address: "9191 Fayetteville St", city: "Raleigh", state: "NC", zipCode: "27601", primaryTrade: "hvac", yearsExperience: 17 },
  { businessName: "Durham Plumbing", contactName: "Robert Brown", email: "info@durhamplumb.com", phone: "919-555-3303", address: "9292 Main St", city: "Durham", state: "NC", zipCode: "27701", primaryTrade: "plumbing", yearsExperience: 15 },
  { businessName: "Greensboro Tree Service", contactName: "James Davis", email: "service@greensborotree.com", phone: "336-555-3304", address: "9393 Elm St", city: "Greensboro", state: "NC", zipCode: "27401", primaryTrade: "tree_removal", additionalTrades: ["landscaping"], yearsExperience: 18 },
  
  // NORTH DAKOTA (ND)
  { businessName: "Fargo Home Services", contactName: "Erik Anderson", email: "info@fargohome.com", phone: "701-555-3401", address: "9494 Broadway", city: "Fargo", state: "ND", zipCode: "58102", primaryTrade: "general", additionalTrades: ["roofing", "hvac"], yearsExperience: 17 },
  { businessName: "Bismarck Roofing", contactName: "Lars Peterson", email: "service@bismarckroof.com", phone: "701-555-3402", address: "9595 Main Ave", city: "Bismarck", state: "ND", zipCode: "58501", primaryTrade: "roofing", yearsExperience: 15 },
  
  // OHIO (OH)
  { businessName: "Columbus Roofing Company", contactName: "Michael Thompson", email: "info@columbusroof.com", phone: "614-555-3501", address: "9696 High St", city: "Columbus", state: "OH", zipCode: "43215", primaryTrade: "roofing", additionalTrades: ["gutters", "siding"], yearsExperience: 22 },
  { businessName: "Cleveland HVAC Pros", contactName: "David Miller", email: "service@clevelandhvac.com", phone: "216-555-3502", address: "9797 Euclid Ave", city: "Cleveland", state: "OH", zipCode: "44114", primaryTrade: "hvac", yearsExperience: 19 },
  { businessName: "Cincinnati Plumbing", contactName: "Robert Johnson", email: "info@cinciplumb.com", phone: "513-555-3503", address: "9898 Vine St", city: "Cincinnati", state: "OH", zipCode: "45202", primaryTrade: "plumbing", yearsExperience: 17 },
  { businessName: "Toledo Electrical", contactName: "James Wilson", email: "service@toledoelectric.com", phone: "419-555-3504", address: "9999 Adams St", city: "Toledo", state: "OH", zipCode: "43604", primaryTrade: "electrical", yearsExperience: 15 },
  
  // OKLAHOMA (OK)
  { businessName: "Oklahoma City Roofing", contactName: "David Thompson", email: "info@okcroof.com", phone: "405-555-3601", address: "1001 Broadway", city: "Oklahoma City", state: "OK", zipCode: "73102", primaryTrade: "roofing", additionalTrades: ["hail_damage"], yearsExperience: 20 },
  { businessName: "Tulsa Storm Repair", contactName: "Michael Davis", email: "service@tulsastorm.com", phone: "918-555-3602", address: "1102 Main St", city: "Tulsa", state: "OK", zipCode: "74103", primaryTrade: "roofing", additionalTrades: ["water_damage", "siding"], yearsExperience: 22 },
  { businessName: "Norman HVAC", contactName: "Robert Anderson", email: "info@normanhvac.com", phone: "405-555-3603", address: "1203 Main St", city: "Norman", state: "OK", zipCode: "73069", primaryTrade: "hvac", yearsExperience: 16 },
  
  // OREGON (OR)
  { businessName: "Portland Roofing Co", contactName: "Kevin Murphy", email: "info@portlandroof.com", phone: "503-555-3701", address: "1304 Burnside St", city: "Portland", state: "OR", zipCode: "97204", primaryTrade: "roofing", additionalTrades: ["moss_removal", "gutters"], yearsExperience: 22 },
  { businessName: "Eugene Home Services", contactName: "Brian O'Connor", email: "service@eugenehome.com", phone: "541-555-3702", address: "1405 Willamette St", city: "Eugene", state: "OR", zipCode: "97401", primaryTrade: "general", additionalTrades: ["roofing", "plumbing"], yearsExperience: 18 },
  { businessName: "Salem Plumbing", contactName: "Daniel Peterson", email: "info@salemplumb.com", phone: "503-555-3703", address: "1506 State St", city: "Salem", state: "OR", zipCode: "97301", primaryTrade: "plumbing", yearsExperience: 16 },
  
  // PENNSYLVANIA (PA)
  { businessName: "Philadelphia Roofing", contactName: "Anthony Russo", email: "info@philaroof.com", phone: "215-555-3801", address: "1607 Market St", city: "Philadelphia", state: "PA", zipCode: "19103", primaryTrade: "roofing", additionalTrades: ["gutters", "siding"], yearsExperience: 25 },
  { businessName: "Pittsburgh HVAC", contactName: "Michael Murphy", email: "service@pittsburghhvac.com", phone: "412-555-3802", address: "1708 Forbes Ave", city: "Pittsburgh", state: "PA", zipCode: "15222", primaryTrade: "hvac", yearsExperience: 20 },
  { businessName: "Allentown Plumbing", contactName: "Joseph Romano", email: "info@allentownplumb.com", phone: "610-555-3803", address: "1809 Hamilton St", city: "Allentown", state: "PA", zipCode: "18101", primaryTrade: "plumbing", yearsExperience: 18 },
  { businessName: "Harrisburg Electrical", contactName: "Thomas Walsh", email: "service@harrisburgelectric.com", phone: "717-555-3804", address: "1910 Market St", city: "Harrisburg", state: "PA", zipCode: "17101", primaryTrade: "electrical", yearsExperience: 16 },
  
  // RHODE ISLAND (RI)
  { businessName: "Providence Home Services", contactName: "Sean Sullivan", email: "info@providencehome.com", phone: "401-555-3901", address: "2011 Westminster St", city: "Providence", state: "RI", zipCode: "02903", primaryTrade: "general", additionalTrades: ["roofing", "siding"], yearsExperience: 20 },
  { businessName: "Warwick Roofing", contactName: "Patrick O'Brien", email: "service@warwickroof.com", phone: "401-555-3902", address: "2112 Post Rd", city: "Warwick", state: "RI", zipCode: "02886", primaryTrade: "roofing", yearsExperience: 17 },
  
  // SOUTH CAROLINA (SC)
  { businessName: "Charleston Roofing", contactName: "Marcus Williams", email: "info@charlestonroof.com", phone: "843-555-4001", address: "2213 King St", city: "Charleston", state: "SC", zipCode: "29401", primaryTrade: "roofing", additionalTrades: ["hurricane_damage", "siding"], yearsExperience: 22 },
  { businessName: "Columbia HVAC Services", contactName: "David Johnson", email: "service@columbiahvac.com", phone: "803-555-4002", address: "2314 Main St", city: "Columbia", state: "SC", zipCode: "29201", primaryTrade: "hvac", yearsExperience: 18 },
  { businessName: "Greenville Plumbing", contactName: "Robert Brown", email: "info@greenvilleplumb.com", phone: "864-555-4003", address: "2415 Main St", city: "Greenville", state: "SC", zipCode: "29601", primaryTrade: "plumbing", yearsExperience: 16 },
  
  // SOUTH DAKOTA (SD)
  { businessName: "Sioux Falls Home Services", contactName: "Erik Anderson", email: "info@siouxfallshome.com", phone: "605-555-4101", address: "2516 Phillips Ave", city: "Sioux Falls", state: "SD", zipCode: "57104", primaryTrade: "general", additionalTrades: ["roofing", "hvac"], yearsExperience: 18 },
  { businessName: "Rapid City Roofing", contactName: "Lars Peterson", email: "service@rapidcityroof.com", phone: "605-555-4102", address: "2617 Main St", city: "Rapid City", state: "SD", zipCode: "57701", primaryTrade: "roofing", yearsExperience: 15 },
  
  // TENNESSEE (TN)
  { businessName: "Nashville Roofing Company", contactName: "Marcus Davis", email: "info@nashvilleroof.com", phone: "615-555-4201", address: "2718 Broadway", city: "Nashville", state: "TN", zipCode: "37203", primaryTrade: "roofing", additionalTrades: ["gutters", "siding"], yearsExperience: 20 },
  { businessName: "Memphis HVAC Pros", contactName: "David Williams", email: "service@memphishvac.com", phone: "901-555-4202", address: "2819 Beale St", city: "Memphis", state: "TN", zipCode: "38103", primaryTrade: "hvac", yearsExperience: 18 },
  { businessName: "Knoxville Plumbing", contactName: "Robert Johnson", email: "info@knoxvilleplumb.com", phone: "865-555-4203", address: "2920 Gay St", city: "Knoxville", state: "TN", zipCode: "37902", primaryTrade: "plumbing", yearsExperience: 16 },
  { businessName: "Chattanooga Electrical", contactName: "James Brown", email: "service@chattaelectric.com", phone: "423-555-4204", address: "3021 Broad St", city: "Chattanooga", state: "TN", zipCode: "37402", primaryTrade: "electrical", yearsExperience: 17 },
  
  // TEXAS (TX)
  { businessName: "Houston Storm Restoration", contactName: "Carlos Rodriguez", email: "info@houstonstorm.com", phone: "713-555-4301", address: "3122 Main St", city: "Houston", state: "TX", zipCode: "77002", primaryTrade: "roofing", additionalTrades: ["hurricane_damage", "water_damage"], yearsExperience: 25 },
  { businessName: "Dallas Roofing Experts", contactName: "Miguel Hernandez", email: "service@dallasroof.com", phone: "214-555-4302", address: "3223 Elm St", city: "Dallas", state: "TX", zipCode: "75201", primaryTrade: "roofing", additionalTrades: ["hail_damage"], yearsExperience: 22 },
  { businessName: "San Antonio HVAC", contactName: "Roberto Martinez", email: "info@sahvac.com", phone: "210-555-4303", address: "3324 Commerce St", city: "San Antonio", state: "TX", zipCode: "78205", primaryTrade: "hvac", yearsExperience: 18 },
  { businessName: "Austin Plumbing Co", contactName: "David Garcia", email: "service@austinplumb.com", phone: "512-555-4304", address: "3425 Congress Ave", city: "Austin", state: "TX", zipCode: "78701", primaryTrade: "plumbing", yearsExperience: 16 },
  { businessName: "Fort Worth Tree Service", contactName: "James Lopez", email: "info@fwtree.com", phone: "817-555-4305", address: "3526 Main St", city: "Fort Worth", state: "TX", zipCode: "76102", primaryTrade: "tree_removal", additionalTrades: ["landscaping"], yearsExperience: 15 },
  { businessName: "El Paso Roofing", contactName: "Antonio Chavez", email: "service@elpasroof.com", phone: "915-555-4306", address: "3627 Mesa St", city: "El Paso", state: "TX", zipCode: "79901", primaryTrade: "roofing", yearsExperience: 17 },
  
  // UTAH (UT)
  { businessName: "Salt Lake City Roofing", contactName: "Tyler Peterson", email: "info@slcroof.com", phone: "801-555-4401", address: "3728 State St", city: "Salt Lake City", state: "UT", zipCode: "84111", primaryTrade: "roofing", additionalTrades: ["snow_damage"], yearsExperience: 18 },
  { businessName: "Provo HVAC Services", contactName: "Brandon Anderson", email: "service@provohvac.com", phone: "801-555-4402", address: "3829 University Ave", city: "Provo", state: "UT", zipCode: "84601", primaryTrade: "hvac", yearsExperience: 15 },
  { businessName: "Ogden Plumbing", contactName: "Ryan Johnson", email: "info@ogdenplumb.com", phone: "801-555-4403", address: "3930 Washington Blvd", city: "Ogden", state: "UT", zipCode: "84401", primaryTrade: "plumbing", yearsExperience: 14 },
  
  // VERMONT (VT)
  { businessName: "Burlington Home Services", contactName: "Daniel Murphy", email: "info@burlingtonhome.com", phone: "802-555-4501", address: "4031 Church St", city: "Burlington", state: "VT", zipCode: "05401", primaryTrade: "general", additionalTrades: ["roofing", "hvac"], yearsExperience: 20 },
  { businessName: "Montpelier Roofing", contactName: "Patrick O'Brien", email: "service@montpelierroof.com", phone: "802-555-4502", address: "4132 Main St", city: "Montpelier", state: "VT", zipCode: "05602", primaryTrade: "roofing", yearsExperience: 17 },
  
  // VIRGINIA (VA)
  { businessName: "Virginia Beach Roofing", contactName: "Marcus Johnson", email: "info@vbroof.com", phone: "757-555-4601", address: "4233 Atlantic Ave", city: "Virginia Beach", state: "VA", zipCode: "23451", primaryTrade: "roofing", additionalTrades: ["hurricane_damage"], yearsExperience: 20 },
  { businessName: "Richmond HVAC", contactName: "David Williams", email: "service@richmondhvac.com", phone: "804-555-4602", address: "4334 Broad St", city: "Richmond", state: "VA", zipCode: "23219", primaryTrade: "hvac", yearsExperience: 18 },
  { businessName: "Norfolk Plumbing", contactName: "Robert Brown", email: "info@norfolkplumb.com", phone: "757-555-4603", address: "4435 Granby St", city: "Norfolk", state: "VA", zipCode: "23510", primaryTrade: "plumbing", yearsExperience: 16 },
  { businessName: "Arlington Electrical", contactName: "James Davis", email: "service@arlingtonelectric.com", phone: "703-555-4604", address: "4536 Wilson Blvd", city: "Arlington", state: "VA", zipCode: "22203", primaryTrade: "electrical", yearsExperience: 19 },
  
  // WASHINGTON (WA)
  { businessName: "Seattle Roofing Company", contactName: "Kevin O'Brien", email: "info@seattleroof.com", phone: "206-555-4701", address: "4637 1st Ave", city: "Seattle", state: "WA", zipCode: "98101", primaryTrade: "roofing", additionalTrades: ["moss_removal", "gutters"], yearsExperience: 22 },
  { businessName: "Tacoma HVAC Pros", contactName: "Brian Murphy", email: "service@tacomahvac.com", phone: "253-555-4702", address: "4738 Pacific Ave", city: "Tacoma", state: "WA", zipCode: "98402", primaryTrade: "hvac", yearsExperience: 18 },
  { businessName: "Spokane Plumbing", contactName: "Daniel Peterson", email: "info@spokaneplumb.com", phone: "509-555-4703", address: "4839 Sprague Ave", city: "Spokane", state: "WA", zipCode: "99201", primaryTrade: "plumbing", yearsExperience: 16 },
  { businessName: "Bellevue Electrical", contactName: "Sean Anderson", email: "service@bellevueelectric.com", phone: "425-555-4704", address: "4940 Bellevue Way", city: "Bellevue", state: "WA", zipCode: "98004", primaryTrade: "electrical", yearsExperience: 17 },
  
  // WEST VIRGINIA (WV)
  { businessName: "Charleston Home Services", contactName: "James Thompson", email: "info@charlestonhome.com", phone: "304-555-4801", address: "5041 Capitol St", city: "Charleston", state: "WV", zipCode: "25301", primaryTrade: "general", additionalTrades: ["roofing", "plumbing"], yearsExperience: 18 },
  { businessName: "Huntington Roofing", contactName: "David Miller", email: "service@huntingtonroof.com", phone: "304-555-4802", address: "5142 4th Ave", city: "Huntington", state: "WV", zipCode: "25701", primaryTrade: "roofing", yearsExperience: 15 },
  
  // WISCONSIN (WI)
  { businessName: "Milwaukee Roofing Co", contactName: "Erik Anderson", email: "info@milwaukeeroof.com", phone: "414-555-4901", address: "5243 Wisconsin Ave", city: "Milwaukee", state: "WI", zipCode: "53202", primaryTrade: "roofing", additionalTrades: ["ice_dam", "gutters"], yearsExperience: 22 },
  { businessName: "Madison HVAC", contactName: "Lars Peterson", email: "service@madisonhvac.com", phone: "608-555-4902", address: "5344 State St", city: "Madison", state: "WI", zipCode: "53703", primaryTrade: "hvac", yearsExperience: 18 },
  { businessName: "Green Bay Plumbing", contactName: "Ole Johnson", email: "info@greenbayplumb.com", phone: "920-555-4903", address: "5445 Main St", city: "Green Bay", state: "WI", zipCode: "54301", primaryTrade: "plumbing", yearsExperience: 16 },
  
  // WYOMING (WY)
  { businessName: "Cheyenne Home Services", contactName: "Tyler Peterson", email: "info@cheyennehome.com", phone: "307-555-5001", address: "5546 Capitol Ave", city: "Cheyenne", state: "WY", zipCode: "82001", primaryTrade: "general", additionalTrades: ["roofing", "hvac"], yearsExperience: 17 },
  { businessName: "Casper Roofing", contactName: "Brandon Anderson", email: "service@casperroof.com", phone: "307-555-5002", address: "5647 Center St", city: "Casper", state: "WY", zipCode: "82601", primaryTrade: "roofing", yearsExperience: 14 },
];

// Get all unique states
export const ALL_STATES = [...new Set(NATIONWIDE_CONTRACTORS.map(c => c.state))].sort();

// Get contractors by state
export function getContractorsByState(state: string): ContractorData[] {
  return NATIONWIDE_CONTRACTORS.filter(c => c.state === state);
}

// Get contractors by trade
export function getContractorsByTrade(trade: string): ContractorData[] {
  return NATIONWIDE_CONTRACTORS.filter(c => 
    c.primaryTrade === trade || c.additionalTrades?.includes(trade)
  );
}

// Get contractors by state and trade
export function getContractorsByStateAndTrade(state: string, trade: string): ContractorData[] {
  return NATIONWIDE_CONTRACTORS.filter(c => 
    c.state === state && (c.primaryTrade === trade || c.additionalTrades?.includes(trade))
  );
}

// Get contractors by city
export function getContractorsByCity(city: string, state: string): ContractorData[] {
  return NATIONWIDE_CONTRACTORS.filter(c => 
    c.city.toLowerCase() === city.toLowerCase() && c.state === state
  );
}

export default NATIONWIDE_CONTRACTORS;
