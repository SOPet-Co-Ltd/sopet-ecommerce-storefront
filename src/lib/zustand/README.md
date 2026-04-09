# Zustand Helpers

This folder contains shared utilities to keep Zustand store setup consistent.

## Files

- `create-store.ts`: typed store creator helper (`createAppStore`).
- `middlewares.ts`: reusable middleware wrappers (`withDevtools`, `withPersist`).
- `selectors.ts`: selector helpers (`select`, `pick`).
- `index.ts`: public exports.

## 1) Create a store

Use `createAppStore` to create a typed store:

```ts
import { createAppStore } from "@/lib/zustand"

type CounterState = {
  count: number
  inc: () => void
  dec: () => void
}

export const useCounterStore = createAppStore<CounterState>((set) => ({
  count: 0,
  inc: () => set((state) => ({ count: state.count + 1 })),
  dec: () => set((state) => ({ count: state.count - 1 })),
}))
```

## 2) Add middleware

`withDevtools` enables Redux DevTools in development.
`withPersist` persists state to storage with an SSR-safe fallback.

```ts
import { createAppStore, withDevtools, withPersist } from "@/lib/zustand"

type UIState = {
  isDrawerOpen: boolean
  setDrawerOpen: (open: boolean) => void
}

const initializer = withDevtools(
  withPersist<UIState>(
    (set) => ({
      isDrawerOpen: false,
      setDrawerOpen: (open) => set({ isDrawerOpen: open }),
    }),
    { name: "ui-store" }
  ),
  "ui-store-devtools"
)

// Important: let createAppStore infer middleware mutators.
export const useUIStore = createAppStore(initializer)
```

## 3) Use selectors

Use `select` for single values and `pick` for grouped fields.

```ts
import { pick, select } from "@/lib/zustand"
import { useUIStore } from "./ui-store"

const isDrawerOpen = useUIStore(select((state) => state.isDrawerOpen))

const ui = useUIStore(pick("isDrawerOpen", "setDrawerOpen"))
```

## Notes

- Keep `persist` names unique per store.
- Keep actions inside the store for a single source of truth.
- Use selectors to avoid unnecessary re-renders in components.
