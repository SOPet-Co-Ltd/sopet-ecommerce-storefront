# Accessibility Quick Reference Checklist

Quick checklist for developers working on SOPet storefront. For detailed guidelines, see [WCAG_GUIDELINES.md](./WCAG_GUIDELINES.md).

## Before Every Commit ✅

- [ ] All images have meaningful alt text (or alt="" for decorative)
- [ ] All form inputs have associated labels
- [ ] All buttons have descriptive text or aria-label
- [ ] No divs used for interactive elements (use button/a/input)
- [ ] All interactive elements are keyboard accessible

## Forms

### Basic Form Pattern

```tsx
<form onSubmit={handleSubmit} noValidate>
  <div>
    <label htmlFor="email">อีเมล</label>
    <input
      id="email"
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      aria-required="true"
      aria-invalid={!!error}
      aria-describedby={error ? "email-error" : undefined}
    />
  </div>
  {error && (
    <div id="email-error" role="alert" aria-live="polite">
      {error}
    </div>
  )}
  <button type="submit" disabled={loading} aria-busy={loading}>
    {loading ? "กำลังส่ง..." : "ส่ง"}
  </button>
</form>
```

### Checklist

- [ ] Form has `onSubmit` handler
- [ ] Inputs have unique `id` attributes
- [ ] Labels use `htmlFor` matching input `id`
- [ ] Required inputs have `aria-required="true"`
- [ ] Errors have `role="alert"` and `aria-live="polite"`
- [ ] Errors linked to inputs via `aria-describedby`
- [ ] Submit button has `type="submit"`
- [ ] Loading state uses `aria-busy`

## Buttons

### Icon Buttons

```tsx
// ✅ Good
<button type="button" aria-label="ปิด" onClick={onClose}>
  <CloseIcon aria-hidden="true" />
</button>

// ❌ Bad
<button onClick={onClose}>
  <CloseIcon />
</button>
```

### Loading Buttons

```tsx
// ✅ Good
<button type="submit" disabled={loading} aria-busy={loading}>
  {loading ? "กำลังส่ง..." : "ส่ง"}
</button>
```

### Checklist

- [ ] Button has explicit `type` attribute
- [ ] Icon-only buttons have `aria-label`
- [ ] Decorative icons have `aria-hidden="true"`
- [ ] Loading state uses `aria-busy`
- [ ] Disabled state is semantic (not just styling)

## Links

### Basic Links

```tsx
// ✅ Good - Descriptive
<Link href="/products/dog-food">อาหารสุนัข</Link>

// ❌ Bad - Generic
<Link href="/products/dog-food">อ่านเพิ่มเติม</Link>

// ✅ Good - Context added
<Link href="/products/dog-food" aria-label="อ่านเพิ่มเติมเกี่ยวกับอาหารสุนัข">
  อ่านเพิ่มเติม
</Link>
```

### Logo Links

```tsx
// ✅ Good
<Link href="/" aria-label="SOPet หน้าหลัก">
  <SOPetLogo aria-hidden="true" />
</Link>
```

### Checklist

- [ ] Link text is descriptive (avoid "คลิกที่นี่", "อ่านเพิ่มเติม")
- [ ] Logo links have `aria-label`
- [ ] Active page link has `aria-current="page"`

## Images

### Informative Images

```tsx
// ✅ Good
<Image
  src="/product.jpg"
  alt="อาหารสุนัข Royal Canin ขนาด 2kg สูตรผู้ใหญ่"
  width={300}
  height={300}
/>
```

### Decorative Images

```tsx
// ✅ Good
<div role="img" aria-label="SOPet โลโก้">
  <SOPetLogo />
</div>

// ✅ Good - Purely decorative
<Image src="/pattern.jpg" alt="" decorative />
```

### Checklist

- [ ] Informative images have descriptive alt text
- [ ] Decorative images have `alt=""` or `aria-hidden="true"`
- [ ] Alt text doesn't include "รูปภาพของ", "ภาพ"
- [ ] Complex images have extended descriptions

## Modals/Dialogs

### Basic Modal Pattern

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

