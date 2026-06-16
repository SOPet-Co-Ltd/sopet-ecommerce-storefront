"use client"

import { HttpTypes } from "@medusajs/types"
import { CategoryNavbar, HeaderCategoryNavbar } from "@/components/molecules"
import { CloseIcon, HamburgerMenuIcon } from "@/icons"
import { useState, useEffect, useRef } from "react"

export const MobileNavbar = ({
  childrenCategories,
  parentCategories,
}: {
  childrenCategories: HttpTypes.StoreProductCategory[]
  parentCategories: HttpTypes.StoreProductCategory[]
}) => {
  const [openMenu, setOpenMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const closeMenuHandler = () => {
    setOpenMenu(false)
    // Return focus to trigger button when closing
    triggerRef.current?.focus()
  }

  // Focus trap and escape key handler
  useEffect(() => {
    if (!openMenu) return

    // Focus the menu when it opens
    menuRef.current?.focus()

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMenuHandler()
      }
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return

      const focusableElements = menuRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusableElements || focusableElements.length === 0) return

      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener("keydown", handleEscape)
    document.addEventListener("keydown", handleTabKey)

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.removeEventListener("keydown", handleTabKey)
    }
  }, [openMenu])

  return (
    <div className="lg:hidden">
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpenMenu(true)}
        aria-label="เปิดเมนู"
        aria-expanded={openMenu}
        aria-controls="mobile-menu"
      >
        <HamburgerMenuIcon aria-hidden="true" />
      </button>
      {openMenu && (
        <div
          id="mobile-menu"
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          aria-label="เมนูหลัก"
          tabIndex={-1}
          className="fixed w-full h-full bg-primary p-2 top-0 left-0 z-20"
        >
          <div className="flex justify-end">
            <button
              type="button"
              onClick={closeMenuHandler}
              aria-label="ปิดเมนู"
              className="p-2"
            >
              <CloseIcon size={20} aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="หมวดหมู่สินค้า" className="border mt-4 rounded-xs">
            <HeaderCategoryNavbar
              onClose={closeMenuHandler}
              categories={parentCategories}
            />
            <div className="border-t pt-2">
              <CategoryNavbar
                onClose={closeMenuHandler}
                categories={childrenCategories}
              />
            </div>
          </nav>
        </div>
      )}
    </div>
  )
}
