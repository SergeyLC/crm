import {
  Prisma,
  Deal,
  DealStage,
  DealStatus,
} from "@/shared/generated/prisma";

type DealWithCreatorContact = Prisma.DealGetPayload<{
  include: {
    creator: true;
    contact: true;
    notes: true;
    assignee: true;
    appointments: true;
  };
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

export type Lead = Deal;
export type LeadExt = DealExt;

export type {
  DealWithCreatorContact,
  DealStage as LeadStage,
  DealStatus as LeadStatus,
};

export type LeadCardType = Omit<
  Lead,
  "creatorId" | "contactId" | "assigneeId" | "updatedAt"
>;

export type CreateLeadDTO = Omit<DealExt, "id" | "createdAt" | "updatedAt">;
export type UpdateLeadDTO = Partial<CreateLeadDTO>;
