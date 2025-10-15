import { Request, Response } from "express";
import prisma from "../prisma/client";
import { Note, Appointment } from "@/generated/prisma";

import type { DealStage, DealStatus } from "@/generated/prisma";

export const shouldAllLinkedDatelsIncluded = {
  contact: true,
  creator: true,
  notes: true,
  assignee: true,
  appointments: true,
};

// export const getAllLeadsBase = async (
//   _req: Request,
//   res: Response,
//   stages?: DealStage[],
//   statuses?: DealStatus[]
// ) => {
//   const leads = await prisma.deal.findMany({
//     where: {
//       stage: stages ? { in: stages } : undefined,
//       status: statuses ? { in: statuses } : undefined,
//     },
//     include: shouldAllLinkedDatelsIncluded,
//   });
//   res.json(leads);
// };

export type DealsBaseParams = {
  excludeStatuses?: DealStatus[] | string[];
  excludeStages?: DealStage[] | string[];
  statuses?: DealStatus[] | string;
  stages?: DealStage[] | string;
};

export const getDealsParamsFromRequest = (_req: Request, defaultParams: DealsBaseParams) => {
  const { excludeStatuses, excludeStages, statuses, stages } =
    _req.query as DealsBaseParams;

  // If explicit parameters are provided, don't use conflicting defaults
  const hasExplicitStatuses = statuses !== undefined;
  const hasExplicitStages = stages !== undefined;
  const hasExplicitExcludeStatuses = excludeStatuses !== undefined;
  const hasExplicitExcludeStages = excludeStages !== undefined;

  return {
    excludeStatuses: hasExplicitExcludeStatuses ? excludeStatuses : defaultParams.excludeStatuses,
    excludeStages: hasExplicitExcludeStages ? excludeStages : defaultParams.excludeStages,
    statuses: hasExplicitStatuses ? statuses : defaultParams.statuses,
    stages: hasExplicitStages ? stages : defaultParams.stages,
  };
};

export const prepareParams = async ({
  excludeStatuses,
  excludeStages,
  statuses,
  stages,
}: DealsBaseParams) => {
  const finalStatuses: DealStatus[] | undefined = statuses
    ? (Array.isArray(statuses)
        ? statuses
        : (statuses as string).split(",")
      ).map((s) => s as DealStatus)
    : undefined;

  const finalStages: DealStage[] | undefined = stages
    ? (Array.isArray(stages) ? stages : (stages as string).split(",")).map(
        (s) => s as DealStage
      )
    : undefined;

  // Process excludeStatuses and excludeStages to arrays
  const finalExcludeStatuses: DealStatus[] | undefined = excludeStatuses
    ? (Array.isArray(excludeStatuses)
        ? excludeStatuses
        : (excludeStatuses as string).split(",")
      ).map((s) => s as DealStatus)
    : undefined;

  const finalExcludeStages: DealStage[] | undefined = excludeStages
    ? (Array.isArray(excludeStages)
        ? excludeStages
        : (excludeStages as string).split(",")
      ).map((s) => s as DealStage)
    : undefined;

  const filteredStatuses = finalStatuses
    ? finalExcludeStatuses ? finalStatuses.filter(
        (s) => !finalExcludeStatuses.includes(s)
      ) : finalStatuses
    : undefined;

  const filteredStages: DealStage[] | undefined = finalStages
    ? finalExcludeStages ? finalStages.filter(
        (s) => !finalExcludeStages.includes(s)
      ) : finalStages
    : undefined;

  return { statuses: filteredStatuses, stages: filteredStages };
};

export const getAllDealsBase = async (params: DealsBaseParams) => {
  const { statuses, stages } = await prepareParams(params);

  return prisma.deal.findMany({
    where: {
      status: statuses ? { in: statuses } : undefined,
      stage: stages ? { in: stages } : undefined,
    },
    include: shouldAllLinkedDatelsIncluded,
  });
};

export const getAllDeals = async (_req: Request, res: Response) => {
  const defaultParams = {
    excludeStatuses: ["ARCHIVED"],
    excludeStages: ["LEAD", "WON", "LOST"],
    statuses: ["ACTIVE", "ARCHIVED"],
    stages: [
      "CONTACTED",
      "QUALIFIED",
      "PROPOSAL_SENT",
      "NEGOTIATION",
      "DEMO_SCHEDULED",
    ],
  } as DealsBaseParams;

  const params = getDealsParamsFromRequest(_req, defaultParams);
  const deals = await getAllDealsBase(params);

  res.json(deals);
};

export const getArchivedDeals = async (_req: Request, res: Response) => {
  const defaultParams = {
    excludeStages: ["LEAD", "WON", "LOST"],
    statuses: ["ARCHIVED"],
  } as DealsBaseParams;

  const params = getDealsParamsFromRequest(_req, defaultParams);
  const deals = await getAllDealsBase(params);

  res.json(deals);
};

export const getWonDeals = async (_req: Request, res: Response) => {
  const defaultParams = {
    stages: ["WON"],
    // excludeStatuses: ["ARCHIVED"],
  } as DealsBaseParams;

  const params = getDealsParamsFromRequest(_req, defaultParams);
  const deals = await getAllDealsBase(params);

  res.json(deals);
};

export const getLostDeals = async (_req: Request, res: Response) => {
  const defaultParams = {
    stages: ["LOST"],
    // excludeStatuses: ["ARCHIVED"],
  } as DealsBaseParams;

  const params = getDealsParamsFromRequest(_req, defaultParams);
  const deals = await getAllDealsBase(params);

  res.json(deals);
};

