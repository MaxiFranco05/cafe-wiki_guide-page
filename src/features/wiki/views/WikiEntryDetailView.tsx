import React from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { getBrewerRecipes } from '../../../data/wiki-brewers';
import { getDrinksForBrewer } from '../../../data/wiki-drinks';
import { getOriginsForVarietal, getVarietalsForOrigin } from '../../../data/wiki/origin-varietals';
import { t } from '../../../i18n';
import { NotFoundView } from '../../../shared/components/NotFoundView';
import { BrewerIcon } from '../components/BrewerIcon';
import { BrewerPhoto } from '../components/BrewerPhoto';
import { DrinkComposition } from '../components/DrinkComposition';
import { FlavorNoteChips } from '../components/FlavorNoteChips';
import { RecipeTabs } from '../components/RecipeTabs';
import { RecommendedMethodCard, methodProfileLabels } from '../components/RecommendedMethodCard';
import { SensoryWheel } from '../components/SensoryWheel';
import { WikiChapterIndex, WikiChapterList, type WikiChapterData } from '../components/WikiChapter';
import type { WikiEntryLinkState } from '../components/WikiEntryCard';
import { UiIcon } from '../components/WikiIcons';
import { BrewerCoffees, WikiRelationChips, buildBrewerCoffeesGroups } from '../components/WikiRelations';
import { buildOriginStoryChapter, buildStoryChapter } from '../components/WikiStoryChapter';
import { getWikiItem, type WikiItem } from '../sections';
import { capAliases } from '../utils/wiki-ui.helpers';
import '../wiki.css';

interface DetailParts {
  readonly facts: readonly (readonly [string, string])[];
  readonly media?: React.ReactNode;
  readonly titleIcon?: React.ReactNode;
  readonly chapters: readonly (WikiChapterData | null)[];
  readonly action: React.ReactNode;
}

const notesChapter = (item: WikiItem): WikiChapterData | null =>
  item.flavorNodeIds.length > 0
    ? {
        id: 'notas',
        title: t('wiki.ui.chapters.notes.title'),
        sub: t('wiki.ui.chapters.notes.sub'),
        content: <FlavorNoteChips nodeIds={item.flavorNodeIds} from={`${item.section}/${item.slug}`} />,
      }
    : null;

function relationChapter(item: WikiItem): WikiChapterData | null {
  if (item.kind !== 'wiki') return null;
  if (item.entry.category === 'origin') {
    const varietals = getVarietalsForOrigin(item.slug).map((v) => getWikiItem('varietales', v.slug)).filter((v): v is WikiItem => !!v);
    return varietals.length
      ? {
          id: 'varietales',
          title: t('wiki.ui.chapters.varietals.title'),
          sub: t('wiki.ui.chapters.varietals.sub', { origin: item.title }),
          content: <WikiRelationChips section="varietales" items={varietals} />,
        }
      : null;
  }
  if (item.entry.category === 'varietal') {
    const origins = getOriginsForVarietal(item.slug).map((o) => getWikiItem('origenes', o.slug)).filter((o): o is WikiItem => !!o);
    return origins.length
      ? {
          id: 'origenes',
          title: t('wiki.ui.chapters.origins.title'),
          sub: t('wiki.ui.chapters.origins.sub'),
          content: <WikiRelationChips section="origenes" items={origins} tags={origins.map((o) => o.groupLabel)} />,
        }
      : null;
  }
  return null;
}

function wikiParts(item: Extract<WikiItem, { kind: 'wiki' }>): DetailParts {
  const { entry } = item;
  const f = (key: string) => t(`wiki.ui.detail.facts.${key}`);
  const facts: (readonly [string, string])[] =
    entry.category === 'origin'
      ? [
          [f('altitude'), t('wiki.ui.detail.facts.altitudeValue', { min: entry.metadata.altitudeRangeMeters.min, max: entry.metadata.altitudeRangeMeters.max })],
          [f('region'), t(entry.metadata.regionKey)],
          [f('harvest'), t(entry.metadata.harvestMonthsKey)],
        ]
      : entry.category === 'varietal'
        ? [
            [f('species'), t(`wiki.species.${entry.metadata.species}`)],
            [f('lineage'), t(entry.metadata.lineageKey)],
            [f('discovery'), t(entry.metadata.discoveryRegionKey)],
          ]
        : [
            [f('fermentation'), t(`wiki.ui.fermentation.${entry.metadata.fermentationType}`)],
            [f('mucilage'), t(entry.metadata.mucilageRemovalKey)],
            [f('drying'), t(entry.metadata.dryingMethodKey)],
          ];
  return {
    facts,
    chapters: [relationChapter(item), buildStoryChapter(undefined), notesChapter(item)],
    action: (
      <section className="w-panel w-panel--accent w-o2" aria-labelledby="w-methods-title">
        <h2 id="w-methods-title">{t('wiki.ui.methods.title')}</h2>
        {entry.recommendedMethods.map((method, index) => (
          <RecommendedMethodCard key={method.methodId} methodId={method.methodId} profileId={method.profileId} reason={t(method.reasonKey)} primary={index === 0} />
        ))}
      </section>
    ),
  };
}

