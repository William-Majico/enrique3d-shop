/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	darkMode: 'class', // Activa el modo oscuro
	theme: {
		extend: {
			colors: {
				// Aquí recuperamos tu paleta "Warm" personalizada
				warm: {
					cream: '#faf8f5',      // Color de fondo crema suave
					terracotta: '#f97316', // Tu naranja principal (orange-500)
					'terracotta-light': '#fb923c', // Naranja más claro para hovers
					'dark-bg': '#111827',  // Fondo oscuro (gray-900)
					'dark-card': '#1f2937', // Fondo de tarjetas oscuro (gray-800)
					charcoal: '#1f2937',   // Gris carbón para textos
					grey: '#9ca3af',       // Gris medio
				}
			}
		},
	},
	plugins: [],
}