import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  // 1. Datos de tus llaves
  const appId = import.meta.env.WOMPI_APP_ID;
  const apiSecret = import.meta.env.WOMPI_API_SECRET;
  
  // 🔴 CORRECCIÓN CLAVE: Wompi usa esta URL especial solo para dar permisos
  const urlAutenticacion = "https://id.wompi.sv/connect/token";

  try {
    // 2. Pedimos el Token a la oficina de Identidad
    const respuesta = await fetch(urlAutenticacion, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: appId,
        client_secret: apiSecret,
        audience: 'wompi_api'
      })
    });

    // 3. Verificamos si Wompi nos dio el visto bueno ANTES de leer el JSON
    if (!respuesta.ok) {
        const errorTexto = await respuesta.text(); // Leemos texto por si no es JSON
        return new Response(JSON.stringify({ 
            estado: 'Error', 
            codigo: respuesta.status, 
            mensaje: 'Wompi no nos dio el token',
            detalle: errorTexto
        }), { status: 400 });
    }

    // 4. Si todo salió bien, leemos el token
    const datos = await respuesta.json();

    return new Response(JSON.stringify({ 
      estado: 'Éxito', 
      mensaje: '¡Conexión con Wompi establecida correctamente!', 
      token_tipo: datos.token_type,
      // Solo mostramos los primeros 5 caracteres por seguridad
      token_preview: datos.access_token ? datos.access_token.substring(0, 10) + '...' : 'No recibido'
    }, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: (error as any).message }), { status: 500 });
  }
}