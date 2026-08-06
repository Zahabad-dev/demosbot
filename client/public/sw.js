// Service worker minimo: solo push notifications, sin cache offline (no es una app que
// necesite funcionar sin internet, es el panel de administracion).

self.addEventListener('push', (event) => {
  let data = { titulo: 'Panel FAQ Bot', cuerpo: 'Tienes algo nuevo pendiente.', url: '/admin' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // payload no era JSON, se queda con los valores por defecto
  }
  event.waitUntil(
    self.registration.showNotification(data.titulo, {
      body: data.cuerpo,
      icon: '/icon.svg',
      badge: '/icon.svg',
      data: { url: data.url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/admin';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
