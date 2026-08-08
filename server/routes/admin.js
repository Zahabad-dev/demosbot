import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { query, withTransaction } from '../db.js';
import { login, requireAuth, scopeNegocio, requireAgencia } from '../auth.js';
import { config } from '../config.js';

export const adminRouter = Router();

adminRouter.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const result = await login(username, password);
  if (!result) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  res.cookie('token', result.token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({ user: result.user });
});

adminRouter.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

adminRouter.get('/me', requireAuth, (req, res) => res.json({ user: req.auth }));

// Llave pública VAPID que el frontend necesita para registrar una suscripción push del navegador.
adminRouter.get('/push/public-key', (req, res) => res.json({ publicKey: config.vapidPublicKey || null }));

// Guarda/actualiza la suscripción push del dispositivo actual (un navegador = una fila).
// Sirve tanto para agencia como para cliente — cada quien recibe avisos de lo suyo (ver
// notificarNegocio en push.js: agencia recibe de todos, cliente solo de su negocio).
adminRouter.post('/push/subscribe', requireAuth, async (req, res) => {
  const { endpoint, keys } = req.body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) return res.status(400).json({ error: 'Suscripción incompleta' });
  await query(
    `INSERT INTO push_subscriptions (admin_user_id, negocio_id, endpoint, p256dh, auth)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (endpoint) DO UPDATE SET admin_user_id = $1, negocio_id = $2, p256dh = $4, auth = $5`,
    [req.auth.sub, req.auth.negocioId, endpoint, keys.p256dh, keys.auth]
  );
  res.status(201).json({ ok: true });
});

adminRouter.post('/push/unsubscribe', requireAuth, async (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) return res.status(400).json({ error: 'Falta endpoint' });
  await query('DELETE FROM push_subscriptions WHERE endpoint = $1 AND admin_user_id = $2', [endpoint, req.auth.sub]);
  res.json({ ok: true });
});

// Verifica que la fila (de una tabla relacionada a negocio_id) pertenezca al negocio del
// usuario logueado, salvo rol 'agencia' (ve todo). Usado en los PUT/DELETE de faq, links,
// solicitudes, pedidos, citas y reservas, que se referencian por su propio id (no por
// negocioId en la URL) y por eso no quedan cubiertos por scopeNegocio.
async function assertOwnsRow(req, res, tabla) {
  const { rows } = await query(`SELECT negocio_id FROM ${tabla} WHERE id = $1`, [req.params.id]);
  if (!rows[0]) { res.status(404).json({ error: 'No encontrado' }); return null; }
  if (req.auth.rol !== 'agencia' && rows[0].negocio_id !== req.auth.negocioId) {
    res.status(403).json({ error: 'Sin acceso a este registro' });
    return null;
  }
  return rows[0];
}

// Lista de negocios visibles para el admin logueado (agencia ve todos, cliente solo el suyo).
// "pendientes" suma pedidos/citas/reservas nuevos + solicitudes no leidas de ese negocio —
// se usa como badge de notificacion junto al link "Solicitudes" de cada fila.
adminRouter.get('/negocios', requireAuth, async (req, res) => {
  const isAgencia = req.auth.rol === 'agencia';
  const { rows } = await query(
    `SELECT n.id, n.slug, n.nombre, n.giro, n.ciudad, n.tono, n.activo, n.es_demo, n.dominio, n.suspendido,
       COALESCE(p.pendientes, 0) + COALESCE(c.pendientes, 0) + COALESCE(r.pendientes, 0) + COALESCE(s.pendientes, 0) AS pendientes
     FROM negocios n
     LEFT JOIN (SELECT negocio_id, COUNT(*) AS pendientes FROM pedidos WHERE estado = 'Nuevo' GROUP BY negocio_id) p ON p.negocio_id = n.id
     LEFT JOIN (SELECT negocio_id, COUNT(*) AS pendientes FROM citas WHERE estado = 'Nueva' GROUP BY negocio_id) c ON c.negocio_id = n.id
     LEFT JOIN (SELECT negocio_id, COUNT(*) AS pendientes FROM reservas WHERE estado = 'Nueva' GROUP BY negocio_id) r ON r.negocio_id = n.id
     LEFT JOIN (SELECT negocio_id, COUNT(*) AS pendientes FROM solicitudes WHERE leido = false GROUP BY negocio_id) s ON s.negocio_id = n.id
     WHERE $1 = true OR n.id = $2
     ORDER BY n.nombre`,
    [isAgencia, req.auth.negocioId]
  );
  res.json(rows);
});

