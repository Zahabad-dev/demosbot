import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/apiClient';

export default function NegocioEditor() {
  const { negocioId } = useParams();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/admin/negocios/${negocioId}`).then(setForm).catch((e) => setError(e.message));
  }, [negocioId]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const onSave = async (e) => {
    e.preventDefault();
    setSaved(false);
    setError('');
    try {
      const updated = await api.put(`/admin/negocios/${negocioId}`, form);
      setForm(updated);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!form) return <p>Cargando…</p>;

  return (
    <div>
      <h1>Moldear bot: {form.nombre}</h1>
      <p style={{ color: '#9aa1ad' }}>
        Este es el panel que hace al bot moldeable: cambia el giro, el tono y las instrucciones
        (system prompt) del agente de IA para convertirlo en cualquier negocio — sin tocar n8n.
      </p>
      <form onSubmit={onSave}>
        <div className="field">
          <label>Nombre del negocio</label>
          <input value={form.nombre} onChange={set('nombre')} />
        </div>
        <div className="field">
          <label>Giro (ej. taqueria, venta de azulejos, veterinaria...)</label>
          <input value={form.giro} onChange={set('giro')} />
        </div>
        <div className="field">
          <label>Ciudad</label>
          <input value={form.ciudad || ''} onChange={set('ciudad')} />
        </div>
        <div className="field">
          <label>Tono</label>
          <select value={form.tono} onChange={set('tono')}>
            <option value="amigable">Amigable</option>
            <option value="formal">Formal</option>
            <option value="divertido">Divertido</option>
            <option value="tecnico">Técnico</option>
          </select>
        </div>
        <div className="field">
          <label>System prompt (instrucciones del agente IA)</label>
          <textarea value={form.system_prompt} onChange={set('system_prompt')} rows={10} />
        </div>
        <div className="field">
          <label>Número de WhatsApp</label>
          <input value={form.whatsapp_numero || ''} onChange={set('whatsapp_numero')} />
        </div>
        <div className="field">
          <label>Chatwoot Inbox ID</label>
          <input value={form.chatwoot_inbox_id || ''} onChange={set('chatwoot_inbox_id')} />
        </div>
        <div className="field">
          <label>Chatwoot Account ID</label>
          <input value={form.chatwoot_account_id || ''} onChange={set('chatwoot_account_id')} />
        </div>
        {error && <p className="error-msg">{error}</p>}
        {saved && <p style={{ color: '#8fd18f' }}>Guardado.</p>}
        <button type="submit">Guardar cambios</button>
      </form>
    </div>
  );
}
