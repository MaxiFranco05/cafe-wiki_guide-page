import type { SvgStageDirective } from '../../../../domain/schemas/brewing.schema';

export type BrewVesselType = SvgStageDirective['vesselType'];

export interface ChamberBounds {
  readonly top: number;
  readonly bottom: number;
}

/** Lower server / main extraction chamber SVG clip paths in the 160x168 viewBox. */
export const VESSEL_CLIP_PATHS: Record<BrewVesselType, string> = {
  cone_v60: 'M50 86h60l8 52H42l8-52Z',
  hourglass_chemex: 'M65 86h30l21 52H44l21-52Z',
  wedge_melitta: 'M52 84h56v42c0 8-12 12-28 12s-28-4-28-12V84Z',
  cylinder_aeropress: 'M52 60h56v70H52V60Z',
  beaker_french_press: 'M46 56h68v82a6 6 0 0 1-6 6H52a6 6 0 0 1-6-6V56Z',
  portafilter_espresso: 'M50 96h60v20a22 22 0 0 1-22 22H72a22 22 0 0 1-22-22V96Z',
};

/** Upper paper filter cone clip paths (pour-over coffee bed + shallow slurry only). */
export const UPPER_FILTER_CLIP_PATHS: Partial<Record<BrewVesselType, string>> = {
  cone_v60: 'M38 37h84L98 84H62L38 37Z',
  hourglass_chemex: 'M42 32h76L94 82H66L42 32Z',
  wedge_melitta: 'M40 36h80l-16 46H56L40 36Z',
};

/** Vertical chamber bounds used to convert fill ratio [0..1] to meniscus Y coordinates. */
export const VESSEL_CHAMBER_BOUNDS: Record<BrewVesselType, ChamberBounds> = {
  cone_v60: { top: 94, bottom: 138 },
  hourglass_chemex: { top: 96, bottom: 138 },
  wedge_melitta: { top: 92, bottom: 138 },
  cylinder_aeropress: { top: 65, bottom: 130 },
  beaker_french_press: { top: 60, bottom: 144 },
  portafilter_espresso: { top: 98, bottom: 138 },
};

/** Returns true for gravity pour-over vessels with separated upper dripper & lower server. */
export function isPourOverVessel(vesselType: BrewVesselType): boolean {
  return (
    vesselType === 'cone_v60' ||
    vesselType === 'hourglass_chemex' ||
    vesselType === 'wedge_melitta'
  );
}
