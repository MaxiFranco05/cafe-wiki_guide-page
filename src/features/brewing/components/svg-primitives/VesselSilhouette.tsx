import {
  UPPER_FILTER_CLIP_PATHS,
  VESSEL_CLIP_PATHS,
  type BrewVesselType,
} from './chamber-geometry';

export interface VesselClipDefsProps {
  readonly vesselType: BrewVesselType;
  readonly carafeClipId: string;
  readonly upperFilterClipId?: string;
}

/** Emits scoped SVG `<clipPath>` geometry (dual-chamber for pour-overs, single chamber otherwise). */
export function VesselClipDefs({
  vesselType,
  carafeClipId,
  upperFilterClipId,
}: VesselClipDefsProps) {
  const upperPath = UPPER_FILTER_CLIP_PATHS[vesselType];
  return (
    <>
      <clipPath id={carafeClipId} data-chamber-clip="carafe">
        <path d={VESSEL_CLIP_PATHS[vesselType]} />
      </clipPath>
      {upperPath && upperFilterClipId ? (
        <clipPath id={upperFilterClipId} data-chamber-clip="upper-filter">
          <path d={upperPath} />
        </clipPath>
      ) : null}
    </>
  );
}

export interface VesselSilhouetteProps {
  readonly vesselType: BrewVesselType;
}

