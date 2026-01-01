import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
    const { url, cookies, redirect } = context;
    const mantenimientoActivo = import.meta.env.MODO_MANTENIMIENTO === "true";

    // 1. LOGOUT (Cerrar sesión de admin)
    if (url.searchParams.get("acceso") === "salir") {
        cookies.delete("admin_session", { path: "/" });
        return redirect("/mantenimiento");
    }

    // 2. EXCEPCIONES TÉCNICAS (Archivos que SIEMPRE deben cargar)
    // NOTA: Quitamos "/mantenimiento" de aquí para manejarlo con lógica estricta abajo
    if (
        url.pathname.startsWith("/api/") ||
        url.pathname.startsWith("/assets/") ||
        url.pathname.startsWith("/favicon") ||
        url.pathname.includes(".") // Detecta archivos como .css, .js, .svg, .png
    ) {
        return next();
    }

    // 3. LÓGICA DE LA PÁGINA DE MANTENIMIENTO (¡Aquí estaba el error!) 🚨
    if (url.pathname === "/mantenimiento") {
        // Si el mantenimiento está APAGADO, redirigir al Home
        if (!mantenimientoActivo) {
            return redirect("/");
        }
        // Si el mantenimiento está ENCENDIDO, dejar ver la página
        return next();
    }

    // 4. LOGIN (Puerta trasera para ti)
    if (url.searchParams.get("acceso") === "soyadmin") {
        cookies.set("admin_session", "true", { path: "/", maxAge: 60 * 60 * 24 });
        return redirect("/");
    }

    // Verificar si eres Admin
    const esAdmin = cookies.get("admin_session")?.value === "true";

    // 5. BLOQUEO DE SEGURIDAD
    // Si mantenimiento está ON y NO eres admin -> Mandar a mantenimiento
    if (mantenimientoActivo && !esAdmin) {
        return redirect("/mantenimiento");
    }

    // Si todo está bien, dejar pasa
    return next();
    
});