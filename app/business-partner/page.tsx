'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Building2,
  Users,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Eye,
  Mail,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { AddPropertyModal } from '@/components/AddPropertyModal';
import { AddAgentModal } from '@/components/AddAgentModal';

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
  seoSlug: string;
}

interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  employee_id?: string;
  created_at: string;
}

interface Stats {
  totalProperties: number;
  totalAgents: number;
  verifiedProperties: number;
  pendingProperties: number;
}

export default function BusinessPartnerDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalProperties: 0,
    totalAgents: 0,
    verifiedProperties: 0,
    pendingProperties: 0,
  });
  const [properties, setProperties] = useState<Property[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [addPropertyModalOpen, setAddPropertyModalOpen] = useState(false);
  const [addAgentModalOpen, setAddAgentModalOpen] = useState(false);
  
  const { data: session, status } = useSession();
  const user = session?.user;
  const { toast } = useToast();
  const router = useRouter();

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);

      // Fetch properties created by this business partner
      const propertiesRes = await fetch('/api/properties');
      if (propertiesRes.ok) {
        const data = await propertiesRes.json();
        // Filter properties created by current user
        const myProperties = data.properties?.filter((p: any) => p.created_by === (user as any).id) || [];
        setProperties(myProperties);
        
        const verified = myProperties.filter((p: Property) => p.verificationStatus === 'verified');
        const pending = myProperties.filter((p: Property) => p.verificationStatus === 'pending');
        
        setStats(prev => ({
          ...prev,
          totalProperties: myProperties.length,
          verifiedProperties: verified.length,
          pendingProperties: pending.length,
        }));
      }

      // Fetch agents created by this business partner
      const agentsRes = await fetch('/api/users?role=agent');
      if (agentsRes.ok) {
        const data = await agentsRes.json();
        // Filter agents created by current user
        const myAgents = data.users?.filter((a: any) => a.created_by === (user as any).id) || [];
        setAgents(myAgents);
        
        setStats(prev => ({
          ...prev,
          totalAgents: myAgents.length,
        }));
      }
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
  }, [user, toast]);

  useEffect(() => {
    // Wait for session to load
    if (status === 'loading') {
      return;
    }

    // Redirect to login if not authenticated
    if (status === 'unauthenticated' || !user) {
      router.push('/login');
      return;
    }

    // Check role access
    if ((user as any).role !== 'business_partner') {
      router.push('/');
      toast({
        title: 'Access Denied',
        description: 'This page is only accessible to business partners.',
        variant: 'destructive',
      });
      return;
    }

    // Fetch data if authenticated and has correct role
    fetchDashboardData();
  }, [status, user, router, toast, fetchDashboardData]);

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} L`;
    } else {
      return `₹${price.toLocaleString('en-IN')}`;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      verified: { className: 'bg-green-500/10 text-green-700 border-green-500/20', label: 'Verified' },
      pending: { className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20', label: 'Pending' },
      rejected: { className: 'bg-red-500/10 text-red-700 border-red-500/20', label: 'Rejected' },
      submitted: { className: 'bg-blue-500/10 text-blue-700 border-blue-500/20', label: 'Submitted' },
    };

    const variant = variants[status] || variants.pending;
    return (
      <Badge variant="outline" className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Partner Dashboard</h1>
          <p className="text-muted-foreground">Manage your properties and agents</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAddPropertyModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Property
          </Button>
          <Button onClick={() => setAddAgentModalOpen(true)} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Agent
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProperties}</div>
            <p className="text-xs text-muted-foreground">Properties you've added</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verifiedProperties}</div>
            <p className="text-xs text-muted-foreground">Verified properties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingProperties}</div>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAgents}</div>
            <p className="text-xs text-muted-foreground">Agents you've added</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="properties" className="space-y-4">
        <TabsList>
          <TabsTrigger value="properties">
            My Properties ({stats.totalProperties})
          </TabsTrigger>
          <TabsTrigger value="agents">
            My Agents ({stats.totalAgents})
          </TabsTrigger>
        </TabsList>

        {/* Properties Tab */}
        <TabsContent value="properties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Properties</CardTitle>
              <CardDescription>Properties you have added to the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : properties.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No properties added yet</p>
                  <Button 
                    onClick={() => setAddPropertyModalOpen(true)} 
                    className="mt-4"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Property
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Added</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {properties.map((property) => (
                        <TableRow key={property.id}>
                          <TableCell className="font-medium">{property.title}</TableCell>
                          <TableCell>{property.city}</TableCell>
                          <TableCell>{formatPrice(property.price)}</TableCell>
                          <TableCell className="capitalize">{property.propertyType}</TableCell>
                          <TableCell>{getStatusBadge(property.verificationStatus)}</TableCell>
                          <TableCell>{formatDate(property.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => router.push(`/plots/${property.seoSlug}`)}
                              title="View Property"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Agents</CardTitle>
              <CardDescription>Agents you have added to the team</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : agents.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No agents added yet</p>
                  <Button 
                    onClick={() => setAddAgentModalOpen(true)} 
                    className="mt-4"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Agent
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee ID</TableHead>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Mobile</TableHead>
                        <TableHead className="hidden lg:table-cell">Address</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agents.map((agent) => (
                        <TableRow key={agent.id}>
                          <TableCell>
                            <Badge variant="secondary" className="font-mono text-xs">
                              {agent.employee_id || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{agent.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate max-w-[150px]">{agent.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              {agent.phone}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <span className="truncate max-w-[150px] inline-block">
                              {agent.address || '—'}
                            </span>
                          </TableCell>
                          <TableCell>{formatDate(agent.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddPropertyModal
        isOpen={addPropertyModalOpen}
        onClose={() => setAddPropertyModalOpen(false)}
        onSuccess={() => {
          setAddPropertyModalOpen(false);
          fetchDashboardData();
        }}
      />
      
      <AddAgentModal
        isOpen={addAgentModalOpen}
        onClose={() => setAddAgentModalOpen(false)}
        onSuccess={() => {
          setAddAgentModalOpen(false);
          fetchDashboardData();
        }}
        allowManagerRole={false}
      />
    </div>
  );
}
