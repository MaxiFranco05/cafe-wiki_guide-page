import React from 'react';
import { Link } from 'react-router';
import type { BrewMethod } from '../../../domain/schemas';
import { deriveMethodCardViewModel } from '../utils/method-card.mapper';
import { MethodVesselIcon } from './MethodVesselIcon';

export interface MethodCardProps {
  readonly method: BrewMethod;
}

export const MethodCard: React.FC<MethodCardProps> = ({ method }) => {
  const vm = deriveMethodCardViewModel(method);

  return (
    <Link
      to={vm.href}
      className="relative rounded-[18px] overflow-hidden bg-dark-card border border-border-subtle text-text-on-photo min-h-[280px] flex flex-col justify-between p-5 shadow-card hover-lift pressable group no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {/* Background Moody Photo */}
      <img
        src={vm.imageSrc}
        alt={vm.title}
        style={vm.objectPosition ? { objectPosition: vm.objectPosition } : undefined}
        className="absolute inset-0 w-full h-full object-cover contrast-[1.12] saturate-[1.22] brightness-[0.74] transition-transform duration-300 group-hover:scale-[1.02]"
      />

      {/* Dark Gradual Scrim */}
      <div className="absolute inset-0 bg-gradient-to-b from-canvas/25 via-canvas/60 to-canvas/95 z-0 pointer-events-none" />

      {/* Top Row: Category Badge & SVG Vessel Silhouette */}
      <div className="relative z-10 flex items-start justify-between gap-3">
        <span className="font-mono text-[11px] px-2.5 py-1 rounded-md bg-canvas/80 border border-gold/40 text-gold backdrop-blur-sm">
          {vm.categoryBadge}
        </span>

        <span className="w-11 h-11 shrink-0 rounded-xl bg-canvas/80 border border-text-primary/20 backdrop-blur-sm flex items-center justify-center transition-colors group-hover:border-gold/55">
          <MethodVesselIcon vesselType={vm.vesselType} />
        </span>
      </div>

      {/* Bottom Row: Title, Author, Summary & Derived Metrics */}
      <div className="relative z-10 space-y-2 mt-auto pt-8">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-xl font-bold tracking-tight m-0 text-text-primary group-hover:text-gold transition-colors">
            {vm.title}
          </h3>
          <span className="font-mono text-[11px] text-text-secondary shrink-0">
            {vm.referenceAuthor}
          </span>
        </div>

        <p className="text-xs text-text-on-photo/85 m-0 line-clamp-2 leading-relaxed">
          {vm.description}
        </p>

        <div className="flex items-center gap-3.5 pt-2.5 mt-2 border-t border-text-on-photo/15 font-mono font-mono-tabular text-xs text-gold">
          <span>{vm.ratioBadge}</span>
          <span>{vm.doseBadge}</span>
          <span>{vm.durationBadge}</span>
        </div>
      </div>
    </Link>
  );
};
