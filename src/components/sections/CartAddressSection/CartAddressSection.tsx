"use client"

import { Heading, useToggleState } from "@medusajs/ui"
import { setAddresses } from "@/lib/data/cart"
import compareAddresses from "@/lib/helpers/compare-addresses"
import { HttpTypes } from "@medusajs/types"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { Button, Spinner } from "@/components/atoms"
import ErrorMessage from "@/components/molecules/ErrorMessage/ErrorMessage"
import ShippingAddress from "@/components/organisms/ShippingAddress/ShippingAddress"
import { MapPin } from "lucide-react"
import { Cart } from "@/types/cart"
import ShippingAddressSummary from "@/components/molecules/ShippingAddressSummary/ShippingAddressSummary"

import { GuestOTPDialog } from "@/components/organisms/GuestOTPDialog/GuestOTPDialog"
import { AddressSelectionDialog } from "@/components/organisms/AddressSelectionDialog/AddressSelectionDialog"
import { EditAddressDialog } from "@/components/organisms/EditAddressDialog/EditAddressDialog"
import { useCheckoutPayment } from "@/components/sections/CheckoutPaymentSection/CheckoutPaymentContext"

export const CartAddressSection = ({
  cart,
  customer,
  phoneAddresses = [],
  hasAuthToken = false,
}: {
  cart: Cart | null
  customer: HttpTypes.StoreCustomer | null
  phoneAddresses?: HttpTypes.StoreCustomerAddress[]
  hasAuthToken?: boolean
}) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [isOTPVerified, setIsOTPVerified] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [showAddressDialog, setShowAddressDialog] = useState(false)
  const [editDialogState, setEditDialogState] = useState<{
    isOpen: boolean
    address: HttpTypes.StoreCustomerAddress | null
  }>({
    isOpen: false,
    address: null,
  })
  const [selectedSavedAddress, setSelectedSavedAddress] =
    useState<HttpTypes.StoreCustomerAddress | null>(null)
  const [pendingAddress, setPendingAddress] =
    useState<HttpTypes.StoreCustomerAddress | null>(null)
  const autoAppliedRef = useRef(false)
  const pendingNavigationRef = useRef<{ moveToDelivery: boolean } | null>(null)
  const { setSelectedAddress, setSelectedEmail } = useCheckoutPayment()

  const savedAddresses = useMemo(() => {
    if (customer?.addresses?.length) {
      return customer.addresses
    }
    if (pendingAddress) {
      return [pendingAddress]
    }
    return phoneAddresses
  }, [customer?.addresses, pendingAddress, phoneAddresses])
  const hasSavedAddresses = savedAddresses.length > 0

  const cartHasAddress = Boolean(
    cart?.shipping_address &&
    cart?.shipping_address.first_name &&
    cart?.shipping_address.last_name &&
    cart?.shipping_address.address_1 &&
    cart?.shipping_address.city &&
    cart?.shipping_address.postal_code &&
    cart?.shipping_address.country_code
  )
  const canUseCartAddress = !hasAuthToken
  const isAddress = hasSavedAddresses || (canUseCartAddress && cartHasAddress)
  const isOpen = searchParams.get("step") === "address" || !isAddress

  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true
  )

  const [message, formAction, isPending] = useActionState(setAddresses, null)

  const hasError = Boolean(message && message !== "success")

  useEffect(() => {
    if (isPending || !pendingNavigationRef.current) {
      return
    }

    if (hasError) {
      pendingNavigationRef.current = null
      return
    }

    const { moveToDelivery } = pendingNavigationRef.current
    pendingNavigationRef.current = null

    if (pendingAddress && !selectedSavedAddress) {
      setSelectedSavedAddress(pendingAddress)
    }

    if (moveToDelivery) {
      router.replace(`${pathname}?step=delivery`)
    }
    router.refresh()
  }, [
    hasError,
    isPending,
    pathname,
    pendingAddress,
    router,
    selectedSavedAddress,
  ])

  useEffect(() => {
    if (!isAddress) {
      router.replace(pathname + "?step=address")
    }
  }, [isAddress])

  useEffect(() => {
    if (!hasSavedAddresses) {
      if (selectedSavedAddress) setSelectedSavedAddress(null)
      return
    }

    if (!selectedSavedAddress) {
      // Only fall back to default if no selection has been made yet
      const defaultAddress =
        savedAddresses.find((addr) => addr.is_default_shipping) ||
        savedAddresses[0] ||
        null
      setSelectedSavedAddress(defaultAddress)
    }
  }, [hasSavedAddresses, savedAddresses, selectedSavedAddress])

  useEffect(() => {
    if (selectedSavedAddress) {
      setSelectedAddress(selectedSavedAddress)
    }
  }, [selectedSavedAddress, setSelectedAddress])

  useEffect(() => {
    if (customer?.email || cart?.email) {
      setSelectedEmail(customer?.email || cart?.email || "")
    }
  }, [cart?.email, customer?.email, setSelectedEmail])

  const buildAddressFormData = useCallback(
    (address: HttpTypes.StoreCustomerAddress) => {
      const data = new FormData()
      data.set("shipping_address.first_name", address.first_name || "")
      data.set("shipping_address.last_name", address.last_name || "-")
      data.set("shipping_address.address_1", address.address_1 || "")
      data.set("shipping_address.address_2", address.address_2 || "")
      data.set("shipping_address.company", address.company || "")
      data.set("shipping_address.postal_code", address.postal_code || "")
      data.set("shipping_address.city", address.city || "")
      data.set("shipping_address.country_code", address.country_code || "")
      data.set("shipping_address.province", address.province || "")
      data.set("shipping_address.phone", address.phone || customer?.phone || "")
      if (customer?.email || cart?.email) {
        data.set("email", customer?.email || cart?.email || "")
      }
      return data
    },
    [cart?.email, customer?.email, customer?.phone]
  )

  const applySavedAddress = useCallback(
    (
      address: HttpTypes.StoreCustomerAddress,
      options: { moveToDelivery?: boolean } = { moveToDelivery: true }
    ) => {
      const data = buildAddressFormData(address)
      pendingNavigationRef.current = {
        moveToDelivery: options.moveToDelivery ?? true,
      }
      startTransition(() => {
        formAction(data)
      })
    },
    [buildAddressFormData, formAction]
  )

  useEffect(() => {
    if (
      !hasSavedAddresses ||
      cart?.shipping_address ||
      !selectedSavedAddress ||
      autoAppliedRef.current
    ) {
      return
    }

    autoAppliedRef.current = true
    try {
      applySavedAddress(selectedSavedAddress, { moveToDelivery: false })
    } catch (error) {
      console.error("[CartAddressSection] Auto-apply address failed:", error)
      autoAppliedRef.current = false
    }
  }, [
    applySavedAddress,
    cart?.shipping_address,
    hasSavedAddresses,
    selectedSavedAddress,
  ])

  const handleEdit = () => {
    if (hasSavedAddresses) {
      setShowAddressDialog(true)
      return
    }
    router.replace(pathname + "?step=address")
  }

  const handleVerified = (phone: string) => {
    setPhoneNumber(phone)
    setIsOTPVerified(true)
    router.refresh()
  }

  // Show OTP Dialog if not logged in and not verified
  const showOTPDialog = !hasAuthToken && !customer && !isOTPVerified

  return (
    <div className="p-4 rounded-xs  bg-sop-base-white relative">
      <GuestOTPDialog isOpen={showOTPDialog} onVerified={handleVerified} />

      <div className="flex flex-row items-center justify-between mb-6 border-b border-sop-neutral-gray-light py-2">
        <Heading
          level="h2"
          className="flex flex-row gap-x-2  items-center text-ui-fg-base"
        >
          <MapPin className="text-sop-primary-500" />
          <span className="sop-headline-sm-medium text-sop-primary-500">
            ที่อยู่ในการจัดส่ง
          </span>
        </Heading>
      </div>

      <form
        action={formAction}
        onSubmit={(event) => {
          const form = event.currentTarget
          const data = new FormData(form)
          const toText = (value: FormDataEntryValue | null) =>
            typeof value === "string" ? value : ""
          setPendingAddress({
            id: "pending-address",
            first_name: toText(data.get("shipping_address.first_name")),
            last_name: toText(data.get("shipping_address.last_name")),
            address_1: toText(data.get("shipping_address.address_1")),
            address_2: toText(data.get("shipping_address.address_2")),
            city: toText(data.get("shipping_address.city")),
            province: toText(data.get("shipping_address.province")),
            postal_code: toText(data.get("shipping_address.postal_code")),
            country_code: toText(data.get("shipping_address.country_code")),
            phone: toText(data.get("shipping_address.phone")),
            is_default_shipping: false,
            is_default_billing: false,
            created_at: "",
            updated_at: "",
            deleted_at: null,
            metadata: null,
            customer_id: customer?.id || null,
            address_name: null,
            company: toText(data.get("shipping_address.company")),
          } as unknown as HttpTypes.StoreCustomerAddress)
          pendingNavigationRef.current = { moveToDelivery: true }
        }}
      >
        {hasSavedAddresses ? (
          <div>
            {selectedSavedAddress ? (
              <ShippingAddressSummary
                cart={
                  {
                    ...(cart || {}),
                    shipping_address:
                      selectedSavedAddress as unknown as Cart["shipping_address"],
                  } as Cart
                }
                onEdit={handleEdit}
              />
            ) : (
              <div className="flex items-center justify-center p-8 bg-sop-neutral-grayfixed-50 rounded-xl">
                <Spinner />
              </div>
            )}
          </div>
        ) : isOpen ? (
          <div className="pb-8">
            <ShippingAddress
              customer={customer}
              showSaveAddress={!!customer || isOTPVerified}
              checked={sameAsBilling}
              onChange={toggleSameAsBilling}
              prefilledPhone={phoneNumber || customer?.phone || ""}
            />
            <Button
              className="mt-6"
              data-testid="submit-address-button"
              disabled={isPending}
              loading={isPending}
            >
              บันทึกและดำเนินการต่อ
            </Button>
            <ErrorMessage
              error={hasError ? message : undefined}
              data-testid="address-error-message"
            />
          </div>
        ) : (
          <div>
            {cart && <ShippingAddressSummary cart={cart} onEdit={handleEdit} />}
          </div>
        )}
      </form>

      {showAddressDialog && (
        <AddressSelectionDialog
          isOpen={showAddressDialog}
          onClose={() => setShowAddressDialog(false)}
          addresses={savedAddresses}
          currentAddressId={selectedSavedAddress?.id}
          onSelect={async (address) => {
            setSelectedSavedAddress(address)
            await applySavedAddress(address)
            setShowAddressDialog(false)
          }}
          onEdit={(address) => {
            setShowAddressDialog(false)
            setEditDialogState({ isOpen: true, address })
          }}
          onAddNew={() => {
            setShowAddressDialog(false)
            setEditDialogState({ isOpen: true, address: null })
          }}
          allowEdit={!!customer}
        />
      )}

      {editDialogState.isOpen && (
        <EditAddressDialog
          isOpen={editDialogState.isOpen}
          onClose={() =>
            setEditDialogState({ ...editDialogState, isOpen: false })
          }
          address={editDialogState.address}
          onSuccess={() => {
            router.refresh()
            // Optionally re-open selection dialog or just close
            setShowAddressDialog(true)
          }}
        />
      )}
    </div>
  )
}
