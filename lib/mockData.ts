import { Property, Lead, User } from '@/types';

export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    email: 'rajesh@example.com',
    role: 'owner',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'user-2',
    name: 'Priya Sharma',
    phone: '+91 98765 43211',
    email: 'priya@example.com',
    role: 'agent',
    createdAt: new Date('2024-01-10'),
  },
  {
    id: 'user-3',
    name: 'Amit Patel',
    phone: '+91 98765 43212',
    email: 'amit@example.com',
    role: 'manager',
    createdAt: new Date('2024-01-05'),
  },
  {
    id: 'user-4',
    name: 'Admin User',
    phone: '+91 98765 43213',
    email: 'admin@example.com',
    role: 'admin',
    createdAt: new Date('2024-01-01'),
  },
];

export const mockProperties: Property[] = [
  {
    id: 'prop-1',
    title: '200 Sq Yd Residential Plot in Whitefield',
    description: 'Premium residential plot in the heart of Whitefield, Bangalore. Close to IT parks, schools, and hospitals. Gated community with 24/7 security. Perfect for building your dream home.',
    price: 4500000,
    location: 'Whitefield',
    city: 'Bangalore',
    state: 'Karnataka',
    plotSize: 200,
    plotSizeUnit: 'sqft',
    propertyType: 'residential',
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
      'https://images.unsplash.com/photo-1448630360428-65456885c650?w=800',
    ],
    ownerId: 'user-2',
    ownerName: 'Priya Sharma',
    ownerPhone: '+91 98765 43211',
    verificationStatus: 'verified',
    verificationBadge: 'verified-agent',
    isFeatured: true,
    seoSlug: '200-sqft-residential-plot-whitefield-bangalore',
    views: 245,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'prop-2',
    title: '500 Sq Yd Commercial Plot in Gurgaon',
    description: 'Prime commercial plot on main road in Sector 45, Gurgaon. Ideal for office building, showroom, or retail space. Excellent connectivity to metro and highway.',
    price: 15000000,
    location: 'Sector 45',
    city: 'Gurgaon',
    state: 'Haryana',
    plotSize: 500,
    plotSizeUnit: 'sqft',
    propertyType: 'commercial',
    images: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
      'https://images.unsplash.com/photo-1464938050520-ef2571c26106?w=800',
    ],
    ownerId: 'user-1',
    ownerName: 'Rajesh Kumar',
    ownerPhone: '+91 98765 43210',
    verificationStatus: 'verified',
    verificationBadge: 'verified-manager',
    isFeatured: true,
    seoSlug: '500-sqft-commercial-plot-sector-45-gurgaon',
    views: 189,
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-22'),
  },
  {
    id: 'prop-3',
    title: '1 Acre Agricultural Land in Nashik',
    description: 'Fertile agricultural land with water source. Suitable for farming, orchting, or farmhouse. Beautiful mountain views and clean air.',
    price: 2500000,
    location: 'Nashik Road',
    city: 'Nashik',
    state: 'Maharashtra',
    plotSize: 1,
    plotSizeUnit: 'acre',
    propertyType: 'agricultural',
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
      'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800',
    ],
    ownerId: 'user-1',
    ownerName: 'Rajesh Kumar',
    ownerPhone: '+91 98765 43210',
    verificationStatus: 'pending',
    verificationBadge: null,
    isFeatured: false,
    seoSlug: '1-acre-agricultural-land-nashik-maharashtra',
    views: 67,
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25'),
  },
  {
    id: 'prop-4',
    title: '150 Sq Yd Plot in Noida Extension',
    description: 'Affordable residential plot in upcoming area of Noida Extension. Near proposed metro station. Great investment opportunity.',
    price: 2800000,
    location: 'Noida Extension',
    city: 'Noida',
    state: 'Uttar Pradesh',
    plotSize: 150,
    plotSizeUnit: 'sqft',
    propertyType: 'residential',
    images: [
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    ],
    ownerId: 'user-2',
    ownerName: 'Priya Sharma',
    ownerPhone: '+91 98765 43211',
    verificationStatus: 'verified',
    verificationBadge: 'verified-agent',
    isFeatured: false,
    seoSlug: '150-sqft-residential-plot-noida-extension',
    views: 134,
    createdAt: new Date('2024-01-22'),
    updatedAt: new Date('2024-01-22'),
  },
  {
    id: 'prop-5',
    title: '2000 Sq Ft Industrial Plot in Pune',
    description: 'Industrial plot in MIDC area with all approvals. Ready for factory or warehouse construction. Good road connectivity.',
    price: 8500000,
    location: 'MIDC Chakan',
    city: 'Pune',
    state: 'Maharashtra',
    plotSize: 2000,
    plotSizeUnit: 'sqft',
    propertyType: 'industrial',
    images: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
    ],
    ownerId: 'user-1',
    ownerName: 'Rajesh Kumar',
    ownerPhone: '+91 98765 43210',
    verificationStatus: 'verified',
    verificationBadge: 'verified-manager',
    isFeatured: true,
    seoSlug: '2000-sqft-industrial-plot-midc-pune',
    views: 98,
    createdAt: new Date('2024-01-19'),
    updatedAt: new Date('2024-01-23'),
  },
  {
    id: 'prop-6',
    title: '300 Sq Yd Corner Plot in Jaipur',
    description: 'Premium corner plot in posh locality of Jaipur. East facing with wide roads on two sides. Ideal for luxury villa construction.',
    price: 6200000,
    location: 'Vaishali Nagar',
    city: 'Jaipur',
    state: 'Rajasthan',
    plotSize: 300,
    plotSizeUnit: 'sqft',
    propertyType: 'residential',
    images: [
      'https://images.unsplash.com/photo-1448630360428-65456885c650?w=800',
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    ],
    ownerId: 'user-2',
    ownerName: 'Priya Sharma',
    ownerPhone: '+91 98765 43211',
    verificationStatus: 'verified',
    verificationBadge: 'verified-agent',
    isFeatured: false,
    seoSlug: '300-sqft-corner-plot-vaishali-nagar-jaipur',
    views: 156,
    createdAt: new Date('2024-01-21'),
    updatedAt: new Date('2024-01-21'),
  },
];

