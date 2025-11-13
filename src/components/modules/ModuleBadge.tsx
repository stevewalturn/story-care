'use client';

/**
 * Module Badge Component
 * Displays treatment module with domain-specific styling
 */

import type { TherapeuticDomain } from '@/models/Schema';
import { Heart, Sparkles, Target, Users } from 'lucide-react';

type ModuleBadgeProps = {
  moduleName: string;
  domain: TherapeuticDomain;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  onClick?: () => void;
};

const domainConfig = {
  self_strength: {
    name: 'Self & Strength',
    icon: Sparkles,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    dotColor: 'bg-blue-500',
  },
  relationships_repair: {
    name: 'Relationships & Repair',
    icon: Users,
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    dotColor: 'bg-green-500',
  },
  identity_transformation: {
    name: 'Identity & Transformation',
    icon: Heart,
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    dotColor: 'bg-purple-500',
  },
  purpose_future: {
    name: 'Purpose & Future',
    icon: Target,
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    dotColor: 'bg-orange-500',
  },
};

const sizeConfig = {
  sm: {
    badge: 'px-2 py-1 text-xs',
    icon: 'h-3 w-3',
    dot: 'h-1.5 w-1.5',
  },
  md: {
    badge: 'px-3 py-1.5 text-sm',
    icon: 'h-4 w-4',
    dot: 'h-2 w-2',
  },
  lg: {
    badge: 'px-4 py-2 text-base',
    icon: 'h-5 w-5',
    dot: 'h-2.5 w-2.5',
  },
};

export function ModuleBadge({
  moduleName,
  domain,
  size = 'md',
  showIcon = true,
  onClick,
}: ModuleBadgeProps) {
  const config = domainConfig[domain] || domainConfig.self_strength;
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  const className = `
    inline-flex items-center gap-1.5 rounded-full border font-medium transition-all
    ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizes.badge}
    ${onClick ? 'cursor-pointer hover:shadow-sm' : ''}
  `.trim();

  return (
    <span className={className} onClick={onClick}>
      {showIcon && <Icon className={sizes.icon} />}
      <span className="truncate">{moduleName}</span>
      <span className={`rounded-full ${config.dotColor} ${sizes.dot}`} />
    </span>
  );
}

/**
 * Module Badge with Domain Label
 * Shows both module name and domain category
 */
export function ModuleBadgeWithDomain({
  moduleName,
  domain,
  size = 'md',
}: Omit<ModuleBadgeProps, 'showIcon' | 'onClick'>) {
  const config = domainConfig[domain] || domainConfig.self_strength;
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div className="inline-flex flex-col gap-1">
      <span className={`text-xs font-medium ${config.textColor}`}>
        {config.name}
      </span>
      <span
        className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium
        ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizes.badge}
      `.trim()}
      >
        <Icon className={sizes.icon} />
        <span className="truncate">{moduleName}</span>
      </span>
    </div>
  );
}

/**
 * Simple domain indicator dot
 */
export function ModuleDomainDot({ domain }: { domain: TherapeuticDomain }) {
  const config = domainConfig[domain] || domainConfig.self_strength;

  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${config.dotColor}`}
      title={config.name}
    />
  );
}