export const getActiveDeals = async (_req: Request, res: Response) => {
  const defaultParams = {
    statuses: ["ACTIVE"],
    excludeStages: ["LEAD", "WON", "LOST"],
  } as DealsBaseParams;

  const params = getDealsParamsFromRequest(_req, defaultParams);
  const deals = await getAllDealsBase(params);

  res.json(deals);
};


export const getDealByIdBase = async (id: string) =>
  await prisma.deal.findUnique({
    where: { id },
    include: shouldAllLinkedDatelsIncluded,
  });

export const getDealById = async (req: Request, res: Response) => {
  const deal = await getDealByIdBase(req.params.id);
  if (!deal) return res.status(404).json({ error: "Deal not found" });
  res.json(deal);
};

export const createDealBase = async (
  req: Request,
  res: Response,
  stage: DealStage = "QUALIFIED"
) => {
  const { creator, contact, notes, appointments, assigneeId, ...dealData } =
    req.body;

  console.log("Creating deal with data:", req.body, " stage:", stage);

  const creatorEmail = creator?.email || "hans.schmidt@example.com";
  const deal = await prisma.deal.create({
    data: {
      ...dealData,
      stage,
      creator: { connect: { email: creatorEmail } },

      contact: contact
        ? contact.id
          ? { connnect: contact.id }
          : { create: contact }
        : undefined,

      notes: notes && notes.length > 0 ? { create: notes } : undefined,

      appointments:
        appointments && appointments.length
          ? { create: appointments }
          : undefined,

      assignee: assigneeId
        ? {
            connect: { id: assigneeId },
          }
        : undefined,
    },
    include: shouldAllLinkedDatelsIncluded,
  });

  res.status(201).json(deal);
};

export const createDeal = async (req: Request, res: Response) =>
  await createDealBase(req, res, "QUALIFIED");

export const updateDeal = async (req: Request, res: Response) => {
  const {
    id: _id, // Exclude id from dealData (not used)
    assigneeId,
    contact,
    creator, // Extract creator to handle separately
    notes = [],
    appointments = [],
    createdAt: _createdAt, // Exclude timestamps (auto-generated)
    updatedAt: _updatedAt, // Exclude timestamps (auto-generated)
    archivedAt: _archivedAt, // Exclude timestamps (auto-generated)
    ...dealData
  } = req.body;
  console.log("Updating deal assigneeId:", assigneeId);
  console.log("Updating deal with id:", req.params.id, " data:", dealData);

  // Split notes into update and create
  const notesToUpdate = notes
    .filter((note: Note) => note.id)
    .map((note: Note) => ({
      ...note,
      creatorId: undefined, // CreatorId is not updated, only the content
      dealId: undefined, // dealId is not uodated, only the content
    }));
  const notesToCreate = notes.filter((note: Note) => !note.id);

  // Split appointments into update and create
  const appointmentsToUpdate = appointments
    .filter((app: Appointment) => app.id && app.dealId !== "REMOVED")
    .map((app: Appointment) => ({
      ...app,
      dealId: undefined, // dealId is not updated, only the content
    }));
  const appointmentsToCreate = appointments
    .filter((app: Appointment) => !app.id)
    .map((app: Appointment) => ({
      ...app,
      dealId: undefined,
    }));

  const appointmentsToDelete = appointments
    .filter(
      (app: Appointment) =>
        app.id && /*app.dealId && */ !app.datetime && !app.note && !app.type
    )
    .map((app: Appointment) => ({
      ...app,
      dealId: undefined, // dealId is not updated, only the content
    }));

  // Form a nested object for notes
  const notesNested = {
    update: notesToUpdate.map((note: any) => {
      const { id: _noteId, ...noteData } = note;
      return {
        where: { id: _noteId },
        data: noteData,
      };
    }),
    create: notesToCreate,
  };

  // Form a nested object for appointments
  const appointmentsNested = {
    update: appointmentsToUpdate.map((app: any) => {
      const { id: _appId, ...appData } = app;
      return {
        where: { id: _appId },
        data: appData,
      };
    }),
    create: appointmentsToCreate,
    delete: appointmentsToDelete,
  };

  const deal = await prisma.deal.update({
    where: {
      id: req.params.id,
    },
    data: {
      ...dealData,

      creator: creator?.id
        ? {
            connect: { id: creator.id },
          }
        : creator === null
        ? {
            disconnect: true,
          }
        : undefined,

      contact: contact?.id
        ? {
            update: {
              where: { id: contact.id },
              data: (() => {
                const { id: _contactId, ...contactData } = contact;
                return contactData;
              })(),
            },
          }
        : contact
        ? { create: contact }
        : undefined,

      assignee: assigneeId
        ? {
            connect: { id: assigneeId },
          }
        : undefined,

      notes: notes.length > 0 ? notesNested : undefined,
      appointments: appointments.length > 0 ? appointmentsNested : undefined,
    },
    include: shouldAllLinkedDatelsIncluded,
  });

  res.json(deal);
};

export const deleteDeal = async (req: Request, res: Response) => {
  const dealId = req.params.id;
  await prisma.$transaction([
    prisma.note.deleteMany({ where: { dealId } }),
    prisma.appointment.deleteMany({ where: { dealId } }),
    prisma.deal.delete({ where: { id: dealId } }),
  ]);
  res.status(204).end();
};