function brewerParts(item: Extract<WikiItem, { kind: 'brewer' }>): DetailParts {
  const { entry } = item;
  const recipes = getBrewerRecipes(item.slug);
  const prepare: WikiChapterData =
    entry.methodId && recipes.length > 0
      ? {
          id: 'recetas',
          title: t('wiki.ui.chapters.recipes.title'),
          sub: t('wiki.ui.chapters.recipes.sub'),
          content: <RecipeTabs methodId={entry.methodId} recipes={recipes} />,
        }
      : {
          id: 'preparacion',
          title: t('wiki.ui.chapters.prepare.title'),
          sub: t('wiki.ui.chapters.prepare.sub'),
          content: (
            <>
              {entry.traditionalPreparationKey && <p className="w-prose">{t(entry.traditionalPreparationKey)}</p>}
              <div className="w-noted">
                <UiIcon name="info" />
                <span>{t('wiki.ui.chapters.prepare.encyclopedicNote')}</span>
              </div>
            </>
          ),
        };
  const coffees = buildBrewerCoffeesGroups(entry.methodId);
  const drinks = getDrinksForBrewer(item.slug)
    .map((d) => getWikiItem('bebidas', d.slug))
    .filter((d): d is WikiItem => !!d);
  return {
    facts: [
      [t('wiki.ui.detail.facts.creator'), t(entry.history.inventorKey)],
      [t('wiki.ui.detail.facts.origin'), t(entry.history.originCountryKey)],
      [t('wiki.ui.detail.facts.era'), t(entry.history.eraKey)],
    ],
    media: <BrewerPhoto slug={item.slug} title={item.title} />,
    titleIcon: (
      <span className="w-brewer-badge w-brewer-badge--lg">
        <BrewerIcon slug={item.slug} />
      </span>
    ),
    chapters: [
      prepare,
      {
        id: 'funciona',
        title: t('wiki.ui.chapters.howItWorks.title'),
        sub: t('wiki.ui.chapters.howItWorks.sub', { family: item.groupLabel }),
        content: <p className="w-prose">{t(entry.history.howItWorksKey)}</p>,
      },
      coffees.length
        ? { id: 'cafes', title: t('wiki.ui.chapters.coffees.title'), sub: t('wiki.ui.chapters.coffees.sub'), content: <BrewerCoffees groups={coffees} /> }
        : null,
      buildStoryChapter(undefined),
      notesChapter(item),
      drinks.length
        ? { id: 'bebidas', title: t('wiki.ui.chapters.drinks.title'), sub: t('wiki.ui.chapters.drinks.sub'), content: <WikiRelationChips section="bebidas" items={drinks} /> }
        : null,
    ],
    action: entry.methodId ? (
      <section className="w-panel w-panel--accent w-o2" aria-labelledby="w-station-title">
        <h2 id="w-station-title">{t('wiki.ui.station.title')}</h2>
        <p className="w-prose">{t('wiki.ui.station.desc')}</p>
        <Link className="w-cta" to={`/brew/${entry.methodId}`}>
          {t('wiki.ui.station.open', { method: methodProfileLabels(entry.methodId, 'normal').method })}
          <UiIcon name="arrow" />
        </Link>
      </section>
    ) : null,
  };
}

