import { BadgeCheck, ShieldCheck } from 'lucide-react';
import { VerificationBadgeType } from '@/types';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface VerificationBadgeProps {
  badge: VerificationBadgeType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const badgeConfig = {
  'verified-agent': {
    icon: BadgeCheck,
    label: 'Verified Agent',
    description: 'This property is listed by a verified real estate agent.',
    iconClass: 'text-primary-foreground',
    bgClass: 'bg-success',
  },
  'verified-manager': {
    icon: ShieldCheck,
    label: 'Verified Property',
    description: 'This property has been verified by our internal team for authenticity and ownership.',
    iconClass: 'text-primary-foreground',
    bgClass: 'bg-success',
  },
};

const sizeConfig = {
  sm: { icon: 'h-3 w-3', container: 'h-5 w-5', text: 'text-xs' },
  md: { icon: 'h-3.5 w-3.5', container: 'h-6 w-6', text: 'text-xs' },
  lg: { icon: 'h-4 w-4', container: 'h-7 w-7', text: 'text-sm' },
};

export default function VerificationBadge({
  badge,
  size = 'md',
  showLabel = false,
  className,
}: VerificationBadgeProps) {
  if (!badge) return null;

  const config = badgeConfig[badge];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('inline-flex items-center gap-1.5 cursor-help', className)}>
          <span className={cn(
            'rounded-full flex items-center justify-center',
            sizes.container,
            config.bgClass
          )}>
            <Icon className={cn(sizes.icon, config.iconClass)} />
          </span>
          {showLabel && (
            <span className={cn('font-medium text-success', sizes.text)}>
              {config.label}
            </span>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="font-semibold">{config.label}</p>
        <p className="text-xs text-muted-foreground">{config.description}</p>
      </TooltipContent>
    </Tooltip>
  );
};
