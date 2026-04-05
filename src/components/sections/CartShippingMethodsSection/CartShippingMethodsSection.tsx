"use client"

import ErrorMessage from "@/components/molecules/ErrorMessage/ErrorMessage"
import { setMultiShippingMethods } from "@/lib/data/cart"
import { calculatePriceForShippingOption } from "@/lib/data/fulfillment"
import { convertToLocale } from "@/lib/helpers/money"
import { CheckCircleSolid, ChevronUpDown, Loader } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { clx, Heading, Text } from "@medusajs/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Fragment, useEffect, useState } from "react"
import { Button } from "@/components/atoms"
import { Modal, SelectField } from "@/components/molecules"
import { CartShippingMethodRow } from "./CartShippingMethodRow"
import { Listbox, Transition } from "@headlessui/react"
import clsx from "clsx"
import { Cart, StoreCardShippingMethod } from "@/types/cart"

// Extended cart item product type to include seller
type ExtendedStoreProduct = HttpTypes.StoreProduct & {
  seller?: {
    id: string
    name: string
  }
}

// Cart item type definition
type CartItem = {
  product?: ExtendedStoreProduct
  // Include other cart item properties as needed
}

type ShippingProps = {
  cart: Cart
  availableShippingMethods: StoreCardShippingMethod[] | null
}

