import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
    const { url, cookies, redirect } = context;

    // --- ZONA DE DEBUG ---
    // Intentamos leer la variable de todas las formas posibles
    // Nota: process.env funciona en Vercel Serverless (Node)
    const valorMantenimiento = import.meta.env.MODO_MANTENIMIENTO || process.env.MODO_MANTENIMIENTO || "false";
    
    // Convertimos a booleano real
    const mantenimientoActivo = valorMantenimiento === "true";

    // Imprimimos en la consola del servidor (Ver Logs en Vercel)
    console.log(`[MIDDLEWARE] Ruta: ${url.pathname} | Mantenimiento activo: ${mantenimientoActivo} | Valor Leído: "${valorMantenimiento}"`);
    // ---------------------

    // 1. LOGOUT
    if (url.searchParams.get("acceso") === "salir") {
        cookies.delete("admin_session", { path: "/" });
        return redirect("/mantenimiento");
    }

    // 2. EXCEPCIONES
    if (
        url.pathname.startsWith("/api/") ||
        url.pathname.startsWith("/assets/") ||
        url.pathname.startsWith("/favicon") ||
        url.pathname.includes(".")
    ) {
        return next();
    }

    // 3. LÓGICA /MANTENIMIENTO
    if (url.pathname === "/mantenimiento") {
        if (!mantenimientoActivo) {
            return redirect("/");
        }
        return next();
    }

    // 4. LOGIN
    if (url.searchParams.get("acceso") === "soyadmin") {
        cookies.set("admin_session", "true", { path: "/", maxAge: 60 * 60 * 24 });
        return redirect("/");
    }

    const esAdmin = cookies.get("admin_session")?.value === "true";

    // 5. BLOQUEO
    if (mantenimientoActivo && !esAdmin) {
        return redirect("/mantenimiento");
    }

    return next();
});