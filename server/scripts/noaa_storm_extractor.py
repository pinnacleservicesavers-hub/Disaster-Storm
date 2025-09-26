#!/usr/bin/env python3
"""
NOAA Storm Events Data Extractor
Fetches comprehensive storm data from 1950-2025 for contractor lead generation
Based on official NOAA Storm Events Database CSV files
"""

import re
import requests
import json
import csv
import gzip
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup

class NOAAStormExtractor:
    def __init__(self):
        self.INDEX_URL = "https://www.ncei.noaa.gov/pub/data/swdi/stormevents/csvfiles/"
        self.headers = {
            'User-Agent': 'StormOpsHub/1.0 (Disaster Response Platform)',
            'Accept': 'text/html,application/xml,*/*'
        }
        
        # Regex patterns for each file type
        self.patterns = {
            'details': re.compile(r"^StormEvents_details-ftp_v1\.0_d(\d{4})_c\d{8}\.csv\.gz$"),
            'locations': re.compile(r"^StormEvents_locations-ftp_v1\.0_d(\d{4})_c\d{8}\.csv\.gz$"),
            'fatalities': re.compile(r"^StormEvents_fatalities-ftp_v1\.0_d(\d{4})_c\d{8}\.csv\.gz$")
        }
    
    def fetch_all_urls(self, yr_min: int = 1950, yr_max: int = 2025) -> Dict[str, List[str]]:
        """Fetch all NOAA Storm Events CSV URLs for the specified year range"""
        print(f"🌪️ Fetching NOAA Storm Events URLs ({yr_min}-{yr_max})...")
        
        try:
            resp = requests.get(self.INDEX_URL, headers=self.headers, timeout=60)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")
            
            # Extract all href links
            hrefs = [a.get("href") for a in soup.find_all("a") if a.get("href")]
            
            urls = {
                'details': [],
                'locations': [],
                'fatalities': []
            }
            
            # Process each file type
            for file_type, pattern in self.patterns.items():
                for href in hrefs:
                    match = pattern.match(href)
                    if match:
                        year = int(match.group(1))
                        if yr_min <= year <= yr_max:
                            full_url = self.INDEX_URL + href
                            urls[file_type].append((year, full_url))
            
            # Sort by year ascending
            for file_type in urls:
                urls[file_type].sort(key=lambda x: x[0])
                urls[file_type] = [url for _, url in urls[file_type]]
            
            print(f"✅ Found {len(urls['details'])} details files, {len(urls['locations'])} location files, {len(urls['fatalities'])} fatality files")
            return urls
            
        except Exception as e:
            print(f"❌ Error fetching NOAA URLs: {str(e)}")
            return {'details': [], 'locations': [], 'fatalities': []}
    
    def download_and_parse_csv(self, url: str, file_type: str) -> List[Dict[str, Any]]:
        """Download and parse a single NOAA CSV file"""
        year = self._extract_year_from_url(url)
        print(f"📥 Downloading {file_type} data for {year}...")
        
        try:
            response = requests.get(url, headers=self.headers, timeout=120)
            response.raise_for_status()
            
            # Decompress gzip content
            content = gzip.decompress(response.content).decode('utf-8')
            
            # Parse CSV
            reader = csv.DictReader(content.splitlines())
            data = list(reader)
            
            print(f"✅ Parsed {len(data)} {file_type} records for {year}")
            return data
            
        except Exception as e:
            print(f"❌ Error downloading {url}: {str(e)}")
            return []
    
    def extract_county_storm_data(self, details_data: List[Dict], locations_data: List[Dict] = None) -> List[Dict[str, Any]]:
        """Extract county-level storm data for contractor opportunities"""
        county_storms = {}
        
        for event in details_data:
            try:
                # Extract key fields
                state = event.get('STATE', '').strip()
                county = event.get('CZ_NAME', '').strip()
                event_type = event.get('EVENT_TYPE', '').strip()
                damage_property = self._parse_damage_amount(event.get('DAMAGE_PROPERTY', '0'))
                damage_crops = self._parse_damage_amount(event.get('DAMAGE_CROPS', '0'))
                injuries = int(event.get('INJURIES_DIRECT', '0') or 0)
                deaths = int(event.get('DEATHS_DIRECT', '0') or 0)
                begin_date = event.get('BEGIN_DATE_TIME', '')
                end_date = event.get('END_DATE_TIME', '')
                
                # Skip if missing critical data
                if not state or not county:
                    continue
                
                # Create county key
                county_key = f"{state}-{county}"
                
                if county_key not in county_storms:
                    county_storms[county_key] = {
                        'state': state,
                        'county': county,
                        'events': [],
                        'total_damage': 0,
                        'total_injuries': 0,
                        'total_deaths': 0,
                        'event_types': set(),
                        'years': set()
                    }
                
                # Add event data
                county_data = county_storms[county_key]
                county_data['events'].append({
                    'type': event_type,
                    'damage_property': damage_property,
                    'damage_crops': damage_crops,
                    'injuries': injuries,
                    'deaths': deaths,
                    'begin_date': begin_date,
                    'end_date': end_date
                })
                
                # Update aggregates
                county_data['total_damage'] += damage_property + damage_crops
                county_data['total_injuries'] += injuries
                county_data['total_deaths'] += deaths
                county_data['event_types'].add(event_type)
                
                # Extract year
                if begin_date:
                    try:
                        year = datetime.strptime(begin_date.split()[0], '%m/%d/%Y').year
                        county_data['years'].add(year)
                    except:
                        pass
                        
            except Exception as e:
                print(f"⚠️ Error processing event: {str(e)}")
                continue
        
        # Convert to list and calculate risk scores
        result = []
        for county_key, data in county_storms.items():
            # Convert sets to lists for JSON serialization
            data['event_types'] = list(data['event_types'])
            data['years'] = sorted(list(data['years']))
            data['risk_score'] = self._calculate_risk_score(data)
            data['contractor_opportunity'] = data['risk_score'] >= 70
            result.append(data)
        
        # Sort by risk score descending
        result.sort(key=lambda x: x['risk_score'], reverse=True)
        return result
    
    def _extract_year_from_url(self, url: str) -> Optional[int]:
        """Extract year from NOAA URL"""
        match = re.search(r'_d(\d{4})_', url)
        return int(match.group(1)) if match else None
    
    def _parse_damage_amount(self, damage_str: str) -> float:
        """Parse damage amount string (e.g., '5.00K', '1.50M') to float"""
        if not damage_str or damage_str in ['0', '0.00', 'null', 'NULL']:
            return 0.0
        
        try:
            # Remove any currency symbols and whitespace
            clean_str = damage_str.strip().replace('$', '').replace(',', '')
            
            # Handle K (thousands), M (millions), B (billions)
            if clean_str.endswith('K'):
                return float(clean_str[:-1]) * 1000
            elif clean_str.endswith('M'):
                return float(clean_str[:-1]) * 1000000
            elif clean_str.endswith('B'):
                return float(clean_str[:-1]) * 1000000000
            else:
                return float(clean_str)
                
        except (ValueError, IndexError):
            return 0.0
    
    def _calculate_risk_score(self, county_data: Dict[str, Any]) -> float:
        """Calculate contractor opportunity risk score for a county"""
        score = 0.0
        
        # Base score for having storm events
        score += 20
        
        # Event frequency (max 25 points)
        event_count = len(county_data['events'])
        score += min(event_count * 2, 25)
        
        # Damage amount score (max 20 points)
        damage = county_data['total_damage']
        if damage > 10000000:  # $10M+
            score += 20
        elif damage > 1000000:  # $1M+
            score += 15
        elif damage > 100000:   # $100K+
            score += 10
        elif damage > 10000:    # $10K+
            score += 5
        
        # Event type diversity (max 15 points)
        event_types = set(county_data['event_types'])
        high_impact_types = {'Hurricane', 'Tornado', 'Hail', 'High Wind', 'Flash Flood'}
        high_impact_count = len(event_types.intersection(high_impact_types))
        score += min(high_impact_count * 3, 15)
        
        # Recency bonus (max 10 points) - events in last 10 years
        current_year = datetime.now().year
        recent_years = [y for y in county_data['years'] if current_year - y <= 10]
        if recent_years:
            score += min(len(recent_years), 10)
        
        # Hurricane bonus
        if 'Hurricane' in event_types:
            score += 10
        
        return min(score, 100.0)  # Cap at 100
    
    def save_data(self, data: List[Dict], filename: str):
        """Save processed data to JSON file"""
        os.makedirs(os.path.dirname(filename) if os.path.dirname(filename) else '.', exist_ok=True)
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, default=str)
        
        print(f"💾 Saved {len(data)} records to {filename}")

