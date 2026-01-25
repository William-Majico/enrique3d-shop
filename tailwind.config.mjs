/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	darkMode: 'class', // Activamos modo oscuro manual
	theme: {
		extend: {
			colors: {
				'warm-cream': '#faf8f5',
				'warm-dark-bg': '#0f1117',
			},
		},
	},
	plugins: [],
};