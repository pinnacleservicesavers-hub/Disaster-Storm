import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { fieldReportsApi } from "@/lib/api";
import { Camera, Mic, Video, AlertTriangle, ChevronRight } from "lucide-react";

export default function FieldReports() {
  const { translate } = useLanguage();
  
  const { data: reports, isLoading } = useQuery({
    queryKey: ["/api/field-reports"],
    queryFn: () => fieldReportsApi.getReports(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const activeReports = reports?.filter(report => report.status !== 'completed').slice(0, 2) || [];
  const urgentReports = reports?.filter(report => report.priority === 'urgent').length || 0;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCrewInitials = (crewName: string) => {
    return crewName.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((new Date().getTime() - new Date(date).getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Card data-testid="card-field-reports">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-gray-900">
            {translate('field_reports_title')}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge className="bg-green-100 text-green-800">
              {reports?.length || 0} {translate('crews_active')}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 animate-shimmer"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {activeReports.map((report, index) => (
              <div 
                key={report.id} 
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                data-testid={`field-report-${index}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${
                      report.priority === 'urgent' ? 'bg-red-500' : 'bg-primary'
                    } rounded-full flex items-center justify-center`}>
                      <span className="text-white font-medium text-sm">
                        {getCrewInitials(report.crewName)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium" data-testid={`crew-name-${index}`}>
                        {report.crewName}
                      </div>
                      <div className="text-sm text-gray-500" data-testid={`report-location-${index}`}>
                        {report.location}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getPriorityColor(report.priority)}>
                      {translate(report.priority === 'urgent' ? 'urgent' : 
                                 report.priority === 'high' ? 'high_priority' :
                                 report.priority === 'low' ? 'low_priority' : 'normal_priority')}
                    </Badge>
                    <span className="text-xs text-gray-500" data-testid={`report-time-${index}`}>
                      {formatTimeAgo(report.createdAt)}
                    </span>
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="text-sm text-gray-700" data-testid={`report-description-${index}`}>
                    {report.description}
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm">
                    {report.photoCount > 0 && (
                      <div className="flex items-center text-gray-500">
                        <Camera className="w-4 h-4 mr-1" />
                        <span data-testid={`photo-count-${index}`}>
                          {report.photoCount} photos
                        </span>
                      </div>
                    )}
                    {report.videoCount > 0 && (
                      <div className="flex items-center text-gray-500">
                        <Video className="w-4 h-4 mr-1" />
                        <span data-testid={`video-count-${index}`}>
                          {report.videoCount} videos
                        </span>
                      </div>
                    )}
                    {report.audioCount > 0 && (
                      <div className="flex items-center text-gray-500">
                        <Mic className="w-4 h-4 mr-1" />
                        <span data-testid={`audio-count-${index}`}>
                          {report.audioCount} voice notes
                        </span>
                      </div>
                    )}
                    {report.priority === 'urgent' && (
                      <div className="flex items-center text-red-600">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        <span>{translate('urgent')}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {report.priority === 'urgent' ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        data-testid={`button-prioritize-${index}`}
                      >
                        {translate('prioritize')}
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary-dark"
                        data-testid={`button-review-${index}`}
                      >
                        {translate('review')} <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-600">
            {urgentReports > 0 && (
              <span className="text-red-600 font-medium" data-testid="urgent-reports-count">
                {urgentReports} urgent reports need attention
              </span>
            )}
          </div>
        </div>
        <Button 
          className="w-full bg-primary text-white hover:bg-primary-dark"
          data-testid="button-view-all-reports"
        >
          View All Field Reports
        </Button>
      </div>
    </Card>
  );
}
