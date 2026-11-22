import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import type { FlavorWheelNode } from '../../../domain/schemas';
import { getFlavorNodeById, getFlavorNodeLineage } from '../../../data/flavor-wheel';
import { getWikiItem } from '../../wiki/sections';

export const NODE_PARAM = 'node';
export const FROM_PARAM = 'from';

export interface ReturnEntry {
  readonly href: string;
  readonly title: string;
}

export interface FlavorSelection {
  readonly selectedNode: FlavorWheelNode | undefined;
  /** Family → … → selected node; empty without a selection. */
  readonly lineage: readonly FlavorWheelNode[];
  /** Family whose branch the wheel zooms into (always the lineage root). */
  readonly focusFamily: FlavorWheelNode | undefined;
  /** Wiki entry the user came from (`?from=<section>/<slug>`), only when it exists. */
  readonly returnEntry: ReturnEntry | undefined;
  readonly select: (nodeId: string) => void;
  readonly clear: () => void;
}

const EMPTY_LINEAGE: readonly FlavorWheelNode[] = [];

function resolveReturnEntry(from: string | null): ReturnEntry | undefined {
  if (!from) return undefined;
  const [section, slug, ...rest] = from.split('/');
  if (rest.length > 0) return undefined;
  const item = getWikiItem(section, slug);
  return item ? { href: `/wiki/${item.section}/${item.slug}`, title: item.title } : undefined;
}

/**
 * Single source of truth for the wheel: the selection lives in `?node=` and is written with
 * `replace`, so exploring never grows the history; every other parameter (e.g. `from`) is kept.
 */
export function useFlavorSelection(): FlavorSelection {
  const [searchParams, setSearchParams] = useSearchParams();
  const nodeId = searchParams.get(NODE_PARAM);
  const from = searchParams.get(FROM_PARAM);

  const selectedNode = nodeId ? getFlavorNodeById(nodeId) : undefined;
  const lineage = (selectedNode && getFlavorNodeLineage(selectedNode.id)) ?? EMPTY_LINEAGE;
  const returnEntry = useMemo(() => resolveReturnEntry(from), [from]);

  const writeNode = useCallback(
    (next: string | null) => {
      setSearchParams(
        (current) => {
          const params = new URLSearchParams(current);
          if (next) params.set(NODE_PARAM, next);
          else params.delete(NODE_PARAM);
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const select = useCallback(
    (id: string) => {
      if (getFlavorNodeById(id)) writeNode(id);
    },
    [writeNode],
  );
  const clear = useCallback(() => writeNode(null), [writeNode]);

  return { selectedNode, lineage, focusFamily: lineage[0], returnEntry, select, clear };
}
