import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TribeService } from './tribe.service';
import { tribeRepository } from '../repositories/tribe.repository';
import * as SupabaseService from './supabase.service';

// Mock dependencies
vi.mock('../repositories/tribe.repository');
vi.mock('./supabase.service');

describe('TribeService', () => {
    let service: TribeService;

    beforeEach(() => {
        service = new TribeService();
        vi.resetAllMocks();
    });

    describe('inviteMember', () => {
        it('should create an invite when requester is a SPACE (Mock Mode)', async () => {
            // Setup
            vi.spyOn(SupabaseService, 'isMockMode').mockReturnValue(true);

            // Execute
            const result = await service.inviteMember('space-123', 'pro@test.com');

            // Verify
            expect(result).toEqual({
                id: 'mock-invite-id',
                hub_id: 'space-123',
                email: 'pro@test.com',
                token: 'mock-invite-token',
                status: 'pending'
            });
        });

        it('should throw error if requester is not a SPACE (Real Mode)', async () => {
             // Setup
             vi.spyOn(SupabaseService, 'isMockMode').mockReturnValue(false);
             vi.mocked(tribeRepository.findProfile).mockResolvedValue({ id: 'pro-1', role: 'PROFESSIONAL' } as any);

             // Execute & Verify
             await expect(service.inviteMember('pro-1', 'new@test.com'))
                .rejects
                .toThrow('Only Sanctuaries can invite team members');
        });

        it('should create invite successfully if requester is SPACE (Real Mode)', async () => {
            // Setup
            vi.spyOn(SupabaseService, 'isMockMode').mockReturnValue(false);
            vi.mocked(tribeRepository.findProfile).mockResolvedValue({ id: 'space-1', role: 'SPACE' } as any);
            vi.mocked(tribeRepository.createInvite).mockResolvedValue({ 
                id: 'inv-1', 
                hub_id: 'space-1', 
                email: 'new@test.com', 
                token: 'abc', 
                status: 'pending' 
            } as any);

            // Execute
            const result = await service.inviteMember('space-1', 'new@test.com');

            // Verify
            expect(tribeRepository.createInvite).toHaveBeenCalledWith(expect.objectContaining({
                hub_id: 'space-1',
                email: 'new@test.com'
            }));
            expect(result.id).toBe('inv-1');
        });
    });
});
