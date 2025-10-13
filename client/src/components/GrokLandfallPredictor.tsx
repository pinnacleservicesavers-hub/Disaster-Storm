import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MapPin, 
  Target, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  Sparkles,
  Eye,
  Waves,
  Wind,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '@/lib/queryClient';

interface GrokPredictionProps {
  stormData?: any;
}

export default function GrokLandfallPredictor({ stormData }: GrokPredictionProps) {
  const queryClient = useQueryClient();
  const [selectedStorm, setSelectedStorm] = useState<string | null>(null);

  // Fetch Grok US landfall prediction
  const { data: prediction, isLoading, refetch } = useQuery({
    queryKey: ['/api/grok/predict-us-landfall', selectedStorm],
    queryFn: async () => {
      const storm = stormData?.storms?.[0] || {
        stormName: 'Current Storm',
        latitude: 25.5,
        longitude: -80.0,
        movementDirection: 'WNW',
        movementSpeed: 16,
        windSpeed: 85,
        centralPressure: 985,
        sst: 'Above normal',
        windShear: 'Low (<10kt)',
        steeringFlow: 'Ridge to north',
        satelliteFeatures: 'Eye forming',
        modelConsensus: 'WNW then recurve'
      };

      const res = await apiRequest(`/api/grok/predict-us-landfall`, {
        method: 'POST',
        body: JSON.stringify(storm),
        headers: { 'Content-Type': 'application/json' }
      });
      return res.prediction;
    },
    enabled: true
  });

  // Fetch real-time intelligence briefing
  const { data: briefing } = useQuery({
    queryKey: ['/api/grok/intelligence-briefing', selectedStorm],
    queryFn: async () => {
      const storm = stormData?.storms?.[0] || {};
      const res = await apiRequest(`/api/grok/intelligence-briefing`, {
        method: 'POST',
        body: JSON.stringify(storm),
        headers: { 'Content-Type': 'application/json' }
      });
      return res.briefing;
    },
    enabled: true
  });

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['/api/grok/intelligence-briefing'] });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600 animate-pulse" />
          <h3 className="text-lg font-semibold">Grok AI Storm Analysis</h3>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isLoading}
          data-testid="button-refresh-grok"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-8"
          >
            <Sparkles className="h-8 w-8 mx-auto mb-2 animate-spin text-purple-600" />
            <p className="text-sm text-muted-foreground">Grok is analyzing storm data...</p>
          </motion.div>
        ) : prediction ? (
          <motion.div
            key="prediction"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* US Landfall Prediction */}
            <Card className={`border-2 ${prediction.willHitUS ? 'border-red-500 bg-red-50 dark:bg-red-950' : 'border-green-500 bg-green-50 dark:bg-green-950'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {prediction.willHitUS ? (
                    <>
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <span className="text-red-700 dark:text-red-300">US Landfall PREDICTED</span>
                    </>
                  ) : (
                    <>
                      <Target className="h-5 w-5 text-green-600" />
                      <span className="text-green-700 dark:text-green-300">No US Landfall Expected</span>
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  Confidence: {prediction.confidence}% based on real-time satellite and atmospheric data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={prediction.confidence} className="h-2" />

                {prediction.predictedLandfall && (
                  <div className="space-y-3 p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-red-600 mt-1" />
                      <div>
                        <p className="font-semibold text-lg">{prediction.predictedLandfall.location}</p>
                        <p className="text-sm text-muted-foreground">{prediction.predictedLandfall.state}</p>
                        {prediction.predictedLandfall.coordinates && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Coordinates: {prediction.predictedLandfall.coordinates.lat.toFixed(2)}°N, {prediction.predictedLandfall.coordinates.lng.toFixed(2)}°W
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-orange-600 mt-1" />
                      <div>
                        <p className="font-semibold">Estimated Timing</p>
                        <p className="text-sm text-muted-foreground">{prediction.predictedLandfall.timing}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Satellite Data Analysis */}
                {prediction.satelliteDataAnalysis && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Eye className="h-4 w-4 text-blue-600" />
                      Satellite Analysis
                    </h4>
                    <p className="text-sm text-muted-foreground">{prediction.satelliteDataAnalysis}</p>
                  </div>
                )}

                {/* Reasoning */}
                {prediction.reasoning && prediction.reasoning.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      Grok's Analysis
                    </h4>
                    <ul className="space-y-2">
                      {prediction.reasoning.map((reason: string, index: number) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-purple-600 font-bold mt-0.5">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Key Factors */}
                {prediction.keyFactors && prediction.keyFactors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Wind className="h-4 w-4 text-cyan-600" />
                      Key Factors
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {prediction.keyFactors.map((factor: string, index: number) => (
                        <Badge key={index} variant="outline" className="bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Wildcard Scenarios */}
                {prediction.wildcardScenarios && prediction.wildcardScenarios.length > 0 && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border-2 border-amber-200 dark:border-amber-800">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      Wildcard Scenarios
                    </h4>
                    <ul className="space-y-1">
                      {prediction.wildcardScenarios.map((scenario: string, index: number) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-amber-600 mt-0.5">⚠</span>
                          <span>{scenario}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Real-Time Intelligence Briefing */}
            {briefing && (
              <Card className="border-2 border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    Real-Time Intelligence Brief
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {briefing}
                    </p>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
