import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../prisma/client';

const SAFE_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const getAllUsers = async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({ select: SAFE_USER_SELECT });
  res.json(users);
};

export const getUserById = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: SAFE_USER_SELECT,
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { password, ...userData } = req.body;
    
    if (!password || password.trim() === '') {
      return res.status(400).json({ error: 'Password is required' });
    }
    
    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const user = await prisma.user.create({ 
      data: { 
        ...userData, 
        password: hashedPassword 
      },
      select: SAFE_USER_SELECT,
    });
    
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { password, ...userData } = req.body;
    
    // Prepare update data - exclude password if it's not provided or empty
    const updateData: Record<string, unknown> = { ...userData };
    
    // Only include password in update if it's provided and not empty
    if (password && password.trim() !== '') {
      // Hash the password before saving
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }
    
    const user = await prisma.user.update({ 
      where: { id: req.params.id }, 
      data: updateData,
      select: SAFE_USER_SELECT,
    });
    
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  res.status(204).end();
};

// Update user status
export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status value
    const validStatuses = ['ACTIVE', 'INACTIVE', 'BLOCKED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be one of: ACTIVE, INACTIVE, BLOCKED' 
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { status },
      select: SAFE_USER_SELECT,
    });

    res.json(user);
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};

// Block user (set status to BLOCKED)
export const blockUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id },
      data: { status: 'BLOCKED' },
      select: SAFE_USER_SELECT,
    });

    res.json(user);
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
};

// Unblock user (set status to ACTIVE)
export const unblockUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' },
      select: SAFE_USER_SELECT,
    });

    res.json(user);
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
};
