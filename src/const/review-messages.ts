/**
 * Centralized review submission messages in Thai
 * Single source of truth for all user-facing text
 */
export const REVIEW_MESSAGES = {
  SUCCESS: {
    ALL: (count: number) => `ขอบคุณสำหรับการรีวิว! (${count} รายการ)`,
    PARTIAL: (success: number, failed: number) =>
      `ส่งรีวิวสำเร็จ ${success} รายการ, ล้มเหลว ${failed} รายการ`,
  },
  ERROR: {
    FILE_READ: "ไม่สามารถอ่านไฟล์ภาพ",
    FILE_UPLOAD: "ไม่สามารถอัปโหลดรูปภาพรีวิว",
    SUBMIT_FAILED: "ล้มเหลวในการส่งรีวิว กรุณาลองใหม่",
    UNEXPECTED: (message: string) => `ข้อผิดพลาด: ${message}`,
  },
} as const
