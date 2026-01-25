
self.addEventListener('push', function(event) {
    const data = event.data ? event.data.json() : {};
    
    const title = data.title || 'Viva360';
    const options = {
        body: data.body || 'Nova mensagem do seu santuário.',
        icon: '/vite.svg', // Fallback icon
        badge: '/vite.svg',
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