export const mockLeads: Lead[] = [
  {
    id: 'lead-1',
    propertyId: 'prop-1',
    propertyTitle: '200 Sq Yd Residential Plot in Whitefield',
    name: 'Vikram Singh',
    phone: '+91 99887 76655',
    createdAt: new Date('2024-01-26'),
  },
  {
    id: 'lead-2',
    propertyId: 'prop-2',
    propertyTitle: '500 Sq Yd Commercial Plot in Gurgaon',
    name: 'Sneha Gupta',
    phone: '+91 99887 76656',
    createdAt: new Date('2024-01-25'),
  },
  {
    id: 'lead-3',
    propertyId: 'prop-1',
    propertyTitle: '200 Sq Yd Residential Plot in Whitefield',
    name: 'Arjun Reddy',
    phone: '+91 99887 76657',
    createdAt: new Date('2024-01-24'),
  },
];

// Helper functions
export const getPropertyBySlug = (slug: string): Property | undefined => {
  return mockProperties.find(p => p.seoSlug === slug);
};

export const getPropertyById = (id: string): Property | undefined => {
  return mockProperties.find(p => p.id === id);
};

export const getFeaturedProperties = (): Property[] => {
  return mockProperties.filter(p => p.isFeatured && p.verificationStatus === 'verified');
};

export const getVerifiedProperties = (): Property[] => {
  return mockProperties.filter(p => p.verificationStatus === 'verified');
};

export const getPropertiesByOwner = (ownerId: string): Property[] => {
  return mockProperties.filter(p => p.ownerId === ownerId);
};

export const getLeadsByOwner = (ownerId: string): Lead[] => {
  const ownerProperties = getPropertiesByOwner(ownerId);
  const propertyIds = ownerProperties.map(p => p.id);
  return mockLeads.filter(l => propertyIds.includes(l.propertyId));
};

export const formatPrice = (price: number): string => {
  if (price >= 10000000) {
    return `₹${(price / 10000000).toFixed(2)} Cr`;
  } else if (price >= 100000) {
    return `₹${(price / 100000).toFixed(2)} L`;
  }
  return `₹${price.toLocaleString('en-IN')}`;
};

export const formatPlotSize = (size: number, unit: string): string => {
  return `${size} ${unit === 'sqft' ? 'Sq Ft' : 'Acre'}`;
};
