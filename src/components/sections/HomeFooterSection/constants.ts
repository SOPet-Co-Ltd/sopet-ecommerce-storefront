import {
  FooterFacebookIcon,
  FooterInstagramIcon,
  FooterYouTubeIcon,
  FooterLineIcon,
  FooterLemon8Icon,
  FooterTikTokIcon,
} from "@/icons"

export const SOCIAL_LINKS = [
  {
    name: "Facebook",
    href: "https://facebook.com/sopet",
    Icon: FooterFacebookIcon,
  },
  {
    name: "Instagram",
    href: "https://instagram.com/sopet",
    Icon: FooterInstagramIcon,
  },
  {
    name: "YouTube",
    href: "https://youtube.com/sopet",
    Icon: FooterYouTubeIcon,
  },
  { name: "Line", href: "https://line.me/R/sopet", Icon: FooterLineIcon },
  {
    name: "Lemon8",
    href: "https://lemon8.com/sopet",
    Icon: FooterLemon8Icon,
  },
  {
    name: "TikTok",
    href: "https://tiktok.com/sopet",
    Icon: FooterTikTokIcon,
  },
]

export const COMPANY_INFO = {
  name: "บริษัท เอสโอเพ็ท จำกัด",
  address: "เลขที่ 17 ซอยสุขุมวิท 35 แขวงคลองตันเหนือ",
  district: "เขตวัฒนา กรุงเทพมหานคร 10110",
  email: "sopet@gmail.com",
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
  download: {
    title: "ดาวน์โหลดแอป",
  },
}

export const FOOTER_LINKS = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Cookie Policy", href: "/cookie-policy" },
]