// --- El panel "moldeable": editar giro / tono / system_prompt de un negocio ---
// Lectura: agencia ve cualquiera, cliente solo el suyo (scopeNegocio). El cliente puede
// necesitar leer estos datos (ej. para mostrar su propio nombre en el panel), pero JAMAS
// puede escribirlos — ver el PUT de abajo, restringido a requireAgencia.
adminRouter.get('/negocios/:negocioId', requireAuth, scopeNegocio, async (req, res) => {
  const { rows } = await query('SELECT * FROM negocios WHERE id = $1', [req.params.negocioId]);
  if (!rows[0]) return res.status(404).json({ error: 'No encontrado' });
  res.json(rows[0]);
});

// Solo agencia: system_prompt, canal (WhatsApp/Chatwoot), plantilla, dominio y colores de
// marca son configuracion sensible que un cliente activado nunca debe poder tocar el mismo.
adminRouter.put('/negocios/:negocioId', requireAuth, requireAgencia, async (req, res) => {
  const {
    nombre, giro, ciudad, tono, system_prompt, whatsapp_numero, chatwoot_inbox_id,
    chatwoot_account_id, activo, plantilla, logo_data_url, tipo_funcion,
    dominio, dominio_vence, color_primario, color_acento,
  } = req.body;
  const { rows } = await query(
    `UPDATE negocios SET
       nombre = COALESCE($2, nombre),
       giro = COALESCE($3, giro),
       ciudad = COALESCE($4, ciudad),
       tono = COALESCE($5, tono),
       system_prompt = COALESCE($6, system_prompt),
       whatsapp_numero = COALESCE($7, whatsapp_numero),
       chatwoot_inbox_id = COALESCE($8, chatwoot_inbox_id),
       chatwoot_account_id = COALESCE($9, chatwoot_account_id),
       activo = COALESCE($10, activo),
       plantilla = COALESCE($11, plantilla),
       logo_data_url = COALESCE($12, logo_data_url),
       tipo_funcion = COALESCE($13, tipo_funcion),
       dominio = COALESCE($14, dominio),
       dominio_vence = COALESCE($15, dominio_vence),
       color_primario = COALESCE($16, color_primario),
       color_acento = COALESCE($17, color_acento)
     WHERE id = $1 RETURNING *`,
    [req.params.negocioId, nombre, giro, ciudad, tono, system_prompt, whatsapp_numero, chatwoot_inbox_id, chatwoot_account_id, activo, plantilla, logo_data_url, tipo_funcion, dominio, dominio_vence, color_primario, color_acento]
  );
  res.json(rows[0]);
});

// Activar un negocio como "la demo en vivo" — desactiva a los DEMAS NEGOCIOS QUE SIGUEN
// SIENDO DEMO (es_demo = true) en la misma transaccion. Un cliente ya activado (es_demo =
// false) tiene su propio inbox/dominio real y nunca debe apagarse por este switch, aunque
// se active una demo nueva para presentarle a otro prospecto.
adminRouter.put('/negocios/:negocioId/activar', requireAuth, requireAgencia, async (req, res) => {
  const negocio = await withTransaction(async (client) => {
    await client.query('UPDATE negocios SET activo = false WHERE id <> $1 AND es_demo = true', [req.params.negocioId]);
    const { rows } = await client.query('UPDATE negocios SET activo = true WHERE id = $1 RETURNING *', [req.params.negocioId]);
    return rows[0];
  });
  if (!negocio) return res.status(404).json({ error: 'No encontrado' });
  res.json(negocio);
});

