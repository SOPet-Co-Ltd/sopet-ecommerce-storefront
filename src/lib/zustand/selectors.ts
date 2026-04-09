export const select =
  <TState, TSelected>(selector: (state: TState) => TSelected) =>
  (state: TState) =>
    selector(state)

export const pick =
  <TState, const TKeys extends readonly (keyof TState)[]>(...keys: TKeys) =>
  (state: TState): Pick<TState, TKeys[number]> => {
    const result = {} as Pick<TState, TKeys[number]>

    for (const key of keys) {
      result[key] = state[key]
    }

    return result
  }
