import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  Target, 
  CloudRain, 
  Wind, 
  Thermometer, 
  MapPin, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Zap,
  Activity,
  BarChart3
} from 'lucide-react';
import { FadeIn, SlideIn, StaggerContainer, StaggerItem } from '@/components/ui/animations';
import { ModuleWrapper } from '@/components/ModuleWrapper';
import { ModuleCard } from '@/components/ModuleHero';

interface StormPrediction {
  id: string;
  name: string;
  category: number;
  probability: number;
  impactArea: string;
  estimatedLandfall: string;
  windSpeed: number;
  rainfall: number;
  stormSurge: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'extreme';
  affectedPopulation: number;
  economicImpact: number;
}

const mockPredictions: StormPrediction[] = [
  {
    id: '1',
    name: 'Hurricane Alexandra',
    category: 3,
    probability: 85,
    impactArea: 'Southeast Florida',
    estimatedLandfall: '2024-09-28T14:00:00Z',
    windSpeed: 120,
    rainfall: 8.5,
    stormSurge: 12,
    riskLevel: 'extreme',
    affectedPopulation: 2500000,
    economicImpact: 5.2
  },
  {
    id: '2',
    name: 'Tropical Storm Beta',
    category: 1,
    probability: 65,
    impactArea: 'Gulf Coast',
    estimatedLandfall: '2024-09-30T08:00:00Z',
    windSpeed: 85,
    rainfall: 4.2,
    stormSurge: 6,
    riskLevel: 'moderate',
    affectedPopulation: 850000,
    economicImpact: 1.8
  }
];

export default function StormPredictions() {
  const [selectedPrediction, setSelectedPrediction] = useState<StormPrediction | null>(null);
  const [modelAccuracy, setModelAccuracy] = useState(92.5);

  useEffect(() => {
    // Simulate real-time model accuracy updates
    const interval = setInterval(() => {
      setModelAccuracy(prev => {
        const change = (Math.random() - 0.5) * 2;
        return Math.max(85, Math.min(98, prev + change));
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-500';
      case 'moderate': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'extreme': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <ModuleWrapper 
      moduleId="prediction"
      heroChildren={
        <div className="flex items-center space-x-4 mt-4">
          <Badge className="glass-card-pro bg-white/20 text-white border-white/30 px-4 py-2">
            <Activity className="w-4 h-4 mr-2" />
            AI Model Active
          </Badge>
          <Badge className="glass-card-pro bg-emerald-500/20 text-emerald-100 border-emerald-300/30 px-4 py-2">
            <Target className="w-4 h-4 mr-2" />
            {modelAccuracy.toFixed(1)}% Accuracy
          </Badge>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto">
        <FadeIn>
          {/* Model Performance Overview */}
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StaggerItem>
              <Card className="glass-card-pro">
                <CardContent className="p-6 text-center">
                  <Target className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{modelAccuracy.toFixed(1)}%</div>
                  <div className="text-sm text-purple-200">Model Accuracy</div>
                </CardContent>
              </Card>
            </StaggerItem>
            <StaggerItem>
              <Card className="glass-card-pro">
                <CardContent className="p-6 text-center">
                  <CloudRain className="w-8 h-8 text-sky-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">2</div>
                  <div className="text-sm text-purple-200">Active Predictions</div>
                </CardContent>
              </Card>
            </StaggerItem>
            <StaggerItem>
              <Card className="glass-card-pro">
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">1</div>
                  <div className="text-sm text-purple-200">High Risk Events</div>
                </CardContent>
              </Card>
            </StaggerItem>
            <StaggerItem>
              <Card className="glass-card-pro">
                <CardContent className="p-6 text-center">
                  <BarChart3 className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">$7.0B</div>
                  <div className="text-sm text-purple-200">Est. Economic Impact</div>
                </CardContent>
              </Card>
            </StaggerItem>
          </StaggerContainer>

          {/* Storm Predictions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Predictions List */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <Target className="w-6 h-6 mr-2 text-purple-400" />
                Active Predictions
              </h2>
              
              {mockPredictions.map((prediction, index) => (
                <motion.div
                  key={prediction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all duration-300 bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 ${
                      selectedPrediction?.id === prediction.id ? 'ring-2 ring-purple-400' : ''
                    }`}
                    onClick={() => setSelectedPrediction(prediction)}
                    data-testid={`prediction-card-${prediction.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-white">{prediction.name}</CardTitle>
                          <CardDescription className="text-purple-200">
                            Category {prediction.category} • {prediction.impactArea}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge className={`${getRiskColor(prediction.riskLevel)} text-white`}>
                            {prediction.riskLevel.toUpperCase()}
                          </Badge>
                          <Badge className="bg-blue-500/20 text-blue-200 border-blue-400/30">
                            {prediction.probability}% probability
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <Wind className="w-4 h-4 text-gray-300 mx-auto mb-1" />
                          <div className="text-white font-medium">{prediction.windSpeed} mph</div>
                          <div className="text-purple-200">Max Winds</div>
                        </div>
                        <div className="text-center">
                          <CloudRain className="w-4 h-4 text-gray-300 mx-auto mb-1" />
                          <div className="text-white font-medium">{prediction.rainfall}"</div>
                          <div className="text-purple-200">Rainfall</div>
                        </div>
                        <div className="text-center">
                          <Clock className="w-4 h-4 text-gray-300 mx-auto mb-1" />
                          <div className="text-white font-medium">
                            {new Date(prediction.estimatedLandfall).toLocaleDateString()}
                          </div>
                          <div className="text-purple-200">Est. Landfall</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Detailed View */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <BarChart3 className="w-6 h-6 mr-2 text-purple-400" />
                Detailed Analysis
              </h2>
              
              {selectedPrediction ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                        {selectedPrediction.name} - Detailed Forecast
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Impact Metrics */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="text-purple-200 text-sm">Affected Population</div>
                          <div className="text-white font-bold text-xl">
                            {(selectedPrediction.affectedPopulation / 1000000).toFixed(1)}M people
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-purple-200 text-sm">Economic Impact</div>
                          <div className="text-white font-bold text-xl">
                            ${selectedPrediction.economicImpact}B
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-purple-200 text-sm">Storm Surge</div>
                          <div className="text-white font-bold text-xl">
                            {selectedPrediction.stormSurge} ft
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-purple-200 text-sm">Category</div>
                          <div className="text-white font-bold text-xl">
                            {selectedPrediction.category}
                          </div>
                        </div>
                      </div>

                      {/* Risk Assessment */}
                      <div className="space-y-3">
                        <h4 className="text-white font-semibold">Risk Assessment</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-purple-200">Landfall Probability</span>
                            <span className="text-white font-medium">{selectedPrediction.probability}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <motion.div
                              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${selectedPrediction.probability}%` }}
                              transition={{ duration: 1, delay: 0.5 }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="space-y-3">
                        <h4 className="text-white font-semibold">Estimated Timeline</h4>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-purple-200">Current Time:</span>
                            <span className="text-white">{new Date().toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-purple-200">Est. Landfall:</span>
                            <span className="text-white">
                              {new Date(selectedPrediction.estimatedLandfall).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-purple-200">Time to Impact:</span>
                            <span className="text-white font-medium text-red-300">
                              {Math.ceil((new Date(selectedPrediction.estimatedLandfall).getTime() - Date.now()) / (1000 * 60 * 60))} hours
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent className="p-12 text-center">
                    <Target className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                    <p className="text-purple-200">Select a storm prediction to view detailed analysis</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </FadeIn>
      </div>
    </ModuleWrapper>
  );
}