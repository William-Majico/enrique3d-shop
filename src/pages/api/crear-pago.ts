import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const wompiIdUrl = "https://id.wompi.sv/connect/token";
  const wompiApiUrl = "https://api.wompi.sv/EnlacePago";

  // 1. DETECCIÓN AUTOMÁTICA DE DOMINIO 🧠
  // Si Vercel dice que es Producción, usa tu dominio .shop. Si no, usa localhost.
  const baseUrl = import.meta.env.PROD 
    ? "https://enrique3d.shop" 
    : "http://localhost:4321";

  try {
    const body = await request.json();
    const { productId, nombreProducto, precio } = body; 

    // 2. Obtener Token de Wompi
    const authRes = await fetch(wompiIdUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: import.meta.env.WOMPI_APP_ID,
        client_secret: import.meta.env.WOMPI_API_SECRET,
        audience: 'wompi_api'
      })
    });
    
    if (!authRes.ok) {
        return new Response(JSON.stringify({ error: "Error Permisos Wompi (Token)" }), { status: 400 });
    }
    const tokenData = await authRes.json();
    const token = tokenData.access_token;

    // 3. Crear Enlace de Pago
    const linkRes = await fetch(wompiApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        IdentificadorEnlaceComercio: `ENRIQUE3D-${productId}-${Date.now()}`,
        Monto: parseFloat(precio), // Aseguramos que sea número
        NombreProducto: nombreProducto,
        FormaPago: { 
            PermitirTarjetaCreditoDebido: true,
            PermitirPagoConPuntoAgricola: false, // Wompi pide al menos uno true
            PermitirPagoEnCuotasAgricola: false,
            PermitirPagoEnBitcoin: false
        },
        Configuracion: {
            EsMontoEditable: false,
            EmailsNotificacion: "majicoenrique76@gmail.com", 
            // 4. USAMOS LA URL INTELIGENTE AQUÍ 👇
            UrlRedirect: `${baseUrl}/gracias`
        }
      })
    });

    const linkData = await linkRes.json();

    if (!linkRes.ok) {
        return new Response(JSON.stringify({ error: "Wompi rechazó la creación del enlace", detalle: linkData }), { status: 400 });
    }

    return new Response(JSON.stringify({ url: linkData.urlEnlace }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: (error as any).message }), { status: 500 });
  }
}