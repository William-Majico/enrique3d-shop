import type { APIRoute } from 'astro';
import products from '../../data/products.json';

export const POST: APIRoute = async ({ request }) => {
  // 1. CONFIGURACIÓN BÁSICA
  const isProd = import.meta.env.PROD;
  const baseUrl = isProd ? "https://enrique3d.shop" : "http://localhost:4321";
  
  // URL OFICIAL DE PRODUCCIÓN DE N1CO
  const N1CO_API_URL = "https://api-pay.n1co.shop/api/paymentlink/checkout"; 
  const N1CO_SECRET = import.meta.env.N1CO_SECRET;
  const N1CO_LOCATION_CODE = import.meta.env.N1CO_LOCATION_CODE;

  try {
    const body = await request.json();
    const { productId } = body; 

    if (!productId || typeof productId !== 'string') {
      return new Response(JSON.stringify({ error: "ID de producto inválido o ausente" }), { status: 400 });
    }

    // 2. SEGURIDAD: Validamos que el producto exista en tu base de datos
    const product = products.find(p => p.id === productId);

    if (!product) {
      return new Response(JSON.stringify({ error: "Producto no encontrado" }), { status: 404 });
    }

    // 3. SEGURIDAD: Verificamos credenciales del servidor
    if (!N1CO_SECRET || !N1CO_LOCATION_CODE) {
      console.error("Faltan credenciales en el servidor");
      return new Response(JSON.stringify({ error: "Error interno de configuración" }), { status: 500 });
    }

    const imagenAbsoluta = product.images[0].startsWith("http") 
      ? product.images[0] 
      : `${baseUrl}${product.images[0]}`;

    // 4. PREPARAMOS LOS DATOS PARA N1CO
    // Nota: successUrl incluye ?id=... para que la página de gracias sepa qué mostrar
    const n1coPayload = {
      orderReference: `E3D-${product.id}-${Date.now()}`, 
      orderName: "Enrique3D Shop",
      orderDescription: `Compra: ${product.title}`,
      locationCode: N1CO_LOCATION_CODE, 
      currency: "USD",
      successUrl: `${baseUrl}/gracias?id=${product.id}`, 
      cancelUrl: `${baseUrl}/producto/${product.id}`,
      lineItems: [
        {
          product: {
            name: product.title,
            price: parseFloat(product.price),
            imageUrl: imagenAbsoluta,
            requiresShipping: false,
            sku: product.id
          },
          quantity: 1
        }
      ]
    };

    console.log("Iniciando cobro real con N1CO...");

    // 5. CONEXIÓN CON LA PASARELA
    const response = await fetch(N1CO_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${N1CO_SECRET}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(n1coPayload)
    });

    // Manejo de respuesta (Text primero para evitar errores de parseo)
    const rawText = await response.text();
    let data;
    try {
        data = JSON.parse(rawText);
    } catch (e) {
        console.error("Error crítico: N1CO no devolvió JSON", rawText);
        return new Response(JSON.stringify({ error: "Error de comunicación con el banco" }), { status: 500 });
    }

    if (!response.ok) {
      console.error("Cobro rechazado por N1CO:", data);
      return new Response(JSON.stringify({ error: "No se pudo procesar el pago", detalle: data }), { status: 400 });
    }

    // Obtenemos la URL de pago
    const urlPago = data.paymentLinkUrl || data.url || data.data?.url || data.data?.paymentLinkUrl;

    if (!urlPago) {
       return new Response(JSON.stringify({ error: "No se recibió enlace de pago" }), { status: 500 });
    }

    // 6. ÉXITO: Enviamos al cliente a pagar
    return new Response(JSON.stringify({ url: urlPago }), { status: 200 });

  } catch (error) {
    console.error("Error del servidor:", error);
    return new Response(JSON.stringify({ error: "Error interno del servidor" }), { status: 500 });
  }
}