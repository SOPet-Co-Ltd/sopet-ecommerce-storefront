import { z } from "zod"

const orderStatusValues = ["pending", "completed", "canceled"] as const
const paymentStatusValues = [
  "not_paid",
  "awaiting",
  "authorized",
  "captured",
  "partially_refunded",
  "refunded",
  "canceled",
] as const
const fulfillmentStatusValues = [
  "not_fulfilled",
  "partially_fulfilled",
  "fulfilled",
  "partially_shipped",
  "shipped",
  "partially_delivered",
  "delivered",
  "canceled",
] as const

const nullableString = z.string().nullish().catch(null)
const numberField = z.coerce.number()
const isoDateField = z
  .union([z.string(), z.date()])
  .transform((value) =>
    value instanceof Date ? value.toISOString() : value
  )
  .catch(new Date(0).toISOString())
const stringField = z.preprocess((value) => {
  if (value === null || value === undefined) {
    return undefined
  }

  return String(value)
}, z.string())
const stringFieldOrEmpty = z.preprocess((value) => {
  if (value === null || value === undefined) {
    return ""
  }

  return String(value)
}, z.string())

function normalizeOrderStatus(
  value: string | null | undefined
): (typeof orderStatusValues)[number] {
  if (value === "completed") {
    return "completed"
  }

  if (value === "canceled") {
    return "canceled"
  }

  return "pending"
}

function normalizePaymentStatus(
  value: string | null | undefined
): (typeof paymentStatusValues)[number] {
  switch (value) {
    case "awaiting":
    case "authorized":
    case "captured":
    case "partially_refunded":
    case "refunded":
    case "canceled":
    case "not_paid":
      return value
    case "pending":
      return "awaiting"
    case "completed":
    case "partially_captured":
      return "captured"
    case "partially_authorized":
      return "authorized"
    default:
      return "not_paid"
  }
}

function normalizeFulfillmentStatus(
  value: string | null | undefined
): (typeof fulfillmentStatusValues)[number] {
  switch (value) {
    case "not_fulfilled":
    case "partially_fulfilled":
    case "fulfilled":
    case "partially_shipped":
    case "shipped":
    case "partially_delivered":
    case "delivered":
    case "canceled":
      return value
    default:
      return "not_fulfilled"
  }
}

export const orderVariantSchema = z
  .object({
    id: stringField.nullish(),
    title: nullableString,
    sku: nullableString,
  })
  .passthrough()

export const orderAdjustmentSchema = z
  .object({
    amount: numberField.nullish(),
    code: nullableString,
  })
  .passthrough()

export const orderLineItemSchema = z
  .object({
    id: stringFieldOrEmpty.catch(""),
    title: z
      .string()
      .nullish()
      .transform((value) => value ?? "")
      .catch(""),
    subtitle: nullableString.catch(null),
    thumbnail: nullableString.catch(null),
    unit_price: numberField.catch(0).default(0),
    quantity: numberField.catch(0).default(0),
    subtotal: numberField.catch(0).default(0),
    adjustments: z.array(orderAdjustmentSchema).nullish().optional().catch([]),
    fulfilled_quantity: numberField.nullish().catch(null),
    shipped_quantity: numberField.nullish().catch(null),
    delivered_quantity: numberField.nullish().catch(null),
    variant: orderVariantSchema.nullish().catch(null),
  })
  .passthrough()

export const orderShippingAddressSchema = z
  .object({
    first_name: nullableString,
    last_name: nullableString,
    phone: nullableString,
    address_1: nullableString,
    address_2: nullableString,
    city: nullableString,
    province: nullableString,
    postal_code: nullableString,
  })
  .passthrough()

export const orderSellerSchema = z
  .object({
    id: stringFieldOrEmpty,
    name: stringFieldOrEmpty,
    address_line: nullableString,
    city: nullableString,
    state: nullableString,
    postal_code: nullableString,
    country_code: nullableString,
    email: nullableString,
    phone: nullableString,
    photo: nullableString,
  })
  .passthrough()

export const orderPaymentSchema = z
  .object({
    provider_id: nullableString,
    authorized_at: nullableString,
    captured_at: nullableString,
    canceled_at: nullableString,
  })
  .passthrough()

export const orderPaymentSessionDataSchema = z
  .object({
    client_secret: nullableString,
  })
  .passthrough()

export const orderPaymentSessionSchema = z
  .object({
    id: stringFieldOrEmpty,
    provider_id: stringFieldOrEmpty,
    status: stringFieldOrEmpty,
    created_at: nullableString,
    payment_collection_id: stringField.nullish().catch(null),
    data: orderPaymentSessionDataSchema.nullish(),
  })
  .passthrough()

export const orderPaymentCollectionSchema = z
  .object({
    id: stringFieldOrEmpty,
    payment_sessions: z.array(orderPaymentSessionSchema).nullish().optional(),
    payments: z.array(orderPaymentSchema).nullish().optional(),
  })
  .passthrough()

export const orderSetSchema = z
  .object({
    id: stringFieldOrEmpty,
  })
  .passthrough()

export const orderStatusMetadataSchema = z
  .object({
    is_paid: z.boolean().optional(),
  })
  .passthrough()

