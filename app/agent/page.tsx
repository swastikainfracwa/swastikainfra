'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Send, Eye, AlertCircle, CheckCircle2, Clock, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import DocumentUpload from '@/components/DocumentUpload';
import DocumentList from '@/components/DocumentList';

interface Property {
  id: string;
  title: string;
  location: string;
  city: string;
  verification_status: string;
  document_upload_completed: boolean;
  assigned_at: string;
  price: number;
  property_type: string;
}

interface Stats {
  assigned: number;
  documentsPending: number;
  submitted: number;
}

export default function AgentDashboard() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<Stats>({ assigned: 0, documentsPending: 0, submitted: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (user?.role !== 'agent') {
      router.push('/dashboard');
      return;
    }
    fetchProperties();
  }, [user]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/properties?agentId=${user?.id}`);
      const data = await response.json();

      if (response.ok) {
        setProperties(data.properties);
        calculateStats(data.properties);
      } else {
        throw new Error(data.error || 'Failed to fetch properties');
      }
    } catch (error: any) {
      console.error('Fetch properties error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load properties',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (props: Property[]) => {
    const stats = {
      assigned: props.length,
      documentsPending: props.filter(p => !p.document_upload_completed).length,
      submitted: props.filter(p => p.verification_status === 'submitted').length,
    };
    setStats(stats);
  };

  const handleUploadDocuments = (property: Property) => {
    setSelectedProperty(property);
    setDocumentModalOpen(true);
  };

  const handleSubmitForReview = async (propertyId: string) => {
    try {
      setSubmitting(propertyId);
      
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verificationStatus: 'submitted',
          documentUploadCompleted: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit property');
      }

      toast({
        title: 'Success',
        description: 'Property submitted for manager review',
      });

      fetchProperties();
    } catch (error: any) {
      console.error('Submit error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit property',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: 'Documents Pending', className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' },
      submitted: { label: 'Under Review', className: 'bg-blue-500/10 text-blue-700 border-blue-500/20' },
      verified: { label: 'Verified', className: 'bg-green-500/10 text-green-700 border-green-500/20' },
      rejected: { label: 'Rejected', className: 'bg-red-500/10 text-red-700 border-red-500/20' },
    };

    const variant = variants[status] || variants.pending;
    return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
   };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Agent Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage your assigned properties and upload verification documents
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assigned Properties</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assigned}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total properties assigned to you
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Documents Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.documentsPending}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Properties awaiting document upload
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Submitted for Review</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.submitted}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Under manager review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Properties</CardTitle>
          <CardDescription>
            Upload documents and submit properties for verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No properties assigned yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">{property.title}</TableCell>
                    <TableCell>{property.city}</TableCell>
                    <TableCell>{formatPrice(property.price)}</TableCell>
                    <TableCell className="capitalize">{property.property_type}</TableCell>
                    <TableCell>{getStatusBadge(property.verification_status)}</TableCell>
                    <TableCell>{formatDate(property.assigned_at)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUploadDocuments(property)}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Documents
                      </Button>
                      {property.document_upload_completed && property.verification_status !== 'submitted' && (
                        <Button
                          size="sm"
                          onClick={() => handleSubmitForReview(property.id)}
                          disabled={submitting === property.id}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Submit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Document Upload Modal */}
      <Dialog open={documentModalOpen} onOpenChange={setDocumentModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Property Documents</DialogTitle>
            <DialogDescription>
              {selectedProperty?.title}
            </DialogDescription>
          </DialogHeader>

          {selectedProperty && (
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Upload Documents</TabsTrigger>
                <TabsTrigger value="view">View Uploaded</TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-6 mt-6">
                <DocumentUpload
                  propertyId={selectedProperty.id}
                  documentType="owner_national_id"
                  label="Owner's National ID"
                  description="Upload owner's government-issued ID"
                  onUploadComplete={() => {
                    toast({ title: 'Document uploaded successfully' });
                    fetchProperties();
                  }}
                />

                <DocumentUpload
                  propertyId={selectedProperty.id}
                  documentType="property_registration"
                  label="Property Registration Documents"
                  description="Upload title deed and registration papers"
                  multiple
                  onUploadComplete={() => {
                    toast({ title: 'Document uploaded successfully' });
                    fetchProperties();
                  }}
                />

                <DocumentUpload
                  propertyId={selectedProperty.id}
                  documentType="property_photo"
                  label="Property Photos"
                  description="Upload clear photos of the property"
                  accept=".jpg,.jpeg,.png"
                  multiple
                  onUploadComplete={() => {
                    toast({ title: 'Photo uploaded successfully' });
                    fetchProperties();
                  }}
                />
              </TabsContent>

              <TabsContent value="view" className="mt-6">
                <DocumentList
                  propertyId={selectedProperty.id}
                  canDelete={true}
                  onDocumentDeleted={fetchProperties}
                />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
