import webpush from 'web-push';
import { query } from './db.js';
import { config } from './config.js';

if (config.vapidPublicKey && config.vapidPrivateKey) {
  webpush.setVapidDetails('mailto:contacto@blacksheepagencia.com', config.vapidPublicKey, config.vapidPrivateKey);
}

// Manda un push a todos los dispositivos suscritos de un negocio: los suyos propios
// (push_subscriptions.negocio_id = negocioId) mas los de cualquier admin de agencia
// (admin_users.rol = 'agencia', ve/recibe avisos de todos los negocios).
export async function notificarNegocio(negocioId, { titulo, cuerpo, url }) {
  if (!config.vapidPublicKey || !config.vapidPrivateKey) return; // VAPID no configurado, no truena, solo no manda nada

  const { rows: subs } = await query(
    `SELECT ps.id, ps.endpoint, ps.p256dh, ps.auth
     FROM push_subscriptions ps
     JOIN admin_users au ON au.id = ps.admin_user_id
     WHERE ps.negocio_id = $1 OR au.rol = 'agencia'`,
    [negocioId]
  );

  const payload = JSON.stringify({ titulo, cuerpo, url: url || '/admin/negocios' });

  await Promise.all(subs.map(async (sub) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
    } catch (err) {
      // 404/410 = el dispositivo ya no existe (navegador desinstalado, permiso revocado, etc.) — se limpia sola.
      if (err.statusCode === 404 || err.statusCode === 410) {
        await query('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]);
      }
    }
  }));
}
