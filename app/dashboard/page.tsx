'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Plus, Home, Eye, Users, CheckCircle, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddPropertyModal } from '@/components/AddPropertyModal';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import StatusBadge from '@/components/StatusBadge';

interface Property {
  id: string;
  title: string;
  location: string;
  city: string;
  price: number;
  verification_status: string;
  views: number;
  created_at: string;
}

interface Stats {
  totalProperties: number;
  totalViews: number;
  totalLeads: number;
  verifiedCount: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalProperties: 0,
    totalViews: 0,
    totalLeads: 0,
    verifiedCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'owner') {
      router.push('/');
      return;
    }
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch owner's properties
      const response = await fetch(`/api/properties?ownerId=${user?.id}`);
      const data = await response.json();

      if (response.ok) {
        const props = data.properties || [];
        setProperties(props);
        
        // Calculate stats
        const totalViews = props.reduce((sum: number, p: Property) => sum + (p.views || 0), 0);
        const verifiedCount = props.filter((p: Property) => p.verification_status === 'verified').length;
        
        setStats({
          totalProperties: props.length,
          totalViews,
          totalLeads: 0, // TODO: Fetch leads from API when ready
          verifiedCount,
        });
      } else {
        throw new Error(data.error || 'Failed to fetch properties');
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
  };

  const statsConfig = [
    {
      title: 'Properties',
      value: stats.totalProperties,
      icon: Home,
      color: 'text-primary',
    },
    {
      title: 'Views',
      value: stats.totalViews,
      icon: Eye,
      color: 'text-blue-500',
    },
    {
      title: 'Leads',
      value: stats.totalLeads,
      icon: Users,
      color: 'text-yellow-500',
    },
    {
      title: 'Verified',
      value: stats.verifiedCount,
      icon: CheckCircle,
      color: 'text-green-500',
    },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <main className="flex-1 bg-muted/30">
      <div className="container px-4 py-6 md:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="font-display text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
              Welcome, {user?.name || 'User'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your properties and track leads
            </p>
          </div>
          <Button className="gap-2 w-full sm:w-auto" onClick={() => setIsAddPropertyOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Property
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          {statsConfig.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">{stat.title}</p>
                    <p className="font-display text-xl md:text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`h-10 w-10 md:h-12 md:w-12 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Properties */}
        <Card className="mb-6">
          <CardHeader className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base md:text-lg">My Properties</CardTitle>
                <CardDescription className="text-xs md:text-sm">Manage your listed properties</CardDescription>
              </div>
              <Link href="/plots">
                <Button variant="outline" size="sm" className="text-xs md:text-sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No properties yet</p>
                <Button onClick={() => setIsAddPropertyOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Property
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {properties.slice(0, 5).map((property) => (
                  <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors">
                    <div className="flex-1">
                      <h3 className="font-semibold">{property.title}</h3>
                      <p className="text-sm text-muted-foreground">{property.city}</p>
                      <p className="text-sm font-medium text-primary mt-1">{formatPrice(property.price)}</p>
                    </div>
                    <StatusBadge status={property.verification_status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leads - Placeholder */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Recent Leads</CardTitle>
            <CardDescription className="text-xs md:text-sm">New inquiries from potential buyers</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Leads feature coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <AddPropertyModal 
        isOpen={isAddPropertyOpen} 
        onClose={() => {
          setIsAddPropertyOpen(false);
          fetchDashboardData();
        }} 
      />
    </main>
  );
}
