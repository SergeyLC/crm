import {
  Prisma,
  Contact,
} from "@/shared/generated/prisma";


type ContactExt = Prisma.ContactGetPayload<{
  include: { deals: true; };
}>;

export type { Contact, ContactExt };

export type CreateContactDTO = Omit<ContactExt, "id" | "createdAt" | "updatedAt">;
export type UpdateContactDTO = Partial<CreateContactDTO>;
