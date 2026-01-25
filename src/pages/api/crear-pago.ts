import type { APIRoute } from 'astro';
// Importamos tu base de datos para asegurar el precio correcto
import products from '../../data/products.json';

export const POST: APIRoute = async ({ request }) => {
  // 1. CONFIGURACIÓN
  // Detecta si es producción o local para generar los links de retorno correctamente
  const isProd = import.meta.env.PROD;
  const baseUrl = isProd ? "https://enrique3d.shop" : "http://localhost:4321";
  
  // Endpoint de n1co (Si en el futuro te dan acceso a producción real, cambia .shop por .com si es necesario)
  // CAMBIO: Usamos .com en lugar de .shop
  const N1CO_API_URL = "https://api.n1co.com/paymentlink/checkout";

  // Leemos las credenciales seguras
  const N1CO_SECRET = import.meta.env.N1CO_SECRET;
  const N1CO_LOCATION_CODE = import.meta.env.N1CO_LOCATION_CODE;

  try {
    const body = await request.json();
    const { productId } = body; 

    // 2. SEGURIDAD: Buscamos el producto real
    const product = products.find(p => p.id === productId);

    if (!product) {
      return new Response(JSON.stringify({ error: "Producto no encontrado" }), { status: 404 });
    }

    // Verificamos que las llaves existan para no dar errores raros
    if (!N1CO_SECRET || !N1CO_LOCATION_CODE) {
      console.error("Faltan credenciales de N1CO");
      return new Response(JSON.stringify({ error: "Error de configuración en el servidor" }), { status: 500 });
    }

    // 3. PREPARAR IMAGEN ABSOLUTA
    // n1co necesita la URL completa (https://...) para mostrar la foto
    const imagenAbsoluta = product.images[0].startsWith("http") 
      ? product.images[0] 
      : `${baseUrl}${product.images[0]}`;

    // 4. CREAR EL PAYLOAD (DATOS) PARA N1CO
    const n1coPayload = {
      orderReference: `E3D-${product.id}-${Date.now()}`, // ID único de orden
      orderName: "Enrique3D Shop",
      orderDescription: `Compra de asset: ${product.title}`,
      amount: parseFloat(product.price), 
      locationCode: N1CO_LOCATION_CODE, 
      currency: "USD",
      // Redirecciones
      successUrl: `${baseUrl}/gracias`, 
      cancelUrl: `${baseUrl}/producto/${product.id}`, // Si cancela, vuelve al producto
      // Detalle visual (Ticket de compra)
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

    // 5. ENVIAR A N1CO
    const response = await fetch(N1CO_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${N1CO_SECRET}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(n1coPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error N1CO:", data);
      return new Response(JSON.stringify({ error: "La pasarela rechazó la solicitud", detalle: data }), { status: 400 });
    }

    // Extraemos la URL de pago
    const urlPago = data.paymentLinkUrl || data.url || data.data?.url;

    if (!urlPago) {
       return new Response(JSON.stringify({ error: "No se recibió enlace de pago" }), { status: 500 });
    }

    // Devolvemos la URL al frontend para que redirija
    return new Response(JSON.stringify({ url: urlPago }), { status: 200 });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: (error as any).message }), { status: 500 });
  }
}