function drinkParts(item: Extract<WikiItem, { kind: 'drink' }>): DetailParts {
  const { entry } = item;
  const link = entry.brewLink ? methodProfileLabels(entry.brewLink.methodId, entry.brewLink.profileId) : null;
  return {
    facts: [
      [t('wiki.ui.detail.facts.origin'), t(entry.history.originCountryKey)],
      [t('wiki.ui.detail.facts.era'), t(entry.history.eraKey)],
      [t('wiki.ui.detail.facts.serving'), t('wiki.ui.detail.facts.servingValue', { min: entry.servedVolumeMl.min, max: entry.servedVolumeMl.max })],
    ],
    chapters: [
      {
        id: 'composicion',
        title: t('wiki.ui.chapters.composition.title'),
        sub: t('wiki.ui.chapters.composition.sub'),
        content: (
          <>
            <DrinkComposition drink={entry} />
            <p className="w-prose">
              <b>{t('wiki.ui.chapters.composition.prepare')}</b> {t(entry.history.preparationKey)}
            </p>
            <div className="w-chips">
              <span className="w-eyebrow">{t('wiki.ui.chapters.composition.baseBrewer')}</span>
              {entry.baseBrewerSlugs.map((slug) => {
                const brewer = getWikiItem('cafeteras', slug);
                return brewer ? (
                  <Link key={slug} className="w-chip" to={`/wiki/cafeteras/${slug}`}>
                    <BrewerIcon slug={slug} />
                    {brewer.title}
                  </Link>
                ) : null;
              })}
            </div>
          </>
        ),
      },
      buildOriginStoryChapter(t(entry.history.historyKey), item.summary),
      entry.regionalVariants.length
        ? {
            id: 'variantes',
            title: t('wiki.ui.chapters.variants.title'),
            sub: t('wiki.ui.chapters.variants.sub'),
            content: (
              <ul className="w-variants">
                {entry.regionalVariants.map((variant) => (
                  <li key={variant.id} className="w-variant">
                    <span>{t(variant.regionKey)}</span>
                    <b>{t(variant.nameKey)}</b>
                    <p>{t(variant.descriptionKey)}</p>
                  </li>
                ))}
              </ul>
            ),
          }
        : null,
      notesChapter(item),
    ],
    action: (
      <section className="w-panel w-panel--accent w-o2" aria-labelledby="w-drink-title">
        <h2 id="w-drink-title">{t('wiki.ui.drinkBrew.title')}</h2>
        {entry.brewLink && link ? (
          <>
            <p className="w-prose">{t('wiki.ui.drinkBrew.desc', { method: link.method, profile: link.profile })}</p>
            <Link className="w-cta" to={`/brew/${entry.brewLink.methodId}?profile=${entry.brewLink.profileId}`}>
              {t('wiki.ui.drinkBrew.cta', { method: link.method, profile: link.profile })}
              <UiIcon name="arrow" />
            </Link>
          </>
        ) : (
          <div className="w-noted">
            <UiIcon name="info" />
            <span>{t('wiki.ui.drinkBrew.none')}</span>
          </div>
        )}
      </section>
    ),
  };
}

function partsFor(item: WikiItem): DetailParts {
  switch (item.kind) {
    case 'wiki':
      return wikiParts(item);
    case 'brewer':
      return brewerParts(item);
    case 'drink':
      return drinkParts(item);
  }
}

export const WikiEntryDetailView: React.FC = () => {
  const { section, entrySlug } = useParams<{ section: string; entrySlug: string }>();
  const location = useLocation();
  const item = getWikiItem(section, entrySlug);
  if (!item) return <NotFoundView />;

  const parts = partsFor(item);
  const chapters = parts.chapters.filter((chapter): chapter is WikiChapterData => chapter !== null);
  const returnSearch = (location.state as WikiEntryLinkState | null)?.returnSearch ?? '';
  const sectionHref = `/wiki/${item.section}${returnSearch}`;
  const sectionTitle = t(`wiki.ui.sections.${item.section}.title`);
  const aliases = capAliases(item.aliases);

  return (
    <div className="w">
      <nav aria-label={t('wiki.ui.detail.breadcrumbAria')}>
        <ol className="w-crumbs">
          <li>
            <Link to="/wiki">{t('wiki.ui.detail.breadcrumbHome')}</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to={sectionHref}>{sectionTitle}</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{item.title}</li>
        </ol>
      </nav>
      <div className="w-detail">
        <div className="w-col">
          <header className={`w-head w-o1 ${parts.media ? 'w-head--photo' : ''}`}>
            {parts.media}
            <div className="w-head-body">
              <div className="w-pills">
                <span className="w-pill w-pill--sec">{t(`wiki.ui.sections.${item.section}.singular`)}</span>
                <span className="w-pill">{item.groupLabel}</span>
                <span className="w-pill">{t(`wiki.relevance.${item.relevance}`)}</span>
              </div>
              <div className="w-head-title-wrap">
                {parts.titleIcon}
                <div>
                  <h1>{item.title}</h1>
                  {aliases.shown.length > 0 && (
                    <p className="w-aliases" title={aliases.hidden.length ? [...aliases.shown, ...aliases.hidden].join(', ') : undefined}>
                      {aliases.shown.join(', ')}
                      {aliases.hidden.length > 0 && (
                        <>
                          {' '}
                          <small aria-hidden="true">{t('wiki.ui.detail.aliasesMore', { count: aliases.hidden.length })}</small>
                          <span className="sr-only">, {aliases.hidden.join(', ')}</span>
                        </>
                      )}
                    </p>
                  )}
                </div>
              </div>
              <p className="w-summary">{item.summary}</p>
              <dl className="w-quickfacts">
                {parts.facts.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </header>
          <WikiChapterList chapters={chapters} />
          <Link className="w-back w-o4" to={sectionHref}>
            <UiIcon name="back" /> {t('wiki.ui.detail.back', { section: sectionTitle })}
          </Link>
        </div>
        <div className="w-col w-col--side">
          <section className="w-panel w-o2" aria-labelledby="w-wheel-title">
            <h2 id="w-wheel-title">{t('wiki.ui.detail.wheelTitle')}</h2>
            <SensoryWheel profile={item.sensory} variant="full" />
          </section>
          {parts.action}
          <WikiChapterIndex chapters={chapters} />
        </div>
      </div>
    </div>
  );
};
