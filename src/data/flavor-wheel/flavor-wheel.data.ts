import type { FlavorWheelNode, FlavorWheelTier } from '../../domain/schemas';

function makeNode(
  id: string,
  tier: FlavorWheelTier,
  colorHex: string,
  children: FlavorWheelNode[] = []
): FlavorWheelNode {
  const keySegment = id.replaceAll('.', '_');
  return {
    id,
    tier,
    labelKey: `flavorWheel.nodes.${keySegment}.label`,
    colorHex,
    tastingNoteKey: `flavorWheel.nodes.${keySegment}.note`,
    children,
  };
}

export const FLAVOR_WHEEL_DATA: readonly FlavorWheelNode[] = [
  makeNode('fruity', 1, '#DA1D23', [
    makeNode('fruity.berry', 2, '#DD4C51', [
      makeNode('fruity.berry.blackberry', 3, '#3E0317'),
      makeNode('fruity.berry.raspberry', 3, '#E62969'),
      makeNode('fruity.berry.blueberry', 3, '#6569B0'),
      makeNode('fruity.berry.strawberry', 3, '#EF2D36'),
    ]),
    makeNode('fruity.dried-fruit', 2, '#C94A44', [
      makeNode('fruity.dried-fruit.raisin', 3, '#B53B54'),
      makeNode('fruity.dried-fruit.prune', 3, '#A5446F'),
    ]),
    makeNode('fruity.citrus', 2, '#F7A128', [
      makeNode('fruity.citrus.grapefruit', 3, '#F26355'),
      makeNode('fruity.citrus.orange', 3, '#E2631E'),
      makeNode('fruity.citrus.lemon', 3, '#FDE404'),
      makeNode('fruity.citrus.lime', 3, '#7EB138'),
    ]),
    makeNode('fruity.stone-tropical', 2, '#E75B68', [
      makeNode('fruity.stone-tropical.peach', 3, '#F68A5C'),
      makeNode('fruity.stone-tropical.cherry', 3, '#E73451'),
      makeNode('fruity.stone-tropical.mango', 3, '#F89A1C'),
      makeNode('fruity.stone-tropical.apple', 3, '#8FB339'),
    ]),
  ]),
  makeNode('floral', 1, '#E0719C', [
    makeNode('floral.tea', 2, '#975E6D', [
      makeNode('floral.tea.black-tea', 3, '#7A4A57'),
    ]),
    makeNode('floral.blossom', 2, '#E0719C', [
      makeNode('floral.blossom.jasmine', 3, '#F7F1BD'),
      makeNode('floral.blossom.rose', 3, '#EF5A78'),
      makeNode('floral.blossom.chamomile', 3, '#F99E1C'),
      makeNode('floral.blossom.bergamot', 3, '#D9829D'),
    ]),
  ]),
  makeNode('sweet', 1, '#E65832', [
    makeNode('sweet.brown-sugar', 2, '#D45A59', [
      makeNode('sweet.brown-sugar.panela', 3, '#B85D3B'),
      makeNode('sweet.brown-sugar.caramel', 3, '#D97828'),
      makeNode('sweet.brown-sugar.honey', 3, '#DA5C1F'),
      makeNode('sweet.brown-sugar.molasses', 3, '#4B1D19'),
    ]),
    makeNode('sweet.vanilla-aromatics', 2, '#F89A80', [
      makeNode('sweet.vanilla-aromatics.vanilla', 3, '#F37674'),
      makeNode('sweet.vanilla-aromatics.maple-syrup', 3, '#AE341F'),
    ]),
  ]),
  makeNode('nutty-cocoa', 1, '#A87B64', [
    makeNode('nutty-cocoa.nutty', 2, '#C78869', [
      makeNode('nutty-cocoa.nutty.almond', 3, '#C78936'),
      makeNode('nutty-cocoa.nutty.hazelnut', 3, '#9D5433'),
      makeNode('nutty-cocoa.nutty.peanut', 3, '#D4AD12'),
      makeNode('nutty-cocoa.nutty.walnut', 3, '#8C5A3C'),
    ]),
    makeNode('nutty-cocoa.cocoa', 2, '#BB764C', [
      makeNode('nutty-cocoa.cocoa.dark-chocolate', 3, '#470604'),
      makeNode('nutty-cocoa.cocoa.milk-chocolate', 3, '#692A19'),
      makeNode('nutty-cocoa.cocoa.cocoa-nib', 3, '#7A3E24'),
    ]),
  ]),
  makeNode('spiced', 1, '#AD213E', [
    makeNode('spiced.brown-spice', 2, '#B14D57', [
      makeNode('spiced.brown-spice.cinnamon', 3, '#E5762E'),
      makeNode('spiced.brown-spice.clove', 3, '#9B6B43'),
      makeNode('spiced.brown-spice.nutmeg', 3, '#8B2929'),
      makeNode('spiced.brown-spice.anise', 3, '#C78936'),
    ]),
    makeNode('spiced.pungent', 2, '#794752', [
      makeNode('spiced.pungent.black-pepper', 3, '#CC3D41'),
      makeNode('spiced.pungent.cardamom', 3, '#6E8B52'),
    ]),
  ]),
  makeNode('roasted', 1, '#C94930', [
    makeNode('roasted.cereal', 2, '#DDAF61', [
      makeNode('roasted.cereal.malt', 3, '#E5A93C'),
      makeNode('roasted.cereal.toasted-grain', 3, '#B7906F'),
    ]),
    makeNode('roasted.burnt', 2, '#BE8663', [
      makeNode('roasted.burnt.smoky', 3, '#A1743B'),
      makeNode('roasted.burnt.roast-toast', 3, '#7E4E2D'),
      makeNode('roasted.burnt.tobacco', 3, '#9E6B47'),
    ]),
  ]),
  makeNode('green-vegetative', 1, '#187A2F', [
    makeNode('green-vegetative.herbal', 2, '#3AA255', [
      makeNode('green-vegetative.herbal.fresh-herb', 3, '#59A96A'),
      makeNode('green-vegetative.herbal.green-tea', 3, '#6AA84F'),
      makeNode('green-vegetative.herbal.mint', 3, '#479B6E'),
    ]),
    makeNode('green-vegetative.vegetal', 2, '#718933', [
      makeNode('green-vegetative.vegetal.olive-oil', 3, '#A2B029'),
      makeNode('green-vegetative.vegetal.hay', 3, '#A3A36F'),
    ]),
  ]),
  makeNode('sour-fermented', 1, '#EBB40F', [
    makeNode('sour-fermented.sour-acids', 2, '#E1C315', [
      makeNode('sour-fermented.sour-acids.citric-acid', 3, '#F7D21E'),
      makeNode('sour-fermented.sour-acids.malic-acid', 3, '#C7D42C'),
      makeNode('sour-fermented.sour-acids.phosphoric-acid', 3, '#E5A910'),
    ]),
    makeNode('sour-fermented.fermented', 2, '#B09733', [
      makeNode('sour-fermented.fermented.winey', 3, '#8F1B53'),
      makeNode('sour-fermented.fermented.boozy-rum', 3, '#9A4D2E'),
      makeNode('sour-fermented.fermented.overripe-fruit', 3, '#B34039'),
    ]),
  ]),
  makeNode('other', 1, '#0AA3B5', [
    makeNode('other.woody-earthy', 2, '#8B8C90', [
      makeNode('other.woody-earthy.cedar', 3, '#7A543E'),
      makeNode('other.woody-earthy.earthy', 3, '#6E5A4F'),
      makeNode('other.woody-earthy.woody', 3, '#94745B'),
    ]),
    makeNode('other.papery-mineral', 2, '#76C0CB', [
      makeNode('other.papery-mineral.mineral', 3, '#5B9AA9'),
      makeNode('other.papery-mineral.papery', 3, '#A8BCC2'),
    ]),
  ]),
];
