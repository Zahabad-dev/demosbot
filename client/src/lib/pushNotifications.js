import { api } from './apiClient';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export const soportaPush = () => 'serviceWorker' in navigator && 'PushManager' in window;
export const soportaNotificaciones = () => 'Notification' in window;

// Camino "real": Service Worker + Web Push — funciona aunque el panel este cerrado.
// Soportado en Android (cualquier navegador) y en iOS 16.4+ SOLO si la PWA esta agregada a
// pantalla de inicio (Safari en pestaña normal de iOS no lo soporta, por eso existe el
// fallback de abajo).
export async function activarPush() {
  if (!soportaPush()) return { ok: false, motivo: 'no-soportado' };
  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') return { ok: false, motivo: 'permiso-denegado' };

  const reg = await navigator.serviceWorker.register('/sw.js');
  const { publicKey } = await api.get('/admin/push/public-key');
  if (!publicKey) return { ok: false, motivo: 'servidor-sin-configurar' };

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }
  const json = sub.toJSON();
  await api.post('/admin/push/subscribe', { endpoint: json.endpoint, keys: json.keys });
  return { ok: true };
}

export async function desactivarPush() {
  if (!soportaPush()) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await api.post('/admin/push/unsubscribe', { endpoint: sub.endpoint });
    await sub.unsubscribe();
  }
}

// Fallback para navegadores sin Push API real (ej. iPhone en Safari sin instalar la PWA):
// solo avisa mientras el panel esta abierto en una pestaña, con la Notification API del
// navegador directamente, sin service worker ni servidor de por medio.
export async function activarNotificacionesEnPestana() {
  if (!soportaNotificaciones()) return { ok: false, motivo: 'no-soportado' };
  const permiso = await Notification.requestPermission();
  return { ok: permiso === 'granted' };
}

export function notificarEnPestana(titulo, cuerpo) {
  if (soportaNotificaciones() && Notification.permission === 'granted') {
    new Notification(titulo, { body: cuerpo, icon: '/icon.svg' });
  }
}
