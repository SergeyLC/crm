import { Request, Response } from 'express';
import prisma from '../prisma/client';

export const getAllGroups = async (_req: Request, res: Response) => {
  try {
    const groups = await prisma.group.findMany({
      include: {
        leader: true,
        members: {
          include: {
            user: true
          }
        }
      }
    });
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
};

export const getGroupById = async (req: Request, res: Response) => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: {
        leader: true,
        members: {
          include: {
            user: true
          }
        }
      }
    });
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(group);
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
};

export const createGroup = async (req: Request, res: Response) => {
  try {
    const { name, leaderId } = req.body;

    if (!name || !leaderId) {
      return res.status(400).json({ error: 'Name and leaderId are required' });
    }

    const group = await prisma.group.create({
      data: { name, leaderId },
      include: {
        leader: true,
        members: {
          include: {
            user: true
          }
        }
      }
    });

    res.status(201).json(group);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
};

export const updateGroup = async (req: Request, res: Response) => {
  try {
    const { name, leaderId } = req.body;

    const group = await prisma.group.update({
      where: { id: req.params.id },
      data: { name, leaderId },
      include: {
        leader: true,
        members: {
          include: {
            user: true
          }
        }
      }
    });

    res.json(group);
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ error: 'Failed to update group' });
  }
};

export const deleteGroup = async (req: Request, res: Response) => {
  try {
    await prisma.group.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
};

export const addUserToGroup = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'UserId is required' });
    }
    console.log(`Adding user ${userId} to group: ${groupId}`);
    const member = await prisma.groupMember.create({
      data: { groupId, userId },
      include: {
        user: true,
        group: true
      }
    });

    res.status(201).json(member);
  } catch (error) {
    console.error('Error adding user to group:', error);
    res.status(500).json({ error: 'Failed to add user to group' });
  }
};

export const removeUserFromGroup = async (req: Request, res: Response) => {
  try {
    const { groupId, userId } = req.params;

    await prisma.groupMember.deleteMany({
      where: { groupId, userId }
    });

    res.status(204).end();
  } catch (error) {
    console.error('Error removing user from group:', error);
    res.status(500).json({ error: 'Failed to remove user from group' });
  }
};

export const getGroupMembers = async (req: Request, res: Response) => {
  try {
    const members = await prisma.groupMember.findMany({
      where: { groupId: req.params.id },
      include: {
        user: true
      }
    });
    res.json(members);
  } catch (error) {
    console.error('Error fetching group members:', error);
    res.status(500).json({ error: 'Failed to fetch group members' });
  }
};

export const addMembersBatch = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const userIds: string[] = req.body;

    if (!Array.isArray(userIds)) {
      return res.status(400).json({ error: 'Expected an array of userIds' });
    }

    const results = await prisma.$transaction(async (tx) => {
      for (const userId of userIds) {
        if (!userId) continue;
        await tx.groupMember.create({ data: { groupId, userId } }).catch(() => {});
      }

      const members = await tx.groupMember.findMany({ where: { groupId }, include: { user: true } });
      return members;
    });

    res.status(200).json(results);
  } catch (error) {
    console.error('Error adding members batch:', error);
    res.status(500).json({ error: 'Failed to add members batch' });
  }
};

export const removeMembersBatch = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const userIds: string[] = req.body;

    if (!Array.isArray(userIds)) {
      return res.status(400).json({ error: 'Expected an array of userIds' });
    }

    const results = await prisma.$transaction(async (tx) => {
      await tx.groupMember.deleteMany({ where: { groupId, userId: { in: userIds } } });
      const members = await tx.groupMember.findMany({ where: { groupId }, include: { user: true } });
      return members;
    });

    res.status(200).json(results);
  } catch (error) {
    console.error('Error removing members batch:', error);
    res.status(500).json({ error: 'Failed to remove members batch' });
  }
};

export const replaceMembersBatch = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const newUserIds: string[] = req.body;

    if (!Array.isArray(newUserIds)) {
      return res.status(400).json({ error: 'Expected an array of userIds' });
    }

    const results = await prisma.$transaction(async (tx) => {
      // Fetch current members
      const current = await tx.groupMember.findMany({ where: { groupId } });
      const currentIds = current.map((m) => m.userId);

      const toAdd = newUserIds.filter((id) => !currentIds.includes(id));
      const toRemove = currentIds.filter((id) => !newUserIds.includes(id));

      if (toRemove.length > 0) {
        await tx.groupMember.deleteMany({ where: { groupId, userId: { in: toRemove } } });
      }

      for (const userId of toAdd) {
        if (!userId) continue;
        await tx.groupMember.create({ data: { groupId, userId } }).catch(() => {});
      }

      const members = await tx.groupMember.findMany({ where: { groupId }, include: { user: true } });
      return members;
    });

    res.status(200).json(results);
  } catch (error) {
    console.error('Error replacing members batch:', error);
    res.status(500).json({ error: 'Failed to replace members batch' });
  }
};
