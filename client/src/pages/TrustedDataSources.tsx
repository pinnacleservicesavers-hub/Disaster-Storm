import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Cloud, Map, Building, Shield, RefreshCw, Calendar, ExternalLink } from "lucide-react";

export default function TrustedDataSources() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <Database className="w-16 h-16 mx-auto mb-4 text-green-400" />
          <h1 className="text-4xl font-bold mb-4">Trusted Data & Sources</h1>
          <p className="text-slate-400">Transparency about where our data comes from</p>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Effective Date: January 7, 2026
            </span>
            <span>|</span>
            <span>Last Updated: January 7, 2026</span>
            <span>|</span>
            <span>Version: v1.0</span>
          </div>
        </div>

        <Card className="bg-green-900/20 border-green-700 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw className="w-6 h-6 text-green-400" />
              <span className="text-lg font-semibold text-green-300">Data Refresh Schedule</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-400">2 min</div>
                <div className="text-xs text-slate-400">Weather Alerts</div>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">5 min</div>
                <div className="text-xs text-slate-400">Radar Data</div>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-amber-400">10 min</div>
                <div className="text-xs text-slate-400">Storm Predictions</div>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-purple-400">12 hr</div>
                <div className="text-xs text-slate-400">FEMA Disasters</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Cloud className="w-5 h-5 text-blue-400" />
                Weather & Storm Data
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  <div>
                    <div className="font-semibold">National Weather Service (NWS)</div>
                    <div className="text-sm text-slate-400">Official U.S. weather forecasts, alerts, and warnings</div>
                    <a href="https://www.weather.gov" target="_blank" rel="noopener" className="text-xs text-blue-400 flex items-center gap-1 mt-1">
                      weather.gov <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  <div>
                    <div className="font-semibold">NOAA (National Oceanic and Atmospheric Administration)</div>
                    <div className="text-sm text-slate-400">Radar data, climate information, and atmospheric research</div>
                    <a href="https://www.noaa.gov" target="_blank" rel="noopener" className="text-xs text-blue-400 flex items-center gap-1 mt-1">
                      noaa.gov <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  <div>
                    <div className="font-semibold">National Hurricane Center (NHC)</div>
                    <div className="text-sm text-slate-400">Hurricane tracking, forecasts, and tropical weather</div>
                    <a href="https://www.nhc.noaa.gov" target="_blank" rel="noopener" className="text-xs text-blue-400 flex items-center gap-1 mt-1">
                      nhc.noaa.gov <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  <div>
                    <div className="font-semibold">Storm Prediction Center (SPC)</div>
                    <div className="text-sm text-slate-400">Severe weather watches, local storm reports</div>
                    <a href="https://www.spc.noaa.gov" target="_blank" rel="noopener" className="text-xs text-blue-400 flex items-center gap-1 mt-1">
                      spc.noaa.gov <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Building className="w-5 h-5 text-red-400" />
                Emergency & Disaster Data
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
                  <div>
                    <div className="font-semibold">FEMA (Federal Emergency Management Agency)</div>
                    <div className="text-sm text-slate-400">Disaster declarations, assistance programs, recovery resources</div>
                    <a href="https://www.fema.gov" target="_blank" rel="noopener" className="text-xs text-blue-400 flex items-center gap-1 mt-1">
                      fema.gov <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
                  <div>
                    <div className="font-semibold">USGS (U.S. Geological Survey)</div>
                    <div className="text-sm text-slate-400">Earthquake data, river gauges, geological hazards</div>
                    <a href="https://www.usgs.gov" target="_blank" rel="noopener" className="text-xs text-blue-400 flex items-center gap-1 mt-1">
                      usgs.gov <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
                  <div>
                    <div className="font-semibold">NASA FIRMS</div>
                    <div className="text-sm text-slate-400">Fire Information for Resource Management System - wildfire detection</div>
                    <a href="https://firms.modaps.eosdis.nasa.gov" target="_blank" rel="noopener" className="text-xs text-blue-400 flex items-center gap-1 mt-1">
                      firms.modaps.eosdis.nasa.gov <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Map className="w-5 h-5 text-green-400" />
                Geographic & Traffic Data
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <div>
                    <div className="font-semibold">State DOT 511 Systems</div>
                    <div className="text-sm text-slate-400">Traffic cameras, road conditions, and highway information</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <div>
                    <div className="font-semibold">OpenStreetMap / LocationIQ</div>
                    <div className="text-sm text-slate-400">Geocoding and address validation</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <div>
                    <div className="font-semibold">Google Maps Platform</div>
                    <div className="text-sm text-slate-400">Mapping, directions, and location services</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-amber-900/30 border-amber-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-300">
                <Shield className="w-5 h-5" />
                Important Data Accuracy Notice
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Data may be delayed:</strong> Real-time data feeds can experience delays of seconds to minutes</li>
                <li><strong>Third-party accuracy:</strong> We do not control these data sources and cannot guarantee their accuracy</li>
                <li><strong>Verify critical information:</strong> Always confirm evacuation orders and emergency alerts through official channels</li>
                <li><strong>AI analysis:</strong> Our AI models provide probabilistic predictions, not certainties</li>
                <li><strong>Report issues:</strong> Contact us if you notice data discrepancies</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              <p>Questions about our data sources?</p>
              <p className="mt-2">
                <strong>Email:</strong> strategicservicesavers@gmail.com<br />
                <strong>Phone:</strong> +1 (877) 378-5143
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>Strategic Services Savers | strategicservicesavers.org</p>
        </div>
      </div>
    </div>
  );
}
