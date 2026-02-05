# 🛡️ Aegis-G Frontend

Modern, responsive frontend for the Aegis-G Cybersecurity Command Center built with Next.js 14, React, TypeScript, and Tailwind CSS.

## ✨ Features

### 🎨 Design System
- **Dark Theme**: Military-grade command center aesthetic
- **Custom Color Palette**: Purpose-built for security operations
- **Typography**: Inter (sans), JetBrains Mono (code), Rajdhani (display)
- **Components**: Reusable UI components with consistent styling

### 📊 Pages & Views
1. **Home/Landing** (`/`) - System diagnostic and welcome screen
2. **Dashboard** (`/dashboard`) - Real-time threat intelligence overview
   - Live stats cards
   - Global threat map
   - Top threat actors
   - Recent critical threats
   - Quick actions panel
3. **Threats** (`/threats`) - Threat intelligence management
   - Filterable threat list (by severity)
   - Search functionality
   - Grid/List view toggle
   - Detailed threat cards
4. **Network Graph** (`/network`) - Visual network analysis
   - Interactive node-link diagram
   - Threat actor relationships
   - System connections
   - Hover & click interactions
5. **Forensics** (`/forensics/[id]`) - Detailed forensic analysis
   - Attack timeline
   - Evidence & artifacts
   - Network activity logs
   - AI insights panel
   - IOCs (Indicators of Compromise)
6. **Sharing** (`/sharing`) - Inter-agency intelligence sharing
   - Blockchain-verified reports
   - Partner agency management
   - Secure sharing interface
7. **Login/Register** (`/login`, `/register`) - Authentication
   - Email/password login
   - SSO options (CAC/PIV, Agency SSO)
   - User registration with approval workflow

### 🎯 Key Components

#### Layout Components
- `Navbar` - Top navigation with role badges, notifications
- `Sidebar` - Live activity feed, system health, AI insights
- `AIManager` - Floating chat interface (⌘M / Ctrl+M)

#### UI Components
- `Button` - Primary, secondary, danger, AI variants
- `Card` - Container with hover effects
- `StatCard` - KPI display with trend indicators
- `Input` - Form input with icons and validation
- `Badge` - Status and severity indicators

#### Specialized Components
- `ThreatCard` - Detailed threat display with risk score
- `ThreatMapGlobe` - Interactive global threat visualization
- `NetworkGraph` - Node-link diagram for relationships

## 🎨 Color Theme

### Background Colors
- Primary: `#0a0e1a` - Deep navy black
- Secondary: `#121827` - Slate dark
- Tertiary: `#1a2332` - Midnight blue

### Accent Colors
- Primary: `#3b82f6` - Electric blue
- Secondary: `#8b5cf6` - Cyber purple
- Success: `#10b981` - Emerald green
- Warning: `#f59e0b` - Amber
- Danger: `#ef4444` - Alert red
- Info: `#06b6d4` - Cyan

### Text Colors
- Primary: `#f1f5f9` - Off-white
- Secondary: `#94a3b8` - Slate gray
- Muted: `#64748b` - Dim gray

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Navigate to frontend directory**
```bash
cd CyberSec/frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Run development server**
```bash
npm run dev
```

4. **Open browser**
```
http://localhost:3000
```

### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                      # Next.js 14 App Router
│   │   ├── dashboard/            # Dashboard page
│   │   ├── threats/              # Threats list page
│   │   ├── network/              # Network graph page
│   │   ├── forensics/[id]/       # Forensic detail page
│   │   ├── sharing/              # Intelligence sharing page
│   │   ├── login/                # Login page
│   │   ├── register/             # Registration page
│   │   ├── layout.tsx            # Root layout with navbar
│   │   ├── page.tsx              # Home page
│   │   └── globals.css           # Global styles
│   │
│   ├── components/
│   │   ├── ui/                   # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── StatCard.tsx
│   │   │   └── index.ts          # Component exports
│   │   ├── layout/               # Layout components
│   │   │   ├── Navbar.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── threats/              # Threat-specific components
│   │   │   └── ThreatCard.tsx
│   │   ├── visual/               # Visualization components
│   │   │   ├── ThreatMapGlobe.tsx
│   │   │   └── NetworkGraph.tsx
│   │   └── ai/                   # AI components
│   │       └── AIManager.tsx
│   │
│   └── lib/                      # Utilities (if needed)
│
├── public/                       # Static assets
├── tailwind.config.js            # Tailwind configuration
├── next.config.js                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies
```

