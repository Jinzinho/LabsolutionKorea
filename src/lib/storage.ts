import { CouponData, QRRecord, STORAGE_KEYS } from "@/types/coupon";

const BROADCAST_CHANNEL_NAME = "coupon-admin";

export class StorageManager {
  private static channel: BroadcastChannel | null = null;

  static getChannel(): BroadcastChannel {
    if (!this.channel && typeof window !== "undefined") {
      this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    }
    return this.channel!;
  }

  static broadcast(type: string, data?: any) {
    try {
      this.getChannel().postMessage({ type, data, timestamp: Date.now() });
    } catch (error) {
      console.error("Broadcast failed:", error);
    }
  }

  static getCoupons(): CouponData[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LIST);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveCoupons(coupons: CouponData[]) {
    localStorage.setItem(STORAGE_KEYS.LIST, JSON.stringify(coupons));
    this.broadcast("coupons-updated");
  }

  static getTrash(): CouponData[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRASH);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveTrash(trash: CouponData[]) {
    localStorage.setItem(STORAGE_KEYS.TRASH, JSON.stringify(trash));
    this.broadcast("trash-updated");
  }

  static getQRs(): QRRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QR);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveQRs(qrs: QRRecord[]) {
    localStorage.setItem(STORAGE_KEYS.QR, JSON.stringify(qrs));
    this.broadcast("qrs-updated");
  }

  static getUndoStack(): CouponData[][] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.UNDO);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveUndoStack(stack: CouponData[][]) {
    localStorage.setItem(STORAGE_KEYS.UNDO, JSON.stringify(stack));
  }

  static getFormData(): Partial<CouponData> | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FORM);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  static saveFormData(formData: Partial<CouponData>) {
    localStorage.setItem(STORAGE_KEYS.FORM, JSON.stringify(formData));
  }

  static clearFormData() {
    localStorage.removeItem(STORAGE_KEYS.FORM);
  }
}
