import { Request, Response } from 'express';
import prisma from "../prisma/client";

// Benutzer einer Pipeline zuweisen (nur Admin)
export const assignUsersToPipeline = async (req: Request, res: Response) => {
  // if (req.user?.role !== 'ADMIN') {
  //   return res.status(403).json({ error: 'Nicht autorisiert' });
  // }
  
  const { id } = req.params;
  const { userIds } = req.body;
  
  if (!Array.isArray(userIds)) {
    return res.status(400).json({ error: 'userIds muss ein Array sein' });
  }
  
  // Pipeline existiert?
  const pipeline = await prisma.pipeline.findUnique({ where: { id } });
  if (!pipeline) {
    return res.status(404).json({ error: 'Pipeline nicht gefunden' });
  }
  
  // PipelineUser-Einträge erstellen
  const results = await Promise.all(userIds.map(userId => 
    prisma.pipelineUser.upsert({
      where: {
        pipelineId_userId: {
          pipelineId: id,
          userId
        }
      },
      update: {},
      create: {
        pipelineId: id,
        userId
      }
    })
  ));
  
  return res.status(200).json(results);
};

// Benutzer von Pipeline entfernen (nur Admin)
export const removeUserFromPipeline = async (req: Request, res: Response) => {
  // if (req.user?.role !== 'ADMIN') {
  //   return res.status(403).json({ error: 'Nicht autorisiert' });
  // }
  
  const { id, userId } = req.params;
  
  await prisma.pipelineUser.delete({
    where: {
      pipelineId_userId: {
        pipelineId: id,
        userId
      }
    }
  });
  
  return res.status(204).send();
};

// Gruppen einer Pipeline zuweisen (nur Admin)
export const assignGroupsToPipeline = async (req: Request, res: Response) => {
  // if (req.user?.role !== 'ADMIN') {
  //   return res.status(403).json({ error: 'Nicht autorisiert' });
  // }
  
  const { id } = req.params;
  const { groupIds } = req.body;
  
  if (!Array.isArray(groupIds)) {
    return res.status(400).json({ error: 'groupIds muss ein Array sein' });
  }
  
  // Pipeline existiert?
  const pipeline = await prisma.pipeline.findUnique({ where: { id } });
  if (!pipeline) {
    return res.status(404).json({ error: 'Pipeline nicht gefunden' });
  }
  
  // PipelineGroup-Einträge erstellen
  const results = await Promise.all(groupIds.map(groupId => 
    prisma.pipelineGroup.upsert({
      where: {
        pipelineId_groupId: {
          pipelineId: id,
          groupId
        }
      },
      update: {},
      create: {
        pipelineId: id,
        groupId
      }
    })
  ));
  
  return res.status(200).json(results);
};

// Gruppe von Pipeline entfernen (nur Admin)
export const removeGroupFromPipeline = async (req: Request, res: Response) => {
  
  console.log("removeGroupFromPipeline called with params:", req.params);
  const { id, groupId } = req.params;
  
  await prisma.pipelineGroup.delete({
    where: {
      pipelineId_groupId: {
        pipelineId: id,
        groupId
      }
    }
  });
  
  return res.status(204).send();
};

/**
 * Entfernt mehrere Benutzer aus einer Pipeline
 * @route POST /api/pipelines/:id/users/remove
 * @param {Request} req - Express Request mit Pipeline-ID im URL-Parameter und userIds-Array im Request-Body
 * @param {Response} res - Express Response
 */
export const removeUsersFromPipeline = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'userIds muss ein nicht-leeres Array sein' });
    }

    // Überprüfen, ob die Pipeline existiert
    const pipeline = await prisma.pipeline.findUnique({
      where: { id }
    });

    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline nicht gefunden' });
    }

    // Berechtigungsprüfung
    // Hier können Sie prüfen, ob der aktuelle Benutzer berechtigt ist, 
    // Benutzer aus dieser Pipeline zu entfernen

    // Entfernen der Benutzer
    const deleteOperations = userIds.map(userId =>
      prisma.pipelineUser.deleteMany({
        where: {
          pipelineId: id,
          userId
        }
      })
    );

    // Alle Löschoperationen gleichzeitig ausführen
    await prisma.$transaction(deleteOperations);

    res.status(200).json({ message: `${userIds.length} Benutzer wurden aus der Pipeline entfernt` });
  } catch (error) {
    console.error('Fehler beim Entfernen der Benutzer aus der Pipeline:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

/**
 * Entfernt mehrere Gruppen von einer Pipeline
 * @route POST /api/pipelines/:id/groups/remove
 * @param {Request} req - Express Request mit Pipeline-ID im URL-Parameter und groupIds-Array im Request-Body
 * @param {Response} res - Express Response
 */
export const removeGroupsFromPipeline = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { groupIds } = req.body;

    if (!Array.isArray(groupIds) || groupIds.length === 0) {
      return res.status(400).json({ error: 'groupIds muss ein nicht-leeres Array sein' });
    }

    // Überprüfen, ob die Pipeline existiert
    const pipeline = await prisma.pipeline.findUnique({
      where: { id }
    });

    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline nicht gefunden' });
    }

    // Entfernen der Gruppen
    const deleteOperations = groupIds.map(groupId =>
      prisma.pipelineGroup.deleteMany({
        where: {
          pipelineId: id,
          groupId
        }
      })
    );

    // Alle Löschoperationen gleichzeitig ausführen
    await prisma.$transaction(deleteOperations);

    res.status(200).json({ message: `${groupIds.length} Gruppen wurden aus der Pipeline entfernt` });
  } catch (error) {
    console.error('Fehler beim Entfernen der Gruppen aus der Pipeline:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};