import type { ContentSkeletonProps } from '@/shared/ui/ContentSkeleton';

/**
 * Ordered regex-based rules mapping pathname -> skeleton config.
 * First matching rule wins. Keep most specific patterns first.
 */
interface SkeletonRule {
  pattern: RegExp;
  config: ContentSkeletonProps;
}

const RULES: SkeletonRule[] = [
  // Deals Kanban view (no blocks, more text lines, keep header)
  { pattern: /\/deals\/kanban(\/|$)/, config: { blocks: 0, lines: 4, header: true } },
  // Deals generic listing / filters
  { pattern: /\/deals(\/|$)/, config: { blocks: 2, lines: 2 } },
  // Lead detail page (id after /leads/) – more lines, dense layout
  { pattern: /\/leads\/[A-Za-z0-9-]+(\/|$)/, config: { blocks: 1, lines: 3, dense: true } },
  // Leads list / archived etc.
  { pattern: /\/leads(\/|$)/, config: { blocks: 1, lines: 2 } },
  // Users main table
  { pattern: /\/users(\/|$)/, config: { blocks: 1, lines: 1 } },
  // Appointments section – show header + more lines
  { pattern: /\/appointments(\/|$)/, config: { blocks: 1, lines: 4, header: true } },
  // Notes (mostly textual) – no blocks, many dense lines
  { pattern: /\/notes(\/|$)/, config: { blocks: 0, lines: 5, dense: true, header: false } },
];

/**
 * Returns skeleton configuration based on pathname via RULES.
 */
export function getSkeletonConfig(pathname: string): ContentSkeletonProps {
  for (const rule of RULES) {
    if (rule.pattern.test(pathname)) return rule.config;
  }
  // Default fallback
  return { blocks: 1, lines: 2 };
}

/**
 * Expose rules for testing / future dynamic extension.
 */
export function __getSkeletonRules(): ReadonlyArray<SkeletonRule> { return RULES; }

// export function getSkeletonConfig(pathname: string): ContentSkeletonProps {
//   if (pathname.includes("/deals/kanban"))
//     return { blocks: 0, lines: 4, header: true };
//   if (pathname.includes("/deals")) return { blocks: 2, lines: 2 };
//   if (pathname.includes("/leads/")) return { blocks: 1, lines: 3, dense: true };
//   if (pathname.endsWith("/users")) return { blocks: 1, lines: 1 };
//   return { blocks: 1, lines: 2 };
// }
