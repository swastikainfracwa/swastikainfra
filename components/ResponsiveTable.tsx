import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { formatPrice } from '@/data/mockData';
import { Property, Lead } from '@/types';

interface PropertyCardMobileProps {
  property: Property;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export const PropertyCardMobile: React.FC<PropertyCardMobileProps> = ({
  property,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-success/10 text-success border-success/20 text-xs">Verified</Badge>;
      case 'pending':
        return <Badge className="bg-warning/10 text-warning border-warning/20 text-xs">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex gap-3 p-3">
          <img
            src={property.images[0]}
            alt={property.title}
            className="h-16 w-20 rounded-lg object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm line-clamp-1">{property.title}</p>
                <p className="text-xs text-muted-foreground">
                  {property.location}, {property.city}
                </p>
              </div>
              {showActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit?.(property.id)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => onDelete?.(property.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="font-semibold text-sm text-primary">
                {formatPrice(property.price)}
              </span>
              {getStatusBadge(property.verificationStatus)}
              <span className="text-xs text-muted-foreground">
                {property.views} views
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface LeadCardMobileProps {
  lead: Lead;
}

export const LeadCardMobile: React.FC<LeadCardMobileProps> = ({ lead }) => {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-sm">{lead.name}</p>
            <a href={`tel:${lead.phone}`} className="text-xs text-primary hover:underline">
              {lead.phone}
            </a>
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {lead.createdAt.toLocaleDateString()}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
          {lead.propertyTitle}
        </p>
      </CardContent>
    </Card>
  );
};