const CartShippingMethodsSection: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
}) => {
  const [isLoadingPrices, setIsLoadingPrices] = useState(false)
  const [calculatedPricesMap, setCalculatedPricesMap] = useState<
    Record<string, number>
  >({})
  const [error, setError] = useState<string | null>(null)
  const [missingModal, setMissingModal] = useState(false)
  const [missingShippingSellers, setMissingShippingSellers] = useState<
    string[]
  >([])
  // Track per-seller shipping option selections
  const [sellerSelections, setSellerSelections] = useState<Record<string, string>>({})

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "delivery"

  const _shippingMethods = availableShippingMethods?.filter(
    (sm) =>
      sm.rules?.find((rule: any) => rule.attribute === "is_return")?.value !==
      "true"
  )

  useEffect(() => {
    const set = new Set<string>()
    cart.items?.forEach((item) => {
      const product = item?.product as ExtendedStoreProduct
      if (product?.seller?.id) {
        set.add(product.seller.id)
      }
    })

    const sellerMethods = _shippingMethods?.map(({ seller_id }) => seller_id)

    const missingSellerIds = [...set].filter(
      (sellerId) => !sellerMethods?.includes(sellerId)
    )

    setMissingShippingSellers(Array.from(missingSellerIds))

    if (missingSellerIds.length > 0 && !cart.shipping_methods?.length) {
      setMissingModal(true)
    }
  }, [cart])

  // Initialize per-seller selections from existing cart shipping methods
  useEffect(() => {
    if (!_shippingMethods?.length) return

    const initial: Record<string, string> = {}
    let hasAllSellers = true
    const sellerIdsInCart = new Set<string>()

    // Use a Set to track which sellers have a method in the cart
    if (cart.shipping_methods?.length) {
      for (const sm of cart.shipping_methods) {
        const matchingOption = _shippingMethods.find(
          (opt: any) => opt.id === sm.shipping_option_id
        )
        if (matchingOption?.seller_id && sm.shipping_option_id) {
          initial[matchingOption.seller_id] = sm.shipping_option_id
          sellerIdsInCart.add(matchingOption.seller_id)
        }
      }
    }

    // Check which sellers are missing a shipping method
    const allSellerIds = new Set<string>()
    cart.items?.forEach((item) => {
      const product = item?.product as ExtendedStoreProduct
      if (product?.seller?.id) {
        allSellerIds.add(product.seller.id)
      }
    })

    const missingSellerIds = Array.from(allSellerIds).filter(id => !sellerIdsInCart.has(id))
    
    if (missingSellerIds.length > 0) {
      // Pick defaults for missing sellers
      const newSelections = { ...initial }
      let changed = false
      for (const sellerId of missingSellerIds) {
        const defaultMethod = _shippingMethods.find(m => m.seller_id === sellerId)
        if (defaultMethod) {
          newSelections[sellerId] = defaultMethod.id
          changed = true
        }
      }
      
      if (changed) {
        setSellerSelections(newSelections)
        // Auto-persist to backend
        const allOptionIds = Object.values(newSelections).filter(Boolean)
        setMultiShippingMethods({
          cartId: cart.id,
          optionIds: allOptionIds
        }).then(() => {
          router.refresh()
        }).catch(err => {
          console.error("Failed to auto-select shipping methods", err)
        })
        return
      }
    }

    setSellerSelections(initial)
  }, [cart.shipping_methods, _shippingMethods, cart.id, cart.items])

  useEffect(() => {
    if (_shippingMethods?.length) {
      const promises = _shippingMethods
        .filter((sm) => sm.price_type === "calculated")
        .map((sm) => calculatePriceForShippingOption(sm.id, cart.id))

      if (promises.length) {
        Promise.allSettled(promises).then((res) => {
          const pricesMap: Record<string, number> = {}
          res
            .filter((r) => r.status === "fulfilled")
            .forEach((p) => (pricesMap[p.value?.id || ""] = p.value?.amount!))

          setCalculatedPricesMap(pricesMap)
          setIsLoadingPrices(false)
        })
      }
    }
  }, [availableShippingMethods])

  const handleSubmit = () => {
    router.push(pathname + "?step=payment", { scroll: false })
  }

  const handleSetShippingMethod = async (sellerId: string, optionId: string | null) => {
    if (!optionId) {
      return
    }

    // Update local selections for this seller
    const updated = { ...sellerSelections, [sellerId]: optionId }
    setSellerSelections(updated)

    // Gather all selected option IDs across all sellers
    const allOptionIds = Object.values(updated).filter(Boolean)
    if (allOptionIds.length === 0) return

    try {
      setError(null)
      setIsLoadingPrices(true)
      await setMultiShippingMethods({
        cartId: cart.id,
        optionIds: allOptionIds,
      })
      router.refresh()
    } catch (error: any) {
      setError(
        error?.message?.replace("Error setting up the request: ", "") ||
          "An error occurred"
      )
      // Revert if failed
      const prev = { ...sellerSelections }
      delete prev[sellerId]
      setSellerSelections(prev)
    } finally {
      setIsLoadingPrices(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  const groupedBySellerId = _shippingMethods?.reduce((acc: any, method) => {
    const sellerId = method.seller_id!

    if (!acc[sellerId]) {
      acc[sellerId] = []
    }

    const amount = Number(
      method.price_type === "flat"
        ? method.amount
        : calculatedPricesMap[method.id]
    )

    if (!isNaN(amount)) {
      acc[sellerId]?.push(method)
    }

    return acc
  }, {})

  const handleEdit = () => {
    router.replace(pathname + "?step=delivery")
  }

  const missingSellers = cart.items
    ?.filter((item) => {
      const product = item.product as ExtendedStoreProduct
      return missingShippingSellers.includes(product?.seller?.id!)
    })
    .map((item) => {
      const product = item.product as ExtendedStoreProduct
      return product?.seller?.name
    })

  return (
    <div className="border p-4 rounded-xs bg-ui-bg-interactive">
      {/* {missingModal && (
        <Modal
          heading="Missing seller shipping option"
          onClose={() => router.push(`/${pathname.split("/")[1]}/cart`)}
        >
          <div className="p-4">
            <h2 className="heading-sm">
              Some of the sellers in your cart do not have shipping options.
            </h2>

            <p className="text-md mt-3">
              Please remove the{" "}
              <span className="font-bold">
                {missingSellers?.map(
                  (seller, index) =>
                    `${seller}${
                      index === missingSellers.length - 1 ? " " : ", "
                    }`
                )}
              </span>{" "}
              items or contact{" "}
              {missingSellers && missingSellers?.length > 1 ? "them" : "him"} to
              get the shipping options.
            </p>
          </div>
        </Modal>
      )} */}
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className="flex flex-row text-3xl-regular gap-x-2  items-center"
        >
          {!isOpen && (cart.shipping_methods?.length ?? 0) > 0 && (
            <CheckCircleSolid />
          )}
          Delivery
        </Heading>
        {!isOpen && (
          <Text>
            <Button onClick={handleEdit}>Edit</Button>
          </Text>
        )}
      </div>
      {isOpen ? (
        <>
          <div className="grid">
            <div data-testid="delivery-options-container">
              <div className="pb-8 md:pt-0 pt-2">
                {Object.keys(groupedBySellerId).map((key) => {
                  return (
                    <div key={key} className="mb-4">
                      <Heading level="h3" className="mb-2">
                        {groupedBySellerId[key][0].seller_name}
                      </Heading>
                      <Listbox
                        value={
                          cart.shipping_methods?.find((sm) =>
                            groupedBySellerId[key].some(
                              (opt: any) => opt.id === sm.shipping_option_id
                            )
                          )?.shipping_option_id
                        }
                        onChange={(value) => {
                          handleSetShippingMethod(key, value)
                        }}
                      >
                        <div className="relative">
                          <Listbox.Button
                            className={clsx(
                              "relative w-full flex justify-between items-center px-4 h-12 bg-white text-left cursor-default border rounded-lg focus:outline-none focus:ring-1 focus:ring-sop-primary-500 border-gray-200 text-base"
                            )}
                          >
                            {({ open }) => (
                              <>
                                <span className="block truncate">
                                  Choose delivery option
                                </span>
                                <ChevronUpDown
                                  className={clx(
                                    "transition-rotate duration-200",
                                    {
                                      "transform rotate-180": open,
                                    }
                                  )}
                                />
                              </>
                            )}
                          </Listbox.Button>
                          <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                          >
                            <Listbox.Options
                              className="absolute z-20 w-full overflow-auto text-sm bg-white border rounded-lg shadow-lg max-h-60 focus:outline-none mt-1"
                              data-testid="shipping-address-options"
                            >
                              {groupedBySellerId[key].map((option: any) => {
                                return (
                                  <Listbox.Option
                                    className="cursor-pointer select-none relative pl-6 pr-10 hover:bg-gray-50 py-4 border-b"
                                    value={option.id}
                                    key={option.id}
                                  >
                                    {option.name}
                                    {" - "}
                                    {option.price_type === "flat" ? (
                                      convertToLocale({
                                        amount: option.amount!,
                                        currency_code: cart?.currency_code,
                                      })
                                    ) : calculatedPricesMap[option.id] ? (
                                      convertToLocale({
                                        amount: calculatedPricesMap[option.id],
                                        currency_code: cart?.currency_code,
                                      })
                                    ) : isLoadingPrices ? (
                                      <Loader />
                                    ) : (
                                      "-"
                                    )}
                                  </Listbox.Option>
                                )
                              })}
                            </Listbox.Options>
                          </Transition>
                        </div>
                      </Listbox>
                    </div>
                  )
                })}
                {cart && (cart.shipping_methods?.length ?? 0) > 0 && (
                  <div className="flex flex-col">
                    {cart.shipping_methods?.map((method) => (
                      <CartShippingMethodRow
                        key={method.id}
                        method={method}
                        currency_code={cart.currency_code}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div>
            <ErrorMessage
              error={error}
              data-testid="delivery-option-error-message"
            />
            <Button
              onClick={handleSubmit}
              disabled={
                !cart.shipping_methods ||
                cart.shipping_methods.length < Object.keys(groupedBySellerId || {}).length
              }
              loading={isLoadingPrices}
            >
              Continue to payment
            </Button>
          </div>
        </>
      ) : (
        <div>
          <div className="text-small-regular">
            {cart && (cart.shipping_methods?.length ?? 0) > 0 && (
              <div className="flex flex-col">
                {cart.shipping_methods?.map((method) => (
                  <div key={method.id} className="mb-4 border rounded-md p-4">
                    <Text className="txt-medium-plus text-ui-fg-base mb-1">
                      Method
                    </Text>
                    <Text className="txt-medium text-ui-fg-subtle">
                      {method.name}{" "}
                      {convertToLocale({
                        amount: method.amount!,
                        currency_code: cart?.currency_code,
                      })}
                    </Text>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CartShippingMethodsSection
