# WCAG 2.1 Accessibility Guidelines - SOPet E-commerce Storefront

## Table of Contents

1. [Overview](#overview)
2. [WCAG Conformance Levels](#wcag-conformance-levels)
3. [Development Guidelines](#development-guidelines)
4. [Component-Specific Guidelines](#component-specific-guidelines)
5. [Testing Requirements](#testing-requirements)
6. [Resources](#resources)

## Overview

This document outlines the Web Content Accessibility Guidelines (WCAG) 2.1 compliance standards for the SOPet e-commerce storefront. Our target is **WCAG 2.1 Level AA** conformance.

### Why Accessibility Matters

- **Legal compliance**: Many jurisdictions require accessible websites
- **Market reach**: 15% of the global population has some form of disability
- **SEO benefits**: Accessible sites rank better in search engines
- **Better UX**: Accessibility improvements benefit all users

### Target Audience

- Screen reader users (NVDA, JAWS, VoiceOver, TalkBack)
- Keyboard-only users
- Users with low vision or color blindness
- Users with cognitive disabilities
- Users with motor impairments

## WCAG Conformance Levels

### Level A (Minimum)

Must be addressed. Failure to meet Level A creates barriers that make content inaccessible to many users.

### Level AA (Target)

Should be addressed. Provides significant accessibility improvements. This is our compliance target.

### Level AAA (Enhanced)

May be addressed where feasible, but not required for all content.

## Development Guidelines

### 1. Perceivable

#### 1.1 Text Alternatives

**Guideline**: Provide text alternatives for non-text content.

```tsx
// ✅ Good - Decorative images
<div role="img" aria-label="SOPet โลโก้">
  <SOPetLogo size={250} />
</div>

// ✅ Good - Informative images with next/image
<Image
  src="/product.jpg"
  alt="น้ำยาทำความสะอาด สูตรไม่ระคายเคือง 500ml"
  width={300}
  height={300}
/>

// ❌ Bad - Missing alt text
<img src="/product.jpg" />

// ❌ Bad - Redundant alt text
<img src="/product.jpg" alt="รูปภาพ" />
```

#### 1.3 Adaptable

**Guideline**: Create content that can be presented in different ways without losing information.

```tsx
// ✅ Good - Semantic HTML structure
<form onSubmit={handleSubmit}>
  <label htmlFor="email">อีเมล</label>
  <input id="email" type="email" required />
  <button type="submit">ส่ง</button>
</form>

// ❌ Bad - Divs instead of semantic elements
<div onClick={handleSubmit}>
  <div>อีเมล</div>
  <input type="text" />
  <div onClick={submit}>ส่ง</div>
</div>
```

#### 1.4 Distinguishable

**Guideline**: Make it easier for users to see and hear content.

- **Contrast ratio**: 4.5:1 for normal text, 3:1 for large text
- **Text sizing**: Support up to 200% zoom without loss of functionality
- **Color**: Don't rely solely on color to convey information

```tsx
// ✅ Good - Error indication with icon and text
<div className="text-red-500" role="alert">
  <AlertIcon aria-hidden="true" />
  <span>กรุณากรอกอีเมลให้ถูกต้อง</span>
</div>

// ❌ Bad - Color only
<div className="text-red-500">
  กรุณากรอกอีเมลให้ถูกต้อง
</div>
```

### 2. Operable

#### 2.1 Keyboard Accessible

**Guideline**: Make all functionality available from a keyboard.

```tsx
// ✅ Good - Keyboard accessible
<button onClick={handleClick}>คลิก</button>

// ❌ Bad - Div with only onClick
<div onClick={handleClick}>คลิก</div>

// ✅ Good - Custom interactive element
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }}
>
  คลิก
</div>
```

**Testing**: Navigate your entire application using only `Tab`, `Shift+Tab`, `Enter`, `Space`, and arrow keys.

#### 2.2 Enough Time

**Guideline**: Provide users enough time to read and use content.

```tsx
// ✅ Good - Countdown with pause option
;<div>
  <p>รหัสจะหมดอายุใน {countdown} วินาที</p>
  <button onClick={pauseCountdown}>หยุดชั่วคราว</button>
  <button onClick={extendTime}>ขอเวลาเพิ่ม</button>
</div>

// ⚠️ Consider - Session timeout with warning
useEffect(() => {
  const warningTime = setTimeout(
    () => {
      setShowTimeoutWarning(true)
    },
    18 * 60 * 1000
  ) // Warn at 18 minutes

  const logoutTime = setTimeout(
    () => {
      logout()
    },
    20 * 60 * 1000
  ) // Logout at 20 minutes

  return () => {
    clearTimeout(warningTime)
    clearTimeout(logoutTime)
  }
}, [])
```

#### 2.4 Navigable

**Guideline**: Provide ways to help users navigate, find content, and determine where they are.

```tsx
// ✅ Good - Skip to main content
<a href="#main-content" className="sr-only focus:not-sr-only">
  ข้ามไปยังเนื้อหาหลัก
</a>
<main id="main-content">
  {/* Main content */}
</main>

// ✅ Good - Page titles
<Head>
  <title>สินค้าสำหรับสุนัข - SOPet</title>
</Head>

// ✅ Good - Breadcrumbs
<nav aria-label="Breadcrumb">
  <ol className="flex gap-2">
    <li><Link href="/">หน้าแรก</Link></li>
    <li aria-current="page">สินค้าสำหรับสุนัข</li>
  </ol>
</nav>

// ✅ Good - Heading hierarchy
<h1>หมวดหมู่สินค้า</h1>
<section>
  <h2>สินค้าสำหรับสุนัข</h2>
  <h3>อาหารสุนัข</h3>
</section>
```

#### 2.5 Input Modalities

**Guideline**: Make it easier for users to operate functionality through various inputs.

```tsx
// ✅ Good - Touch target size (minimum 44x44px)
<button className="min-w-[44px] min-h-[44px] p-3">
  เพิ่มในตะกร้า
</button>

// ✅ Good - Adequate spacing between clickable elements
<div className="flex gap-4">
  <button>แก้ไข</button>
  <button>ลบ</button>
</div>
```

### 3. Understandable

#### 3.1 Readable

**Guideline**: Make text content readable and understandable.

```tsx
// ✅ Good - Language declaration
<html lang="th">
  {/* Thai content */}
</html>

// ✅ Good - Language changes
<p>
  ยินดีต้อนรับสู่ SOPet <span lang="en">Premium Pet Store</span>
</p>
```

#### 3.2 Predictable

**Guideline**: Make web pages appear and operate in predictable ways.

```tsx
// ✅ Good - Consistent navigation
<nav>
  <Link href="/">หน้าแรก</Link>
  <Link href="/products">สินค้า</Link>
  <Link href="/cart">ตะกร้า</Link>
  <Link href="/account">บัญชี</Link>
</nav>

// ❌ Bad - Automatic form submission
<input onChange={(e) => submitForm()} /> // Unexpected behavior

// ✅ Good - Explicit submission
<input onChange={(e) => setValue(e.target.value)} />
<button type="submit">ค้นหา</button>
```

#### 3.3 Input Assistance

**Guideline**: Help users avoid and correct mistakes.

```tsx
// ✅ Good - Label and error pattern
<div>
  <label htmlFor="email">อีเมล</label>
  <input
    id="email"
    type="email"
    aria-required="true"
    aria-invalid={!!error}
    aria-describedby={error ? "email-error" : undefined}
  />
  {error && (
    <div id="email-error" role="alert" aria-live="polite">
      {error}
    </div>
  )}
</div>

// ✅ Good - Input hints
<div>
  <label htmlFor="phone">เบอร์โทรศัพท์</label>
  <input
    id="phone"
    type="tel"
    placeholder="08-1234-5678"
    aria-describedby="phone-hint"
  />
  <p id="phone-hint" className="text-sm text-gray-500">
    รูปแบบ: XX-XXXX-XXXX
  </p>
</div>

// ✅ Good - Confirmation for destructive actions
const handleDelete = async () => {
  if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้?')) {
    await deleteItem()
  }
}
```

### 4. Robust

#### 4.1 Compatible

**Guideline**: Maximize compatibility with current and future user tools.

```tsx
// ✅ Good - Valid ARIA usage
;<div
  role="dialog"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
  aria-modal="true"
>
  <h2 id="dialog-title">ยืนยันการสั่งซื้อ</h2>
  <p id="dialog-description">กรุณาตรวจสอบรายการสั่งซื้อ</p>
</div>

// ✅ Good - Unique IDs
{
  items.map((item) => (
    <div key={item.id}>
      <label htmlFor={`qty-${item.id}`}>จำนวน</label>
      <input id={`qty-${item.id}`} type="number" />
    </div>
  ))
}

// ❌ Bad - Duplicate IDs
{
  items.map((item) => (
    <div key={item.id}>
      <label htmlFor="qty">จำนวน</label>
      <input id="qty" type="number" />
    </div>
  ))
}
```

## Component-Specific Guidelines

### Forms

```tsx
// Complete accessible form example
export function AccessibleForm() {
  const [value, setValue] = useState("")
  const [error, setError] = useState("")
  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus()
    }
  }, [error])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value) {
      setError("กรุณากรอกข้อมูล")
      return
    }
    // Submit form
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="field">ฟิลด์</label>
        <input
          id="field"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-required="true"
          aria-invalid={!!error}
          aria-describedby={error ? "field-error" : undefined}
          autoFocus
        />
      </div>
      {error && (
        <div
          id="field-error"
          ref={errorRef}
          role="alert"
          aria-live="polite"
          tabIndex={-1}
        >
          {error}
        </div>
      )}
      <button type="submit">ส่ง</button>
    </form>
  )
}
```

### Buttons

```tsx
// ✅ Good - Accessible button patterns
<button type="button" onClick={handleClick}>
  คลิก
</button>

<button type="submit" disabled={loading} aria-busy={loading}>
  {loading ? "กำลังส่ง..." : "ส่ง"}
</button>

<button
  type="button"
  aria-label="ปิด"
  onClick={handleClose}
>
  <CloseIcon aria-hidden="true" />
</button>

// Icon button with visible text
<button className="flex items-center gap-2">
  <CartIcon aria-hidden="true" />
  <span>ตะกร้าสินค้า</span>
</button>
```

### Modals/Dialogs

```tsx
export function AccessibleModal({ isOpen, onClose, title, children }) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      ref={modalRef}
      tabIndex={-1}
    >
      <h2 id="modal-title">{title}</h2>
      {children}
      <button onClick={onClose} aria-label="ปิด">
        <CloseIcon aria-hidden="true" />
      </button>
    </div>
  )
}
```

### Navigation

```tsx
// ✅ Good - Accessible navigation
<nav aria-label="หลัก">
  <ul>
    <li>
      <Link href="/">หน้าแรก</Link>
    </li>
    <li>
      <Link href="/products">สินค้า</Link>
    </li>
    <li>
      <Link href="/cart" aria-label={`ตะกร้า (${cartCount} รายการ)`}>
        ตะกร้า {cartCount > 0 && `(${cartCount})`}
      </Link>
    </li>
  </ul>
</nav>
```

### Loading States

```tsx
// ✅ Good - Accessible loading indicators
<div role="status" aria-live="polite" aria-busy={loading}>
  {loading ? (
    <>
      <Spinner aria-hidden="true" />
      <span className="sr-only">กำลังโหลด...</span>
    </>
  ) : (
    <div>{content}</div>
  )}
</div>

// ✅ Good - Live region for dynamic content
<div aria-live="polite" aria-atomic="true">
  {message}
</div>
```

### Tables

```tsx
// ✅ Good - Accessible data table
<table>
  <caption>รายการสินค้าในตะกร้า</caption>
  <thead>
    <tr>
      <th scope="col">สินค้า</th>
      <th scope="col">ราคา</th>
      <th scope="col">จำนวน</th>
      <th scope="col">รวม</th>
    </tr>
  </thead>
  <tbody>
    {items.map((item) => (
      <tr key={item.id}>
        <td>{item.name}</td>
        <td>{item.price}</td>
        <td>{item.quantity}</td>
        <td>{item.total}</td>
      </tr>
    ))}
  </tbody>
</table>
```

## Testing Requirements

### Manual Testing Checklist

- [ ] Keyboard navigation (Tab, Shift+Tab, Enter, Space, Arrow keys)
- [ ] Screen reader testing (NVDA on Windows, VoiceOver on Mac/iOS, TalkBack on Android)
- [ ] Zoom to 200% - verify no content loss or horizontal scrolling
- [ ] Test with high contrast mode
- [ ] Test with color blindness simulators
- [ ] Test form validation and error handling
- [ ] Test loading states and dynamic content
- [ ] Verify all images have appropriate alt text
- [ ] Check heading hierarchy (no skipped levels)
- [ ] Verify focus indicators are visible

### Automated Testing

Use these tools during development:

- **Browser extensions**: axe DevTools, WAVE
- **Lighthouse**: Accessibility audit in Chrome DevTools
- **eslint-plugin-jsx-a11y**: Catch issues during development

### Testing Priorities

1. **Critical flows**: Login, checkout, payment
2. **Navigation**: Main menu, breadcrumbs, search
3. **Content**: Product listings, product details
4. **Account management**: Profile, orders, addresses
5. **Support**: Contact forms, help pages

## Resources

### WCAG 2.1 Documentation

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WCAG 2.1 Understanding Docs](https://www.w3.org/WAI/WCAG21/Understanding/)

### Testing Tools

- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [NVDA Screen Reader](https://www.nvaccess.org/) (Windows, free)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Learning Resources

- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)

### Thai Language Resources

- Thai screen reader users primarily use NVDA or JAWS on Windows
- Mobile users primarily use TalkBack (Android) or VoiceOver (iOS)
- Ensure proper lang="th" attribute for correct pronunciation

## Questions?

For questions about implementing these guidelines, consult:

1. This documentation
2. W3C WCAG 2.1 official documentation
3. Team accessibility lead
4. Accessibility audit reports

---

Last updated: 2026-06-16
