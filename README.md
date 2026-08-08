# Ecosistema FAQ Bot — moldeable por giro (Black Sheep Agencia)

Motor reusable para bots de WhatsApp vía **Chatwoot** (webhook) + **n8n** + **Redis** (buffer de
mensajes) + **Postgres** (multi-tenant), con un **panel web** para moldear el bot a cualquier
negocio sin tocar código ni el flujo de n8n.

Demo incluida: **Tacos Memo**, taquería en el Centro de Tulancingo, Hidalgo.

## Por qué es "moldeable"

Todo cuelga de la tabla `negocios` (ver `sql/01_schema.sql`):

- `giro`, `tono` y sobre todo `system_prompt` → definen cómo se comporta el agente de IA.
- `faq` → única fuente de verdad que el agente puede usar para responder (precios, horarios, catálogo…).
- `chatwoot_inbox_id` → así el flujo de n8n sabe, con un solo webhook central, a qué negocio
  pertenece cada conversación entrante (multi-tenant real, mismo patrón que `BLACKBOTRESPOND`).

Para convertir la demo de "taquería" a, por ejemplo, "venta de azulejos": se entra al panel
`/admin`, se edita el `system_prompt` y el `giro` del negocio, se reemplazan las filas de `faq`,
y listo — mismo flujo de n8n, mismo código, cero redeploy.

## Estructura

```
ecosistema-faq-bot/
├── sql/                     esquema Postgres multi-tenant + seed de Tacos Memo
├── server/                  API Express + pg (sitio público + panel admin)
├── client/                  React + Vite: sitio público de Tacos Memo + panel /admin
└── n8n/                     flujo de n8n (JSON) — Chatwoot → Redis → Postgres → IA → Chatwoot
```

## Cómo correrlo en local

```bash
# 1. Base de datos (usa un Postgres local o uno de prueba en Easypanel)
psql "$DATABASE_URL" -f sql/01_schema.sql
psql "$DATABASE_URL" -f sql/02_usuarios.sql   # opcional, roles separados
psql "$DATABASE_URL" -f sql/03_seed_tacos_memo.sql

# 2. Generar el hash real del admin de Tacos Memo (reemplaza __HASH_BCRYPT__ en 03_seed_tacos_memo.sql)
cd server && npm install
node -e "require('bcryptjs').hash('TacosMemo2026', 10).then(h => console.log(h))"

# 3. Backend
DATABASE_URL=postgres://user:pass@host:5432/db JWT_SECRET=algo-largo npm start

# 4. Frontend (otra terminal)
cd ../client && npm install && npm run dev
```

Sitio público: `http://localhost:5173/` · Panel: `http://localhost:5173/admin/login`
(usuario `admin@tacosmemo.com`, contraseña la que hayas hasheado en el paso 2).

## Despliegue (Easypanel, patrón de la agencia)

Igual que Sianna Travel / Wolf Daniels / Black Sheep:

1. **Postgres**: servicio nuevo en Easypanel (o reusar uno existente con una BD nueva),
   correr los 3 scripts SQL vía DBGate. Puerto **cerrado** a internet — solo host interno.
