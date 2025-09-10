import { Request, Response } from 'express';

import prisma from "../prisma/client";

// Pipelines des angemeldeten Benutzers abrufen
export const getUserPipelines = async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(401).json({ error: 'Nicht authentifiziert' });
  }
  
  try {
    // Pipelines finden, wo der Benutzer direkt zugewiesen ist
    const directPipelines = await prisma.pipeline.findMany({
      where: {
        users: {
          some: {
            userId
          }
        }
      },
      include: {
        users: {
          include: {
            user: true
          }
        },
        groups: {
          include: {
            group: true
          }
        }
      }
    });
    
    // Pipelines finden, wo der Benutzer über eine Gruppe zugewiesen ist
    const groupMembers = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true },
    });

    const groupIds = groupMembers.map(gm => gm.groupId);

    const groupPipelines = await prisma.pipeline.findMany({
      where: {
        groups: {
          some: {
            groupId: {
              in: groupIds
            }
          }
        }
      },
      include: {
        users: {
          include: {
            user: true
          }
        },
        groups: {
          include: {
            group: true
          }
        }
      }
    });
    
    // Duplikate entfernen
    const pipelineMap = new Map();
    [...directPipelines, ...groupPipelines].forEach(pipeline => {
      pipelineMap.set(pipeline.id, pipeline);
    });
    
    const pipelines = Array.from(pipelineMap.values());
    
    return res.json(pipelines);
  } catch (error) {
    console.error('Fehler beim Abrufen der Pipelines für Benutzer:', error);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
};