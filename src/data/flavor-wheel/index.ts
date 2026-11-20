import type { FlavorWheelNode } from '../../domain/schemas';
import { FLAVOR_WHEEL_DATA } from './flavor-wheel.data';

function deepFreezeNode(node: FlavorWheelNode): FlavorWheelNode {
  for (const child of node.children) {
    deepFreezeNode(child);
  }
  Object.freeze(node.children);
  return Object.freeze(node);
}

export const FLAVOR_WHEEL_TREE: readonly FlavorWheelNode[] = Object.freeze(
  FLAVOR_WHEEL_DATA.map((root) => deepFreezeNode(root))
);

const nodesByIdRecord: Record<string, FlavorWheelNode> = {};
const lineageByIdRecord: Record<string, readonly FlavorWheelNode[]> = {};
const descendantsByIdRecord: Record<string, readonly string[]> = {};

function indexTree(node: FlavorWheelNode, ancestors: readonly FlavorWheelNode[]): readonly string[] {
  const lineage = Object.freeze([...ancestors, node]);
  nodesByIdRecord[node.id] = node;
  lineageByIdRecord[node.id] = lineage;

  const descendantIds: string[] = [node.id];
  for (const child of node.children) {
    const childDescendants = indexTree(child, lineage);
    descendantIds.push(...childDescendants);
  }

  const frozenDescendants = Object.freeze(descendantIds);
  descendantsByIdRecord[node.id] = frozenDescendants;
  return frozenDescendants;
}

for (const root of FLAVOR_WHEEL_TREE) {
  indexTree(root, []);
}

export const FLAVOR_NODES_BY_ID: Readonly<Record<string, FlavorWheelNode>> =
  Object.freeze(nodesByIdRecord);

export const FLAVOR_LINEAGE_BY_ID: Readonly<Record<string, readonly FlavorWheelNode[]>> =
  Object.freeze(lineageByIdRecord);

export function getFlavorNodeById(nodeId: string): FlavorWheelNode | undefined {
  return FLAVOR_NODES_BY_ID[nodeId];
}

export function getFlavorNodeLineage(nodeId: string): readonly FlavorWheelNode[] | undefined {
  return FLAVOR_LINEAGE_BY_ID[nodeId];
}

export function getDescendantFlavorNodeIds(nodeId: string): readonly string[] {
  return descendantsByIdRecord[nodeId] ?? [];
}