// Activar un negocio como CLIENTE REAL (ya pago): se marca es_demo = false (deja de competir
// por el switch de arriba, corre independiente y permanente) y se crea su usuario de acceso
// al panel, con acceso restringido solo a FAQ y a sus solicitudes/pedidos/citas/reservas — el
// frontend oculta "Editar bot" para rol 'cliente', y el backend lo bloquea con requireAgencia
// en el PUT de negocios de todas formas, asi que aunque alguien intente pegarle directo al
// endpoint, no puede tocar el system_prompt/canal/plantilla.
// El numero real de WhatsApp y el logo los sigue dando de alta la agencia a mano despues.
adminRouter.post('/negocios/:negocioId/activar-cliente', requireAuth, requireAgencia, async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Falta el usuario/correo del cliente' });

  const { rows: negRows } = await query('SELECT id, nombre FROM negocios WHERE id = $1', [req.params.negocioId]);
  if (!negRows[0]) return res.status(404).json({ error: 'Negocio no encontrado' });

  const password = crypto.randomBytes(9).toString('base64url'); // ~12 caracteres, legible
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const { negocio, usuario } = await withTransaction(async (client) => {
      const { rows } = await client.query(
        'UPDATE negocios SET es_demo = false WHERE id = $1 RETURNING *',
        [req.params.negocioId]
      );
      const { rows: userRows } = await client.query(
        `INSERT INTO admin_users (negocio_id, username, password_hash, nombre, rol)
         VALUES ($1, $2, $3, $4, 'cliente') RETURNING id, username, nombre, rol`,
        [req.params.negocioId, username, passwordHash, negRows[0].nombre]
      );
      return { negocio: rows[0], usuario: userRows[0] };
    });
    // La contrasena en texto plano solo se devuelve UNA VEZ aqui — no se guarda en ningun lado.
    res.status(201).json({ negocio, usuario, password });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Ese usuario/correo ya existe' });
    throw err;
  }
});

// Pausar/reanudar el servicio de un cliente real (ej. no pagó) SIN borrar ni tocar nada de su
// configuracion/datos: mientras suspendido = true, el sitio de su dominio muestra un aviso de
// "servicio pausado" (ver negocio.suspendido en el frontend) y el bot deja de responder en
// Chatwoot (el endpoint /bot/negocio-por-inbox lo filtra). Reversible con el mismo toggle.
adminRouter.put('/negocios/:negocioId/suspender', requireAuth, requireAgencia, async (req, res) => {
  const { suspendido } = req.body;
  if (typeof suspendido !== 'boolean') return res.status(400).json({ error: 'Falta el campo suspendido (booleano)' });
  const { rows } = await query(
    'UPDATE negocios SET suspendido = $2 WHERE id = $1 RETURNING *',
    [req.params.negocioId, suspendido]
  );
  if (!rows[0]) return res.status(404).json({ error: 'No encontrado' });
  res.json(rows[0]);
});

// Eliminacion DEFINITIVA de un negocio: borra la fila y, por ON DELETE CASCADE del esquema,
// TODO lo que cuelga de el (faq, links, solicitudes, pedidos, citas, reservas, admin_users) en
// una sola operacion irreversible. NO toca nada fuera de la base de datos — el inbox de
// Chatwoot y el dominio dado de alta en Easypanel quedan huerfanos, hay que borrarlos a mano en
// esos paneles si ya no se van a usar. Exige escribir el nombre exacto del negocio como
// confirmacion (mismo patron que "escribe el nombre del repo para borrarlo" de GitHub) para que
// no se dispare por error desde un click accidental o un script.
adminRouter.delete('/negocios/:negocioId', requireAuth, requireAgencia, async (req, res) => {
  const { confirmarNombre } = req.body;
  const { rows: negRows } = await query('SELECT nombre FROM negocios WHERE id = $1', [req.params.negocioId]);
  if (!negRows[0]) return res.status(404).json({ error: 'No encontrado' });
  if (confirmarNombre !== negRows[0].nombre) {
    return res.status(400).json({ error: 'El nombre de confirmación no coincide con el nombre del negocio' });
  }
  await query('DELETE FROM negocios WHERE id = $1', [req.params.negocioId]);
  res.json({ ok: true });
});

