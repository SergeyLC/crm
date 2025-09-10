import {
  Prisma,
  Note,
} from "@/shared/generated/prisma";


type NoteExt = Prisma.NoteGetPayload<{
  include: { creator: true, deal: true; };
}>;

export type { Note, NoteExt };

export type CreateNoteDTO = Omit<NoteExt, "id" | "createdAt" | "updatedAt">;
export type UpdateNoteDTO = Partial<CreateNoteDTO>;
