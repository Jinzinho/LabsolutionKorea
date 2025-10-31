import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CouponCard from "@/components/CouponCard";
import { decodeCouponData } from "@/lib/qr-generator";
import { StorageManager } from "@/lib/storage";
import { CouponData } from "@/types/coupon";

export default function CouponPopup() {
  const [searchParams] = useSearchParams();
  const [coupon, setCoupon] = useState<Partial<CouponData> | null>(null);
  const [serial, setSerial] = useState<number | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const encoded = searchParams.get("d");
    const serialParam = searchParams.get("s");

    if (encoded) {
      const decoded = decodeCouponData(encoded);
      if (decoded && decoded.code) {
        // Try to find full coupon data with logo from localStorage
        const savedCoupons = StorageManager.getCoupons();
        const fullCoupon = savedCoupons.find(c => c.code === decoded.code);
        
        // Use full coupon if found (includes logo), otherwise use decoded data
        setCoupon(fullCoupon || decoded);
        
        if (serialParam) {
          setSerial(parseInt(serialParam));
        }
      } else {
        setError(true);
      }
    } else {
      setError(true);
    }
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">잘못된 쿠폰 링크</h1>
          <p className="text-muted-foreground">유효하지 않은 쿠폰 정보입니다.</p>
        </div>
      </div>
    );
  }

  if (!coupon) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <CouponCard coupon={coupon} showCopyButton serial={serial || undefined} />
      </div>
    </div>
  );
}
