export interface CouponData {
  id: string;
  brand: string;
  title: string;
  subtitle: string;
  badge: string;
  code: string;
  validFrom: string;
  validTo: string;
  usageGuide: string;
  linkType: "direct" | "deeplink" | "none";
  linkUrl: string;
  memo: string;
  color: string;
  logoDataUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface QRRecord {
  id: string;
  code: string;
  url: string;
  size: number;
  serial: number;
  dataUrl: string;
  createdAt: string;
}

export interface StorageKeys {
  FORM: "coupon_builder_form_v1";
  LIST: "coupon_builder_saved_list_v1";
  TRASH: "coupon_builder_trash_v1";
  UNDO: "coupon_builder_list_undo_stack_v1";
  QR: "coupon_builder_qr_saved_v1";
}

export const STORAGE_KEYS: StorageKeys = {
  FORM: "coupon_builder_form_v1",
  LIST: "coupon_builder_saved_list_v1",
  TRASH: "coupon_builder_trash_v1",
  UNDO: "coupon_builder_list_undo_stack_v1",
  QR: "coupon_builder_qr_saved_v1",
};