// Solo rol 'agencia' puede crear negocios nuevos (nuevos clientes/demos).
// Nace SIEMPRE inactivo (activo = false): así nunca compite por el chatwoot_inbox_id
// con la demo que esté activa en ese momento. Se activa a propósito con /activar.
adminRouter.post('/negocios', requireAuth, requireAgencia, async (req, res) => {
  const { slug, nombre, giro, ciudad, tono, system_prompt } = req.body;
  const { rows } = await query(
    `INSERT INTO negocios (slug, nombre, giro, ciudad, tono, system_prompt, activo)
     VALUES ($1,$2,$3,$4,$5,$6,false) RETURNING *`,
    [slug, nombre, giro, ciudad, tono || 'amigable', system_prompt]
  );
  res.status(201).json(rows[0]);
});

// --- FAQ (moldeable por negocio) — el cliente SI puede leer/escribir la suya ---
adminRouter.get('/negocios/:negocioId/faq', requireAuth, scopeNegocio, async (req, res) => {
  const { rows } = await query('SELECT * FROM faq WHERE negocio_id = $1 ORDER BY orden, id', [req.params.negocioId]);
  res.json(rows);
});

// Limite de servicios/productos "estrella" por negocio — cualquier fila de FAQ que NO sea
// categoria 'general' u 'horario' cuenta como catalogo (servicios, entradas, fuertes, bebidas,
// postres, vehiculos, etc., segun la plantilla). La info general (ubicacion, financiamiento...)
// y el horario configurable (una sola fila JSON) quedan sin limite. Aplica igual para agencia y
// cliente, es un limite de producto, no de rol.
const LIMITE_SERVICIOS_ESTRELLA = 15;
const CATEGORIAS_SIN_LIMITE = ['general', 'horario'];

