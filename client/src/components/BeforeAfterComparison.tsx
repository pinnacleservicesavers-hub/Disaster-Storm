import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  SplitSquareHorizontal, ArrowLeftRight, Download, Share2,
  Image, Maximize2, ChevronLeft, ChevronRight, Camera, MapPin, Clock
} from 'lucide-react';

interface PhotoItem {
  id: string;
  url: string;
  thumbnail?: string;
  phase: 'before' | 'during' | 'after';
  timestamp: string;
  location?: string;
  projectId?: string;
}

interface BeforeAfterComparisonProps {
  photos: PhotoItem[];
  projectName?: string;
  onShare?: (comparison: { before: PhotoItem; after: PhotoItem }) => void;
  onDownload?: (comparison: { before: PhotoItem; after: PhotoItem }) => void;
}

export default function BeforeAfterComparison({ photos, projectName, onShare, onDownload }: BeforeAfterComparisonProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side' | 'overlay'>('slider');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [selectedBefore, setSelectedBefore] = useState<PhotoItem | null>(null);
  const [selectedAfter, setSelectedAfter] = useState<PhotoItem | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const beforePhotos = photos.filter(p => p.phase === 'before');
  const afterPhotos = photos.filter(p => p.phase === 'after');

  useEffect(() => {
    if (beforePhotos.length > 0 && !selectedBefore) {
      setSelectedBefore(beforePhotos[0]);
    }
    if (afterPhotos.length > 0 && !selectedAfter) {
      setSelectedAfter(afterPhotos[0]);
    }
  }, [photos]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current || viewMode !== 'slider') return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || viewMode !== 'slider') return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleShare = async () => {
    if (!selectedBefore || !selectedAfter) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Before & After - ${projectName || 'Project'}`,
          text: 'Check out this transformation!',
          url: window.location.href
        });
      } catch (e) {
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied!',
        description: 'Share this link to show the before & after',
      });
    }
    
    onShare?.({ before: selectedBefore, after: selectedAfter });
  };

  const handleDownload = async () => {
    if (!selectedBefore || !selectedAfter) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img1 = new window.Image();
    const img2 = new window.Image();
    img1.crossOrigin = 'anonymous';
    img2.crossOrigin = 'anonymous';

    img1.onload = () => {
      img2.onload = () => {
        canvas.width = img1.width + img2.width + 20;
        canvas.height = Math.max(img1.height, img2.height) + 80;
        
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('BEFORE', 10, 35);
        ctx.fillText('AFTER', img1.width + 30, 35);
        
        ctx.drawImage(img1, 0, 50);
        ctx.drawImage(img2, img1.width + 20, 50);
        
        const link = document.createElement('a');
        link.download = `before-after-${projectName || 'comparison'}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
        
        toast({
          title: 'Downloaded!',
          description: 'Before & after comparison saved',
        });
      };
      img2.src = selectedAfter.url;
    };
    img1.src = selectedBefore.url;

    onDownload?.({ before: selectedBefore, after: selectedAfter });
  };

  if (beforePhotos.length === 0 || afterPhotos.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="py-12 text-center">
          <SplitSquareHorizontal className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold mb-2">Before & After Comparison</h3>
          <p className="text-slate-500 mb-4">
            {beforePhotos.length === 0 && afterPhotos.length === 0 
              ? 'Upload before and after photos to create comparisons'
              : beforePhotos.length === 0 
                ? 'Upload before photos to enable comparisons'
                : 'Upload after photos to enable comparisons'}
          </p>
          <div className="flex justify-center gap-2">
            <Badge variant="outline" className={beforePhotos.length > 0 ? 'bg-green-50' : ''}>
              <Camera className="w-3 h-3 mr-1" />
              {beforePhotos.length} Before
            </Badge>
            <Badge variant="outline" className={afterPhotos.length > 0 ? 'bg-green-50' : ''}>
              <Camera className="w-3 h-3 mr-1" />
              {afterPhotos.length} After
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <SplitSquareHorizontal className="w-5 h-5 text-purple-600" />
              Before & After Comparison
            </CardTitle>
            <CardDescription>
              Compare project photos side by side or with a slider
            </CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-fullscreen-comparison">
                <Maximize2 className="w-4 h-4 mr-2" />
                Full View
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[80vh]">
              <DialogHeader>
                <DialogTitle>Before & After - {projectName || 'Project'}</DialogTitle>
                <DialogDescription>
                  Drag the slider to compare before and after photos
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex gap-2 mb-4">
                <Button 
                  variant={viewMode === 'slider' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setViewMode('slider')}
                  data-testid="button-view-slider"
                >
                  <ArrowLeftRight className="w-4 h-4 mr-1" /> Slider
                </Button>
                <Button 
                  variant={viewMode === 'side-by-side' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setViewMode('side-by-side')}
                  data-testid="button-view-sidebyside"
                >
                  <SplitSquareHorizontal className="w-4 h-4 mr-1" /> Side by Side
                </Button>
                <div className="ml-auto flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleShare} data-testid="button-share-comparison">
                    <Share2 className="w-4 h-4 mr-1" /> Share
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload} data-testid="button-download-comparison">
                    <Download className="w-4 h-4 mr-1" /> Download
                  </Button>
                </div>
              </div>

              {viewMode === 'slider' && selectedBefore && selectedAfter && (
                <div 
                  ref={containerRef}
                  className="relative w-full h-[400px] overflow-hidden rounded-lg cursor-ew-resize select-none"
                  onMouseDown={() => setIsDragging(true)}
                  onMouseUp={() => setIsDragging(false)}
                  onMouseLeave={() => setIsDragging(false)}
                  onMouseMove={handleMouseMove}
                  onTouchMove={handleTouchMove}
                  data-testid="comparison-slider-container"
                >
                  <img 
                    src={selectedAfter.url} 
                    alt="After" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div 
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${sliderPosition}%` }}
                  >
                    <img 
                      src={selectedBefore.url} 
                      alt="Before" 
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ width: `${100 / sliderPosition * 100}%`, maxWidth: 'none' }}
                    />
                  </div>
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize z-10"
                    style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                      <ArrowLeftRight className="w-5 h-5 text-slate-600" />
                    </div>
                  </div>
                  <Badge className="absolute top-4 left-4 bg-amber-500">BEFORE</Badge>
                  <Badge className="absolute top-4 right-4 bg-green-500">AFTER</Badge>
                </div>
              )}

              {viewMode === 'side-by-side' && selectedBefore && selectedAfter && (
                <div className="grid grid-cols-2 gap-4 h-[400px]">
                  <div className="relative rounded-lg overflow-hidden">
                    <img 
                      src={selectedBefore.url} 
                      alt="Before" 
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-4 left-4 bg-amber-500">BEFORE</Badge>
                    <div className="absolute bottom-4 left-4 right-4 bg-black/50 rounded p-2 text-white text-xs">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {new Date(selectedBefore.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="relative rounded-lg overflow-hidden">
                    <img 
                      src={selectedAfter.url} 
                      alt="After" 
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-4 left-4 bg-green-500">AFTER</Badge>
                    <div className="absolute bottom-4 left-4 right-4 bg-black/50 rounded p-2 text-white text-xs">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {new Date(selectedAfter.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Select Photos</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Before Photo</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {beforePhotos.map(photo => (
                        <button
                          key={photo.id}
                          onClick={() => setSelectedBefore(photo)}
                          className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 ${
                            selectedBefore?.id === photo.id ? 'border-amber-500' : 'border-transparent'
                          }`}
                          data-testid={`select-before-${photo.id}`}
                        >
                          <img 
                            src={photo.thumbnail || photo.url} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">After Photo</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {afterPhotos.map(photo => (
                        <button
                          key={photo.id}
                          onClick={() => setSelectedAfter(photo)}
                          className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 ${
                            selectedAfter?.id === photo.id ? 'border-green-500' : 'border-transparent'
                          }`}
                          data-testid={`select-after-${photo.id}`}
                        >
                          <img 
                            src={photo.thumbnail || photo.url} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {selectedBefore && selectedAfter && (
          <div 
            ref={containerRef}
            className="relative w-full h-64 overflow-hidden rounded-lg cursor-ew-resize select-none"
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            data-testid="comparison-slider-preview"
          >
            <img 
              src={selectedAfter.url} 
              alt="After" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div 
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img 
                src={selectedBefore.url} 
                alt="Before" 
                className="absolute inset-0 h-full object-cover"
                style={{ width: `${containerRef.current ? containerRef.current.offsetWidth : 100}px`, maxWidth: 'none' }}
              />
            </div>
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg cursor-ew-resize z-10"
              style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                <ArrowLeftRight className="w-4 h-4 text-slate-600" />
              </div>
            </div>
            <Badge className="absolute top-2 left-2 bg-amber-500 text-xs">BEFORE</Badge>
            <Badge className="absolute top-2 right-2 bg-green-500 text-xs">AFTER</Badge>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-2">
            <Badge variant="outline">
              <Camera className="w-3 h-3 mr-1" />
              {beforePhotos.length} Before
            </Badge>
            <Badge variant="outline">
              <Camera className="w-3 h-3 mr-1" />
              {afterPhotos.length} After
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleShare} data-testid="button-share-inline">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} data-testid="button-download-inline">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