def main():
    """Main extraction workflow"""
    extractor = NOAAStormExtractor()
    
    print("🌪️ NOAA Storm Events Data Extractor - Starting...")
    print("=" * 60)
    
    # Fetch all available URLs
    urls = extractor.fetch_all_urls(yr_min=2020, yr_max=2025)  # Start with recent years
    
    if not urls['details']:
        print("❌ No data URLs found. Exiting.")
        return
    
    # Process recent years (2020-2025) as a test
    all_county_data = []
    
    for url in urls['details'][:5]:  # Process first 5 years for testing
        details_data = extractor.download_and_parse_csv(url, 'details')
        if details_data:
            county_data = extractor.extract_county_storm_data(details_data)
            all_county_data.extend(county_data)
    
    # Remove duplicates and merge by county
    merged_data = {}
    for county in all_county_data:
        key = f"{county['state']}-{county['county']}"
        if key not in merged_data:
            merged_data[key] = county
        else:
            # Merge events and update totals
            existing = merged_data[key]
            existing['events'].extend(county['events'])
            existing['total_damage'] += county['total_damage']
            existing['total_injuries'] += county['total_injuries']
            existing['total_deaths'] += county['total_deaths']
            existing['event_types'] = list(set(existing['event_types'] + county['event_types']))
            existing['years'] = sorted(list(set(existing['years'] + county['years'])))
            existing['risk_score'] = extractor._calculate_risk_score(existing)
    
    final_data = list(merged_data.values())
    final_data.sort(key=lambda x: x['risk_score'], reverse=True)
    
    # Save results
    extractor.save_data(final_data, '../data/noaa-storm-counties-enhanced.json')
    
    # Print summary
    print("\n" + "=" * 60)
    print(f"🎯 EXTRACTION COMPLETE!")
    print(f"📊 Processed Counties: {len(final_data)}")
    print(f"🔥 High-Risk Counties (Score >= 80): {len([c for c in final_data if c['risk_score'] >= 80])}")
    print(f"⚡ Contractor Opportunities (Score >= 70): {len([c for c in final_data if c['contractor_opportunity']])}")
    
    # Top 10 opportunities
    print(f"\n🏆 TOP 10 CONTRACTOR OPPORTUNITIES:")
    for i, county in enumerate(final_data[:10], 1):
        print(f"{i:2d}. {county['county']}, {county['state']} (Score: {county['risk_score']:.1f})")

if __name__ == "__main__":
    main()