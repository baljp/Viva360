import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import crypto from 'crypto';

export const inviteMember = async (req: Request, res: Response) => {
  const hubId = (req as any).user?.userId;
  const { email } = req.body;

  // Verify if requester is SPACE (Sanctuary)
  const hub = await prisma.profile.findUnique({ where: { id: hubId } });
  if (hub?.role !== 'SPACE') {
    return res.status(403).json({ error: 'Only Sanctuaries can invite team members' });
  }

  const token = crypto.randomBytes(16).toString('hex');

  const invite = await prisma.tribeInvite.create({
    data: {
      hub_id: hubId,
      email,
      token,
      status: 'pending'
    }
  });

  // Mock Email Send
  console.log(`[EMAIL] Invite sent to ${email} with token ${token}`);

  return res.json(invite);
};

export const listInvites = async (req: Request, res: Response) => {
  const hubId = (req as any).user?.userId;
  const invites = await prisma.tribeInvite.findMany({ where: { hub_id: hubId } });
  return res.json(invites);
};
