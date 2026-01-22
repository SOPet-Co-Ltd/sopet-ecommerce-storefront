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

export const CartAddressSection = ({
  cart,
  customer,
  phoneAddresses = [],
  guestPhone,
}: {
  cart: Cart | null
  customer: HttpTypes.StoreCustomer | null
  phoneAddresses?: HttpTypes.StoreCustomerAddress[]
  guestPhone?: string | null
}) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [isOTPVerified, setIsOTPVerified] = useState(!!guestPhone)
  const [phoneNumber, setPhoneNumber] = useState(guestPhone || "")
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
  const autoAppliedRef = useRef(false)
  const pendingNavigationRef = useRef<{ moveToDelivery: boolean } | null>(null)

  const isAddress = Boolean(
    cart?.shipping_address &&
    cart?.shipping_address.first_name &&
    cart?.shipping_address.last_name &&
    cart?.shipping_address.address_1 &&
    cart?.shipping_address.city &&
    cart?.shipping_address.postal_code &&
    cart?.shipping_address.country_code
  )
  const isOpen = searchParams.get("step") === "address" || !isAddress

  const savedAddresses = useMemo(() => {
    if (customer?.addresses?.length) {
      return customer.addresses
    }
    return phoneAddresses
  }, [customer?.addresses, phoneAddresses])
  const hasSavedAddresses = savedAddresses.length > 0

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

    if (moveToDelivery) {
      router.replace(`${pathname}?step=delivery`)
    }
    router.refresh()
  }, [hasError, isPending, pathname, router])

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

    const fromCart = cart?.shipping_address
      ? savedAddresses.find((addr) =>
          compareAddresses(addr, cart.shipping_address)
        )
      : null

    if (fromCart) {
      setSelectedSavedAddress(fromCart)
    } else if (!selectedSavedAddress) {
      // Only fall back to default if no selection has been made yet
      const defaultAddress =
        savedAddresses.find((addr) => addr.is_default_shipping) ||
        savedAddresses[0] ||
        null
      setSelectedSavedAddress(defaultAddress)
    }
  }, [hasSavedAddresses, savedAddresses, cart?.shipping_address])

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
      data.set(
        "shipping_address.phone",
        address.phone || customer?.phone || guestPhone || ""
      )
      if (customer?.email || cart?.email) {
        data.set("email", customer?.email || cart?.email || "")
      }
      return data
    },
    [cart?.email, customer?.email, customer?.phone, guestPhone]
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

  useEffect(() => {
    if (guestPhone) {
      setPhoneNumber(guestPhone)
      setIsOTPVerified(true)
    }
  }, [guestPhone])

  // Show OTP Dialog if not logged in and not verified
  const showOTPDialog = !customer && !isOTPVerified && isOpen

  return (
    <div className="p-4 rounded-xs  bg-sop-base-white relative">
      <GuestOTPDialog isOpen={showOTPDialog} onVerified={handleVerified} />

      <div className="flex flex-row items-center justify-between mb-6 border-b border-sop-neutral-gray-light py-2">
        <Heading
          level="h2"
          className="flex flex-row text-3xl-regular gap-x-2  items-center text-ui-fg-base"
        >
          <MapPin className="text-purple-600" />
          <span className="text-lg font-normal text-purple-600">
            ที่อยู่ในการจัดส่ง
          </span>
        </Heading>
      </div>

      <form
        action={formAction}
        onSubmit={() => {
          pendingNavigationRef.current = { moveToDelivery: true }
        }}
      >
        {hasSavedAddresses ? (
          <div>
            {selectedSavedAddress || cart?.shipping_address ? (
              <ShippingAddressSummary
                cart={
                  {
                    ...(cart || {}),
                    shipping_address:
                      (selectedSavedAddress as unknown as Cart["shipping_address"]) ||
                      cart?.shipping_address,
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
              cart={cart}
              prefilledPhone={phoneNumber}
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
          currentAddressId={
            selectedSavedAddress?.id || cart?.shipping_address?.id
          }
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
