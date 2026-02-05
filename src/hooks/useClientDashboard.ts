import { useState, useCallback, useEffect } from 'react';
import { User, DailyRitualSnap, ViewState } from '../../types';
import { api } from '../../services/api';
import { gardenService } from '../../services/gardenService';
import { useBuscadorFlow } from '../flow/BuscadorFlowContext';

export const useClientDashboard = (
    user: User, 
    updateUser: (u: User) => void,
    setView: (v: ViewState) => void
) => {
    const { go } = useBuscadorFlow();
    const [toast, setToast] = useState<{title: string, message: string, type?: 'success' | 'error' | 'info' | 'warning'} | null>(null);
    const [ritualToast, setRitualToast] = useState<{title: string, message: string} | null>(null);
    const [activeModal, setActiveModal] = useState<'camera' | 'invite' | 'leaderboard' | null>(null);
    const [inviteEmail, setInviteEmail] = useState("");
    const [showNotifications, setShowNotifications] = useState(false);

    // Real Notifications Fetch
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        const loadNotifications = async () => {
            try {
                const data = await api.notifications.list(user.id);
                setNotifications(data || []);
            } catch (e) {
                console.error("Failed to load notifications", e);
            }
        };
        loadNotifications();
    }, [user.id]);

    const handleMarkAsRead = useCallback(async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        await api.notifications.markAsRead(id);
    }, []);

    const handleMarkAllRead = useCallback(async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        await api.notifications.markAllAsRead(user.id);
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
            await api.users.update(updated as User);
        } catch (e) {
            console.error("Water Plant Error", e);
            setToast({ title: "Erro na conexão", message: "Sua intenção foi registrada no éter." });
        }
    }, [user, updateUser]);

    const handleDailyCheckIn = useCallback(async (reward: number) => {
          const res = await api.users.checkIn(user.id, reward);
          if (res && res.user) {
              updateUser(res.user as User);
              setRitualToast({ title: "Benção Recebida", message: `Sua jornada foi harmonizada com ${res.reward} Karma.` });
          }
    }, [user, updateUser]);

    const handleCapture = useCallback(async (image: string) => {
          const newSnap: DailyRitualSnap = {
              id: Date.now().toString(),
              date: new Date().toISOString(),
              image,
              mood: 'SERENO', 
              note: 'Registro de Metamorfose'
          };
          const updatedUser = { ...user, snaps: [newSnap, ...(user.snaps || [])] };
          const res = await api.users.update(updatedUser);
          updateUser(res);
          setActiveModal(null);
          setRitualToast({ title: "Registro Salvo", message: "Sua memória foi cristalizada no Akasha." });
    }, [user, updateUser]);

    const handleInvite = useCallback(() => {
        if (!inviteEmail) return;
        setToast({ title: "Convite Enviado", message: `Chamado enviado para ${inviteEmail}` });
        setInviteEmail("");
        setActiveModal(null);
    }, [inviteEmail]);

    return {
        state: {
            toast,
            ritualToast,
            activeModal,
            inviteEmail,
            showNotifications,
            notifications,
            gardenStatus,
            plantVisuals
        },
        actions: {
            setToast,
            setRitualToast,
            setActiveModal,
            setInviteEmail,
            setShowNotifications,
            handleMarkAsRead,
            handleMarkAllRead,
            handleWaterPlant,
            handleDailyCheckIn,
            handleCapture,
            handleInvite,
            go
        }
    };
};
