import type { APIRoute } from 'astro';
import { createClient } from '@vercel/kv';

export const GET: APIRoute = async () => {
  // CONEXIÓN MANUAL: Le damos las llaves en la mano
  const kv = createClient({
    url: import.meta.env.KV_REST_API_URL,
    token: import.meta.env.KV_REST_API_TOKEN,
  });

  // 1. Guardar dato
  await kv.set('saludo', '¡Hola Enrique! Conexión manual exitosa 🚀');

  // 2. Leer dato
  const dato = await kv.get('saludo');

  // 3. Responder
  return new Response(JSON.stringify({ estado: 'Conectado', mensaje: dato }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}