import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/error';
import prisma from '../config/database';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'viva360-default-key-32bytes!!';
const IV_LENGTH = 16;

// ==========================================
// ENCRYPTION UTILS (LGPD Compliance)
// ==========================================

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedText: string): string {
  try {
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return encryptedText; // Return original if decryption fails
  }
}

// ==========================================
// CONSENT LOGGING (LGPD Audit Trail)
// ==========================================

async function logConsent(
  userId: string,
  action: string,
  recordId?: string,
  targetId?: string,
  details?: string,
  req?: AuthRequest
) {
  return prisma.consentLog.create({
    data: {
      userId,
      recordId,
      action,
      targetId,
      details,
      ipAddress: req?.ip || req?.headers['x-forwarded-for'] as string || 'unknown',
      userAgent: req?.headers['user-agent'] || 'unknown',
    },
  });
}

// ==========================================
// HEALTH RECORD CONTROLLERS
// ==========================================

/**
 * Get all health records for the current user (patient view)
 */
export const getMyRecords = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { category, page = 1, limit = 20 } = req.query;

  const where: any = {
    patientId: userId,
    isDeleted: false,
  };

  if (category) {
    where.category = category as string;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [records, total] = await Promise.all([
    prisma.healthRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
      include: {
        professional: {
          select: { id: true, name: true, avatar: true },
        },
      },
    }),
    prisma.healthRecord.count({ where }),
  ]);

  // Decrypt content for viewing
  const decryptedRecords = records.map(record => ({
    ...record,
    content: record.isEncrypted ? decrypt(record.content) : record.content,
    sharedWith: JSON.parse(record.sharedWith),
  }));

  // Log access
  await logConsent(userId, 'VIEW', undefined, undefined, 'Viewed own records', req);

  res.json({
    data: decryptedRecords,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * Get records shared with me (professional view)
 */
export const getSharedWithMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { patientId, page = 1, limit = 20 } = req.query;

  const where: any = {
    isShared: true,
    isDeleted: false,
    OR: [
      { shareType: 'ALL_MY_PROS' },
      { sharedWith: { contains: userId } },
    ],
  };

  if (patientId) {
    where.patientId = patientId as string;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [records, total] = await Promise.all([
    prisma.healthRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
      include: {
        patient: {
          select: { id: true, name: true, avatar: true },
        },
      },
    }),
    prisma.healthRecord.count({ where }),
  ]);

  // Decrypt content
  const decryptedRecords = records.map(record => ({
    ...record,
    content: record.isEncrypted ? decrypt(record.content) : record.content,
  }));

  // Log access
  await logConsent(userId, 'VIEW', undefined, undefined, `Professional viewed shared records`, req);

  res.json({
    data: decryptedRecords,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * Create a new health record (by professional)
 */
export const createRecord = asyncHandler(async (req: AuthRequest, res: Response) => {
  const professionalId = req.user!.userId;
  const { patientId, title, content, category } = req.body;

  if (!patientId || !title || !content || !category) {
    throw new AppError('Todos os campos são obrigatórios', 400);
  }

  // Encrypt sensitive content
  const encryptedContent = encrypt(content);

  const record = await prisma.healthRecord.create({
    data: {
      patientId,
      professionalId,
      title,
      content: encryptedContent,
      category,
      isEncrypted: true,
    },
  });

  // Log creation
  await logConsent(professionalId, 'CREATE', record.id, patientId, `Created ${category} record`, req);

  res.status(201).json({
    ...record,
    content, // Return decrypted for immediate use
  });
});

/**
 * Update sharing settings for a record
 */
export const updateSharing = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;
  const { shareType, sharedWith, consentGiven, expiresAt } = req.body;

  // Verify ownership
  const record = await prisma.healthRecord.findFirst({
    where: { id: id as string, patientId: userId, isDeleted: false },
  });

  if (!record) {
    throw new AppError('Registro não encontrado ou não autorizado', 404);
  }

  // Require explicit consent for sharing
  if ((shareType !== 'NONE' || (sharedWith && sharedWith.length > 0)) && !consentGiven) {
    throw new AppError('É necessário dar consentimento explícito para compartilhar seus dados', 400);
  }

  const updated = await prisma.healthRecord.update({
    where: { id: id as string },
    data: {
      shareType: shareType || record.shareType,
      sharedWith: sharedWith ? JSON.stringify(sharedWith) : record.sharedWith,
      isShared: shareType !== 'NONE' || (sharedWith && sharedWith.length > 0),
      consentGiven: consentGiven || record.consentGiven,
      consentDate: consentGiven ? new Date() : record.consentDate,
      expiresAt: expiresAt ? new Date(expiresAt) : record.expiresAt,
    },
  });

  // Log consent action
  const action = shareType === 'NONE' ? 'REVOKE' : 'GRANT';
  await logConsent(
    userId,
    action,
    id as string,
    sharedWith?.join(','),
    `Updated sharing: ${shareType}`,
    req
  );

  res.json(updated);
});

/**
 * Revoke all access to a record
 */
export const revokeAccess = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const record = await prisma.healthRecord.findFirst({
    where: { id: id as string, patientId: userId, isDeleted: false },
  });

  if (!record) {
    throw new AppError('Registro não encontrado ou não autorizado', 404);
  }

  await prisma.healthRecord.update({
    where: { id: id as string },
    data: {
      isShared: false,
      shareType: 'NONE',
      sharedWith: '[]',
    },
  });

  await logConsent(userId, 'REVOKE', id as string, undefined, 'Revoked all access', req);

  res.json({ message: 'Acesso revogado com sucesso' });
});

