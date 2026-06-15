'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Users,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  UserPlus,
  AlertCircle,
  Plus,
  MessageCircle,
  Phone,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import DocumentList from '@/components/DocumentList';
import { AddPropertyModal } from '@/components/AddPropertyModal';
import { ActionDialogBrand } from '@/components/ActionDialogBrand';

interface Property {
  id: string;
  title: string;
  location: string;
  city: string;
  price: number;
  propertyType: string;
  verificationStatus: string;
  createdAt: Date;
  ownerName?: string;
  ownerPhone?: string;
  assignedAgentId?: string | null;
  assignedAgentName?: string;
  assignedAgentPhone?: string;
}

interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Lead {
  id: string;
  propertyId: string;
  propertyTitle: string;
  name: string;
  phone: string;
  createdAt: Date;
}

interface Stats {
  totalProperties: number;
  activeAgents: number;
  pendingAssignment: number;
  underReview: number;
  totalLeads: number;
}

export default function ManagerDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalProperties: 0,
    activeAgents: 0,
    pendingAssignment: 0,
    underReview: 0,
    totalLeads: 0,
  });
  const [pendingProperties, setPendingProperties] = useState<Property[]>([]);
  const [submittedProperties, setSubmittedProperties] = useState<Property[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [reviewAction, setReviewAction] = useState<'verify' | 'reject'>('verify');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [addPropertyModalOpen, setAddPropertyModalOpen] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all properties
      const propertiesRes = await fetch('/api/properties');
      const propertiesData = await propertiesRes.json();
      
      if (!propertiesRes.ok) {
        throw new Error(propertiesData.error || 'Failed to fetch properties');
      }

      const allProperties = propertiesData.properties;
      
      // Filter properties by assignment status
      // Pending Assignment: Properties without assigned agents (excluding rejected ones)
      const pending = allProperties.filter((p: Property) => 
        !p.assignedAgentId && p.verificationStatus !== 'rejected'
      );
      // Under Review: Properties submitted by agents for manager verification
      const submitted = allProperties.filter((p: Property) => p.verificationStatus === 'submitted');
      
      setPendingProperties(pending);
      setSubmittedProperties(submitted);

      // Fetch agents (from users API - we'll need to create this endpoint)
      let agentsList: Agent[] = [];
      const agentsRes = await fetch('/api/users?role=agent');
      if (agentsRes.ok) {
        const agentsData = await agentsRes.json();
        agentsList = agentsData.users || [];
        setAgents(agentsList);
      }

      // Fetch all leads
      const leadsRes = await fetch('/api/leads');
      let leadsData: Lead[] = [];
      if (leadsRes.ok) {
        const leadsJson = await leadsRes.json();
        leadsData = leadsJson.leads || [];
        setLeads(leadsData);
      }

      setStats({
        totalProperties: allProperties.length,
        activeAgents: agentsList.length,
        pendingAssignment: pending.length,
        underReview: submitted.length,
        totalLeads: leadsData.length,
      });
    } catch (error: any) {
      console.error('Dashboard fetch error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user?.role !== 'manager' && user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    fetchDashboardData();
  }, [user, router, fetchDashboardData]);

  const handleAssignAgent = async () => {
    if (!selectedProperty || !selectedAgentId) return;

    try {
      setProcessing(true);

      const assignedAgentId = selectedAgentId === 'unassign' ? null : selectedAgentId;
      
      const response = await fetch(`/api/properties/${selectedProperty.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignedAgentId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign agent');
      }

      toast({
        title: 'Success',
        description: 'Agent assigned successfully',
      });

      setAssignModalOpen(false);
      setSelectedProperty(null);
      setSelectedAgentId('');
      fetchDashboardData();
    } catch (error: any) {
      console.error('Assign agent error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign agent',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReviewProperty = async () => {
    if (!selectedProperty) return;

    try {
      setProcessing(true);
      
      const response = await fetch(`/api/properties/${selectedProperty.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verificationStatus: reviewAction === 'verify' ? 'verified' : 'rejected',
          rejectionReason: reviewAction === 'reject' ? rejectionReason : undefined,
          verificationBadge: reviewAction === 'verify' ? 'verified-manager' : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update property');
      }

      toast({
        title: 'Success',
        description: `Property ${reviewAction === 'verify' ? 'verified' : 'rejected'} successfully`,
      });

      setReviewModalOpen(false);
      setSelectedProperty(null);
      setRejectionReason('');
      fetchDashboardData();
    } catch (error: any) {
      console.error('Review property error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to review property',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const openAssignModal = (property: Property) => {
    setSelectedProperty(property);
    setSelectedAgentId(property.assignedAgentId || '');
    setAssignModalOpen(true);
  };

  const openReviewModal = (property: Property, action: 'verify' | 'reject') => {
    setSelectedProperty(property);
    setReviewAction(action);
    setReviewModalOpen(true);
  };

  const openDocumentsModal = (property: Property) => {
    setSelectedProperty(property);
    setDocumentsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: 'Awaiting Assignment', className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' },
      assigned: { label: 'Agent Assigned', className: 'bg-blue-500/10 text-blue-700 border-blue-500/20' },
      submitted: { label: 'Under Review', className: 'bg-purple-500/10 text-purple-700 border-purple-500/20' },
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

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const statsConfig = [
    { title: 'Total Properties', value: stats.totalProperties, icon: Building2, color: 'text-primary' },
    { title: 'Active Agents', value: stats.activeAgents, icon: Users, color: 'text-blue-500' },
    { title: 'Pending Assignment', value: stats.pendingAssignment, icon: Clock, color: 'text-yellow-500' },
    { title: 'Under Review', value: stats.underReview, icon: Shield, color: 'text-purple-500' },
    { title: 'Total Leads', value: stats.totalLeads, icon: MessageCircle, color: 'text-cyan-500' },
  ];

  return (
    <div className="container max-w-full px-4 md:px-6 lg:px-8 py-4 md:py-8 space-y-6 md:space-y-8 overflow-x-hidden">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Manager Dashboard</h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">Welcome back, {user?.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {statsConfig.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs md:text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Properties Management */}
      <Tabs defaultValue="pending" className="space-y-4 w-full">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="w-full min-w-[300px]">
            <TabsTrigger value="pending" className="text-xs md:text-sm px-2 md:px-4">
              <span className="hidden sm:inline">Pending Assignment </span>
              <span className="sm:hidden">Pending </span>
              ({stats.pendingAssignment})
            </TabsTrigger>
            <TabsTrigger value="submitted" className="text-xs md:text-sm px-2 md:px-4">
              <span className="hidden sm:inline">Under Review </span>
              <span className="sm:hidden">Review </span>
              ({stats.underReview})
            </TabsTrigger>
            <TabsTrigger value="leads" className="text-xs md:text-sm px-2 md:px-4">
              Leads ({stats.totalLeads})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pending Assignment</CardTitle>
                <CardDescription>
                  Properties awaiting agent assignment
                </CardDescription>
              </div>
              <Button onClick={() => setAddPropertyModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Property
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : pendingProperties.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No pending properties</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingProperties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell className="font-medium">{property.title}</TableCell>
                        <TableCell>{property.city}</TableCell>
                        <TableCell>{formatPrice(property.price)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{property.ownerName || 'N/A'}</div>
                            <div className="text-muted-foreground">{property.ownerPhone}</div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(property.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => openAssignModal(property)}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Assign Agent
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submitted" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Under Review</CardTitle>
              <CardDescription>
                Properties submitted by agents for verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : submittedProperties.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No properties under review</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submittedProperties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell className="font-medium">{property.title}</TableCell>
                        <TableCell>{property.city}</TableCell>
                        <TableCell>{formatPrice(property.price)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{property.assignedAgentName || 'N/A'}</div>
                            <div className="text-muted-foreground">{property.assignedAgentPhone}</div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(property.createdAt)}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDocumentsModal(property)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Docs
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openReviewModal(property, 'verify')}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" />
                            Verify
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openReviewModal(property, 'reject')}
                          >
                            <XCircle className="h-4 w-4 mr-1 text-red-600" />
                            Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leads Management</CardTitle>
              <CardDescription>All property inquiry leads from interested customers</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : leads.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No leads found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a href={`tel:${lead.phone}`} className="hover:text-primary">
                              {lead.phone}
                            </a>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate">
                          {lead.propertyTitle}
                        </TableCell>
                        <TableCell>
                          {typeof lead.createdAt === 'string' 
                            ? formatDate(lead.createdAt)
                            : new Date(lead.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Agent Modal */}
      <Dialog
        open={assignModalOpen}
        onOpenChange={(open) => {
          setAssignModalOpen(open);
          if (!open) {
            setSelectedProperty(null);
            setSelectedAgentId('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <ActionDialogBrand />
            <DialogTitle>Assign Agent</DialogTitle>
            <DialogDescription>
              Select an agent to handle this property verification
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Property</Label>
              <p className="text-sm font-medium mt-1">{selectedProperty?.title}</p>
            </div>
            <div>
              <Label htmlFor="agent">Select Agent</Label>
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger id="agent">
                  <SelectValue placeholder="Choose an agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassign">Unassign</SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name} - {agent.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignAgent} disabled={!selectedAgentId || processing}>
              {processing ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Property Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <ActionDialogBrand />
            <DialogTitle>
              {reviewAction === 'verify' ? 'Verify Property' : 'Reject Property'}
            </DialogTitle>
            <DialogDescription>
              {selectedProperty?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">
                {reviewAction === 'reject' ? 'Reason for Rejection (Required)' : 'Notes (Optional)'}
              </Label>
              <Textarea
                id="notes"
                placeholder={
                  reviewAction === 'verify'
                    ? 'Add verification notes...'
                    : 'Provide reason for rejection...'
                }
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReviewProperty}
              disabled={processing}
              variant={reviewAction === 'verify' ? 'default' : 'destructive'}
            >
              {processing
                ? 'Processing...'
                : reviewAction === 'verify'
                ? 'Verify Property'
                : 'Reject Property'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Documents Modal */}
      <Dialog open={documentsModalOpen} onOpenChange={setDocumentsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <ActionDialogBrand />
            <DialogTitle>Property Documents</DialogTitle>
            <DialogDescription>
              {selectedProperty?.title}
            </DialogDescription>
          </DialogHeader>
          {selectedProperty && (
            <DocumentList
              propertyId={selectedProperty.id}
              canDelete={false}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Property Modal */}
      <AddPropertyModal
        isOpen={addPropertyModalOpen}
        onClose={() => setAddPropertyModalOpen(false)}
        onSuccess={() => {
          setAddPropertyModalOpen(false);
          fetchDashboardData();
        }}
      />
    </div>
  );
}
