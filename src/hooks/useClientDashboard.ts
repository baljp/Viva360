import { useState, useCallback, useEffect } from 'react';
import { User, DailyRitualSnap, ViewState, Notification } from '../../types';
import { accountApi } from '../../services/api/accountClient';
import { communityApi } from '../../services/api/communityClient';
import { gardenService } from '../../services/gardenService';
import { useBuscadorFlow } from '../flow/useBuscadorFlow';
import type { CameraCaptureResult } from '../../components/Common/CameraWidget';
import { idbImages, buildLocalImageKey } from '../utils/idbImageStore';
import { buildReadFailureCopy, isDegradedReadError } from '../utils/readDegradedUX';
import { useAppToast } from '../contexts/AppToastContext';

export const useClientDashboard = (
    user: User, 
    updateUser: (u: User) => void,
    setView: (v: ViewState) => void
) => {
    type CheckInResult = {
        ok?: boolean;
        alreadyDone?: boolean;
        status?: string;
        code?: string;
        reward?: number;
        lastCheckIn?: string | null;
        user?: User;
    };
    type ApiErrorLike = {
        status?: number;
        code?: string;
        message?: string;
        details?: {
            code?: string;
            lastCheckIn?: string;
            user?: { lastCheckIn?: string };
        };
    };
    const { go } = useBuscadorFlow();
    const { toast, showToast, clearToast } = useAppToast();
    const setToast = useCallback((next: {title: string, message: string, type?: 'success' | 'error' | 'info' | 'warning'} | null) => {
        if (next) showToast(next);
        else clearToast();
    }, [showToast, clearToast]);
    const [ritualToast, setRitualToast] = useState<{title: string, message: string} | null>(null);
    const [activeModal, setActiveModal] = useState<'camera' | 'leaderboard' | null>(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notificationsReadIssue, setNotificationsReadIssue] = useState<{ title: string; message: string } | null>(null);

    // Real Notifications Fetch
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const loadNotifications = useCallback(async () => {
        try {
            const data = await communityApi.notifications.list({ strict: true });
            setNotifications(data || []);
            setNotificationsReadIssue(null);
        } catch (e) {
            console.error("Failed to load notifications", e);
            const copy = buildReadFailureCopy(
                [isDegradedReadError(e) ? 'notifications' : 'notifications'],
                false,
            );
            setNotificationsReadIssue(copy);
            setToast({ title: copy.title, message: copy.message, type: 'warning' });
        }
    }, []);

    useEffect(() => {
        loadNotifications();
    }, [user.id, loadNotifications]);

    const handleMarkAsRead = useCallback(async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        await communityApi.notifications.markAsRead(id);
    }, []);

    const handleMarkAllRead = useCallback(async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        await communityApi.notifications.markAllAsRead();
    }, [user.id]);

    const gardenStatus = gardenService.getPlantStatus(user);
    const plantVisuals = gardenService.getPlantVisuals(user.plantStage || 'seed', gardenStatus.status);

    const handleWaterPlant = useCallback(async () => {
        try {
            const reward = gardenService.calculateWateringReward(user);
            const updated = { 
                ...user, 
                lastWateredAt: new Date().toISOString(),
                plantXp: (user.plantXp || 0) + reward.xp,
                plantHealth: Math.min(100, (user.plantHealth || 0) + 10)
            };
            
            updateUser(updated);
            setRitualToast({ title: "Essência Nutrida", message: `+${reward.xp} PX. Seu jardim floresce.` });
            await accountApi.users.update(updated as User);
        } catch (e) {
            console.error("Water Plant Error", e);
            setToast({ title: "Erro na conexão", message: "Sua intenção foi registrada no éter." });
        }
    }, [user, updateUser]);

    const handleDailyCheckIn = useCallback(async (reward: number): Promise<{ ok: boolean; alreadyDone?: boolean }> => {
        try {
            const res = await accountApi.users.checkIn(user.id, reward) as CheckInResult;
            if (res?.alreadyDone || String(res?.status || '').toUpperCase() === 'ALREADY_DONE' || String(res?.code || '').toUpperCase() === 'CHECKIN_ALREADY_DONE') {
                const checkInAt = String(res?.lastCheckIn || res?.user?.lastCheckIn || '').trim();
                if (checkInAt) {
                    updateUser({ ...user, lastCheckIn: checkInAt });
                }
                setToast({ title: "Benção Já Recebida", message: "Você já sintonizou sua energia hoje.", type: 'info' });
                return { ok: true, alreadyDone: true };
            }

            if (res?.ok && res?.user) {
                updateUser(res.user as User);
                setRitualToast({ title: "Benção Recebida", message: `Sua jornada foi harmonizada com ${res.reward || reward} Karma.` });
                return { ok: true };
            }

            setToast({ title: "Não foi possível concluir", message: "Tente novamente em instantes.", type: 'warning' });
            return { ok: false };
        } catch (error) {
            const typedError = error as ApiErrorLike;
            const code = String(typedError?.code || typedError?.details?.code || '').toUpperCase();
            if (code === 'CHECKIN_ALREADY_DONE' || Number(typedError?.status) === 409) {
                const checkInAt = String(typedError?.details?.lastCheckIn || typedError?.details?.user?.lastCheckIn || '').trim();
                if (checkInAt) {
                    updateUser({ ...user, lastCheckIn: checkInAt });
                }
                setToast({ title: "Benção Já Recebida", message: "Você já sintonizou sua energia hoje.", type: 'info' });
                return { ok: true, alreadyDone: true };
            }
            console.error("[useClientDashboard] checkIn error:", error);
            const errMsg = typedError?.message || "Não conseguimos registrar sua benção agora.";
            setToast({ title: "Erro ao receber benção", message: errMsg, type: 'error' });
            return { ok: false };
        }
    }, [user, updateUser]);

    const handleCapture = useCallback(async (capture: CameraCaptureResult) => {
          const snapId = `dash_${Date.now()}`;
          const localKey = buildLocalImageKey(snapId);

          // Local high-quality storage (device only).
          try {
              await idbImages.put(localKey, capture.fullBlob);
          } catch (e) {
              console.warn('[useClientDashboard] idbImages.put failed', e);
          }

          const newSnap: DailyRitualSnap = {
              id: snapId,
              date: new Date().toISOString(),
              // Keep a light thumb for immediate UI; backend payload will be stripped to avoid data bloat.
              image: capture.thumbDataUrl,
              mood: 'SERENO', 
              note: 'Registro de Metamorfose'
          };
          const updatedUserLocal = { ...user, snaps: [newSnap, ...(user.snaps || [])] };
          updateUser(updatedUserLocal);
          setActiveModal(null);
          setRitualToast({ title: "Registro Salvo", message: "Sua memória foi cristalizada no Akasha." });

          // Persist without heavy image payload (images are local-only).
          const payloadUser: User = {
              ...updatedUserLocal,
              snaps: (updatedUserLocal.snaps || []).map((s) => ({ ...s, image: '' })),
          };
          const saved = await accountApi.users.update(payloadUser);
          updateUser({ ...(saved as User), snaps: updatedUserLocal.snaps });
    }, [user, updateUser]);

    return {
        state: {
            toast,
            ritualToast,
            activeModal,
            showNotifications,
            notifications,
            notificationsReadIssue,
            gardenStatus,
            plantVisuals
        },
        actions: {
            setToast,
            setRitualToast,
            setActiveModal,
            setShowNotifications,
            loadNotifications,
            handleMarkAsRead,
            handleMarkAllRead,
            handleWaterPlant,
            handleDailyCheckIn,
            handleCapture,
            go
        }
    };
};
