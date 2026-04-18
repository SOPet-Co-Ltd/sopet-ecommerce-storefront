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

const nullableString = z.string().nullish()
const numberField = z.coerce.number()

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
    id: z.string(),
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
    id: z.string(),
    name: z.string(),
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
    id: z.string(),
    provider_id: z.string(),
    status: z.string(),
    created_at: nullableString,
    payment_collection_id: z.string().nullish(),
    data: orderPaymentSessionDataSchema.nullish(),
  })
  .passthrough()

export const orderPaymentCollectionSchema = z
  .object({
    id: z.string(),
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
    id: z.string(),
    display_id: numberField,
    created_at: z.string(),
    updated_at: z.string(),
    currency_code: z.string(),
    status: z.enum(orderStatusValues),
    payment_status: z.enum(paymentStatusValues),
    fulfillment_status: z.enum(fulfillmentStatusValues),
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
