# MWANGI'Z Salon POS

Production-grade desktop application foundation for MWANGI'Z Salon POS.

This repository currently contains the UI shell only. Business logic, M-Pesa integration, backend APIs, and database schema are intentionally not implemented yet.

## Stack

- Electron
- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui-compatible primitives
- Radix UI
- Zustand
- Recharts
- Lucide React
- Framer Motion
- Axios
- SQLite dependency placeholder through `better-sqlite3`

## Scripts

```bash
npm run dev
npm run dev:web
npm run build
npm run lint
```

`npm run dev` starts Vite and launches Electron.

`npm run dev:web` starts the React shell in a browser for quick UI work.

## Project Structure

```text
electron/
  main.ts
  preload.ts

src/
  app/
  assets/
  components/
  features/
  hooks/
  layouts/
  pages/
  services/
  store/
  types/
  utils/
```

## Architecture Boundary

- Frontend is UI only.
- Backend owns business logic.
- Database owns storage only.
- Cloud database is the source of truth.
- Offline mode is a temporary fallback.
- Server wins during sync conflicts.

## Current Foundation

- Electron window and preload bridge
- React app shell
- Dark-first design system with light mode support
- shadcn/ui-compatible base components
- Zustand UI store
- Axios client placeholder
- Login and dashboard pages with mock data
- Sidebar placeholder for future modules
- Feature folders reserved for future implementation

## Next Development Layer

The next phase should define domain contracts before implementation: roles, permissions, branch boundaries, service catalog rules, payment intent lifecycle, receipt model, and sync engine responsibilities.
