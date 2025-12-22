import type { APIRoute } from 'astro';
import { list } from '@vercel/blob';

export const GET: APIRoute = async () => {
  // Conectar a la Bóveda y pedir la lista de archivos
  const { blobs } = await list({
    token: import.meta.env.BLOB_READ_WRITE_TOKEN,
  });

  // Devolver la lista en pantalla para ver si funcionó
  return new Response(JSON.stringify(blobs, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
}