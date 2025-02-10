import { nextui } from '@nextui-org/theme';
import type { Config } from "tailwindcss";

// Required dependencies
const colors = require("tailwindcss/colors");
const {
	default: flattenColorPalette,
} = require("tailwindcss/lib/util/flattenColorPalette");

/**
 * Custom plugin to add CSS variables for colors
 */
function addVariablesForColors({ addBase, theme }: any) {
	let allColors = flattenColorPalette(theme("colors"));

	// Filter and add only valid string colors
	let newVars = Object.fromEntries(
		Object.entries(allColors)
			.filter(([_, val]) => typeof val === "string")
			.map(([key, val]) => [`--${key}`, val])
	);

	addBase({
		":root": newVars, // Adds the variables to :root
	});
}

const config: Config = {
	content: [
		"./src/**/*.{ts,tsx}",
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
		"./node_modules/@nextui-org/theme/dist/components/navbar.js"
	],
	darkMode: "class", // Enable class-based dark mode
	theme: {
		extend: {
			boxShadow: {
				input: `0px 2px 3px -1px rgba(0,0,0,0.1), 0px 1px 0px 0px rgba(25,28,33,0.02), 0px 0px 0px 1px rgba(25,28,33,0.08)`,
			},
			colors: {
				background: 'hsl(var(--background, 220 14% 96%))', // Fallback provided
				foreground: 'hsl(var(--foreground, 220 14% 24%))',
				card: {
					DEFAULT: 'hsl(var(--card, 0 0% 100%))',
					foreground: 'hsl(var(--card-foreground, 0 0% 20%))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover, 220 10% 98%))',
					foreground: 'hsl(var(--popover-foreground, 220 10% 10%))',
				},
				primary: {
					DEFAULT: 'hsl(var(--primary, 220 90% 56%))',
					foreground: 'hsl(var(--primary-foreground, 0 0% 100%))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary, 220 14% 96%))',
					foreground: 'hsl(var(--secondary-foreground, 220 14% 24%))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted, 220 10% 90%))',
					foreground: 'hsl(var(--muted-foreground, 220 10% 30%))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent, 220 70% 50%))',
					foreground: 'hsl(var(--accent-foreground, 220 70% 10%))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive, 0 70% 50%))',
					foreground: 'hsl(var(--destructive-foreground, 0 70% 10%))',
				},
				border: 'hsl(var(--border, 220 14% 90%))',
				input: 'hsl(var(--input, 220 14% 96%))',
				ring: 'hsl(var(--ring, 220 90% 56%))',
				chart: {
					1: 'hsl(var(--chart-1, 220 80% 50%))',
					2: 'hsl(var(--chart-2, 220 60% 50%))',
					3: 'hsl(var(--chart-3, 220 40% 50%))',
					4: 'hsl(var(--chart-4, 220 20% 50%))',
					5: 'hsl(var(--chart-5, 220 10% 50%))',
				},
			},
			borderRadius: {
				lg: 'var(--radius, 12px)',
				md: 'calc(var(--radius, 12px) - 2px)',
				sm: 'calc(var(--radius, 12px) - 4px)',
			},
		},
	},
	plugins: [
		addVariablesForColors, // Custom plugin to add color variables
		nextui(), // NextUI plugin
		require("tailwindcss-animate"), // For animations
	],
};

module.exports = config;
