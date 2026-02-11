'use client';

import { useState, useEffect } from 'react';
import { FileText, Image as ImageIcon, Download, Trash2, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import type { PropertyDocument, DocumentType } from '@/types';

interface DocumentListProps {
  propertyId: string;
  canDelete?: boolean;
  onDocumentDeleted?: () => void;
}

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  owner_national_id: 'Owner National ID',
  property_registration: 'Property Registration',
  property_photo: 'Property Photo',
};

export default function DocumentList({
  propertyId,
  canDelete = false,
  onDocumentDeleted,
}: DocumentListProps) {
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, [propertyId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/properties/${propertyId}/documents`);
      const data = await response.json();

      if (response.ok) {
        setDocuments(data.documents);
      } else {
        throw new Error(data.error || 'Failed to fetch documents');
      }
    } catch (error: any) {
      console.error('Fetch documents error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load documents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      setDeleting(documentId);
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete document');
      }

      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });

      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
      if (onDocumentDeleted) {
        onDocumentDeleted();
      }
    } catch (error: any) {
      console.error('Delete document error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete document',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const handleView = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`);
      const data = await response.json();

      if (response.ok && data.document.signedUrl) {
        window.open(data.document.signedUrl, '_blank');
      } else {
        throw new Error(data.error || 'Failed to get document URL');
      }
    } catch (error: any) {
      console.error('View document error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to open document',
        variant: 'destructive',
      });
    }
  };

  const getDocumentIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const groupedDocuments = documents.reduce((acc, doc) => {
    const type = doc.documentType;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(doc);
    return acc;
  }, {} as Record<DocumentType, PropertyDocument[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedDocuments).map(([type, docs]) => (
        <div key={type}>
          <h3 className="text-sm font-medium mb-3">
            {DOCUMENT_TYPE_LABELS[type as DocumentType]} ({docs.length})
          </h3>
          <div className="space-y-2">
            {docs.map((doc) => (
              <Card key={doc.id} className="p-4">
                <div className="flex items-center gap-4">
                  {getDocumentIcon(doc.fileName)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.fileName}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span>•</span>
                      <span>{formatDate(doc.createdAt.toString())}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleView(doc.id)}
                      title="View document"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDocumentToDelete(doc.id);
                          setDeleteDialogOpen(true);
                        }}
                        disabled={deleting === doc.id}
                        title="Delete document"
                      >
                        {deleting === doc.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => documentToDelete && handleDelete(documentToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
