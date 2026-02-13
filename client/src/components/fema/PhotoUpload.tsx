import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, Trash2, Image, MapPin, Clock, Eye, X, ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface UploadedPhoto {
  id: string;
  file: File | null;
  previewUrl: string;
  filename: string;
  timestamp: string;
  gpsLat: string;
  gpsLng: string;
  category: string;
  notes: string;
  size: number;
}

function generateId() { return Math.random().toString(36).substring(2, 11); }

export default function PhotoUpload({ photos, setPhotos, category, maxPhotos = 20 }: {
  photos: UploadedPhoto[];
  setPhotos: (p: UploadedPhoto[]) => void;
  category: string;
  maxPhotos?: number;
}) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewPhoto, setViewPhoto] = useState<UploadedPhoto | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = maxPhotos - photos.length;
    if (remaining <= 0) {
      toast({ title: "Photo limit reached", description: `Maximum ${maxPhotos} photos per section`, variant: "destructive" });
      return;
    }
    const newPhotos: UploadedPhoto[] = [];
    const toProcess = Math.min(files.length, remaining);
    for (let i = 0; i < toProcess; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      const photo: UploadedPhoto = {
        id: generateId(),
        file,
        previewUrl: URL.createObjectURL(file),
        filename: file.name,
        timestamp: new Date().toISOString(),
        gpsLat: '',
        gpsLng: '',
        category,
        notes: '',
        size: file.size,
      };
      newPhotos.push(photo);
    }
    if (newPhotos.length > 0) {
      setPhotos([...photos, ...newPhotos]);
      toast({ title: `${newPhotos.length} photo(s) uploaded`, description: `Added to ${category}` });
    }
  };

  const removePhoto = (id: string) => {
    const photo = photos.find(p => p.id === id);
    if (photo?.previewUrl) URL.revokeObjectURL(photo.previewUrl);
    setPhotos(photos.filter(p => p.id !== id));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-blue-400" />
          <p className="text-sm font-medium text-white">Photo Documentation — {category}</p>
          <Badge variant="outline" className="text-xs">{photos.length} / {maxPhotos}</Badge>
        </div>
        <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-3.5 w-3.5 mr-1" /> Upload Photos
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {photos.length === 0 ? (
        <div
          className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleFiles(e.dataTransfer.files); }}
        >
          <Camera className="h-10 w-10 mx-auto text-slate-500 mb-2" />
          <p className="text-sm text-slate-400">Click or drag photos to upload</p>
          <p className="text-xs text-slate-500 mt-1">Supports JPG, PNG, HEIC — GPS metadata will be auto-extracted</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {photos.map(photo => (
            <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-slate-600 bg-slate-800">
              <img
                src={photo.previewUrl}
                alt={photo.filename}
                className="w-full h-24 object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-white" onClick={() => setViewPhoto(photo)}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400" onClick={() => removePhoto(photo.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-1.5">
                <p className="text-[10px] text-slate-300 truncate">{photo.filename}</p>
                <p className="text-[10px] text-slate-500">{formatSize(photo.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewPhoto && (
        <Dialog open={!!viewPhoto} onOpenChange={() => setViewPhoto(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Image className="h-4 w-4" /> {viewPhoto.filename}</DialogTitle>
            </DialogHeader>
            <img src={viewPhoto.previewUrl} alt={viewPhoto.filename} className="w-full rounded-lg max-h-[60vh] object-contain" />
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1 text-slate-400"><Clock className="h-3 w-3" /> {new Date(viewPhoto.timestamp).toLocaleString()}</div>
              <div className="flex items-center gap-1 text-slate-400"><Camera className="h-3 w-3" /> {formatSize(viewPhoto.size)}</div>
              {viewPhoto.gpsLat && (
                <div className="flex items-center gap-1 text-slate-400"><MapPin className="h-3 w-3" /> {viewPhoto.gpsLat}, {viewPhoto.gpsLng}</div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
