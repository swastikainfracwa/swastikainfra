'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Users,
  Shield,
  UserPlus,
  Edit,
  Trash2,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Plus,
  MessageCircle,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AddPropertyModal } from '@/components/AddPropertyModal';
import { ActionDialogBrand } from '@/components/ActionDialogBrand';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  employee_id?: string;
  address?: string;
  created_at: string;
  created_by_name?: string;
  created_by_role?: string;
  created_by_employee_id?: string;
}

interface Property {
  id: string;
  title: string;
  description?: string;
  city: string;
  location: string;
  state?: string;
  price: number;
  plotSize?: number;
  plotSizeUnit?: 'sqft' | 'acre';
  propertyType?: string;
  images?: string[];
  youtubeVideoUrl?: string;
  latitude?: number;
  longitude?: number;
  ownerPhone?: string;
  verificationStatus: string;
  ownerName?: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  seoSlug: string;
  createdAt: Date;
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
  totalUsers: number;
  totalAgents: number;
  totalManagers: number;
  totalBusinessPartners: number;
  totalProperties: number;
  verifiedProperties: number;
  totalLeads: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalAgents: 0,
    totalManagers: 0,
    totalBusinessPartners: 0,
    totalProperties: 0,
    verifiedProperties: 0,
    totalLeads: 0,
  });
  const [agents, setAgents] = useState<User[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [businessPartners, setBusinessPartners] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [propertyDeleteConfirmOpen, setPropertyDeleteConfirmOpen] = useState(false);
  const [assignAgentModalOpen, setAssignAgentModalOpen] = useState(false);
  const [propertyToAssign, setPropertyToAssign] = useState<Property | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [addPropertyModalOpen, setAddPropertyModalOpen] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState<Property | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'agent',
    password: '',
    address: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all users
      const usersRes = await fetch('/api/users');
      const usersData = await usersRes.json();
      
      let users: User[] = [];
      let agentsList: User[] = [];
      let managersList: User[] = [];
      let businessPartnersList: User[] = [];
      
      if (usersRes.ok) {
        users = usersData.users || [];
        agentsList = users.filter((u: User) => u.role === 'agent');
        managersList = users.filter((u: User) => u.role === 'manager');
        businessPartnersList = users.filter((u: User) => u.role === 'business_partner');
        setAllUsers(users);
        setAgents(agentsList);
        setManagers(managersList);
        setBusinessPartners(businessPartnersList);
      }

      // Fetch all properties
      const propertiesRes = await fetch('/api/properties');
      const propertiesData = await propertiesRes.json();
      
      let leadsData: Lead[] = [];
      
      if (propertiesRes.ok) {
        const properties = propertiesData.properties || [];
        const verified = properties.filter((p: Property) => p.verificationStatus === 'verified');
        setProperties(properties);
        
        // Fetch all leads
        const leadsRes = await fetch('/api/leads');
        const leadsJson = await leadsRes.json();
        
        if (leadsRes.ok) {
          leadsData = leadsJson.leads || [];
          setLeads(leadsData);
        }
        
        // Fix: Use the fetched data instead of stale state
        setStats({
          totalUsers: users.length,
          totalAgents: agentsList.length,
          totalManagers: managersList.length,
          totalBusinessPartners: businessPartnersList.length,
          totalProperties: properties.length,
          verifiedProperties: verified.length,
          totalLeads: leadsData.length,
        });
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
  }, [toast]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    fetchDashboardData();
  }, [user, router, fetchDashboardData]);

  const openCreateUserModal = (defaultRole: string = 'agent') => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: defaultRole,
      password: '',
      address: '',
    });
    setUserModalOpen(true);
  };

  const openEditUserModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      password: '',
      address: user.address || '',
    });
    setUserModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!formData.name || !formData.email || !formData.phone) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Validate address for roles that require it
    if (!editingUser && (formData.role === 'agent' || formData.role === 'manager' || formData.role === 'business_partner') && !formData.address) {
      toast({
        title: 'Validation Error',
        description: 'Address is required for agents, managers, and business partners',
        variant: 'destructive',
      });
      return;
    }

    if (!editingUser && !formData.password) {
      toast({
        title: 'Validation Error',
        description: 'Password is required for new users',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessing(true);
      
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save user');
      }

      toast({
        title: 'Success',
        description: `User ${editingUser ? 'updated' : 'created'} successfully`,
      });

      setUserModalOpen(false);
      setEditingUser(null);
      fetchDashboardData();
    } catch (error: any) {
      console.error('Save user error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save user',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setProcessing(true);
      
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });

      setDeleteConfirmOpen(false);
      setUserToDelete(null);
      fetchDashboardData();
    } catch (error: any) {
      console.error('Delete user error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteProperty = async () => {
    if (!propertyToDelete) return;

    try {
      setProcessing(true);
      
      const response = await fetch(`/api/properties/${propertyToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete property');
      }

      toast({
        title: 'Success',
        description: 'Property deleted successfully',
      });

      setPropertyDeleteConfirmOpen(false);
      setPropertyToDelete(null);
      fetchDashboardData();
    } catch (error: any) {
      console.error('Delete property error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete property',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleAssignAgent = async () => {
    if (!propertyToAssign) return;
    if (!selectedAgentId) {
      toast({
        title: 'Select an agent',
        description: 'Choose an agent or unassign before saving.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessing(true);
      
      // If selectedAgentId is 'unassign', send null to unassign the agent
      const agentId = selectedAgentId === 'unassign' ? null : selectedAgentId;
      
      const response = await fetch(`/api/properties/${propertyToAssign.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignedAgentId: agentId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign agent');
      }

      toast({
        title: 'Success',
        description: agentId ? 'Agent assigned successfully' : 'Agent unassigned successfully',
      });

      setAssignAgentModalOpen(false);
      setPropertyToAssign(null);
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

  const handleVerifyProperty = async (propertyId: string) => {
    try {
      setProcessing(true);
      
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verificationStatus: 'verified',
          verificationBadge: 'verified-admin',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify property');
      }

      toast({
        title: 'Success',
        description: 'Property verified successfully',
      });

      fetchDashboardData();
    } catch (error: any) {
      console.error('Verify property error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to verify property',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { className: string }> = {
      admin: { className: 'bg-red-500/10 text-red-700 border-red-500/20' },
      manager: { className: 'bg-purple-500/10 text-purple-700 border-purple-500/20' },
      agent: { className: 'bg-blue-500/10 text-blue-700 border-blue-500/20' },
      business_partner: { className: 'bg-orange-500/10 text-orange-700 border-orange-500/20' },
      owner: { className: 'bg-green-500/10 text-green-700 border-green-500/20' },
      visitor: { className: 'bg-gray-500/10 text-gray-700 border-gray-500/20' },
    };

    const variant = variants[role] || variants.visitor;
    const label = role === 'business_partner' ? 'Business Partner' : role.charAt(0).toUpperCase() + role.slice(1);
    return (
      <Badge variant="outline" className={variant.className}>
        {label}
      </Badge>
    );
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const statsConfig = [
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-primary' },
    { title: 'Active Agents', value: stats.totalAgents, icon: Shield, color: 'text-blue-500' },
    { title: 'Active Managers', value: stats.totalManagers, icon: Shield, color: 'text-orange-500' },
    { title: 'Total Properties', value: stats.totalProperties, icon: Building2, color: 'text-purple-500' },
    { title: 'Verified Properties', value: stats.verifiedProperties, icon: CheckCircle2, color: 'text-green-500' },
    { title: 'Total Leads', value: stats.totalLeads, icon: MessageCircle, color: 'text-cyan-500' },
  ];

  return (
    <div className="container max-w-full px-4 md:px-6 lg:px-8 py-4 md:py-8 space-y-6 md:space-y-8 overflow-x-hidden">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">System overview and management</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
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

      {/* User Management */}
      <Tabs defaultValue="properties" className="space-y-4 w-full">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="grid w-full min-w-[300px] grid-cols-3 lg:grid-cols-6 h-auto">
            <TabsTrigger value="properties" className="text-xs md:text-sm py-2 px-1 md:px-2">
              <span className="block leading-tight">Properties</span>
              <span className="text-[10px] md:text-xs">({stats.totalProperties})</span>
            </TabsTrigger>
            <TabsTrigger value="agents" className="text-xs md:text-sm py-2 px-1 md:px-2">
              <span className="block leading-tight">Agents</span>
              <span className="text-[10px] md:text-xs">({stats.totalAgents})</span>
            </TabsTrigger>
            <TabsTrigger value="managers" className="text-xs md:text-sm py-2 px-1 md:px-2">
              <span className="block leading-tight">Managers</span>
              <span className="text-[10px] md:text-xs">({stats.totalManagers})</span>
            </TabsTrigger>
            <TabsTrigger value="business-partners" className="text-xs md:text-sm py-2 px-1 md:px-2">
              <span className="block leading-tight">Partners</span>
              <span className="text-[10px] md:text-xs">({stats.totalBusinessPartners})</span>
            </TabsTrigger>
            <TabsTrigger value="leads" className="text-xs md:text-sm py-2 px-1 md:px-2">
              <span className="block leading-tight">Leads</span>
              <span className="text-[10px] md:text-xs">({stats.totalLeads})</span>
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs md:text-sm py-2 px-1 md:px-2">
              <span className="block leading-tight">All Users</span>
              <span className="text-[10px] md:text-xs">({stats.totalUsers})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="properties" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
              <div>
                <CardTitle>Property Management</CardTitle>
                <CardDescription className="text-xs md:text-sm">Manage all properties, assign agents, and verify listings</CardDescription>
              </div>
              <Button onClick={() => setAddPropertyModalOpen(true)} className="gap-2 w-full sm:w-auto" size="sm">
                <Plus className="h-4 w-4" />
                Add Property
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : properties.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No properties found</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-6 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[150px]">Title</TableHead>
                            <TableHead className="min-w-[100px]">Location</TableHead>
                            <TableHead className="min-w-[120px]">Price</TableHead>
                            <TableHead className="hidden md:table-cell min-w-[100px]">Owner</TableHead>
                            <TableHead className="hidden lg:table-cell min-w-[100px]">Agent</TableHead>
                            <TableHead className="min-w-[100px]">Status</TableHead>
                            <TableHead className="text-right min-w-[200px] sticky right-0 bg-card">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {properties.map((property) => (
                            <TableRow key={property.id}>
                              <TableCell className="font-medium max-w-[200px] truncate">
                                <a href={`/plots/${property.seoSlug}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                                  {property.title}
                                </a>
                              </TableCell>
                              <TableCell>{property.city}</TableCell>
                              <TableCell className="whitespace-nowrap">{formatPrice(property.price)}</TableCell>
                              <TableCell className="hidden md:table-cell">{property.ownerName || 'N/A'}</TableCell>
                              <TableCell className="hidden lg:table-cell">
                                {property.assignedAgentName ? (
                                  <span className="text-sm">{property.assignedAgentName}</span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">Unassigned</span>
                                )}
                              </TableCell>
                              <TableCell>{getStatusBadge(property.verificationStatus)}</TableCell>
                              <TableCell className="text-right sticky right-0 bg-card">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    type="button"
                                    onClick={() => {
                                      setPropertyToAssign(property);
                                      setSelectedAgentId(property.assignedAgentId || 'unassign');
                                      setAssignAgentModalOpen(true);
                                    }}
                                    title="Assign Agent"
                                  >
                                    <UserPlus className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    type="button"
                                    onClick={() => handleVerifyProperty(property.id)}
                                    title={property.verificationStatus === 'verified' ? 'Already Verified' : 'Verify Property'}
                                    disabled={processing || property.verificationStatus === 'verified'}
                                  >
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    type="button"
                                    onClick={() => {
                                      setPropertyToEdit(property);
                                      setAddPropertyModalOpen(true);
                                    }}
                                    title="Edit Property"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    type="button"
                                    onClick={() => router.push(`/plots/${property.seoSlug}`)}
                                    title="View Property"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    type="button"
                                    onClick={() => {
                                      setPropertyToDelete(property);
                                      setPropertyDeleteConfirmOpen(true);
                                    }}
                                    title="Delete Property"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
              <div>
                <CardTitle>Agent Management</CardTitle>
                <CardDescription className="text-xs md:text-sm">Manage agents and their access</CardDescription>
              </div>
              <Button onClick={() => openCreateUserModal('agent')} className="w-full sm:w-auto" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Agent
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : agents.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No agents found</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-6 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[100px]">Employee ID</TableHead>
                            <TableHead className="min-w-[120px]">Full Name</TableHead>
                            <TableHead className="min-w-[180px]">Email</TableHead>
                            <TableHead className="min-w-[120px]">Mobile</TableHead>
                            <TableHead className="hidden lg:table-cell min-w-[150px]">Address</TableHead>
                            <TableHead className="hidden md:table-cell min-w-[120px]">Referred By</TableHead>
                            <TableHead className="hidden sm:table-cell min-w-[100px]">Joined</TableHead>
                            <TableHead className="text-right min-w-[120px] sticky right-0 bg-card">Actions</TableHead>
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
                                <span className="truncate max-w-[150px] inline-block">{agent.address || '—'}</span>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {agent.created_by_employee_id || agent.created_by_name ? (
                                  <div className="flex flex-col">
                                    {agent.created_by_employee_id ? (
                                      <Badge variant="secondary" className="font-mono text-xs w-fit">
                                        {agent.created_by_employee_id}
                                      </Badge>
                                    ) : (
                                      <span className="font-medium text-sm">{agent.created_by_name}</span>
                                    )}
                                    {agent.created_by_role && (
                                      <Badge variant="outline" className="text-xs w-fit mt-1">
                                        {agent.created_by_role}
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">{formatDate(agent.created_at)}</TableCell>
                              <TableCell className="text-right sticky right-0 bg-card">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => openEditUserModal(agent)}
                                    title="Edit Agent"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      setUserToDelete(agent);
                                      setDeleteConfirmOpen(true);
                                    }}
                                    title="Delete Agent"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="managers" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
              <div>
                <CardTitle>Manager Management</CardTitle>
                <CardDescription className="text-xs md:text-sm">Manage managers and their access</CardDescription>
              </div>
              <Button onClick={() => openCreateUserModal('manager')} className="w-full sm:w-auto" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Manager
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : managers.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No managers found</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-6 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[100px]">Employee ID</TableHead>
                            <TableHead className="min-w-[120px]">Full Name</TableHead>
                            <TableHead className="min-w-[180px]">Email</TableHead>
                            <TableHead className="min-w-[120px]">Mobile</TableHead>
                            <TableHead className="hidden lg:table-cell min-w-[150px]">Address</TableHead>
                            <TableHead className="hidden sm:table-cell min-w-[100px]">Joined</TableHead>
                            <TableHead className="text-right min-w-[120px] sticky right-0 bg-card">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {managers.map((manager) => (
                            <TableRow key={manager.id}>
                              <TableCell>
                                <Badge variant="secondary" className="font-mono text-xs">
                                  {manager.employee_id || 'N/A'}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">{manager.name}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  <span className="truncate max-w-[150px]">{manager.email}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  {manager.phone}
                                </div>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                <span className="truncate max-w-[150px] inline-block">{manager.address || '—'}</span>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">{formatDate(manager.created_at)}</TableCell>
                              <TableCell className="text-right sticky right-0 bg-card">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => openEditUserModal(manager)}
                                    title="Edit Manager"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      setUserToDelete(manager);
                                      setDeleteConfirmOpen(true);
                                    }}
                                    title="Delete Manager"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business-partners" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
              <div>
                <CardTitle>Business Partner Management</CardTitle>
                <CardDescription className="text-xs md:text-sm">Manage business partners and their access</CardDescription>
              </div>
              <Button onClick={() => openCreateUserModal('business_partner')} className="w-full sm:w-auto" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Business Partner
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : businessPartners.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No business partners found</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-6 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[100px]">Employee ID</TableHead>
                            <TableHead className="min-w-[120px]">Full Name</TableHead>
                            <TableHead className="min-w-[180px]">Email</TableHead>
                            <TableHead className="min-w-[120px]">Mobile</TableHead>
                            <TableHead className="hidden lg:table-cell min-w-[150px]">Address</TableHead>
                            <TableHead className="hidden sm:table-cell min-w-[100px]">Joined</TableHead>
                            <TableHead className="text-right min-w-[120px] sticky right-0 bg-card">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {businessPartners.map((partner) => (
                            <TableRow key={partner.id}>
                              <TableCell>
                                <Badge variant="secondary" className="font-mono text-xs">
                                  {partner.employee_id || 'N/A'}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">{partner.name}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  <span className="truncate max-w-[150px]">{partner.email}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  {partner.phone}
                                </div>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                <span className="truncate max-w-[150px] inline-block">{partner.address || '—'}</span>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">{formatDate(partner.created_at)}</TableCell>
                              <TableCell className="text-right sticky right-0 bg-card">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => openEditUserModal(partner)}
                                    title="Edit Business Partner"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      setUserToDelete(partner);
                                      setDeleteConfirmOpen(true);
                                    }}
                                    title="Delete Business Partner"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription className="text-xs md:text-sm">Complete list of platform users</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : allUsers.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No users found</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-6 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[120px]">Full Name</TableHead>
                            <TableHead className="min-w-[180px]">Email</TableHead>
                            <TableHead className="min-w-[120px]">Mobile</TableHead>
                            <TableHead className="min-w-[100px]">Role</TableHead>
                            <TableHead className="min-w-[100px]">Employee ID</TableHead>
                            <TableHead className="hidden sm:table-cell min-w-[100px]">Joined</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allUsers.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.name}</TableCell>
                              <TableCell>
                                <span className="truncate max-w-[150px] inline-block">{user.email}</span>
                              </TableCell>
                              <TableCell>{user.phone}</TableCell>
                              <TableCell>{getRoleBadge(user.role)}</TableCell>
                              <TableCell>
                                {user.employee_id ? (
                                  <Badge variant="secondary" className="font-mono text-xs">
                                    {user.employee_id}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">{formatDate(user.created_at)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leads Management</CardTitle>
              <CardDescription className="text-xs md:text-sm">All property inquiry leads from interested customers</CardDescription>
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
                <div className="overflow-x-auto -mx-6 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[120px]">Customer Name</TableHead>
                            <TableHead className="min-w-[130px]">Phone Number</TableHead>
                            <TableHead className="min-w-[150px]">Property</TableHead>
                            <TableHead className="min-w-[100px]">Date</TableHead>
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
                                {lead.propertyId ? (
                                  <Link href={`/plots/${lead.propertyId}`} className="hover:text-primary underline-offset-4 hover:underline">
                                    {lead.propertyTitle}
                                  </Link>
                                ) : (
                                  lead.propertyTitle
                                )}
                              </TableCell>
                              <TableCell>{formatDate(lead.createdAt)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit User Modal */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent>
          <DialogHeader>
            <ActionDialogBrand />
            <DialogTitle>{editingUser ? 'Edit User' : 'Create New User'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Update user information' : 'Add a new user to the platform'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                disabled={!!editingUser}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="business_partner">Business Partner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(formData.role === 'agent' || formData.role === 'manager' || formData.role === 'business_partner') && (
              <div>
                <Label htmlFor="address">Address {!editingUser && '*'}</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter full address"
                />
              </div>
            )}
            {!editingUser && (
              <div>
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser} disabled={processing}>
              {processing ? 'Saving...' : editingUser ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <ActionDialogBrand />
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{userToDelete?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={processing}>
              {processing ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Agent Modal */}
      <Dialog open={assignAgentModalOpen} onOpenChange={setAssignAgentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <ActionDialogBrand />
            <DialogTitle>Assign Agent</DialogTitle>
            <DialogDescription>
              Assign an agent to manage <strong>{propertyToAssign?.title}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
            <Button type="button" variant="outline" onClick={() => setAssignAgentModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAssignAgent} disabled={processing}>
              {processing ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Property Confirmation Modal */}
      <Dialog open={propertyDeleteConfirmOpen} onOpenChange={setPropertyDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <ActionDialogBrand />
            <DialogTitle>Delete Property</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{propertyToDelete?.title}</strong>? This action cannot be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPropertyDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProperty} disabled={processing}>
              {processing ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Property Modal */}
      <AddPropertyModal
        isOpen={addPropertyModalOpen}
        onClose={() => {
          setAddPropertyModalOpen(false);
          setPropertyToEdit(null);
        }}
        onSuccess={() => {
          setAddPropertyModalOpen(false);
          setPropertyToEdit(null);
          fetchDashboardData();
        }}
        propertyToEdit={propertyToEdit}
      />
    </div>
  );
}