### Checklist

- [ ] Modal has `role="dialog"`
- [ ] Modal has `aria-modal="true"`
- [ ] Title has unique `id` referenced by `aria-labelledby`
- [ ] Focus moves to modal when opened
- [ ] Focus returns to trigger when closed
- [ ] Escape key closes modal
- [ ] Close button is keyboard accessible

## Navigation

### Main Navigation

```tsx
<nav aria-label="หลัก">
  <ul>
    <li>
      <Link href="/" aria-current={pathname === "/" ? "page" : undefined}>
        หน้าแรก
      </Link>
    </li>
    <li>
      <Link href="/products">สินค้า</Link>
    </li>
  </ul>
</nav>
```

### Breadcrumbs

```tsx
<nav aria-label="breadcrumb">
  <ol className="flex gap-2">
    <li>
      <Link href="/">หน้าแรก</Link>
    </li>
    <li>
      <Link href="/products">สินค้า</Link>
    </li>
    <li aria-current="page">อาหารสุนัข</li>
  </ol>
</nav>
```

### Checklist

- [ ] Nav has descriptive `aria-label`
- [ ] Current page has `aria-current="page"`
- [ ] Skip to main content link present
- [ ] Navigation is keyboard accessible

## Interactive Widgets

### Accordion

```tsx
<div>
  <button
    type="button"
    aria-expanded={isOpen}
    aria-controls="accordion-content"
    onClick={() => setIsOpen(!isOpen)}
  >
    {title}
  </button>
  <div id="accordion-content" hidden={!isOpen}>
    {content}
  </div>
</div>
```

### Tabs

```tsx
<div>
  <div role="tablist" aria-label="Product sections">
    <button
      role="tab"
      aria-selected={activeTab === "description"}
      aria-controls="description-panel"
      onClick={() => setActiveTab("description")}
    >
      รายละเอียด
    </button>
  </div>
  <div role="tabpanel" id="description-panel" aria-labelledby="description-tab">
    {content}
  </div>
</div>
```

### Dropdown

```tsx
<button
  type="button"
  aria-expanded={isOpen}
  aria-haspopup="true"
  onClick={() => setIsOpen(!isOpen)}
>
  ตัวเลือก
</button>
```

### Checklist

- [ ] Accordion buttons have `aria-expanded`
- [ ] Tab interface uses proper ARIA roles
- [ ] Dropdowns have `aria-expanded` and `aria-haspopup`
- [ ] All widgets are keyboard accessible

## Dynamic Content

### Loading States

```tsx
// ✅ Good
<div role="status" aria-live="polite">
  {loading ? (
    <>
      <Spinner aria-hidden="true" />
      <span className="sr-only">กำลังโหลด...</span>
    </>
  ) : (
    content
  )}
</div>
```

### Status Messages

```tsx
// ✅ Good
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {isSubmitting && "กำลังส่งข้อมูล กรุณารอสักครู่"}
  {success && "บันทึกสำเร็จ"}
</div>
```

### Checklist

- [ ] Loading spinners have descriptive text (sr-only)
- [ ] Status changes announced via `aria-live="polite"`
- [ ] Error messages use `role="alert"`
- [ ] Success messages announced to screen readers

## Radio Buttons & Checkboxes

### Radio Button Group

```tsx
<fieldset>
  <legend>เลือกวิธีการจัดส่ง</legend>
  <label>
    <input
      type="radio"
      name="shipping"
      value="standard"
      checked={shipping === "standard"}
      onChange={(e) => setShipping(e.target.value)}
    />
    <span>จัดส่งธรรมดา</span>
  </label>
  <label>
    <input
      type="radio"
      name="shipping"
      value="express"
      checked={shipping === "express"}
      onChange={(e) => setShipping(e.target.value)}
    />
    <span>จัดส่งด่วน</span>
  </label>
</fieldset>
```

### Checkbox

```tsx
<label>
  <input
    type="checkbox"
    checked={agree}
    onChange={(e) => setAgree(e.target.checked)}
    aria-describedby="terms-description"
  />
  <span>ยอมรับข้อตกลง</span>
</label>
<p id="terms-description" className="text-sm">
  กรุณาอ่านข้อตกลงการใช้งาน
</p>
```

