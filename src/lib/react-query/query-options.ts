import {
  queryOptions,
  type QueryKey,
  type QueryFunction,
} from "@tanstack/react-query"

type BuildQueryOptionsArgs<TQueryFnData, TKey extends QueryKey> = {
  queryKey: TKey
  queryFn: QueryFunction<TQueryFnData, TKey>
  staleTime?: number
  enabled?: boolean
}

export const buildQueryOptions = <TQueryFnData, TKey extends QueryKey>({
  queryKey,
  queryFn,
  staleTime,
  enabled,
}: BuildQueryOptionsArgs<TQueryFnData, TKey>) =>
  queryOptions({
    queryKey,
    queryFn,
    staleTime,
    enabled,
  })