/**
 * Revoke all access to ALL records
 */
export const revokeAllAccess = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;

  await prisma.healthRecord.updateMany({
    where: { patientId: userId },
    data: {
      isShared: false,
      shareType: 'NONE',
      sharedWith: '[]',
    },
  });

  await logConsent(userId, 'REVOKE', undefined, undefined, 'Revoked ALL record access', req);

  res.json({ message: 'Todos os acessos foram revogados' });
});

/**
 * Get access history (consent log)
 */
export const getAccessHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { recordId, page = 1, limit = 50 } = req.query;

  const where: any = { userId };
  if (recordId) where.recordId = recordId as string;

  const skip = (Number(page) - 1) * Number(limit);

  const [logs, total] = await Promise.all([
    prisma.consentLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.consentLog.count({ where }),
  ]);

  res.json({
    data: logs,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * Export all user data (LGPD portability)
 */
export const exportAllData = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;

  // Get all user data
  const [user, records, appointments, transactions, notifications] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        bio: true,
        phone: true,
        karma: true,
        createdAt: true,
      },
    }),
    prisma.healthRecord.findMany({
      where: { patientId: userId, isDeleted: false },
      select: {
        title: true,
        category: true,
        content: true,
        isEncrypted: true,
        createdAt: true,
      },
    }),
    prisma.appointment.findMany({
      where: { clientId: userId },
      select: {
        serviceName: true,
        date: true,
        time: true,
        status: true,
        price: true,
      },
    }),
    prisma.transaction.findMany({
      where: { userId },
      select: {
        description: true,
        amount: true,
        type: true,
        createdAt: true,
      },
    }),
    prisma.notification.findMany({
      where: { userId },
      select: {
        title: true,
        message: true,
        type: true,
        createdAt: true,
      },
    }),
  ]);

  // Decrypt health records
  const decryptedRecords = records.map(r => ({
    ...r,
    content: r.isEncrypted ? decrypt(r.content) : r.content,
  }));

  // Log export action
  await logConsent(userId, 'EXPORT', undefined, undefined, 'Exported all personal data', req);

  const exportData = {
    exportDate: new Date().toISOString(),
    user,
    healthRecords: decryptedRecords,
    appointments,
    transactions,
    notifications,
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="viva360-export-${userId}.json"`);
  res.json(exportData);
});

/**
 * Delete/anonymize user data (LGPD right to be forgotten)
 */
export const deleteMyData = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { confirmDelete } = req.body;

  if (confirmDelete !== 'CONFIRMAR_EXCLUSAO') {
    throw new AppError('É necessário confirmar a exclusão digitando CONFIRMAR_EXCLUSAO', 400);
  }

  // Soft delete and anonymize health records
  await prisma.healthRecord.updateMany({
    where: { patientId: userId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      anonymized: true,
      content: encrypt('DADOS ANONIMIZADOS'),
    },
  });

  // Log deletion
  await logConsent(userId, 'DELETE', undefined, undefined, 'User requested data deletion', req);

  // Anonymize user (keep for audit, remove PII)
  await prisma.user.update({
    where: { id: userId },
    data: {
      name: 'Usuário Removido',
      email: `deleted_${userId}@removed.viva360.com`,
      bio: null,
      phone: null,
      avatar: null,
      isActive: false,
    },
  });

  res.json({
    message: 'Seus dados foram anonimizados conforme LGPD. Sua conta foi desativada.',
  });
});
