import type { SvgStageDirective } from '../../../domain/schemas/brewing.schema';
import { ProceduralBrewScene } from './ProceduralBrewScene';

export interface BrewPreviewVesselSvgProps {
  readonly directive: SvgStageDirective;
  readonly progress?: number;
  readonly reducedMotion?: boolean;
}

/**
 * Compact preview wrapper delegating to `<ProceduralBrewScene />` while preserving
 * backward compatibility for C-05 integration consumers.
 */
export function BrewPreviewVesselSvg({
  directive,
  progress = 1,
  reducedMotion,
}: BrewPreviewVesselSvgProps) {
  return (
    <ProceduralBrewScene
      directive={directive}
      progress={progress}
      reducedMotion={reducedMotion}
      className="w-[88px] h-[92px]"
    />
  );
}
