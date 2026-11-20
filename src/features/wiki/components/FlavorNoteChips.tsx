import React from 'react';
import { Link } from 'react-router';
import { familyColorVar, getNoteFamilyId } from '../utils/wiki-ui.helpers';
import { noteLabel } from './WikiEntryCard';
import { UiIcon } from './WikiIcons';

/** Tasting notes linked to the flavor wheel; `from` lets C-11 offer "Volver a {ficha}". */
export const FlavorNoteChips: React.FC<{ readonly nodeIds: readonly string[]; readonly from: string }> = ({ nodeIds, from }) => (
  <div className="w-chips">
    {nodeIds.map((id) => {
      const label = noteLabel(id);
      if (!label) return null;
      return (
        <Link
          key={id}
          className="w-chip"
          to={`/flavor-wheel?${new URLSearchParams({ node: id, from }).toString()}`}
          style={{ '--fam': familyColorVar(getNoteFamilyId(id)) } as React.CSSProperties}
        >
          <span className="w-chip-dot" aria-hidden="true" />
          {label}
          <UiIcon name="wheel" size={14} />
        </Link>
      );
    })}
  </div>
);
