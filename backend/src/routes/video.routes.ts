import { Router } from 'express';
import { asyncHandler } from '../middleware/async.middleware';
import { requireRoles } from '../middleware/role.middleware';
import crypto from 'crypto';
import { Request, Response } from 'express';

const router = Router();

/**
 * POST /video/token
 * Generates a Jitsi JWT token for a secure video session.
 * Both PROFESSIONAL and CLIENT can request tokens.
 * The room is scoped to the appointmentId to prevent guessing.
 */
router.post(
  '/token',
  requireRoles('PROFESSIONAL', 'CLIENT'),
  asyncHandler(async (req: Request, res: Response) => {
    const { appointmentId } = req.body as { appointmentId?: string };
    const user = req.user!;

    const jitsiSecret = process.env.JITSI_APP_SECRET || process.env.VITE_JITSI_SECRET || '';
    const jitsiAppId = process.env.JITSI_APP_ID || 'viva360';
    const jitsiDomain = process.env.JITSI_DOMAIN || 'meet.jit.si';

    // Scoped room: appointmentId hash so the room name is unpredictable
    const rawRoom = appointmentId
      ? `viva360-${crypto.createHash('sha256').update(`${appointmentId}-viva360`).digest('hex').slice(0, 16)}`
      : `viva360-${crypto.randomBytes(8).toString('hex')}`;

    // If no JITSI_APP_SECRET is configured, fall back to a signed-URL-free public session
    // but with a hashed (unpredictable) room name for basic isolation.
    if (!jitsiSecret) {
      return res.json({
        token: null,
        roomName: rawRoom,
        domain: jitsiDomain,
        url: `https://${jitsiDomain}/${encodeURIComponent(rawRoom)}#config.prejoinPageEnabled=false&config.disableDeepLinking=true`,
        warning: 'JITSI_APP_SECRET not configured — using hashed room name without JWT auth.',
      });
    }

    // Build JWT payload (Jitsi JWT format)
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 3600; // 1 hour

    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        iss: jitsiAppId,
        sub: jitsiDomain,
        aud: jitsiAppId,
        iat: now,
        exp,
        room: rawRoom,
        context: {
          user: {
            id: String(user.userId),
            name: 'Participante',
            avatar: '',
            email: String(user.email || ''),
          },
          features: { recording: false, livestreaming: false },
        },
      })
    ).toString('base64url');

    const signature = crypto
      .createHmac('sha256', jitsiSecret)
      .update(`${header}.${payload}`)
      .digest('base64url');

    const token = `${header}.${payload}.${signature}`;
    const url = `https://${jitsiDomain}/${encodeURIComponent(rawRoom)}?jwt=${token}#config.prejoinPageEnabled=false&config.disableDeepLinking=true`;

    return res.json({ token, roomName: rawRoom, domain: jitsiDomain, url });
  })
);

export default router;
