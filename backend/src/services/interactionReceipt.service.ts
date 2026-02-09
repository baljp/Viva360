import prisma from '../lib/prisma';
import { randomUUID } from 'crypto';

export type ReceiptStatus = 'CREATED' | 'UPDATED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED' | 'FAILED';

type UpsertActionReceiptInput = {
  entityType: string;
  entityId: string;
  action: string;
  actorId: string;
  status: ReceiptStatus;
  nextStep?: string | null;
  requestId?: string | null;
  payload?: unknown;
};

const normalize = (value: string) => String(value || '').trim().toUpperCase();

export class InteractionReceiptService {
  async upsert(input: UpsertActionReceiptInput) {
    const entityType = normalize(input.entityType);
    const action = normalize(input.action);
    const status = normalize(input.status) as ReceiptStatus;

    let record: any;
    try {
      record = await prisma.interactionReceipt.upsert({
        where: {
          entity_type_entity_id_action_actor_id: {
            entity_type: entityType,
            entity_id: String(input.entityId),
            action,
            actor_id: String(input.actorId),
          },
        },
        create: {
          entity_type: entityType,
          entity_id: String(input.entityId),
          action,
          actor_id: String(input.actorId),
          status,
          next_step: input.nextStep || null,
          request_id: input.requestId || null,
          payload: (input.payload as any) || undefined,
        },
        update: {
          status,
          next_step: input.nextStep || null,
          request_id: input.requestId || null,
          payload: (input.payload as any) || undefined,
        },
        select: {
          id: true,
          entity_type: true,
          entity_id: true,
          action: true,
          actor_id: true,
          status: true,
          next_step: true,
          request_id: true,
          created_at: true,
          updated_at: true,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2021' || error?.code === 'P2022') {
        const now = new Date();
        return {
          id: randomUUID(),
          entityType,
          entityId: String(input.entityId),
          action,
          actorId: String(input.actorId),
          status,
          nextStep: input.nextStep || null,
          requestId: input.requestId || null,
          createdAt: now,
          updatedAt: now,
        };
      }
      throw error;
    }

    return {
      id: record.id,
      entityType: record.entity_type,
      entityId: record.entity_id,
      action: record.action,
      actorId: record.actor_id,
      status: record.status,
      nextStep: record.next_step,
      requestId: record.request_id,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }
}

export const interactionReceiptService = new InteractionReceiptService();
