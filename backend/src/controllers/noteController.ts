import { Request, Response } from "express";
import prisma from "../prisma/client";

export const getAllNotes = async (_req: Request, res: Response) => {
  const notes = await prisma.note.findMany({
    include: { creator: true, deal: true },
  });
  res.json(notes);
};

export const getNoteById = async (req: Request, res: Response) => {
  const note = await prisma.note.findUnique({
    where: { id: req.params.id },
    include: { creator: true, deal: true },
  });
  if (!note) return res.status(404).json({ error: "Note not found" });
  res.json(note);
};

export const createNote = async (req: Request, res: Response) => {
  const note = await prisma.note.create({ data: req.body });
  res.status(201).json(note);
};

export const updateNote = async (req: Request, res: Response) => {
  const note = await prisma.note.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(note);
};

export const deleteNote = async (req: Request, res: Response) => {
  await prisma.note.delete({ where: { id: req.params.id } });
  res.status(204).end();
};
