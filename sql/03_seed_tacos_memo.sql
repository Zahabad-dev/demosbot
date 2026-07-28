-- Seed de demo: TACOS MEMO (taquería, Centro de Tulancingo, Hidalgo)
-- Este archivo es el ejemplo de "moldeado" del ecosistema a un giro concreto.
-- Para moldear a otro giro (ej. venta de azulejos), duplica este bloque cambiando
-- nombre/giro/system_prompt/FAQ — no se toca ni el esquema ni el flujo de n8n.

-- ⚠️ chatwoot_inbox_id debe coincidir con el "inbox_id" real que manda Chatwoot en el webhook
-- (Settings → Inboxes → el inbox conectado). Sin este dato correcto, el flujo de n8n no
-- encuentra el negocio y el nodo "Obtener Negocio (por inbox)" no devuelve filas.
INSERT INTO negocios (slug, nombre, giro, ciudad, tono, system_prompt, whatsapp_numero, chatwoot_inbox_id, activo)
VALUES (
  'tacos-memo',
  'Tacos Memo',
  'taqueria',
  'Tulancingo de Bravo, Hidalgo',
  'amigable',
  'Eres el asistente de WhatsApp de Tacos Memo, una taquería ubicada en el Centro de Tulancingo, Hidalgo. '
  || 'Responde siempre en español, tono cálido y directo, como si atendieras el mostrador. '
  || 'Usa ÚNICAMENTE la información de "PREGUNTAS FRECUENTES" para precios, horarios, menú y ubicación — '
  || 'nunca inventes precios ni platillos que no estén ahí. '
  || 'Si preguntan algo que no está en las FAQ, o quieren hacer un pedido grande/para evento, '
  || 'dile que un encargado de la taquería le va a escribir en un momento y marca la conversación para escalar. '
  || 'Sé breve: máximo 3-4 líneas por respuesta, como un mensaje real de WhatsApp.',
  '',
  '1',
  true
)
ON CONFLICT (slug) DO NOTHING;

-- FAQ de ejemplo para Tacos Memo (editable desde el panel /admin)
INSERT INTO faq (negocio_id, categoria, pregunta, respuesta, orden)
SELECT n.id, v.categoria, v.pregunta, v.respuesta, v.orden
FROM negocios n,
(VALUES
  ('horarios', '¿Cuál es su horario?', 'Abrimos todos los días de 6:00 pm a 1:00 am. Los viernes y sábados cerramos un poco más tarde.', 1),
  ('ubicacion', '¿Dónde están ubicados?', 'Estamos en el Centro de Tulancingo, Hidalgo. Te compartimos la ubicación exacta en Google Maps: https://maps.google.com/?q=Tacos+Memo+Tulancingo', 2),
  ('menu', '¿Qué tipos de tacos manejan?', 'Manejamos pastor, bistec, chorizo, suadero y campechano. Orden de 4 tacos, con su salsa, cebolla y limón incluidos.', 3),
  ('precios', '¿Cuánto cuestan los tacos?', 'Los tacos sencillos están en $18 c/u, la orden de 4 en $65. El campechano tiene $5 extra por taco.', 4),
  ('pedidos', '¿Hacen pedidos para llevar o a domicilio?', 'Sí, para llevar los tienes listos en 15-20 min. A domicilio manejamos zona centro, con un mínimo de $150 de compra.', 5),
  ('pago', '¿Aceptan tarjeta?', 'Aceptamos efectivo y tarjeta (débito/crédito) en el local. Para domicilio, de momento solo efectivo o transferencia.', 6)
) AS v(categoria, pregunta, respuesta, orden)
WHERE n.slug = 'tacos-memo'
ON CONFLICT DO NOTHING;

-- Link de ejemplo (ubicación, para que el bot lo pueda mandar directo)
INSERT INTO links (negocio_id, clave, url, descripcion)
SELECT n.id, 'ubicacion_maps', 'https://maps.google.com/?q=Tacos+Memo+Tulancingo', 'Ubicación en Google Maps'
FROM negocios n WHERE n.slug = 'tacos-memo'
ON CONFLICT (negocio_id, clave) DO NOTHING;

-- Usuario admin inicial para el panel (rol 'cliente', scoped a Tacos Memo).
-- ⚠️ El hash de abajo es PLACEHOLDER. Genera el real así, desde ecosistema-faq-bot/server:
--   npm install
--   node -e "require('bcryptjs').hash('TacosMemo2026', 10).then(h => console.log(h))"
-- y reemplaza __HASH_BCRYPT__ antes de correr este script.
INSERT INTO admin_users (negocio_id, username, password_hash, nombre, rol)
SELECT n.id, 'admin@tacosmemo.com', '__HASH_BCRYPT__', 'Admin Tacos Memo', 'cliente'
FROM negocios n WHERE n.slug = 'tacos-memo'
ON CONFLICT (username) DO NOTHING;

-- Acceso adicional para demos de la agencia (mismo privilegio 'cliente', mismo negocio).
-- ⚠️ Igual que arriba: __HASH_BCRYPT__ es placeholder, genera el hash real antes de correr.
INSERT INTO admin_users (negocio_id, username, password_hash, nombre, rol)
SELECT n.id, 'demo@blackzpr.com', '__HASH_BCRYPT__', 'Demo Black Sheep', 'cliente'
FROM negocios n WHERE n.slug = 'tacos-memo'
ON CONFLICT (username) DO NOTHING;
