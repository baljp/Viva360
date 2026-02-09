import { useState, useEffect } from 'react';
import { Appointment, User } from '../../types';
import { api } from '../../services/api';

export type OrdersTab = 'rituais' | 'vouchers' | 'historico';

export const useOrdersList = (user: User) => {
    const [activeTab, setActiveTab] = useState<OrdersTab>('rituais');
    const [items, setItems] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        setIsLoading(true);

        api.appointments.list(user.id, user.role).then((data) => {
            if (mounted) {
                setItems(data);
                setIsLoading(false);
            }
        }).catch(() => {
            if (mounted) setIsLoading(false);
        });

        return () => { mounted = false; };
    }, [user.id, user.role, activeTab]);

    return {
        state: {
            activeTab,
            items,
            isLoading
        },
        actions: {
            setActiveTab
        }
    };
};

