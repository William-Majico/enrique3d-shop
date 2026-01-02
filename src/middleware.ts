import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
    const { url, cookies, redirect } = context;

    // 1. LECTURA ROBUSTA DE LA VARIABLE
    // Leemos la variable y nos aseguramos de que sea texto (String)
    let valorRaw = import.meta.env.MODO_MANTENIMIENTO || process.env.MODO_MANTENIMIENTO || "false";
    
    // LIMPIEZA: Convertimos a minúsculas y quitamos espacios accidentales
    // Ejemplo: "True " -> "true"
    const valorLimpio = String(valorRaw).toLowerCase().trim();
    
    const mantenimientoActivo = valorLimpio === "true";

    // Debug en logs (opcional, para que veas qué está leyendo realmente)
    console.log(`[MIDDLEWARE] Mantenimiento: ${mantenimientoActivo} (Leído: "${valorRaw}")`);

    // 2. LOGOUT
    if (url.searchParams.get("acceso") === "salir") {
        cookies.delete("admin_session", { path: "/" });
        return redirect("/mantenimiento");
    }

    // 3. EXCEPCIONES (Archivos estáticos y API)
    if (
        url.pathname.startsWith("/api/") ||
        url.pathname.startsWith("/assets/") ||
        url.pathname.startsWith("/favicon") ||
        url.pathname.includes(".")
    ) {
        return next();
    }

    // 4. LÓGICA DE LA PÁGINA /MANTENIMIENTO
    if (url.pathname === "/mantenimiento") {
        // Si NO hay mantenimiento, echamos al usuario al Home
        if (!mantenimientoActivo) {
            return redirect("/");
        }
        return next();
    }

    // 5. LOGIN (Puerta trasera)
    if (url.searchParams.get("acceso") === "soyadmin") {
        cookies.set("admin_session", "true", { path: "/", maxAge: 60 * 60 * 24 });
        return redirect("/");
    }

    const esAdmin = cookies.get("admin_session")?.value === "true";

    // 6. BLOQUEO FINAL
    if (mantenimientoActivo && !esAdmin) {
        return redirect("/mantenimiento");
    }

    return next();
});