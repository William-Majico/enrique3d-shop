import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const wompiIdUrl = "https://id.wompi.sv/connect/token";
  const wompiApiUrl = "https://api.wompi.sv/EnlacePago";

  try {
    const body = await request.json();
    // 1. AQUI RECIBIMOS EL ID QUE FALTABA 👇
    const { productId, nombreProducto, precio } = body; 

    // Obtener Token
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
        return new Response(JSON.stringify({ error: "Error Permisos" }), { status: 400 });
    }
    const tokenData = await authRes.json();
    const token = tokenData.access_token;

    // Crear Enlace
    const linkRes = await fetch(wompiApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // 🔴 2. AQUI AGREGAMOS EL ID AL TICKET (REFERENCIA)
        IdentificadorEnlaceComercio: `ENRIQUE3D-${productId}-${Date.now()}`,
        Monto: precio,
        NombreProducto: nombreProducto,
        FormaPago: { 
            PermitirTarjetaCreditoDebido: true,
            PermitirPagoConPuntoAgricola: false,
            PermitirPagoEnCuotasAgricola: false,
            PermitirPagoEnBitcoin: false
        },
        Configuracion: {
            EsMontoEditable: false,
            EmailsNotificacion: "majicoenrique76@gmail.com", // Tu correo
            UrlRedirect: "http://localhost:4321/gracias"
        }
      })
    });

    const linkData = await linkRes.json();

    if (!linkRes.ok) {
        return new Response(JSON.stringify({ error: "Wompi rechazó la venta", detalle: linkData }), { status: 400 });
    }

    return new Response(JSON.stringify({ url: linkData.urlEnlace }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: (error as any).message }), { status: 500 });
  }
}