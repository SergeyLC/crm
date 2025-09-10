import {
  Prisma,
  Deal,
  DealStatus,
  DealStage,
} from "@/shared/generated/prisma";

type DealWithCreatorContact = Prisma.DealGetPayload<{
  include: { creator: true; contact: true; appointments: true; assignee: true };
}>;

type DealExt = Prisma.DealGetPayload<{
  include: {
    creator: true;
    contact: true;
    notes: true;
    assignee: true;
    appointments: true;
  };
}>;

export type { Deal, DealWithCreatorContact, DealExt, DealStatus, DealStage };

export type CreateDealDTO = Omit<DealExt, "id" | "createdAt" | "updatedAt">;
export type UpdateDealDTO = Partial<CreateDealDTO>;
