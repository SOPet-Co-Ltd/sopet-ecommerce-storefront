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
    id: z.string().optional(),
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
    id: stringFieldOrEmpty,
    title: z
      .string()
      .nullish()
      .transform((value) => value ?? ""),
    subtitle: nullableString,
    thumbnail: nullableString,
    unit_price: numberField.default(0),
    quantity: numberField.default(0),
    subtotal: numberField.default(0),
    adjustments: z.array(orderAdjustmentSchema).nullish().optional(),
    fulfilled_quantity: numberField.nullish(),
    shipped_quantity: numberField.nullish(),
    delivered_quantity: numberField.nullish(),
    variant: orderVariantSchema.nullish(),
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
    payment_sessions: z.array(orderPaymentSessionSchema).optional(),
    payments: z.array(orderPaymentSchema).optional(),
  })
  .passthrough()

export const orderSetSchema = z
  .object({
    id: z.string(),
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
    raw_amount: numberField.nullish(),
    metadata: z.record(z.string(), z.unknown()).nullish(),
    adjustments: z.array(orderAdjustmentSchema).nullish().optional(),
    seller_id: z.string().nullish(),
  })
  .passthrough()

export const orderSchema = z
  .object({
    id: stringFieldOrEmpty,
    display_id: numberField,
    created_at: isoDateField,
    updated_at: isoDateField,
    currency_code: stringFieldOrEmpty,
    status: z.string().nullish().transform(normalizeOrderStatus),
    payment_status: z.string().nullish().transform(normalizePaymentStatus),
    fulfillment_status: z
      .string()
      .nullish()
      .transform(normalizeFulfillmentStatus),
    metadata: orderStatusMetadataSchema.nullish(),
    shipping_total: numberField.default(0),
    discount_total: numberField.default(0),
    subtotal: numberField.default(0),
    total: numberField.default(0),
    items: z.array(orderLineItemSchema).default([]),
    shipping_methods: z.array(orderShippingMethodSchema).optional(),
    seller: orderSellerSchema.nullish().optional(),
    reviews: z.array(z.unknown()).optional(),
    store: z
      .object({
        name: nullableString,
      })
      .passthrough()
      .nullish()
      .optional(),
    shipping_address: orderShippingAddressSchema.nullish().optional(),
    payment_collections: z.array(orderPaymentCollectionSchema).optional(),
    payments: z.array(orderPaymentSchema).optional(),
    fulfillments: z.array(orderFulfillmentSchema).nullish().optional(),
    order_set: orderSetSchema.nullish().optional(),
    payment_provider_id: nullableString,
    email: nullableString,
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
