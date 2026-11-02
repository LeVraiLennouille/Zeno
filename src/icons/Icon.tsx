import type { ComponentType } from 'react';
import Svg, { Circle, Ellipse, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg';

import { ICON_NODES, type IconName, type IconNode, type SvgTag } from './icon-data';
import { NAV_ICONS, type NavIconName } from './nav-icons';

export type AnyIconName = IconName | NavIconName;

/** Vrai si `name` est une icône connue (les toasts reçoivent parfois l'identifiant d'une habitude personnalisée). */
export const isIconName = (name: string): name is AnyIconName => name in NAV_ICONS || name in ICON_NODES;

// Les composants de react-native-svg ont chacun leurs propres props ; les attributs
// viennent d'un fichier généré et validé (voir scripts/generate-icons.cjs), d'où ce type large.
type ShapeComponent = ComponentType<Record<string, unknown>>;
const SHAPES: Readonly<Record<SvgTag, ShapeComponent>> = {
  path: Path as unknown as ShapeComponent,
  circle: Circle as unknown as ShapeComponent,
  rect: Rect as unknown as ShapeComponent,
  line: Line as unknown as ShapeComponent,
  polyline: Polyline as unknown as ShapeComponent,
  polygon: Polygon as unknown as ShapeComponent,
  ellipse: Ellipse as unknown as ShapeComponent,
};

const nodesOf = (name: AnyIconName): readonly IconNode[] =>
  name in NAV_ICONS ? NAV_ICONS[name as NavIconName] : ICON_NODES[name as IconName];

export interface IconProps {
  readonly name: AnyIconName;
  readonly size?: number;
  readonly color: string;
  readonly strokeWidth?: number;
  /** Absent = icône décorative (ignorée des lecteurs d'écran). */
  readonly label?: string;
}

/** Icône SVG au style de la PWA : trait 2, extrémités et jointures arrondies, grille 24×24. */
export function Icon({ name, size = 20, color, strokeWidth = 2, label }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...(label
        ? { accessibilityRole: 'image' as const, accessibilityLabel: label }
        : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const })}
    >
      {nodesOf(name).map((node, i) => {
        const Shape = SHAPES[node.tag];
        const props = Object.fromEntries(
          Object.entries(node.attrs).map(([k, v]) => [k, v === 'currentColor' ? color : v]),
        );
        return <Shape key={i} {...props} />;
      })}
    </Svg>
  );
}