export const orderFulfillmentLabelSchema = z
  .object({
    tracking_number: nullableString,
    tracking_url: nullableString,
  })
  .passthrough()

export const orderFulfillmentSchema = z
  .object({
    labels: z.array(orderFulfillmentLabelSchema).nullish().optional(),
    items: z
      .array(
        z
          .object({
            line_item_id: z.string().nullish(),
            item_id: z.string().nullish(),
            id: z.string().nullish(),
            quantity: numberField.nullish(),
            item: z
              .object({
                line_item_id: z.string().nullish(),
                item_id: z.string().nullish(),
                id: z.string().nullish(),
              })
              .passthrough()
              .nullish(),
          })
          .passthrough()
      )
      .nullish()
      .optional(),
    shipped_at: nullableString,
    delivered_at: nullableString,
    canceled_at: nullableString,
  })
  .passthrough()

export const orderShippingMethodSchema = z
  .object({
    id: z.string().nullish(),
    shipping_option_id: z.string().nullish(),
    amount: numberField.nullish(),
    raw_amount: z.any().nullish(),
    metadata: z.record(z.string(), z.unknown()).nullish(),
    adjustments: z.array(orderAdjustmentSchema).nullish().optional(),
    seller_id: z.string().nullish(),
  })
  .passthrough()

export const orderSchema = z
  .object({
    id: stringFieldOrEmpty.catch(""),
    display_id: numberField.catch(0),
    created_at: isoDateField.catch(new Date(0).toISOString()),
    updated_at: isoDateField.catch(new Date(0).toISOString()),
    currency_code: stringFieldOrEmpty.catch("thb"),
    status: z.string().nullish().transform(normalizeOrderStatus).catch("pending"),
    payment_status: z.string().nullish().transform(normalizePaymentStatus).catch("not_paid"),
    fulfillment_status: z
      .string()
      .nullish()
      .transform(normalizeFulfillmentStatus)
      .catch("not_fulfilled"),
    metadata: orderStatusMetadataSchema.nullish().catch({}),
    shipping_total: numberField.catch(0).default(0),
    discount_total: numberField.catch(0).default(0),
    subtotal: numberField.catch(0).default(0),
    total: numberField.catch(0).default(0),
    items: z.array(orderLineItemSchema).nullish().transform((value) => value ?? []).catch([]),
    shipping_methods: z
      .array(orderShippingMethodSchema)
      .nullish()
      .optional()
      .catch([]),
    seller: orderSellerSchema.nullish().optional().catch(null),
    reviews: z.array(z.unknown()).nullish().optional().catch([]),
    store: z
      .object({
        name: nullableString,
      })
      .passthrough()
      .nullish()
      .optional()
      .catch({ name: null }),
    shipping_address: orderShippingAddressSchema.nullish().optional().catch(null),
    payment_collections: z
      .array(orderPaymentCollectionSchema)
      .nullish()
      .optional()
      .catch([]),
    payments: z.array(orderPaymentSchema).nullish().optional().catch([]),
    fulfillments: z.array(orderFulfillmentSchema).nullish().optional().catch([]),
    order_set: orderSetSchema.nullish().optional().catch(null),
    payment_provider_id: nullableString.catch(null),
    email: nullableString.catch(null),
  })
  .passthrough()

export const listOrdersResponseSchema = z.object({
  orders: z.array(orderSchema),
})

export const retrieveOrderResponseSchema = z.object({
  order: orderSchema,
})

export const retrieveOrderSetResponseSchema = z.object({
  order_set: orderSetSchema,
})

export const returnReasonSchema = z
  .object({
    id: z.string(),
    label: z.string(),
  })
  .passthrough()

export const retrieveReturnReasonsResponseSchema = z.object({
  return_reasons: z.array(returnReasonSchema),
})

export const returnShippingMethodSchema = z
  .object({
    id: z.string(),
    name: z.string(),
  })
  .passthrough()

export const retrieveReturnMethodsResponseSchema = z.object({
  shipping_options: z.array(returnShippingMethodSchema),
})

export const getReturnsResponseSchema = z.object({
  order_return_requests: z.array(z.unknown()),
})

export const createReturnRequestResponseSchema = z.object({
  order_return_request: z
    .object({
      id: z.string(),
    })
    .passthrough(),
})

export const orderMutationResponseSchema = z.object({
  order: z
    .object({
      id: z.string(),
    })
    .passthrough(),
})

export const updateOrderPaymentSessionResponseSchema = z.object({
  payment_session: orderPaymentSessionSchema,
  payment_sessions: z.array(orderPaymentSessionSchema).optional(),
  order_id: z.string().optional(),
  payment_collection_ids: z.array(z.string()).optional(),
})

export const retrievePaymentCollectionResponseSchema = z.object({
  payment_collection: orderPaymentCollectionSchema,
})

export const retrieveCustomerPaymentMethodsResponseSchema = z.object({
  payment_methods: z.array(
    z
      .object({
        id: z.string(),
        brand: nullableString,
        last4: nullableString,
        exp_month: z.coerce.number().nullish(),
        exp_year: z.coerce.number().nullish(),
        funding: nullableString,
        country: nullableString,
        is_default: z.boolean(),
      })
      .passthrough()
  ),
})
