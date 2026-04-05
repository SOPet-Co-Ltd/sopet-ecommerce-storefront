"use client"

import { Heading, Text } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { MapPinIcon } from "@/icons"
import { Cart } from "@/types/cart"
import ShippingAddressSummary from "@/components/molecules/ShippingAddressSummary/ShippingAddressSummary"
import ShippingAddress from "@/components/organisms/ShippingAddress/ShippingAddress"
import { AddressSelectionDialog } from "@/components/organisms/AddressSelectionDialog/AddressSelectionDialog"
import { EditAddressDialog } from "@/components/organisms/EditAddressDialog/EditAddressDialog"
import {
  useCheckoutPayment,
  type DraftShippingAddress,
} from "@/components/sections/CheckoutPaymentSection/CheckoutPaymentContext"
import { useCheckoutPageData } from "@/app/[locale]/(checkout)/_providers/checkout-page-data-context"

function draftToCartAddress(
  draft: DraftShippingAddress
): HttpTypes.StoreCartAddress {
  return {
    first_name: draft.first_name,
    last_name: draft.last_name,
    address_1: draft.address_1,
    address_2: draft.address_2,
    city: draft.city,
    province: draft.province,
    postal_code: draft.postal_code,
    country_code: draft.country_code,
    phone: draft.phone,
  } as HttpTypes.StoreCartAddress
}

function getDefaultShippingAddress(
  addresses: HttpTypes.StoreCustomerAddress[]
): HttpTypes.StoreCustomerAddress | null {
  if (!addresses.length) {
    return null
  }

  const defaultAddress = addresses.find((addr) => addr.is_default_shipping)

  return defaultAddress ?? addresses[0] ?? null
}

type CartAddressSectionProps = {
  cart: Cart | null
  verifiedPhone?: string
}

export const CartAddressSection = ({
  cart,
  verifiedPhone,
}: CartAddressSectionProps) => {
  const router = useRouter()
  const {
    customer,
    isLoading: checkoutDataLoading,
    refetch,
  } = useCheckoutPageData()
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
  /** When true, show draft form even though user has saved addresses (e.g. "Add new" from dialog). */
  const [addingNewAddress, setAddingNewAddress] = useState(false)

  const {
    setSelectedAddress,
    setSelectedEmail,
    shippingAddressIsDraft,
    setShippingAddressIsDraft,
    draftAddress,
    setDraftAddress,
  } = useCheckoutPayment()

  const savedAddresses = useMemo(() => {
    return customer?.addresses || []
  }, [customer])
  const hasSavedAddresses = savedAddresses.length > 0

  const showDraftForm =
    !hasSavedAddresses || (hasSavedAddresses && addingNewAddress)

  // Set default saved address in context when we have saved addresses and not showing draft form
  useEffect(() => {
    if (!hasSavedAddresses || showDraftForm) {
      return
    }

    if (!selectedSavedAddress) {
      setSelectedSavedAddress(getDefaultShippingAddress(savedAddresses))
      return
    }

    setSelectedAddress(selectedSavedAddress)
    setShippingAddressIsDraft(false)
  }, [
    hasSavedAddresses,
    showDraftForm,
    savedAddresses,
    selectedSavedAddress,
    setSelectedAddress,
    setShippingAddressIsDraft,
  ])

  // When showing draft form, sync selectedAddress from draft (for summary/payment section)
  useEffect(() => {
    if (!showDraftForm) return
    setShippingAddressIsDraft(true)
    setSelectedAddress(draftToCartAddress(draftAddress))
  }, [
    showDraftForm,
    draftAddress.first_name,
    draftAddress.last_name,
    draftAddress.address_1,
    draftAddress.address_2,
    draftAddress.city,
    draftAddress.province,
    draftAddress.postal_code,
    draftAddress.country_code,
    draftAddress.phone,
    setSelectedAddress,
    setShippingAddressIsDraft,
  ])

  useEffect(() => {
    if (customer?.email || cart?.email) {
      setSelectedEmail(customer?.email || cart?.email || "")
    }
  }, [cart?.email, customer?.email, setSelectedEmail])

  const handleEdit = useCallback(() => {
    if (hasSavedAddresses) {
      setShowAddressDialog(true)
      return
    }
    setAddingNewAddress(true)
  }, [hasSavedAddresses])

  return (
    <div className="p-4 bg-sop-base-white relative">
      <div className="flex flex-row items-center gap-2 border-b border-sop-neutral-gray-light py-2 mb-4">
        <MapPinIcon className="w-[18px] md:w-[25px] h-[18px] md:h-[25px] text-sop-primary-500" />
        <Heading
          level="h2"
          className="sop-body-sm-regular md:sop-headline-sm-medium text-sop-primary-500"
        >
          ที่อยู่ในการจัดส่ง
        </Heading>
      </div>

      {checkoutDataLoading ? (
        <Text className="text-sm text-gray-500 py-6">
          กำลังโหลดที่อยู่และข้อมูลลูกค้า…
        </Text>
      ) : null}

      {!checkoutDataLoading && hasSavedAddresses && !showDraftForm ? (
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
          ) : null}
        </div>
      ) : !checkoutDataLoading ? (
        <div className="pb-8">
          <ShippingAddress
            customer={customer}
            showSaveAddress={false}
            checked={true}
            onChange={() => {}}
            prefilledPhone={verifiedPhone ?? customer?.phone ?? ""}
            controlledDraft={draftAddress}
            onDraftChange={setDraftAddress}
          />
          {hasSavedAddresses && addingNewAddress && (
            <button
              type="button"
              className="mt-4 text-sm text-gray-500 hover:text-gray-700"
              onClick={() => {
                setAddingNewAddress(false)
                setSelectedSavedAddress(
                  getDefaultShippingAddress(savedAddresses)
                )
              }}
            >
              ยกเลิก - ใช้ที่อยู่ที่บันทึกไว้
            </button>
          )}
        </div>
      ) : null}

      {showAddressDialog && (
        <AddressSelectionDialog
          isOpen={showAddressDialog}
          onClose={() => setShowAddressDialog(false)}
          addresses={savedAddresses}
          currentAddressId={selectedSavedAddress?.id}
          onSelect={(address) => {
            setSelectedSavedAddress(address)
            setSelectedAddress(address)
            setShippingAddressIsDraft(false)
            setShowAddressDialog(false)
          }}
          onEdit={(address) => {
            setShowAddressDialog(false)
            setEditDialogState({ isOpen: true, address })
          }}
          onAddNew={() => {
            setShowAddressDialog(false)
            setAddingNewAddress(true)
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
          onSuccess={async () => {
            await refetch()
            router.refresh()
            setShowAddressDialog(true)
          }}
        />
      )}
    </div>
  )
}