## 🎯 Component Usage Examples

### Button Component
```tsx
import { Button } from '@/components/ui/Button';

<Button variant="primary" icon="🔍">Search</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="danger">Delete</Button>
<Button variant="ai" icon="🤖">AI Analysis</Button>
```

### Card Component
```tsx
import { Card } from '@/components/ui/Card';

<Card>Basic card content</Card>
<Card hover>Card with hover effect</Card>
```

### StatCard Component
```tsx
import { StatCard } from '@/components/ui/StatCard';

<StatCard
  value={85}
  label="Active Threats"
  icon="🚨"
  variant="warning"
  trend={{ value: 12, isPositive: false }}
/>
```

### Badge Component
```tsx
import { Badge } from '@/components/ui/Badge';

<Badge variant="critical">CRITICAL</Badge>
<Badge variant="high">HIGH</Badge>
<Badge variant="info">INFO</Badge>
```

## 🎨 Styling Guidelines

### Using Tailwind Classes
```tsx
// Background colors
className="bg-bg-primary"
className="bg-bg-secondary"

// Text colors
className="text-text-primary"
className="text-text-secondary"

// Borders
className="border border-border-subtle"

// Custom classes
className="card"
className="card-hover"
className="btn-primary"
className="threat-card-critical"
```

### Custom Component Classes
Pre-defined classes in `globals.css`:
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ai`
- `.card`, `.card-hover`
- `.stat-card`, `.stat-card-safe`, `.stat-card-warning`, `.stat-card-critical`
- `.input`
- `.badge`, `.badge-critical`, `.badge-high`, `.badge-medium`, `.badge-low`
- `.threat-card-*`

## 🔧 Configuration

### Tailwind Config
Custom theme extensions in `tailwind.config.js`:
- Colors: Custom security-focused palette
- Fonts: Inter, JetBrains Mono, Rajdhani
- Shadows: Glow effects (blue, purple, red)
- Animations: Slide, pulse effects

### Next.js Config
- App Router (Next.js 14)
- TypeScript support
- Image optimization
- API route proxying (if needed)

## 🚀 Development Tips

1. **Hot Reload**: Changes auto-reload in development
2. **TypeScript**: Full type safety across components
3. **Responsive**: Mobile-first design with Tailwind breakpoints
4. **Accessibility**: WCAG 2.1 AA compliant
5. **Performance**: Optimized with React 18 features

## 📝 Available Scripts

```bash
npm run dev       # Start development server (port 3000)
npm run build     # Build for production
npm start         # Start production server
npm run lint      # Run ESLint
```

## 🔗 Integration with Backend

The frontend is designed to integrate with the FastAPI backend:
- Backend API: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`
- WebSocket: For real-time updates

Update API endpoints in your code as needed:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
```

## 🎯 Future Enhancements

- [ ] Real-time WebSocket integration
- [ ] Advanced data visualizations (D3.js)
- [ ] Dark/Light theme toggle
- [ ] Internationalization (i18n)
- [ ] PWA support
- [ ] Advanced filtering & search
- [ ] Export functionality (PDF, CSV)
- [ ] Keyboard shortcuts panel
- [ ] User preferences persistence

## 📄 License

MIT License - Part of Aegis-G Project

---

**Built with ❤️ for National Security Operations**

