import {
  devtools,
  persist,
  createJSONStorage,
  type StateStorage,
  type PersistOptions as ZustandPersistOptions,
} from "zustand/middleware"
import type { StateCreator, StoreMutatorIdentifier } from "zustand"

type Mutators = [StoreMutatorIdentifier, unknown][]

export const withDevtools = <
  TState,
  Mps extends Mutators = [],
  Mcs extends Mutators = [],
>(
  initializer: StateCreator<TState, Mps, Mcs>,
  name: string
) =>
  devtools(
    initializer as unknown as StateCreator<
      TState,
      [...Mps, ["zustand/devtools", never]],
      Mcs
    >,
    {
      name,
      enabled: process.env.NODE_ENV !== "production",
    }
  )

type PersistOptions<TState> = {
  name: string
  storage?: StateStorage
  partialize?: (state: TState) => Partial<TState>
}

const createNoopStorage = (): StateStorage => ({
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
})

export const withPersist = <
  TState,
  Mps extends Mutators = [],
  Mcs extends Mutators = [],
>(
  initializer: StateCreator<TState, Mps, Mcs>,
  options: PersistOptions<TState>
) => {
  const persistOptions: ZustandPersistOptions<TState, Partial<TState>> = {
    name: options.name,
    storage: createJSONStorage(
      () =>
        options.storage ??
        (typeof window !== "undefined" ? localStorage : createNoopStorage())
    ),
  }

  if (options.partialize) {
    persistOptions.partialize = options.partialize
  }

  return persist(
    initializer as unknown as StateCreator<
      TState,
      [...Mps, ["zustand/persist", unknown]],
      Mcs
    >,
    {
      ...persistOptions,
    }
  )
}
