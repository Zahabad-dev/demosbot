import { Router } from 'express';
import { query } from '../db.js';

export const publicRouter = Router();

// Datos del negocio para pintar el sitio público (Tacos Memo, o el que sea).
publicRouter.get('/negocio/:slug', async (req, res) => {
  const { rows } = await query(
    'SELECT slug, nombre, giro, ciudad, tono, whatsapp_numero, plantilla, logo_data_url FROM negocios WHERE slug = $1 AND activo = true',
    [req.params.slug]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Negocio no encontrado' });
  res.json(rows[0]);
});

// El sitio público sigue al negocio que este activo en ese momento (el switch del panel),
// sin importar cual sea su slug — asi "segun el bot que se elija" es la pagina que se muestra.
publicRouter.get('/negocio-activo', async (req, res) => {
  const { rows } = await query(
    'SELECT slug, nombre, giro, ciudad, tono, whatsapp_numero, plantilla, logo_data_url FROM negocios WHERE activo = true LIMIT 1'
  );
  if (!rows[0]) return res.status(404).json({ error: 'No hay negocio activo' });
  res.json(rows[0]);
});

publicRouter.get('/negocio-activo/faq', async (req, res) => {
  const { rows } = await query(
    `SELECT f.categoria, f.pregunta, f.respuesta
     FROM faq f JOIN negocios n ON n.id = f.negocio_id
     WHERE n.activo = true AND f.activo = true
     ORDER BY f.orden ASC, f.id ASC`
  );
  res.json(rows);
});

publicRouter.get('/negocio/:slug/faq', async (req, res) => {
  const { rows } = await query(
    `SELECT f.categoria, f.pregunta, f.respuesta
     FROM faq f JOIN negocios n ON n.id = f.negocio_id
     WHERE n.slug = $1 AND f.activo = true
     ORDER BY f.orden ASC, f.id ASC`,
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
publicRouter.get('/bot/negocio-por-inbox/:inboxId', async (req, res) => {
  const { rows } = await query(
    'SELECT id, slug, nombre, giro, tono, system_prompt FROM negocios WHERE chatwoot_inbox_id = $1 AND activo = true',
    [req.params.inboxId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Negocio no encontrado para ese inbox' });
  res.json(rows[0]);
});

publicRouter.get('/bot/:negocioId/faq', async (req, res) => {
  const { rows } = await query(
    'SELECT categoria, pregunta, respuesta FROM faq WHERE negocio_id = $1 AND activo = true ORDER BY orden ASC',
    [req.params.negocioId]
  );
  res.json(rows);
});
