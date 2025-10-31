import QRCode from "qrcode";
import JSZip from "jszip";
import { CouponData } from "@/types/coupon";

export function getSiteUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL || "https://localhost:8080";
}

export function encodeCouponData(coupon: CouponData): string {
  // Exclude logo to reduce QR code data size
  const payload = {
    b: coupon.brand,
    t: coupon.title,
    st: coupon.subtitle,
    bd: coupon.badge,
    c: coupon.code,
    vf: coupon.validFrom,
    vt: coupon.validTo,
    ug: coupon.usageGuide,
    lt: coupon.linkType,
    lu: coupon.linkUrl,
    co: coupon.color,
  };
  
  const jsonStr = JSON.stringify(payload);
  const base64 = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) => {
    return String.fromCharCode(parseInt(p1, 16));
  }));
  
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function decodeCouponData(encoded: string): Partial<CouponData> | null {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padding = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
    const jsonStr = decodeURIComponent(
      atob(base64 + padding)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    
    const payload = JSON.parse(jsonStr);
    return {
      brand: payload.b,
      title: payload.t,
      subtitle: payload.st,
      badge: payload.bd,
      code: payload.c,
      validFrom: payload.vf,
      validTo: payload.vt,
      usageGuide: payload.ug,
      linkType: payload.lt,
      linkUrl: payload.lu,
      color: payload.co,
      logoDataUrl: "", // Logo not included in QR
    };
  } catch (error) {
    console.error("Failed to decode coupon data:", error);
    return null;
  }
}

export function generateSerial(): number {
  return Math.floor(Math.random() * 9000) + 1000;
}

export async function generateQRCode(coupon: CouponData, size: number): Promise<string> {
  const serial = generateSerial();
  const encoded = encodeCouponData(coupon);
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/coupon?d=${encoded}&s=${serial}`;
  
  try {
    const dataUrl = await QRCode.toDataURL(url, {
      width: size,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    return dataUrl;
  } catch (error) {
    console.error("Failed to generate QR code:", error);
    throw error;
  }
}

export function downloadQRCode(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export async function downloadQRCodesAsZip(
  qrFiles: { dataUrl: string; filename: string }[],
  zipFilename: string
) {
  const zip = new JSZip();

  // 각 QR 코드를 ZIP에 추가
  for (const qrFile of qrFiles) {
    // data URL에서 base64 데이터 추출
    const base64Data = qrFile.dataUrl.split(",")[1];
    zip.file(qrFile.filename, base64Data, { base64: true });
  }

  // ZIP 파일 생성 및 다운로드
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = zipFilename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function compressImage(dataUrl: string, maxWidth: number = 200, maxHeight: number = 200): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      
      resolve(canvas.toDataURL("image/png", 0.8));
    };
    img.src = dataUrl;
  });
}
