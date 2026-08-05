import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { publicRouter, resolverNegocioPorHost } from './routes/public.js';
import { adminRouter } from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, '..', 'client', 'dist');

const app = express();
app.set('trust proxy', true); // detras de Easypanel/Traefik — necesario para que req.hostname
// refleje el dominio real de la peticion (multi-tenant por dominio, ver routes/public.js)
app.use(express.json({ limit: '4mb' })); // el logo del negocio viaja como data URL base64
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/public', publicRouter);
app.use('/api/admin', adminRouter);

// Sirve el build de Vite (sitio público + panel /admin) — un solo servicio en Easypanel,
// N dominios (multi-tenant): index:false para que "/" no se sirva automaticamente aqui,
// asi el handler de abajo siempre puede inyectar el <title>/meta segun el dominio real.
app.use(express.static(clientDist, { index: false }));

const indexHtmlPath = path.join(clientDist, 'index.html');

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

app.get(/^(?!\/api).*/, async (req, res) => {
  // Lectura perezosa (no al arrancar el server): en local, client/dist no siempre existe
  // (Vite dev server sirve el cliente aparte) — asi el server sigue levantando sin ese build.
  let html;
  try {
    html = fs.readFileSync(indexHtmlPath, 'utf-8');
  } catch {
    return res.status(503).send('Build del cliente no encontrado (client/dist) — corre "npm run build" en /client.');
  }
  try {
    const negocio = await resolverNegocioPorHost(req.hostname);
    if (negocio) {
      const titulo = negocio.es_demo
        ? `${negocio.nombre} — Demo | Black Sheep Agencia`
        : negocio.nombre;
      const descripcion = `${negocio.giro || 'Asistente de WhatsApp'}${negocio.ciudad ? ' en ' + negocio.ciudad : ''}. Escríbenos por WhatsApp.`;
      html = html
        .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(titulo)}</title>`)
        .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${escapeHtml(descripcion)}" />`);
    }
  } catch {
    // si falla la resolucion (ej. BD momentaneamente abajo), se sirve el HTML generico sin romper el sitio
  }
  res.set('Content-Type', 'text/html');
  res.send(html);
});

app.listen(config.port, () => {
  console.log(`Ecosistema FAQ Bot API escuchando en :${config.port}`);
});
