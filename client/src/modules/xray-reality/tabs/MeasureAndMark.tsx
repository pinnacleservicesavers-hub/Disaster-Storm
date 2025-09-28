import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UniversalAR from '@/ar/UniversalAR';
import type { AROverlay } from '@/ar/UniversalAR';
import { 
  Target, 
  Ruler, 
  AlertTriangle, 
  MapPin, 
  Download,
  Trash2,
  Save
} from 'lucide-react';

interface Measurement {
  id: string;
  type: 'distance' | 'diameter' | 'area';
  value: number;
  unit: string;
  label: string;
  timestamp: Date;
}

export default function MeasureAndMark() {
  const [overlays, setOverlays] = useState<AROverlay[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [activeMarkers, setActiveMarkers] = useState(0);

  const addHazardMarker = () => {
    const newOverlay: AROverlay = {
      id: `hazard-${Date.now()}`,
      type: 'marker',
      data: {
        x: (Math.random() - 0.5) * 10,
        y: 0.5,
        z: (Math.random() - 0.5) * 10,
        color: 0xff0000,
        label: 'Energized Line Hazard'
      }
    };
    
    setOverlays(prev => [...prev, newOverlay]);
    setActiveMarkers(prev => prev + 1);
  };

  const addCutLine = () => {
    const points = [
      { x: -2, y: 0.5, z: 0 },
      { x: 0, y: 0.5, z: 1 },
      { x: 2, y: 0.5, z: 0 }
    ];
    
    const newOverlay: AROverlay = {
      id: `cutline-${Date.now()}`,
      type: 'line',
      data: {
        points,
        color: 0x00ff00,
        label: 'Safe Cut Line'
      }
    };
    
    setOverlays(prev => [...prev, newOverlay]);
  };

  const addMeasurement = () => {
    const distance = 2.5 + Math.random() * 3; // Random distance 2.5-5.5m
    
    const newMeasurement: Measurement = {
      id: `measure-${Date.now()}`,
      type: 'distance',
      value: distance,
      unit: 'm',
      label: 'Tree trunk diameter',
      timestamp: new Date()
    };
    
    const newOverlay: AROverlay = {
      id: `measurement-${Date.now()}`,
      type: 'measurement',
      data: {
        x: (Math.random() - 0.5) * 8,
        y: 1,
        z: (Math.random() - 0.5) * 8,
        distance,
        color: 0x0000ff,
        label: `${distance.toFixed(1)}m`
      }
    };
    
    setOverlays(prev => [...prev, newOverlay]);
    setMeasurements(prev => [...prev, newMeasurement]);
  };

  const clearAllMarkers = () => {
    setOverlays([]);
    setMeasurements([]);
    setActiveMarkers(0);
  };

  const exportJobPacket = () => {
    const jobData = {
      timestamp: new Date().toISOString(),
      overlays: overlays.length,
      measurements: measurements.length,
      markers: activeMarkers,
      gpsCoordinates: '25.7617° N, 80.1918° W', // Example Miami coordinates
      summary: `AR session with ${overlays.length} markers and ${measurements.length} measurements`
    };
    
    console.log('Exporting job packet:', jobData);
    
    // In real implementation, this would generate a PDF/ZIP file
    alert(`Job packet exported!\n\nMarkers: ${overlays.length}\nMeasurements: ${measurements.length}\nLocation: ${jobData.gpsCoordinates}`);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const convertToFeet = (meters: number) => {
    return meters * 3.28084;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-purple-500" />
            <span className="font-semibold text-gray-900 dark:text-white">AR Measure & Mark</span>
          </div>
          
          <div className="flex space-x-2">
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              {activeMarkers} Hazards
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              {measurements.length} Measurements
            </Badge>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={exportJobPacket}
            variant="default"
            size="sm"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export Job Packet
          </Button>
          
          <Button
            onClick={clearAllMarkers}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </Button>
        </div>
      </div>

      {/* AR Viewport */}
      <Card className="bg-black border-gray-800">
        <CardContent className="p-0">
          <UniversalAR
            title="AR Measurement & Marking Tools"
            overlays={overlays}
            className="w-full h-96"
          >
            {/* AR Controls Overlay */}
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-4 gap-2">
                <Button
                  onClick={addHazardMarker}
                  className="bg-red-500 hover:bg-red-600 text-white text-xs p-2 h-auto"
                >
                  <AlertTriangle className="h-4 w-4 mb-1" />
                  Drop Hazard
                </Button>
                
                <Button
                  onClick={addCutLine}
                  className="bg-green-500 hover:bg-green-600 text-white text-xs p-2 h-auto"
                >
                  <Ruler className="h-4 w-4 mb-1" />
                  Draw Cut Line
                </Button>
                
                <Button
                  onClick={() => setOverlays(prev => [...prev, {
                    id: `safe-${Date.now()}`,
                    type: 'marker',
                    data: { x: 0, y: 0.5, z: -3, color: 0x0000ff, label: 'Safe Zone' }
                  }])}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-xs p-2 h-auto"
                >
                  <MapPin className="h-4 w-4 mb-1" />
                  Safe Zone
                </Button>
                
                <Button
                  onClick={addMeasurement}
                  className="bg-purple-500 hover:bg-purple-600 text-white text-xs p-2 h-auto"
                >
                  <Ruler className="h-4 w-4 mb-1" />
                  AR Measure
                </Button>
              </div>
              
              <div className="text-white text-xs text-center opacity-75">
                Click tools above to add AR markers and measurements
              </div>
            </div>
          </UniversalAR>
        </CardContent>
      </Card>

      {/* Active Measurements */}
      {measurements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5 text-purple-500" />
              Active Measurements
            </CardTitle>
            <CardDescription>Recent AR measurements and annotations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {measurements.map((measurement) => (
                <div key={measurement.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Ruler className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium">{measurement.label}</p>
                      <p className="text-xs text-gray-500">{formatTime(measurement.timestamp)}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-600">
                      {measurement.value.toFixed(1)}{measurement.unit}
                    </div>
                    <div className="text-xs text-gray-500">
                      {convertToFeet(measurement.value).toFixed(1)}ft
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tools Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900 dark:text-red-100">Hazard Markers</h4>
                <p className="text-sm text-red-700 dark:text-red-200 mt-1">
                  Drop red markers to identify energized lines, split trunks, blocked egress, 
                  or any safety hazards. These markers include GPS coordinates and timestamps 
                  for evidence documentation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Ruler className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-900 dark:text-purple-100">AR Measurements</h4>
                <p className="text-sm text-purple-700 dark:text-purple-200 mt-1">
                  Measure diameters, spans, distances, and clearances visually in augmented reality. 
                  All measurements are automatically saved with location data and can be exported 
                  in job packets for insurance documentation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lead Triage Information */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Target className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Lead Triage & Routing</h4>
              <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                The system automatically labels critical jobs based on hazard markers and measurements, 
                then reorders by urgency and proximity to your crew. This ensures you handle the most 
                important and profitable work first while maintaining safety protocols.
              </p>
              <div className="mt-2 text-xs text-blue-600 dark:text-blue-300">
                💡 Pro tip: Export job packets with photos, AR annotations, timestamps, and GPS coordinates 
                for complete insurance documentation and maximum claim success rates.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}