### Checklist

- [ ] Radio buttons grouped in `<fieldset>`
- [ ] Fieldset has descriptive `<legend>`
- [ ] All options have labels
- [ ] Related info linked via `aria-describedby`

## Tables

### Data Table

```tsx
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

### Checklist

- [ ] Table has descriptive `<caption>`
- [ ] Headers use `<th>` with `scope="col"` or `scope="row"`
- [ ] Complex tables have `aria-describedby` for descriptions

## Common Patterns to Avoid ❌

### Don't Use Divs for Buttons

```tsx
// ❌ Bad
<div onClick={handleClick}>คลิก</div>

// ✅ Good
<button type="button" onClick={handleClick}>คลิก</button>
```

### Don't Use Click-Only Events

```tsx
// ❌ Bad
<img src="..." onClick={handleClick} />

// ✅ Good
<button type="button" onClick={handleClick}>
  <img src="..." alt="..." />
</button>
```

### Don't Use Placeholder as Label

```tsx
// ❌ Bad
<input placeholder="อีเมล" />

// ✅ Good
<label htmlFor="email">อีเมล</label>
<input id="email" placeholder="example@email.com" />
```

### Don't Rely on Color Alone

```tsx
// ❌ Bad
<span className="text-red-500">ข้อผิดพลาด</span>

// ✅ Good
<div className="text-red-500" role="alert">
  <AlertIcon aria-hidden="true" />
  <span>ข้อผิดพลาด: กรุณากรอกอีเมลให้ถูกต้อง</span>
</div>
```

## Keyboard Testing Quick Check

Test these keyboard shortcuts on your component:

- `Tab` - Moves forward through interactive elements
- `Shift+Tab` - Moves backward
- `Enter` - Activates links and buttons
- `Space` - Activates buttons, checks checkboxes
- `Escape` - Closes modals/dropdowns
- `Arrow keys` - Navigate within widgets (tabs, radio groups)

**All functionality must work with keyboard only - no mouse!**

## Screen Reader Classes

### Show Only to Screen Readers

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

### Skip to Main Content

```tsx
<a href="#main-content" className="sr-only sr-only-focusable">
  ข้ามไปยังเนื้อหาหลัก
</a>
<main id="main-content">
  {/* Main content */}
</main>
```

## Testing Tools

### Browser Extensions (Free)

- **axe DevTools** - Chrome/Firefox
- **WAVE** - Chrome/Firefox/Edge
- **Lighthouse** - Built into Chrome DevTools

### Screen Readers (Free)

- **NVDA** - Windows (https://www.nvaccess.org/)
- **VoiceOver** - Mac (built-in, Cmd+F5)
- **TalkBack** - Android (built-in)

### Quick Test

```bash
# 1. Run Lighthouse in Chrome DevTools
#    Aim for Accessibility score > 90

# 2. Install and run axe DevTools
#    Aim for 0 violations

# 3. Test with keyboard only
#    Can you do everything without a mouse?

# 4. Test with screen reader
#    Does everything make sense when read aloud?
```

## Resources

- **Project Guidelines**: [docs/WCAG_GUIDELINES.md](./WCAG_GUIDELINES.md)
- **Audit Report**: [docs/ACCESSIBILITY_AUDIT_REPORT.md](./ACCESSIBILITY_AUDIT_REPORT.md)
- **WCAG Quick Ref**: https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Patterns**: https://www.w3.org/WAI/ARIA/apg/

## Questions?

1. Check [WCAG_GUIDELINES.md](./WCAG_GUIDELINES.md) for detailed patterns
2. Review compliant examples: `LoginForm.tsx`, `OtpVerifyForm.tsx`
3. Consult [Accessibility Audit Report](./ACCESSIBILITY_AUDIT_REPORT.md)

---

**Remember**: Accessibility is not optional - it's a legal requirement and the right thing to do!

Every component you build should be usable by everyone, regardless of ability.
