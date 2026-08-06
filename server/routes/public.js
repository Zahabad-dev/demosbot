import { Router } from 'express';
import { query } from '../db.js';
import { config } from '../config.js';
import { notificarNegocio } from '../push.js';

export const publicRouter = Router();

// Datos del negocio por slug fijo — usado por links permanentes (ej. el menu interactivo
// que se pega en el FAQ). A propósito NO filtra por `activo`: ese link debe seguir
// funcionando aunque el negocio deje de ser el activo del switch.
publicRouter.get('/negocio/:slug', async (req, res) => {
  const { rows } = await query(
    `SELECT slug, nombre, giro, ciudad, tono, whatsapp_numero, plantilla, logo_data_url, es_demo, color_primario, color_acento, suspendido
     FROM negocios WHERE slug = $1`,
    [req.params.slug]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Negocio no encontrado' });
  res.json(rows[0]);
});

const NEGOCIO_PUBLICO_COLS = 'id, slug, nombre, giro, ciudad, tono, whatsapp_numero, plantilla, logo_data_url, es_demo, color_primario, color_acento, suspendido';

// Resuelve que negocio mostrar: primero por dominio propio (clientes reales activados con
// su propio dominio), y si el host no coincide con ninguno (ej. el dominio compartido de
// demos), cae al switch de siempre por `activo = true`. Asi un mismo servicio sirve tanto
// las demos como N clientes reales, cada quien en su propio dominio, sin pisarse.
export async function resolverNegocioPorHost(hostname) {
  if (hostname) {
    const { rows } = await query(
      `SELECT ${NEGOCIO_PUBLICO_COLS} FROM negocios WHERE lower(dominio) = lower($1) LIMIT 1`,
      [hostname]
    );
    if (rows[0]) return rows[0];
  }
  const { rows } = await query(`SELECT ${NEGOCIO_PUBLICO_COLS} FROM negocios WHERE activo = true LIMIT 1`);
  return rows[0] || null;
}

// El sitio público sigue al negocio de su propio dominio si tiene uno configurado, o al
// negocio activo del switch de demos si no (sin importar cual sea su slug).
publicRouter.get('/negocio-activo', async (req, res) => {
  const negocio = await resolverNegocioPorHost(req.hostname);
  if (!negocio) return res.status(404).json({ error: 'No hay negocio activo' });
  res.json(negocio);
});

publicRouter.get('/negocio-activo/faq', async (req, res) => {
  const negocio = await resolverNegocioPorHost(req.hostname);
  if (!negocio) return res.json([]);
  const { rows } = await query(
    'SELECT categoria, pregunta, respuesta, imagen_url FROM faq WHERE negocio_id = $1 AND activo = true ORDER BY orden ASC, id ASC',
    [negocio.id]
  );
  res.json(rows);
});

// Igual que /negocio/:slug: sin filtro de `activo` para que el link del menu permanente
// nunca se rompa aunque este negocio deje de ser el activo del switch.
publicRouter.get('/negocio/:slug/faq', async (req, res) => {
  const { rows } = await query(
    `SELECT f.categoria, f.pregunta, f.respuesta, f.imagen_url
     FROM faq f JOIN negocios n ON n.id = f.negocio_id
     WHERE n.slug = $1 AND f.activo = true
     ORDER BY f.orden ASC, f.id ASC`,
    [req.params.slug]
  );
  res.json(rows);
});

// Slots ya agendados de un negocio (fecha ISO + horario), para que la agenda interactiva los
// tache/oculte como ocupados cuando el negocio tiene horario configurable (categoria='horario'
// en su FAQ). Solo expone fecha+horario, nunca nombre/telefono del cliente que agendo.
publicRouter.get('/negocio/:slug/citas-ocupadas', async (req, res) => {
  const { rows } = await query(
    `SELECT c.fecha, c.horario
     FROM citas c JOIN negocios n ON n.id = c.negocio_id
     WHERE n.slug = $1 AND c.estado <> 'Cancelada'`,
    [req.params.slug]
  );
  res.json(rows);
});

publicRouter.get('/negocio/:slug/links', async (req, res) => {
  const { rows } = await query(
    `SELECT l.clave, l.url, l.descripcion
     FROM links l JOIN negocios n ON n.id = l.negocio_id
     WHERE n.slug = $1 AND l.activo = true`,
    [req.params.slug]
  );
  res.json(rows);
});

// --- Endpoints que consume el bot (n8n), agnósticos de giro ---
// n8n identifica el negocio por chatwoot_inbox_id (viene en el payload del webhook de Chatwoot).
// `suspendido = true` corta el bot igual que si no existiera el negocio — es el mismo toggle
// que usa /admin/negocios/:id/suspender para "cerrar el servicio" sin borrar nada.
publicRouter.get('/bot/negocio-por-inbox/:inboxId', async (req, res) => {
  const { rows } = await query(
    'SELECT id, slug, nombre, giro, tono, system_prompt FROM negocios WHERE chatwoot_inbox_id = $1 AND activo = true AND suspendido = false',
    [req.params.inboxId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Negocio no encontrado para ese inbox' });
  res.json(rows[0]);
});

// n8n llama esto justo despues de insertar un pedido/cita/reserva/solicitud nueva (inserta
// directo a Postgres, no via API, por eso necesita este paso aparte para disparar el push).
// Protegido con secreto compartido en vez de sesion, porque quien llama es el flujo de n8n, no
// un usuario logueado.
publicRouter.post('/bot/notificar', async (req, res) => {
  if (req.headers['x-bot-secret'] !== config.botPushSecret) return res.status(401).json({ error: 'No autorizado' });
  const { negocioId, titulo, cuerpo, url } = req.body;
  if (!negocioId || !titulo) return res.status(400).json({ error: 'Faltan negocioId/titulo' });
  await notificarNegocio(negocioId, { titulo, cuerpo, url });
  res.json({ ok: true });
});

publicRouter.get('/bot/:negocioId/faq', async (req, res) => {
  const { rows } = await query(
    'SELECT categoria, pregunta, respuesta FROM faq WHERE negocio_id = $1 AND activo = true ORDER BY orden ASC',
    [req.params.negocioId]
  );
  res.json(rows);
});
