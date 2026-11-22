import React from 'react';
import { t } from '../../../i18n';

/** Brewer slug -> photo in public/images/coffee (design system Rev 5). */
export const BREWER_PHOTOS: Readonly<Record<string, string>> = {
  v60: 'v60-moody.jpg',
  chemex: 'immersion-moody.jpg',
  melitta: 'melitta-moody.jpg',
  aeropress: 'aeropress-moody.jpg',
  'french-press': 'french-press-moody.jpg',
  'espresso-machine': 'pro-machine-moody.jpg',
  moka: 'moka-moody.jpg',
  siphon: 'siphon-moody.jpg',
  cezve: 'cezve-moody.jpg',
  'electric-drip': 'electric-drip-moody.jpg',
};

export const BrewerPhoto: React.FC<{ readonly slug: string; readonly title: string }> = ({ slug, title }) => {
  const file = BREWER_PHOTOS[slug];
  if (!file) return null;
  return (
    <figure className="w-head-media">
      <img src={`/images/coffee/${file}`} alt={title} loading="lazy" decoding="async" />
      <figcaption>{t(`wiki.ui.photoCaptions.${slug}`)}</figcaption>
    </figure>
  );
};
