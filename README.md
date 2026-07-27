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
   `JWT_SECRET`, `COOKIE_SECURE=1`, `PORT=3001`.
3. **Chatwoot**: ya existe en tu Easypanel (el mismo que usa `BLACKBOTRESPOND`). Solo falta:
   - Crear un **inbox** para el número de WhatsApp de Tacos Memo (o de la demo que sea).
   - Copiar el `inbox_id` y el `account_id` de Chatwoot y guardarlos en el panel `/admin`
     (editor del negocio) o directo en la tabla `negocios`.
   - Configurar en el inbox de Chatwoot el webhook hacia n8n: evento `message_created`.
4. **n8n**: importar `n8n/ecosistema-faq-bot-flow.json`. Configurar credenciales de Postgres,
   Redis y OpenAI (los `REPLACE_ME` del JSON), y las variables de entorno del entorno de n8n
   `CHATWOOT_BASE_URL` y `CHATWOOT_API_TOKEN` (token de acceso de la cuenta de Chatwoot).

## Pendiente / decisiones que requieren al usuario (no ejecutable desde aquí)

- Confirmar en qué proyecto/servicio exacto de Easypanel vive la instancia de Chatwoot y su
  Postgres (`chatwoot-db`), para decidir si el Postgres de este ecosistema va en el mismo
  proyecto o en uno aparte (ver nota de Wolf Daniels en Obsidian sobre `BLACKBOTRESPOND`).
- Dar de alta el número de WhatsApp de Tacos Memo en Chatwoot (Embedded Signup de Meta, vía
  el estatus de Tech Provider de `BLACKBOTRESPOND`).
- Importar y activar el flujo en n8n, cargar credenciales reales.
- Cambiar el hash de contraseña placeholder del admin antes de usar en producción.
