import { create, type StateCreator, type StoreMutatorIdentifier } from "zustand"

type Mutators = [StoreMutatorIdentifier, unknown][]

export const createAppStore = <TState, TMutators extends Mutators = []>(
  initializer: StateCreator<TState, [], TMutators>
) => create<TState>()(initializer)
