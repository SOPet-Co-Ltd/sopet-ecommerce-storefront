import { create } from "zustand"

export type OrderManagementTab =
  | "all"
  | "to-pay"
  | "to-ship"
  | "to-receive"
  | "completed"
  | "cancelled"

export type OrderManagementModalKind =
  | "payment"
  | "change-payment"
  | "cancel"
  | "review"

type ActiveOrderManagementModal = {
  kind: OrderManagementModalKind
  orderId: string
} | null

type OrderPaymentFlowState = {
  selectedCardId: string | null
  paymentSecretsBootstrap: string[] | null
  forceMethodSelection: boolean
}

type OrderManagementUiState = {
  activeTab: OrderManagementTab
  activeModal: ActiveOrderManagementModal
  paymentFlowByOrderId: Record<string, OrderPaymentFlowState | undefined>
  setActiveTab: (tab: OrderManagementTab) => void
  openModal: (kind: OrderManagementModalKind, orderId: string) => void
  closeModal: () => void
  setSelectedCardId: (orderId: string, cardId: string | null) => void
  setPaymentSecretsBootstrap: (
    orderId: string,
    clientSecrets: string[] | null
  ) => void
  setForceMethodSelection: (orderId: string, enabled: boolean) => void
  clearPaymentFlow: (orderId: string) => void
}

const DEFAULT_ACTIVE_TAB: OrderManagementTab = "all"

const getOrderPaymentFlowState = (
  current: OrderPaymentFlowState | undefined
): OrderPaymentFlowState => ({
  selectedCardId: current?.selectedCardId ?? null,
  paymentSecretsBootstrap: current?.paymentSecretsBootstrap ?? null,
  forceMethodSelection: current?.forceMethodSelection ?? false,
})

export const useOrderManagementUiStore = create<OrderManagementUiState>(
  (set) => ({
    activeTab: DEFAULT_ACTIVE_TAB,
    activeModal: null,
    paymentFlowByOrderId: {},
    setActiveTab: (tab) =>
      set({
        activeTab: tab,
      }),
    openModal: (kind, orderId) =>
      set({
        activeModal: { kind, orderId },
      }),
    closeModal: () =>
      set({
        activeModal: null,
      }),
    setSelectedCardId: (orderId, cardId) =>
      set((state) => ({
        paymentFlowByOrderId: {
          ...state.paymentFlowByOrderId,
          [orderId]: {
            ...getOrderPaymentFlowState(state.paymentFlowByOrderId[orderId]),
            selectedCardId: cardId,
          },
        },
      })),
    setPaymentSecretsBootstrap: (orderId, clientSecrets) =>
      set((state) => ({
        paymentFlowByOrderId: {
          ...state.paymentFlowByOrderId,
          [orderId]: {
            ...getOrderPaymentFlowState(state.paymentFlowByOrderId[orderId]),
            paymentSecretsBootstrap: clientSecrets,
          },
        },
      })),
    setForceMethodSelection: (orderId, enabled) =>
      set((state) => ({
        paymentFlowByOrderId: {
          ...state.paymentFlowByOrderId,
          [orderId]: {
            ...getOrderPaymentFlowState(state.paymentFlowByOrderId[orderId]),
            forceMethodSelection: enabled,
          },
        },
      })),
    clearPaymentFlow: (orderId) =>
      set((state) => ({
        paymentFlowByOrderId: {
          ...state.paymentFlowByOrderId,
          [orderId]: {
            selectedCardId: null,
            paymentSecretsBootstrap: null,
            forceMethodSelection: false,
          },
        },
      })),
  })
)
