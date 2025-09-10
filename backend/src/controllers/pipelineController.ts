import { Request, Response } from 'express';

import prisma from "../prisma/client";

// Alle Pipelines abrufen (nur Admin)
export const getAllPipelines = async (req: Request, res: Response) => {
  // console.log("getAllPipelines user:", req.user);
  // if (req.user?.role !== 'ADMIN') {
  //   return res.status(403).json({ error: 'Nicht autorisiert' });
  // }
  
  const pipelines = await prisma.pipeline.findMany();
  return res.json(pipelines);
};

// Pipeline erstellen (nur Admin)
export const createPipeline = async (req: Request, res: Response) => {
  // if (req.user?.role !== 'ADMIN') {
  //   return res.status(403).json({ error: 'Nicht autorisiert' });
  // }
  
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name ist erforderlich' });
  }
  
  const pipeline = await prisma.pipeline.create({
    data: {
      name,
      description
    }
  });
  
  return res.status(201).json(pipeline);
};

// Pipeline Details abrufen
export const getPipeline = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const pipeline = await prisma.pipeline.findUnique({
    where: { id },
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
  
  if (!pipeline) {
    return res.status(404).json({ error: 'Pipeline nicht gefunden' });
  }
  
  // Zugriffskontrolle: Admin oder zugewiesener Benutzer
    // const hasDirectAccess = pipeline.users.some(pu => pu.id === req.user?.id);

    // // Prüfen, ob Benutzer über eine Gruppe Zugriff hat
    // const hasGroupAccess = await prisma.pipelineGroup.findFirst({
    //   where: {
    //     pipelineId: id,
    //     group: {
    //       members: {
    //         some: {
    //           userId: req.user?.id
    //         }
    //       }
    //     }
    //   }
    // });
    
    // if (!hasDirectAccess && !hasGroupAccess) {
    //   return res.status(403).json({ error: 'Nicht autorisiert' });
    // }
  
  return res.json(pipeline);
};

// Pipeline aktualisieren (nur Admin)
export const updatePipeline = async (req: Request, res: Response) => {
  // if (req.user?.role !== 'ADMIN') {
  //   return res.status(403).json({ error: 'Nicht autorisiert' });
  // }
  
  const { id } = req.params;
  const { name, description } = req.body;
  
  const pipeline = await prisma.pipeline.update({
    where: { id },
    data: {
      name,
      description
    }
  });
  
  return res.json(pipeline);
};

// Pipeline löschen (nur Admin)
export const deletePipeline = async (req: Request, res: Response) => {
  // if (req.user?.role !== 'ADMIN') {
  //   return res.status(403).json({ error: 'Nicht autorisiert' });
  // }
  
  const { id } = req.params;
  
  await prisma.pipelineUser.deleteMany({
    where: { pipelineId: id }
  });
  
  await prisma.pipelineGroup.deleteMany({
    where: { pipelineId: id }
  });
  
  await prisma.pipeline.delete({
    where: { id }
  });
  
  return res.status(204).send();
};