import React from 'react';
import Container from '@mui/material/Container';
import { KanbanBoard } from '@/features/kanban/KanbanBoard';
import Box from '@mui/material/Box';
import { DealViewSwitcher } from '@/entities/deal/DealViewSwitcher';

export default async function KanbanDealsPage() {
  return (
    <Container maxWidth={false} component="main" disableGutters sx={{p:2,display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      <Box sx={{ p:0, flexShrink:0 }}>
        <DealViewSwitcher title="Deals kanban board" />
      </Box>
      <Box sx={{display:'flex',flexGrow:1,mt:2,overflow:'hidden',position:'relative'}}>
        <KanbanBoard gap={3} padding={0} />
      </Box>
    </Container>
  );
}
