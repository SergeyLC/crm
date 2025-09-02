"use client";
import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

export interface ContentSkeletonProps {
  lines?: number;          // how many text lines after header
  dense?: boolean;         // reduced spacing / sizes
  header?: boolean;        // show a big header skeleton
  blocks?: number;         // number of rectangular blocks
  children?: ReactNode;    // custom override (render prop style)
}

const SkeletonConfigContext = createContext<ContentSkeletonProps | null>(null);
export function useSkeletonConfig() {
  return useContext(SkeletonConfigContext);
}

export function SkeletonConfigProvider({ value, children }: { value: ContentSkeletonProps; children: ReactNode }) {
  return <SkeletonConfigContext.Provider value={value}>{children}</SkeletonConfigContext.Provider>;
}

export function ContentSkeleton(props: ContentSkeletonProps = {}) {
  const ctx = useSkeletonConfig();
  const { lines = 2, dense = false, header = true, blocks = 1 } = { ...ctx, ...props };

  const gap = dense ? 1 : 2;
  const headerHeight = dense ? 28 : 40;
  const rectHeight = dense ? 140 : 180;
  const blockGap = dense ? 1.5 : 2.5;

  const textLines = useMemo(() => Array.from({ length: lines }), [lines]);
  const rectBlocks = useMemo(() => Array.from({ length: blocks }), [blocks]);

  if (props.children) return <>{props.children}</>;

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap }} aria-label="Loading content">
      {header && <Skeleton variant="text" width={240} height={headerHeight} />}
      {rectBlocks.map((_, i) => (
        <Skeleton key={i} variant="rectangular" height={rectHeight} sx={{ mb: i === rectBlocks.length - 1 ? 0 : blockGap }} />
      ))}
      {textLines.map((_, i) => (
        <Skeleton key={i} variant="text" width={200 - i * 15} />
      ))}
    </Box>
  );
}

export default ContentSkeleton;
