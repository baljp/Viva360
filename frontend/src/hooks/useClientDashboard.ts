import { useState, useCallback } from 'react';
import { User, DailyRitualSnap, ViewState } from '../../../../types';
import { api } from '../../../../services/api';
import { gardenService } from '../../../../services/gardenService';
import { useBuscadorFlow } from '../../../../src/flow/BuscadorFlowContext';

export const useClientDashboard = (
    user: User, 
    updateUser: (u: User) => void,
    setView: (v: ViewState) => void
) => {
    const { go } = useBuscadorFlow();
    const [toast, setToast] = useState<{title: string, message: string} | null>(null);
    const [activeModal, setActiveModal] = useState<'camera' | 'invite' | 'leaderboard' | null>(null);
    const [inviteEmail, setInviteEmail] = useState("");
    const [showNotifications, setShowNotifications] = useState(false);

    // Mock Notifications (In a real app, this might come from a NotificationService context)
    const [notifications, setNotifications] = useState([
        { id: '1', title: 'Hora do Ritual', message: 'O sol nasceu. Hora de despertar.', type: 'ritual', read: false },
        { id: '2', title: 'Pagamento Recebido', message: 'Sua sessão com Dr. Pedro foi confirmada.', type: 'finance', read: true },
    ]);

    const handleMarkAsRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

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
            setToast({ title: "Essência Nutrida", message: `+${reward.xp} PX. Seu jardim floresce.` });
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
              setToast({ title: "Sincronizado", message: `+${res.reward} Karma recebido.` });
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
          setToast({ title: "Registro Salvo", message: "Sua memória foi cristalizada." });
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
            activeModal,
            inviteEmail,
            showNotifications,
            notifications,
            gardenStatus,
            plantVisuals
        },
        actions: {
            setToast,
            setActiveModal,
            setInviteEmail,
            setShowNotifications,
            handleMarkAsRead,
            handleWaterPlant,
            handleDailyCheckIn,
            handleCapture,
            handleInvite,
            go
        }
    };
};