/** Minimalist line-art wireframe silhouette tailored to each extraction vessel. */
export function VesselSilhouette({ vesselType }: VesselSilhouetteProps) {
  switch (vesselType) {
    case 'cone_v60':
      return (
        <g
          data-primitive="vessel-silhouette"
          data-vessel="cone_v60"
          stroke="var(--svg-vessel-stroke)"
          strokeWidth={2.1}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M36 36h88l-25 48H61L36 36Z" />
          <path
            d="M52 36l16 48 M68 36l10 48 M94 36l-10 48"
            stroke="var(--svg-coffee-crema)"
            strokeWidth={1.3}
            opacity={0.65}
          />
          <path d="M44 85h72" stroke="var(--accent-gold)" strokeWidth={2.6} />
          <path d="M116 44h11a6 6 0 0 1 6 6v9a6 6 0 0 1-6 6h-19" strokeWidth={1.8} />
          <path d="M50 86h60l8 52H42l8-52Z" />
          <path d="M112 96h12a7 7 0 0 1 7 7v16a7 7 0 0 1-7 7h-8" />
          <path
            d="M60 104h8 M58 118h10 M56 130h8"
            stroke="var(--svg-coffee-crema)"
            strokeWidth={1.2}
            opacity={0.55}
          />
        </g>
      );

    case 'hourglass_chemex':
      return (
        <g
          data-primitive="vessel-silhouette"
          data-vessel="hourglass_chemex"
          stroke="var(--svg-vessel-stroke)"
          strokeWidth={2.1}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d="M48 32l8-10h48l8 10"
            stroke="var(--svg-coffee-crema)"
            strokeWidth={1.5}
            strokeDasharray="3 2"
            opacity={0.8}
          />
          <path d="M42 32h76L94 84l22 54H44l22-54L42 32Z" />
          <path
            d="M61 74h38l-4 18H65l-4-18Z"
            fill="var(--svg-coffee-liquid)"
            fillOpacity={0.85}
            stroke="var(--accent-gold)"
            strokeWidth={1.8}
          />
          <path d="M60 83h40" stroke="var(--svg-coffee-bed)" strokeWidth={2.8} />
          <circle
            cx={80}
            cy={83}
            r={4}
            fill="var(--accent-gold)"
            stroke="var(--bg-canvas)"
            strokeWidth={1.4}
          />
          <path d="M80 87l-3 9 M80 87l3 9" stroke="var(--accent-gold)" strokeWidth={1.5} />
        </g>
      );

    case 'wedge_melitta':
      return (
        <g
          data-primitive="vessel-silhouette"
          data-vessel="wedge_melitta"
          stroke="var(--svg-vessel-stroke)"
          strokeWidth={2.1}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M40 36h80l-16 46H56L40 36Z" />
          <path
            d="M56 36l8 46 M80 36v46 M104 36l-8 46"
            stroke="var(--svg-coffee-crema)"
            strokeWidth={1.2}
            opacity={0.55}
          />
          <path d="M114 46h10a5 5 0 0 1 5 5v9a5 5 0 0 1-5 5h-16" strokeWidth={1.8} />
          <path d="M46 83h68" stroke="var(--accent-gold)" strokeWidth={2.5} />
          <path d="M52 84h56v42c0 8-12 12-28 12s-28-4-28-12V84Z" />
          <path d="M108 94h11a6 6 0 0 1 6 6v15a6 6 0 0 1-6 6h-11" />
        </g>
      );

    case 'cylinder_aeropress':
      return (
        <g
          data-primitive="vessel-silhouette"
          data-vessel="cylinder_aeropress"
          stroke="var(--svg-vessel-stroke)"
          strokeWidth={2.1}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M47 60h66" stroke="var(--accent-gold)" strokeWidth={2.6} />
          <rect x={52} y={60} width={56} height={70} rx={2} />
          <circle cx={63} cy={116} r={4} stroke="var(--accent-gold)" strokeWidth={1.2} opacity={0.72} />
          <circle cx={63} cy={98} r={4} stroke="var(--accent-gold)" strokeWidth={1.2} opacity={0.72} />
          <circle cx={63} cy={80} r={4} stroke="var(--accent-gold)" strokeWidth={1.2} opacity={0.72} />
          <path d="M42 130h76" stroke="var(--accent-gold)" strokeWidth={3} />
          <path d="M54 130v5h52v-5" fill="var(--bg-dark-card)" />
          <path
            d="M52 136h56v13a7 7 0 0 1-7 7H59a7 7 0 0 1-7-7v-13Z"
            strokeWidth={1.8}
            opacity={0.88}
          />
          <path
            d="M108 139h8a4.5 4.5 0 0 1 4.5 4.5v2a4.5 4.5 0 0 1-4.5 4.5h-8"
            strokeWidth={1.7}
            opacity={0.88}
          />
        </g>
      );

    case 'beaker_french_press':
      return (
        <g
          data-primitive="vessel-silhouette"
          data-vessel="beaker_french_press"
          stroke="var(--svg-vessel-stroke)"
          strokeWidth={2.1}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M41 56h76" stroke="var(--accent-gold)" strokeWidth={2.4} />
          <path d="M46 56h68v82a6 6 0 0 1-6 6H52a6 6 0 0 1-6-6V56Z" />
          <path
            d="M46 72h68 M46 128h68"
            stroke="var(--accent-gold)"
            strokeWidth={1.5}
            opacity={0.75}
          />
          <path d="M114 70h13a7 7 0 0 1 7 7v38a7 7 0 0 1-7 7h-13" />
        </g>
      );

    case 'portafilter_espresso':
      return (
        <g
          data-primitive="vessel-silhouette"
          data-vessel="portafilter_espresso"
          stroke="var(--svg-vessel-stroke)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d="M46 18h68v10H46z"
            fill="var(--bg-dark-card)"
            stroke="var(--accent-gold)"
            strokeWidth={1.7}
          />
          <path
            d="M54 28h52v5H54z"
            fill="var(--accent-primary)"
            stroke="var(--accent-gold)"
            strokeWidth={1.2}
          />
          <path
            d="M50 33h60v5H50z"
            fill="var(--bg-elevated)"
            stroke="var(--accent-gold)"
            strokeWidth={1.5}
          />
          <path
            d="M55 38h50l-5 15c-2 5-8 8-20 8s-18-3-20-8l-5-15Z"
            fill="var(--bg-dark-card)"
            stroke="var(--svg-vessel-stroke)"
            strokeWidth={2}
          />
          <path d="M105 42l12 2" stroke="var(--accent-gold)" strokeWidth={4.2} />
          <path d="M117 44l28 5" stroke="var(--accent-primary)" strokeWidth={5.6} />
          <path d="M117 44l28 5" stroke="var(--accent-gold)" strokeWidth={1.4} opacity={0.85} />
          <path d="M77 61v5l-6 7v4 M83 61v5l6 7v4" stroke="var(--accent-gold)" strokeWidth={2.1} />
          <path d="M50 96h60v20a22 22 0 0 1-22 22H72a22 22 0 0 1-22-22V96Z" />
          <path d="M110 101h9a6.5 6.5 0 0 1 6.5 6.5v6a6.5 6.5 0 0 1-6.5 6.5h-9" />
          <path d="M36 142h88" stroke="var(--accent-gold)" strokeWidth={2.4} />
        </g>
      );
  }
}