2. **App** (este repo): build Nixpacks — `cd client && npm install && npm run build && cd ../server && npm install`,
   start `cd server && npm start`. Variables: `DATABASE_URL` (host interno del Postgres),
   `JWT_SECRET`, `COOKIE_SECURE=1`, `PORT=3001`. Opcionales para notificaciones push del panel
   admin (ver sección de Notificaciones push más abajo): `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
   `BOT_PUSH_SECRET`.
3. **Chatwoot**: ya existe en tu Easypanel (el mismo que usa `BLACKBOTRESPOND`). Solo falta:
   - Crear un **inbox** para el número de WhatsApp de Tacos Memo (o de la demo que sea).
   - Copiar el `inbox_id` y el `account_id` de Chatwoot y guardarlos en el panel `/admin`
     (editor del negocio) o directo en la tabla `negocios`.
   - Configurar en el inbox de Chatwoot el webhook hacia n8n: evento `message_created`.
4. **n8n**: importar `n8n/ecosistema-faq-bot-flow.json`. Configurar credenciales de Postgres,
   Redis y OpenAI (los `REPLACE_ME` del JSON), y las variables de entorno del entorno de n8n
   `CHATWOOT_BASE_URL` y `CHATWOOT_API_TOKEN` (token de acceso de la cuenta de Chatwoot).

## Notificaciones push del panel admin

El panel (`/admin`) puede avisar "te llegó un pedido/cita/reserva/solicitud nuevo" vía Web Push
(instalable como PWA en Android, y en iOS 16.4+ solo si se agrega a pantalla de inicio — Safari
en pestaña normal de iPhone no soporta Push API, así que ahí cae a un fallback que solo avisa
mientras el panel sigue abierto en esa pestaña).

1. Generar llaves VAPID una sola vez: `npx web-push generate-vapid-keys` (o
   `node -e "console.log(require('web-push').generateVAPIDKeys())"` desde `server/`).
2. Configurar en el servicio del server en Easypanel: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
   y `BOT_PUSH_SECRET` (cualquier string largo aleatorio — protege el endpoint que llama n8n).
3. **Pendiente, requiere editar el flujo real de n8n**: después de cada nodo que inserta en
   `pedidos`/`citas`/`reservas`/`solicitudes`, agregar un nodo HTTP Request que llame
   `POST {APP_URL}/api/public/bot/notificar` con header `x-bot-secret: {BOT_PUSH_SECRET}` y body
   `{ negocioId, titulo, cuerpo }` — sin este paso, la infraestructura de push está lista pero
   nunca se dispara (los inserts van directo a Postgres desde n8n, no pasan por la API).

## Radar de FAQ ("qué le falta a mi bot")

El panel de FAQ (`/admin/negocios/:id/faq`) puede mostrarle al cliente preguntas reales que su
bot no supo responder o que hicieron escalar rápido la conversación, con un botón "Convertir en
FAQ" para llenar el hueco de un clic. La infraestructura (tabla `radar_faq`, endpoints, UI) ya
está lista y verificada; falta conectar los disparadores en n8n.

**Pendiente, requiere editar el flujo real de n8n a mano** (no vía MCP/código — reconstruir el
workflow completo de 47 nodos desde SDK es demasiado riesgo para producción; se agregan estos
nodos manualmente en la UI de n8n, mismo patrón que las notificaciones push arriba):

1. **Motivos de escalación** (`intencion_compra` | `quiere_asesor` | `cansado_bot`): después del
   nodo `Detectar Escalacion`, agregar un nodo HTTP Request (en paralelo, sin bloquear la
   respuesta al cliente) que llame `POST {APP_URL}/api/public/bot/radar` con header
   `x-bot-secret: {BOT_PUSH_SECRET}` y body:
   ```json
   { "negocioId": {{ $('Obtener Negocio (por inbox)').first().json.id }}, "pregunta": "{{ $('Combinar Mensajes del Buffer').first().json.mensajeCombinado }}", "motivo": "{{ $('Detectar Escalacion').first().json.motivo }}" }
   ```
   Usa **"Using Fields Below"** para el body (no texto JSON crudo) — un mensaje real con salto de
   línea o comillas rompe el JSON armado a mano, ya pasó una vez con las notificaciones push.
2. **Sin información** (`sin_info`) — **descartado por ahora, decisión del usuario (2026-08-08)**:
   se evaluó detectarlo con un IF que buscara frases tipo "no tengo esa información" en la
   respuesta del agente (nodo `Agente Respuesta (moldeable por negocio)`, campo `output`), pero
   un LLM varía demasiado cómo redacta "no sé" — ese heurístico dejaría pasar la mayoría de los
   casos reales (falsos negativos), así que no vale la pena la superficie de riesgo para el
   beneficio que da. La forma confiable sería la misma técnica que ya usa el sistema para
   escalación: que el agente emita un marcador fijo (ej. `[SIN_INFO]`) cuando no encuentra la
   respuesta en el FAQ — pero eso significa tocar el **prompt base compartido** del agente (la
   instrucción que envuelve el `system_prompt` de cada negocio y es igual para todos), un cambio
   de comportamiento central, no una rama nueva en paralelo como todo lo demás de esta sección.
   Si se retoma en el futuro, confirmar antes de tocar ese prompt compartido.

## Pendiente / decisiones que requieren al usuario (no ejecutable desde aquí)

- Confirmar en qué proyecto/servicio exacto de Easypanel vive la instancia de Chatwoot y su
  Postgres (`chatwoot-db`), para decidir si el Postgres de este ecosistema va en el mismo
  proyecto o en uno aparte (ver nota de Wolf Daniels en Obsidian sobre `BLACKBOTRESPOND`).
- Dar de alta el número de WhatsApp de Tacos Memo en Chatwoot (Embedded Signup de Meta, vía
  el estatus de Tech Provider de `BLACKBOTRESPOND`).
- Importar y activar el flujo en n8n, cargar credenciales reales.
- Cambiar el hash de contraseña placeholder del admin antes de usar en producción.
