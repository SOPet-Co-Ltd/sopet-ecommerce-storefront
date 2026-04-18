"use client"

import { useOrderDetailsQuery } from "@/hooks/useOrderManagementQuery"
import { ClearCheckoutCartHold } from "@/components/sections/OrderConfirmedSection/ClearCheckoutCartHold"
import { OrderConfirmedSection } from "@/components/sections/OrderConfirmedSection/OrderConfirmedSection"
import { Container, Heading, Text } from "@medusajs/ui"
import { CheckCircleSolid } from "@medusajs/icons"
import Link from "next/link"

type OrderConfirmedClientProps = {
  orderId: string
}

const OrderConfirmationSkeleton = () => {
  return (
    <div className="py-12 animate-pulse flex flex-col items-center justify-center">
      <div className="flex flex-col gap-y-6 items-center w-full max-w-4xl px-4">
        {/* Header Icon Skeleton */}
        <div className="w-20 h-20 bg-gray-200 rounded-full mb-4" />
        
        {/* Title Skeleton */}
        <div className="w-3/4 max-w-[400px] h-10 rounded-lg bg-gray-200 animate-pulse" />
        
        {/* Subtitle Skeleton */}
        <div className="w-1/2 max-w-[300px] h-6 rounded-md mb-8 bg-gray-200 animate-pulse" />
        
        {/* Content Box Skeleton */}
        <div className="w-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-6">
          <div className="w-1/3 h-8 rounded-md bg-gray-200 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="w-full h-24 rounded-xl bg-gray-200 animate-pulse" />
            <div className="w-full h-24 rounded-xl bg-gray-200 animate-pulse" />
          </div>
          <div className="w-full space-y-4 mt-4">
            <div className="w-full h-16 rounded-xl bg-gray-200 animate-pulse" />
            <div className="w-full h-16 rounded-xl bg-gray-200 animate-pulse" />
          </div>
          <div className="w-full h-[1px] bg-gray-100 my-4" />
          <div className="flex justify-between items-center">
            <div className="w-1/4 h-6 rounded-md bg-gray-200 animate-pulse" />
            <div className="w-1/4 h-8 rounded-md bg-gray-200 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}

const OrderNotFound = () => {
  return (
    <div className="py-24 flex flex-col items-center justify-center text-center px-4">
      <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
        <span className="text-4xl">😕</span>
      </div>
      <Heading level="h1" className="text-2xl font-bold text-gray-900 mb-3">
        ไม่พบข้อมูลคำสั่งซื้อ
      </Heading>
      <Text className="text-gray-500 max-w-md">
        อาจเกิดจากลิงก์หมดอายุ หรือเกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองตรวจสอบที่หน้า &quot;การสั่งซื้อของฉัน&quot; ในบัญชีของคุณ
      </Text>
      <Link 
        href="/user/orders"
        className="mt-8 px-6 py-3 bg-sopet-violet text-white rounded-full font-medium hover:bg-sopet-violet-dark transition-colors duration-200"
      >
        ไปยังหน้าการสั่งซื้อ
      </Link>
    </div>
  )
}

export const OrderConfirmedClient = ({ orderId }: OrderConfirmedClientProps) => {
  const { data, isLoading, isError } = useOrderDetailsQuery({
    orderId,
  })

  // Since we don't block SSR, we show a premium skeleton while fetching
  if (isLoading) {
    return (
      <main className="container min-h-[60vh] flex items-center justify-center bg-gray-50/50">
        <ClearCheckoutCartHold />
        <OrderConfirmationSkeleton />
      </main>
    )
  }

  // If query failed or returned no order after fetching
  if (isError || !data?.order) {
    return (
      <main className="container min-h-[60vh] bg-gray-50/50">
        <ClearCheckoutCartHold />
        <OrderNotFound />
      </main>
    )
  }

  // Loaded successfully
  return (
    <main className="container bg-gray-50/50 min-h-screen pb-20">
      <ClearCheckoutCartHold />
      <div className="pt-12 pb-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out flex flex-col items-center">
        {/* Premium Success Indicator */}
        <div className="relative mb-8 flex justify-center">
          <div className="absolute inset-0 bg-green-100 rounded-full scale-150 animate-pulse opacity-50"></div>
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200 relative z-10 animate-bounce">
            <CheckCircleSolid className="w-10 h-10 text-white" />
          </div>
        </div>

        <Heading level="h1" className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4 tracking-tight">
          การสั่งซื้อสำเร็จ! 🎉
        </Heading>
        
        <Text className="text-gray-600 text-center max-w-lg mb-2 text-lg">
          ขอบคุณที่ไว้วางใจ SOPet เราได้ส่งรายละเอียดการสั่งซื้อไปที่อีเมลของคุณแล้ว
        </Text>
        <Text className="text-gray-500 text-center font-medium px-4 py-1.5 bg-gray-100 rounded-full mb-10">
          อีเมล: {data.order.email}
        </Text>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out delay-150 fill-mode-both">
        <OrderConfirmedSection order={data.order} />
      </div>
    </main>
  )
}
