'use client';

/**
 * Module Domain Filter Component
 * Filter modules by therapeutic domain
 */

import { Heart, Sparkles, Target, Users } from 'lucide-react';

type TherapeuticDomain = 'self_strength' | 'relationships_repair' | 'identity_transformation' | 'purpose_future' | null;

type ModuleDomainFilterProps = {
  selectedDomain: TherapeuticDomain;
  onSelectDomain: (domain: TherapeuticDomain) => void;
};

const domains = [
  {
    id: 'self_strength' as const,
    name: 'Self & Strength',
    description: 'Grounding, resilience',
    icon: Sparkles,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-500',
    hoverColor: 'hover:bg-blue-100',
  },
  {
    id: 'relationships_repair' as const,
    name: 'Relationships & Repair',
    description: 'Trust, belonging',
    icon: Users,
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-500',
    hoverColor: 'hover:bg-green-100',
  },
  {
    id: 'identity_transformation' as const,
    name: 'Identity & Transformation',
    description: 'Coherence, change',
    icon: Heart,
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-500',
    hoverColor: 'hover:bg-purple-100',
  },
  {
    id: 'purpose_future' as const,
    name: 'Purpose & Future',
    description: 'Meaning, direction',
    icon: Target,
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-500',
    hoverColor: 'hover:bg-orange-100',
  },
];

export function ModuleDomainFilter({ selectedDomain, onSelectDomain }: ModuleDomainFilterProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-700">Filter by Domain</h2>
        {selectedDomain && (
          <button
            onClick={() => onSelectDomain(null)}
            className="text-sm text-purple-600 hover:text-purple-700"
            type="button"
          >
            Clear filter
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {domains.map((domain) => {
          const Icon = domain.icon;
          const isSelected = selectedDomain === domain.id;

          return (
            <button
              key={domain.id}
              onClick={() => onSelectDomain(isSelected ? null : domain.id)}
              className={`group relative rounded-xl border-2 p-4 text-left transition-all ${
                isSelected
                  ? `${domain.borderColor} ${domain.bgColor}`
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              type="button"
            >
              {/* Icon */}
              <div
                className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${
                  isSelected ? domain.color : 'bg-gray-100 group-hover:bg-gray-200'
                }`}
              >
                <Icon className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
              </div>

              {/* Content */}
              <h3
                className={`mb-1 text-sm font-semibold ${
                  isSelected ? domain.textColor : 'text-gray-900'
                }`}
              >
                {domain.name}
              </h3>
              <p className="text-xs text-gray-500">{domain.description}</p>

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className={`h-2 w-2 rounded-full ${domain.color}`} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
