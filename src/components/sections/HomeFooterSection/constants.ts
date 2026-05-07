import { FacebookCustomIcon, LineCustomIcon } from "@/icons"

export const SOCIAL_LINKS = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/sopetofficial",
    Icon: FacebookCustomIcon,
  },
  // {
  //   name: "Instagram",
  //   href: "https://instagram.com/sopet",
  //   Icon: FooterInstagramIcon,
  // },
  // {
  //   name: "YouTube",
  //   href: "https://youtube.com/sopet",
  //   Icon: FooterYouTubeIcon,
  // },
  {
    name: "Line",
    href: "https://line.me/R/ti/p/@131skdjz",
    Icon: LineCustomIcon,
  },
  // {
  //   name: "Lemon8",
  //   href: "https://lemon8.com/sopet",
  //   Icon: FooterLemon8Icon,
  // },
  // {
  //   name: "TikTok",
  //   href: "https://tiktok.com/sopet",
  //   Icon: FooterTikTokIcon,
  // },
]

export const COMPANY_INFO = {
  name: "บริษัท เอสโอเพ็ท จำกัด",
  address: "เลขที่ 17 ซอยสุขุมวิท 35 แขวงคลองตันเหนือ",
  district: "เขตวัฒนา กรุงเทพมหานคร 10110",
  email: "sopetofficial@gmail.com",
  phone: "096-876-5031",
  copyright: "Copyright © 2025 SOpet All right reserved",
}

export const FOOTER_MENUS = {
  products: [
    { label: "สินค้าทั้งหมด", href: "/products" },
    { label: "วิธีสั่งซื้อสินค้า", href: "/products" },
    { label: "สาระน่ารู้", href: "#" },
  ],
  services: {
    title: "บริการ",
    links: [
      { label: "SOPet Application", href: "/app" },
      { label: "ช่องทางชำระเงิน", href: "/payment" },
      { label: "คำถามที่พบบ่อย", href: "/faq" },
    ],
  },
  about: {
    title: "รู้จัก SOPet",
    links: [
      { label: "เกี่ยวกับเรา", href: "/about" },
      { label: "ร่วมงานกับเรา", href: "/careers" },
    ],
  },
  line_oa: {
    title: ["ปรึกษาสัตว​์แพทย์ฟรี !", "ผ่าน LINE OPENCHAT"],
  },
}

export const FOOTER_LINKS = [
  { label: "นโยบายการใช้งาน", href: "/policy/terms-of-service" },
  { label: "นโยบายการคืนเงิน", href: "/policy/refund-policy" },
  { label: "นโยบายความเป็นส่วนตัว", href: "/policy/privacy-policy" },
]
