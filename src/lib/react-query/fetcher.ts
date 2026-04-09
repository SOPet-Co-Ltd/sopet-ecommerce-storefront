import type {
  QueryFunction,
  QueryFunctionContext,
  QueryKey,
} from "@tanstack/react-query"

import { sdk } from "@/lib/config"

type Primitive = string | number | boolean | null | undefined

type MedusaRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  query?: Record<string, Primitive | Primitive[]>
  body?: Record<string, unknown> | unknown[]
  headers?: Record<string, string>
  cache?: RequestCache
}

export class ReactQueryFetcherError extends Error {
  status?: number
  code?: string
  type?: string
  details?: unknown
  raw?: unknown

  constructor(
    message: string,
    options?: {
      status?: number
      code?: string
      type?: string
      details?: unknown
      raw?: unknown
      cause?: unknown
    }
  ) {
    super(message)
    this.name = "ReactQueryFetcherError"
    this.status = options?.status
    this.code = options?.code
    this.type = options?.type
    this.details = options?.details
    this.raw = options?.raw
    if (options?.cause !== undefined) {
      ;(this as Error & { cause?: unknown }).cause = options.cause
    }
  }
}

type ErrorShape = {
  message?: unknown
  code?: unknown
  type?: unknown
  status?: unknown
  body?: unknown
  cause?: unknown
  name?: unknown
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const tryParseJsonString = (value: unknown): unknown => {
  if (typeof value !== "string") {
    return value
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return value
  }
  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

const readString = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.trim()) {
    return value
  }
  return undefined
}

const normalizeErrorPayload = (error: unknown) => {
  const source = error as ErrorShape
  const parsedBody = tryParseJsonString(source.body)
  const bodyRecord = isRecord(parsedBody) ? parsedBody : undefined

  const message =
    readString(source.message) ??
    readString(bodyRecord?.message) ??
    readString(parsedBody) ??
    "Request failed"

  const code = readString(source.code) ?? readString(bodyRecord?.code)
  const type = readString(source.type) ?? readString(bodyRecord?.type)
  const status = typeof source.status === "number" ? source.status : undefined

  return {
    message,
    code,
    type,
    status,
    details: parsedBody,
  }
}

const toReactQueryFetcherError = (error: unknown): ReactQueryFetcherError => {
  if (error instanceof ReactQueryFetcherError) {
    return error
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return new ReactQueryFetcherError("Request was aborted", {
      code: "ABORTED",
      type: "abort_error",
      raw: error,
      cause: error,
    })
  }

  if (error instanceof Error) {
    const payload = normalizeErrorPayload(error)
    return new ReactQueryFetcherError(payload.message, {
      status: payload.status,
      code: payload.code,
      type: payload.type,
      details: payload.details,
      raw: error,
      cause: error,
    })
  }

  if (isRecord(error)) {
    const payload = normalizeErrorPayload(error)

    return new ReactQueryFetcherError(payload.message, {
      status: payload.status,
      code: payload.code,
      type: payload.type,
      details: payload.details,
      raw: error,
    })
  }

  return new ReactQueryFetcherError("Request failed")
}

type CreateMedusaQueryFnInput<
  TData,
  TQueryKey extends QueryKey = QueryKey,
> = MedusaRequestOptions & {
  path: string
  transform?: (response: TData) => TData
}

export const createMedusaQueryFn = <
  TData,
  TQueryKey extends QueryKey = QueryKey,
>({
  path,
  method = "GET",
  query,
  body,
  headers,
  cache,
  transform,
}: CreateMedusaQueryFnInput<TData, TQueryKey>): QueryFunction<
  TData,
  TQueryKey
> => {
  return async (context: QueryFunctionContext<TQueryKey>): Promise<TData> => {
    try {
      const response = await sdk.client.fetch<TData>(path, {
        method,
        query,
        body,
        headers,
        cache,
        signal: context.signal,
      })

      return transform ? transform(response) : response
    } catch (error) {
      throw toReactQueryFetcherError(error)
    }
  }
}

type CreateMedusaMutationFnInput<TData, TVariables> = {
  path: string | ((variables: TVariables) => string)
  method?: "POST" | "PUT" | "PATCH" | "DELETE"
  query?:
    | Record<string, Primitive | Primitive[]>
    | ((
        variables: TVariables
      ) => Record<string, Primitive | Primitive[]> | undefined)
  body?: (
    variables: TVariables
  ) => Record<string, unknown> | unknown[] | undefined
  headers?:
    | Record<string, string>
    | ((variables: TVariables) => Record<string, string> | undefined)
  cache?: RequestCache
  transform?: (response: TData) => TData
}

export const createMedusaMutationFn = <TData, TVariables = void>({
  path,
  method = "POST",
  query,
  body,
  headers,
  cache,
  transform,
}: CreateMedusaMutationFnInput<TData, TVariables>) => {
  return async (variables: TVariables): Promise<TData> => {
    try {
      const resolvedPath = typeof path === "function" ? path(variables) : path
      const resolvedQuery =
        typeof query === "function" ? query(variables) : query
      const resolvedBody = body ? body(variables) : undefined
      const resolvedHeaders =
        typeof headers === "function" ? headers(variables) : headers

      const response = await sdk.client.fetch<TData>(resolvedPath, {
        method,
        query: resolvedQuery,
        body: resolvedBody,
        headers: resolvedHeaders,
        cache,
      })

      return transform ? transform(response) : response
    } catch (error) {
      throw toReactQueryFetcherError(error)
    }
  }
}
