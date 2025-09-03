# Sistema Colori Gaming - BasterdsLegacy

## Panoramica

Il sistema colori è stato progettato per riflettere l'identità gaming del progetto Minecraft, con una palette ispirata ai toni naturali e ai colori vivaci tipici del gaming.

## Palette Colori

### Colori Brand Principali
- **Primary**: Verde smeraldo (#10b981 / #059669)
- **Secondary**: Arancione (#fb923c / #ea580c) 
- **Tertiary**: Blu (#3b82f6 / #1e40af)

### Colori Gaming Accent
- **Success**: Verde (#22c55e / #16a34a)
- **Warning**: Oro/Giallo (#f59e0b / #d97706)
- **Danger**: Rosso (#ef4444 / #dc2626)
- **Info**: Azzurro (#0ea5e9 / #0284c7)

### Colori Speciali Gaming
- **Gold**: Oro (#eab308 / #ca8a04)
- **Crystal**: Viola (#a855f7 / #7c3aed)

## Effetti Glass Migliorati

### Caratteristiche
- **Blur aumentato**: 12px per effetti più visibili
- **Saturazione**: 130% per colori più vivaci
- **Gradiente**: Sfumature gaming-themed
- **Ombre**: Più profonde con effetti inset

### Varianti
- **Subtle**: 8px blur per elementi meno importanti
- **Strong**: 16px blur per modali e overlay

## Utilizzo

### CSS Variables
```css
var(--color-brand-primary)
var(--color-gaming-gold)
var(--gradient-glass)
var(--glass-blur)
var(--shadow-glass)
```

### Chakra UI Semantic Tokens
```tsx
bg="brand.primary"
color="accent.success"
borderColor="gaming.gold"
```

### Utility Classes
```css
.gaming-accent-primary
.gaming-bg-glass
.gaming-border-accent
```

## Temi

### Tema Scuro (default)
- Background: #0a0e1a (blu scuro profondo)
- Effetti glass con tonalità verdi
- Contrasti alti per leggibilità

### Tema Chiaro
- Background: #f1f5f9 (grigio chiaro)
- Effetti glass con tonalità più sottili
- Mantiene l'identità gaming

## Accessibilità

- Contrasto WCAG AA compliant
- Focus ring visibili con colori brand
- Transizioni smooth per ridurre motion sickness

## File Principali

- `src/main.tsx`: Configurazione Chakra UI semantic tokens
- `src/index.css`: Stili CSS base e varianti glass
- `src/shared/styles/colors.css`: CSS variables e utility classes
- `src/shared/components/glass.ts`: Componenti glass con nuovi stili