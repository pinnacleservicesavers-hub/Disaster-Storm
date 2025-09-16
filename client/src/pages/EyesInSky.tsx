import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, ExternalLink, AlertCircle, DollarSign } from 'lucide-react';

export default function EyesInSky() {
  const streamingSources = [
    {
      name: "Severe Studios LiveChase",
      url: "https://www.severestudios.com/livechase/?utm_source=chatgpt.com",
      description: "Professional storm chasing live streams and severe weather coverage",
      category: "Live Chasing"
    },
    {
      name: "Live Storm Chasers",
      url: "https://livestormchasers.com/?utm_source=chatgpt.com",
      description: "Real-time storm chaser feeds and weather tracking",
      category: "Live Chasing"
    },
    {
      name: "Brandon Copic Weather",
      url: "https://www.youtube.com/@BrandonCopicWx",
      description: "Professional meteorologist storm analysis and forecasting",
      category: "YouTube Channel"
    },
    {
      name: "Tornado HQ",
      url: "https://www.tornadohq.com/?utm_source=chatgpt.com",
      description: "Tornado tracking and severe weather intelligence",
      category: "Weather Intelligence"
    },
    {
      name: "Tornado Path",
      url: "https://www.tornadopath.com/?utm_source=chatgpt.com",
      description: "Tornado path tracking and damage assessment",
      category: "Damage Tracking"
    },
    {
      name: "ArcGIS Emergency Dashboard",
      url: "https://www.arcgis.com/apps/dashboards/3ca8efb6f5684fc88e9761f6a26e2b5d",
      description: "Real-time emergency response and incident mapping",
      category: "Emergency Response"
    },
    {
      name: "Zoom.Earth",
      url: "https://zoom.earth/",
      description: "Live satellite imagery and weather visualization",
      category: "Satellite"
    },
    {
      name: "Severe Studios",
      url: "https://www.severestudios.com/?utm_source=chatgpt.com",
      description: "Professional storm photography and documentation",
      category: "Storm Documentation"
    }
  ];

  const openStream = (url: string, name: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="title-eyes-in-sky">
          👁️ Eyes in the Sky - Live Storm Coverage
        </h1>
        <p className="text-gray-600">
          Watch live storm chasing footage and professional weather coverage from across the United States
        </p>
      </div>

      {/* Membership Alert */}
      <Card className="mb-6 border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-800">
            <DollarSign className="w-5 h-5 mr-2" />
            Premium Access Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <p className="text-orange-700 mb-2">
                Some streaming services require premium memberships or subscriptions. 
                StormLead Master will alert you when payment is needed for full access.
              </p>
              <Button variant="outline" size="sm" className="text-orange-700 border-orange-300">
                Manage Subscriptions
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Streams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {streamingSources.map((source, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <Video className="w-5 h-5 mr-2 text-blue-600" />
                  {source.name}
                </CardTitle>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {source.category}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                {source.description}
              </p>
              <Button 
                onClick={() => openStream(source.url, source.name)}
                className="w-full"
                data-testid={`button-stream-${index}`}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Watch Live Stream
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Emergency Access Notice */}
      <Card className="mt-8 border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800">🚨 Emergency Access Protocol</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700">
            During active storm events, priority access will be automatically granted to all contractors 
            for critical weather monitoring and damage assessment operations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}