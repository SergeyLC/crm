/// <reference types="jest" />
import { getSkeletonConfig, __getSkeletonRules } from '@/shared/lib/skeletonRouteConfig';
import type { ContentSkeletonProps } from '@/shared/ui/ContentSkeleton';

describe('getSkeletonConfig', () => {
  const cases: ReadonlyArray<[
    path: string,
    expected: ContentSkeletonProps
  ]> = [
    ['/de/deals/kanban', { blocks: 0, lines: 4, header: true }],
    ['/en/deals/kanban', { blocks: 0, lines: 4, header: true }],
  // ensure nested under kanban still picks kanban rule
  ['/de/deals/kanban/view', { blocks: 0, lines: 4, header: true }],
    ['/de/deals', { blocks: 2, lines: 2 }],
    ['/de/deals/won', { blocks: 2, lines: 2 }],
    ['/de/leads/123', { blocks: 1, lines: 3, dense: true }],
    ['/en/leads/abc', { blocks: 1, lines: 3, dense: true }],
    ['/de/leads', { blocks: 1, lines: 2 }],
  ['/de/leads/', { blocks: 1, lines: 2 }],
    ['/de/users', { blocks: 1, lines: 1 }],
    ['/de/appointments', { blocks: 1, lines: 4, header: true }],
    ['/en/appointments/list', { blocks: 1, lines: 4, header: true }],
  ['/en/appointments/123', { blocks: 1, lines: 4, header: true }],
    ['/de/notes', { blocks: 0, lines: 5, dense: true, header: false }],
  ['/de/notes/abc123', { blocks: 0, lines: 5, dense: true, header: false }],
    ['/de/unknown', { blocks: 1, lines: 2 }],
  ['/de/unknown/deep/path', { blocks: 1, lines: 2 }],
  ];

  test.each(cases)('path %s -> config', (path, expected) => {
    expect(getSkeletonConfig(path)).toEqual(expected);
  });

  it('prioritizes kanban rule over generic deals rule', () => {
    const cfg = getSkeletonConfig('/de/deals/kanban');
    expect(cfg).toEqual({ blocks: 0, lines: 4, header: true });
    expect(cfg).not.toEqual({ blocks: 2, lines: 2 }); // sanity
  });

  it('rules order & pattern sources stable', () => {
    const simplified = __getSkeletonRules().map(r => ({ pattern: r.pattern.source, config: r.config }));
    expect(simplified).toEqual([
      { pattern: '\\/(deals)\\/kanban(\\/|$)'.replace('(deals)','deals'), config: { blocks: 0, lines: 4, header: true } },
      { pattern: '\\/(deals)(\\/|$)'.replace('(deals)','deals'), config: { blocks: 2, lines: 2 } },
      { pattern: '\\/(leads)\\/[A-Za-z0-9-]+(\\/|$)'.replace('(leads)','leads'), config: { blocks: 1, lines: 3, dense: true } },
      { pattern: '\\/(leads)(\\/|$)'.replace('(leads)','leads'), config: { blocks: 1, lines: 2 } },
      { pattern: '\\/(users)(\\/|$)'.replace('(users)','users'), config: { blocks: 1, lines: 1 } },
      { pattern: '\\/(appointments)(\\/|$)'.replace('(appointments)','appointments'), config: { blocks: 1, lines: 4, header: true } },
      { pattern: '\\/(notes)(\\/|$)'.replace('(notes)','notes'), config: { blocks: 0, lines: 5, dense: true, header: false } },
    ]);
  });
});
