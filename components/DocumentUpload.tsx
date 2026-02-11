'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { DocumentType } from '@/types';

interface DocumentUploadProps {
  propertyId: string;
  documentType: DocumentType;
  label: string;
  description?: string;
  accept?: string;
  maxSize?: number;
  onUploadComplete?: (fileUrl: string, documentId: string) => void;
  multiple?: boolean;
}

export default function DocumentUpload({
  propertyId,
  documentType,
  label,
  description,
  accept = '.jpg,.jpeg,.png,.pdf',
  maxSize = 10 * 1024 * 1024, // 10MB
  onUploadComplete,
  multiple = false,
}: DocumentUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File size exceeds ${maxSize / (1024 * 1024)}MB limit`;
    }

    // Check file type
    const allowedTypes = accept.split(',').map(t => t.trim());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const fileType = file.type;

    const isValidExtension = allowedTypes.some(allowed => 
      fileExtension === allowed || allowed === fileExtension
    );
    
    const isValidMimeType = 
      (fileType.startsWith('image/') && accept.includes('image')) ||
      (fileType === 'application/pdf' && accept.includes('pdf'));

    if (!isValidExtension && !isValidMimeType) {
      return 'Invalid file type. Only JPG, PNG, and PDF files are allowed';
    }

    return null;
  };

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;

    const fileArray = Array.from(newFiles);
    const validFiles: File[] = [];
    const errors: string[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      toast({
        title: 'File validation error',
        description: errors.join('\n'),
        variant: 'destructive',
      });
    }

    if (validFiles.length > 0) {
      if (multiple) {
        setFiles(prev => [...prev, ...validFiles]);
      } else {
        setFiles(validFiles.slice(0, 1));
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File): Promise<{ success: boolean; documentId?: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    try {
      const response = await fetch(`/api/properties/${propertyId}/documents`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      return { success: true, documentId: data.document.id };
    } catch (error: any) {
      console.error('Upload error:', error);
      return { success: false };
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const results = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

      const result = await uploadFile(file);
      results.push({ file, ...result });

      setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

      if (result.success && onUploadComplete) {
        onUploadComplete('', result.documentId!);
      }
    }

    setUploading(false);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    if (successCount > 0) {
      toast({
        title: 'Upload complete',
        description: `${successCount} file(s) uploaded successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
      });
      setFiles([]);
      setUploadProgress({});
    } else {
      toast({
        title: 'Upload failed',
        description: 'All uploads failed. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    }
    return <FileText className="h-8 w-8 text-red-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">{label}</label>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>

      <Card
        className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
          dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />
        
        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-sm font-medium mb-1">
          Click to upload or drag and drop
        </p>
        <p className="text-xs text-muted-foreground">
          {accept.replace(/\./g, '').toUpperCase()} files up to {maxSize / (1024 * 1024)}MB
        </p>
      </Card>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-center gap-3">
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  {uploadProgress[file.name] !== undefined && (
                    <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${uploadProgress[file.name]}%` }}
                      />
                    </div>
                  )}
                </div>
                {!uploading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}

          <Button
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              `Upload ${files.length} file${files.length > 1 ? 's' : ''}`
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
