import type { APIRoute } from 'astro';
// IMPORTANTE: Importamos tu "base de datos" para verificar precios reales
import products from '../../data/products.json';

export const POST: APIRoute = async ({ request }) => {
  const wompiIdUrl = "https://id.wompi.sv/connect/token";
  const wompiApiUrl = "https://api.wompi.sv/EnlacePago";

  // Detección de entorno
  const baseUrl = import.meta.env.PROD 
    ? "https://enrique3d.shop" 
    : "http://localhost:4321";

  try {
    const body = await request.json();
    const { productId } = body; // Ya no aceptamos ni precio ni nombre del cliente

    // 1. VERIFICACIÓN DE SEGURIDAD 🛡️
    // Buscamos el producto en nuestra lista oficial
    const product = products.find(p => p.id === productId);

    if (!product) {
        return new Response(JSON.stringify({ error: "Producto no encontrado o no válido" }), { status: 404 });
    }

    // Usamos LOS DATOS DEL JSON, no los que envía el usuario
    const precioReal = parseFloat(product.price);
    const nombreReal = product.title;

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
        return new Response(JSON.stringify({ error: "Error de conexión con Wompi (Token)" }), { status: 500 });
    }
    const tokenData = await authRes.json();
    const token = tokenData.access_token;

    // 3. Crear Enlace de Pago con datos verificados
    const linkRes = await fetch(wompiApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        IdentificadorEnlaceComercio: `ENRIQUE3D-${product.id}-${Date.now()}`,
        Monto: precioReal, // ¡Precio seguro!
        NombreProducto: nombreReal,
        FormaPago: { 
            PermitirTarjetaCreditoDebido: true,
            PermitirPagoConPuntoAgricola: false,
            PermitirPagoEnCuotasAgricola: false,
            PermitirPagoEnBitcoin: false
        },
        Configuracion: {
            EsMontoEditable: false,
            EmailsNotificacion: import.meta.env.WOMPI_EMAIL_NOTIF, // Usamos variable de entorno si existe
            UrlRedirect: `${baseUrl}/gracias`
        }
      })
    });

    const linkData = await linkRes.json();

    if (!linkRes.ok) {
        return new Response(JSON.stringify({ error: "Wompi rechazó la creación", detalle: linkData }), { status: 400 });
    }

    return new Response(JSON.stringify({ url: linkData.urlEnlace }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: (error as any).message }), { status: 500 });
  }
}