adminRouter.post('/negocios/:negocioId/faq', requireAuth, scopeNegocio, async (req, res) => {
  const { categoria, pregunta, respuesta, orden, imagen_url } = req.body;
  const categoriaFinal = categoria || 'general';
  if (!CATEGORIAS_SIN_LIMITE.includes(categoriaFinal)) {
    const { rows: countRows } = await query(
      "SELECT COUNT(*) FROM faq WHERE negocio_id = $1 AND categoria <> ALL($2)",
      [req.params.negocioId, CATEGORIAS_SIN_LIMITE]
    );
    if (Number(countRows[0].count) >= LIMITE_SERVICIOS_ESTRELLA) {
      return res.status(400).json({ error: `Límite de ${LIMITE_SERVICIOS_ESTRELLA} servicios/productos estrella alcanzado. Borra alguno para agregar otro.` });
    }
  }
  const { rows } = await query(
    `INSERT INTO faq (negocio_id, categoria, pregunta, respuesta, orden, imagen_url)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.params.negocioId, categoriaFinal, pregunta, respuesta, orden || 0, imagen_url || null]
  );
  res.status(201).json(rows[0]);
});

adminRouter.put('/faq/:id', requireAuth, async (req, res) => {
  if (!(await assertOwnsRow(req, res, 'faq'))) return;
  const { categoria, pregunta, respuesta, activo, orden, imagen_url } = req.body;
  const { rows } = await query(
    `UPDATE faq SET
       categoria = COALESCE($2, categoria),
       pregunta = COALESCE($3, pregunta),
       respuesta = COALESCE($4, respuesta),
       activo = COALESCE($5, activo),
       orden = COALESCE($6, orden),
       imagen_url = COALESCE($7, imagen_url)
     WHERE id = $1 RETURNING *`,
    [req.params.id, categoria, pregunta, respuesta, activo, orden, imagen_url]
  );
  res.json(rows[0]);
});

adminRouter.delete('/faq/:id', requireAuth, async (req, res) => {
  if (!(await assertOwnsRow(req, res, 'faq'))) return;
  await query('DELETE FROM faq WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// --- Radar de FAQ: preguntas reales que el bot no supo responder o que escalaron rápido ---
// El cliente ve esto en su panel de FAQ para saber exactamente qué le falta cubrir.
adminRouter.get('/negocios/:negocioId/radar', requireAuth, scopeNegocio, async (req, res) => {
  const { rows } = await query(
    'SELECT * FROM radar_faq WHERE negocio_id = $1 AND resuelto = false ORDER BY creado_en DESC LIMIT 100',
    [req.params.negocioId]
  );
  res.json(rows);
});

// Marca una fila del radar como resuelta (ya se agregó al FAQ, o se decidió ignorar) — no se
// borra, se conserva como historial silencioso.
adminRouter.put('/radar/:id', requireAuth, async (req, res) => {
  if (!(await assertOwnsRow(req, res, 'radar_faq'))) return;
  await query('UPDATE radar_faq SET resuelto = true WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// --- Links (solo agencia: son datos tecnicos de integracion, no contenido de FAQ) ---
adminRouter.get('/negocios/:negocioId/links', requireAuth, scopeNegocio, async (req, res) => {
  const { rows } = await query('SELECT * FROM links WHERE negocio_id = $1 ORDER BY id', [req.params.negocioId]);
  res.json(rows);
});

adminRouter.put('/links/:id', requireAuth, async (req, res) => {
  if (!(await assertOwnsRow(req, res, 'links'))) return;
  const { url, descripcion, activo } = req.body;
  const { rows } = await query(
    `UPDATE links SET url = COALESCE($2, url), descripcion = COALESCE($3, descripcion), activo = COALESCE($4, activo)
     WHERE id = $1 RETURNING *`,
    [req.params.id, url, descripcion, activo]
  );
  res.json(rows[0]);
});

// --- Solicitudes / leads ---
// Incluye conteos de pedidos/citas/reservas "Nuevo(a)" por contacto, para mostrar el badge
// en los botones "Historial de..." sin tener que abrir cada modal.
adminRouter.get('/negocios/:negocioId/solicitudes', requireAuth, scopeNegocio, async (req, res) => {
  const { rows } = await query(
    `SELECT s.*,
       COALESCE(p.pendientes, 0) AS pedidos_nuevos,
       COALESCE(c.pendientes, 0) AS citas_nuevas,
       COALESCE(r.pendientes, 0) AS reservas_nuevas
     FROM solicitudes s
     LEFT JOIN (SELECT negocio_id, telefono, COUNT(*) AS pendientes FROM pedidos WHERE estado = 'Nuevo' GROUP BY negocio_id, telefono) p ON p.negocio_id = s.negocio_id AND p.telefono = s.telefono
     LEFT JOIN (SELECT negocio_id, telefono, COUNT(*) AS pendientes FROM citas WHERE estado = 'Nueva' GROUP BY negocio_id, telefono) c ON c.negocio_id = s.negocio_id AND c.telefono = s.telefono
     LEFT JOIN (SELECT negocio_id, telefono, COUNT(*) AS pendientes FROM reservas WHERE estado = 'Nueva' GROUP BY negocio_id, telefono) r ON r.negocio_id = s.negocio_id AND r.telefono = s.telefono
     WHERE s.negocio_id = $1
     ORDER BY s.actualizado_en DESC LIMIT 200`,
    [req.params.negocioId]
  );
  res.json(rows);
});

adminRouter.put('/solicitudes/:id', requireAuth, async (req, res) => {
  if (!(await assertOwnsRow(req, res, 'solicitudes'))) return;
  const { estado, prioridad, bot_bloqueado, leido, motivo_baneo } = req.body;
  const { rows } = await query(
    `UPDATE solicitudes SET
       estado = COALESCE($2, estado),
       prioridad = COALESCE($3, prioridad),
       bot_bloqueado = COALESCE($4, bot_bloqueado),
       leido = COALESCE($5, leido),
       motivo_baneo = COALESCE($6, motivo_baneo)
     WHERE id = $1 RETURNING *`,
    [req.params.id, estado, prioridad, bot_bloqueado, leido, motivo_baneo]
  );
  res.json(rows[0]);
});

// --- Pedidos (generados desde el menu interactivo, insertados por n8n) ---
// Se relacionan por negocio_id + telefono de la solicitud, no por FK directa.
adminRouter.get('/solicitudes/:solicitudId/pedidos', requireAuth, async (req, res) => {
  const { rows: sol } = await query('SELECT negocio_id, telefono FROM solicitudes WHERE id = $1', [req.params.solicitudId]);
  if (!sol[0]) return res.status(404).json({ error: 'Solicitud no encontrada' });
  if (req.auth.rol !== 'agencia' && sol[0].negocio_id !== req.auth.negocioId) return res.status(403).json({ error: 'Sin acceso a este registro' });
  const { rows } = await query(
    'SELECT * FROM pedidos WHERE negocio_id = $1 AND telefono = $2 ORDER BY creado_en DESC',
    [sol[0].negocio_id, sol[0].telefono]
  );
  res.json(rows);
});

adminRouter.put('/pedidos/:id', requireAuth, async (req, res) => {
  if (!(await assertOwnsRow(req, res, 'pedidos'))) return;
  const { estado } = req.body;
  const { rows } = await query(
    'UPDATE pedidos SET estado = COALESCE($2, estado) WHERE id = $1 RETURNING *',
    [req.params.id, estado]
  );
  res.json(rows[0]);
});

// --- Citas (generadas desde la agenda interactiva, insertadas por n8n) ---
// Mismo patron que pedidos: relacion por negocio_id + telefono, no por FK directa.
adminRouter.get('/solicitudes/:solicitudId/citas', requireAuth, async (req, res) => {
  const { rows: sol } = await query('SELECT negocio_id, telefono FROM solicitudes WHERE id = $1', [req.params.solicitudId]);
  if (!sol[0]) return res.status(404).json({ error: 'Solicitud no encontrada' });
  if (req.auth.rol !== 'agencia' && sol[0].negocio_id !== req.auth.negocioId) return res.status(403).json({ error: 'Sin acceso a este registro' });
  const { rows } = await query(
    'SELECT * FROM citas WHERE negocio_id = $1 AND telefono = $2 ORDER BY creado_en DESC',
    [sol[0].negocio_id, sol[0].telefono]
  );
  res.json(rows);
});

adminRouter.put('/citas/:id', requireAuth, async (req, res) => {
  if (!(await assertOwnsRow(req, res, 'citas'))) return;
  const { estado } = req.body;
  const { rows } = await query(
    'UPDATE citas SET estado = COALESCE($2, estado) WHERE id = $1 RETURNING *',
    [req.params.id, estado]
  );
  res.json(rows[0]);
});

// --- Reservas de mesa (guardadas por n8n al detectar el marcador [RESERVA_MESA] que el
// agente emite en conversacion libre, solo para negocios con tipo_funcion = 'pedidos') ---
// Mismo patron que pedidos/citas: relacion por negocio_id + telefono, no por FK directa.
adminRouter.get('/solicitudes/:solicitudId/reservas', requireAuth, async (req, res) => {
  const { rows: sol } = await query('SELECT negocio_id, telefono FROM solicitudes WHERE id = $1', [req.params.solicitudId]);
  if (!sol[0]) return res.status(404).json({ error: 'Solicitud no encontrada' });
  if (req.auth.rol !== 'agencia' && sol[0].negocio_id !== req.auth.negocioId) return res.status(403).json({ error: 'Sin acceso a este registro' });
  const { rows } = await query(
    'SELECT * FROM reservas WHERE negocio_id = $1 AND telefono = $2 ORDER BY creado_en DESC',
    [sol[0].negocio_id, sol[0].telefono]
  );
  res.json(rows);
});

adminRouter.put('/reservas/:id', requireAuth, async (req, res) => {
  if (!(await assertOwnsRow(req, res, 'reservas'))) return;
  const { estado } = req.body;
  const { rows } = await query(
    'UPDATE reservas SET estado = COALESCE($2, estado) WHERE id = $1 RETURNING *',
    [req.params.id, estado]
  );
  res.json(rows[0]);
});
