const fs = require('fs');

const css = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 98%; /* soft gray so white cards pop */
    --foreground: 240 10% 3.9%;
    
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
    
    --radius: 0.5rem;

    --sidebar-background: 0 0% 98%;
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 240 5.9% 10%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 217.2 91.2% 59.8%;

    --chart-1: 240 5.9% 10%;
    --chart-2: 240 4.8% 95.9%;
    --chart-3: 240 3.8% 46.1%;
    --chart-4: 240 5.9% 90%;
    --chart-5: 240 10% 3.9%;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    
    --card: 240 10% 6%;
    --card-foreground: 0 0% 98%;
    
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;

    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 224.3 76.3% 48%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 240 4.8% 95.9%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 217.2 91.2% 59.8%;

    --chart-1: 0 0% 98%;
    --chart-2: 240 3.7% 15.9%;
    --chart-3: 240 5% 64.9%;
    --chart-4: 240 3.7% 15.9%;
    --chart-5: 240 10% 3.9%;
  }

  /* ===== BASE STYLES ===== */
  * {
    border-color: hsl(var(--border));
    scrollbar-width: thin;
    scrollbar-color: hsl(var(--border)) transparent;
  }

  html {
    scroll-behavior: smooth;
  }

  html, body {
    height: 100%;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
    font-feature-settings: "rlig" 1, "calt" 1, "cv02", "cv05";
  }

  /* Typography */
  h1, h2, h3, h4, h5, h6 {
    @apply font-heading tracking-tight;
    font-weight: 700;
  }

  /* Smooth transitions */
  button, a, input, select, textarea {
    transition-property: color, background-color, border-color, outline-color, box-shadow, opacity;
    transition-duration: 150ms;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Focus visible styling */
  *:focus-visible {
    @apply outline-none ring-2 ring-primary ring-offset-2 ring-offset-background;
  }

  /* ===== ANDROID MOBILE OPTIMIZATIONS ===== */
  button, a, [role="button"], label {
    touch-action: manipulation;
  }
  body {
    overscroll-behavior-y: contain;
  }
  .overflow-y-auto, .overflow-y-scroll {
    -webkit-overflow-scrolling: touch;
  }
  * {
    -webkit-tap-highlight-color: transparent;
  }
  ::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    @apply bg-muted-foreground/20 rounded-full hover:bg-muted-foreground/40;
  }
}

@layer utilities {
  .glass-morphism {
    @apply bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 shadow-sm;
  }
  
  .glass-card {
    @apply glass-morphism rounded-xl;
  }

  .mesh-gradient, .dark .mesh-gradient {
    background-color: hsl(var(--background));
  }

  .animate-in-fade {
    @apply animate-in fade-in duration-700 ease-out;
  }

  .animate-in-slide-up {
    @apply animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out;
  }

  .page-enter {
    animation: page-enter 280ms cubic-bezier(0.2, 0, 0, 1) both;
  }

  @keyframes page-enter {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .android-tap {
    @apply relative overflow-hidden;
  }
  .android-tap::after {
    content: '';
    position: absolute;
    inset: 0;
    background: currentColor;
    opacity: 0;
    border-radius: inherit;
    transition: opacity 0.15s ease;
  }
  .android-tap:active::after {
    opacity: 0.08;
  }

  .card-pressable {
    @apply transition-transform duration-100 active:scale-[0.98] cursor-pointer;
  }

  .list-item-tap {
    @apply transition-colors duration-100 active:bg-muted/80;
  }

  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: hsl(var(--border)) transparent;
  }
  .custom-scrollbar::-webkit-scrollbar {
    width: 5px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: hsl(var(--border));
    border-radius: 9999px;
  }

  .text-gradient-primary {
    @apply text-foreground;
  }

  .print-only { display: none; }
  @media print {
    body * { visibility: hidden !important; }
    .print-only { display: flex !important; justify-content: center; align-items: flex-start; visibility: visible !important; position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
    .print-only * { visibility: visible !important; }
  }

  @keyframes vacation-blink {
    0%, 100% { background-color: rgb(236 72 153 / 0.08); }
    50% { background-color: rgb(236 72 153 / 0.35); }
  }
  .animate-vacation-blink {
    animation: vacation-blink 1.6s ease-in-out infinite;
  }

  @keyframes absence-blink {
    0%, 100% { background-color: rgb(239 68 68 / 0.08); }
    50% { background-color: rgb(239 68 68 / 0.40); }
  }
  .animate-absence-blink {
    animation: absence-blink 1.4s ease-in-out infinite;
  }

  @media print {
    .animate-vacation-blink { animation: none !important; background-color: rgb(236 72 153 / 0.15) !important; }
    .animate-absence-blink { animation: none !important; background-color: rgb(239 68 68 / 0.15) !important; }
  }
}

@layer components {
  .harmonogram-table tbody tr:hover > td {
    filter: brightness(0.93);
  }
  .dark .harmonogram-table tbody tr:hover > td {
    filter: brightness(1.2);
  }
}
`;

fs.writeFileSync('src/app/globals.css', css);
console.log('CSS updated successfully!');
