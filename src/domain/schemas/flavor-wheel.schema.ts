import { z } from 'zod';

const FLAVOR_NODE_ID_REGEX = /^[a-z0-9-]+(\.[a-z0-9-]+)*$/;
const HEX_COLOR_6_REGEX = /^#[0-9A-Fa-f]{6}$/;

export const FlavorWheelTierSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
export type FlavorWheelTier = z.infer<typeof FlavorWheelTierSchema>;

export interface FlavorWheelNode {
  id: string;
  tier: FlavorWheelTier;
  labelKey: string;
  colorHex: string;
  tastingNoteKey: string;
  children: FlavorWheelNode[];
}

export const FlavorWheelNodeSchema: z.ZodType<FlavorWheelNode, z.ZodTypeDef, unknown> = z
  .object({
    id: z.string().regex(FLAVOR_NODE_ID_REGEX, {
      message: 'Flavor node id must be kebab-case dot-separated (e.g. fruity.berry.blackberry)',
    }),
    tier: FlavorWheelTierSchema,
    labelKey: z.string().min(1),
    colorHex: z.string().regex(HEX_COLOR_6_REGEX, {
      message: 'colorHex must be a valid 6-digit hex color (e.g. #C93B4B)',
    }),
    tastingNoteKey: z.string().min(1),
    children: z.lazy(() => z.array(FlavorWheelNodeSchema)),
  })
  .superRefine((node, ctx) => {
    if (node.tier === 3) {
      if (node.children.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['children'],
          message: `Tier 3 leaf node "${node.id}" must have an empty children array`,
        });
      }
      return;
    }

    if (node.children.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['children'],
        message: `Tier ${node.tier} node "${node.id}" must contain at least one child`,
      });
      return;
    }

    const expectedChildTier = (node.tier + 1) as FlavorWheelTier;
    const expectedPrefix = `${node.id}.`;

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (!child) continue;

      if (child.tier !== expectedChildTier) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['children', i, 'tier'],
          message: `Child "${child.id}" of tier ${node.tier} node "${node.id}" must have tier ${expectedChildTier}`,
        });
      }

      if (!child.id.startsWith(expectedPrefix)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['children', i, 'id'],
          message: `Child id "${child.id}" must start with parent prefix "${expectedPrefix}"`,
        });
      }
    }
  });

export const FlavorWheelTreeSchema = z.array(FlavorWheelNodeSchema).min(1);
export type FlavorWheelTree = z.infer<typeof FlavorWheelTreeSchema>;
