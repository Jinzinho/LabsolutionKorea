import { CouponData } from "@/types/coupon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface CouponCardProps {
  coupon: Partial<CouponData>;
  showCopyButton?: boolean;
  serial?: number;
}

export default function CouponCard({ coupon, showCopyButton = false, serial }: CouponCardProps) {
  const copyCode = () => {
    if (coupon.code) {
      navigator.clipboard.writeText(coupon.code);
      toast.success("쿠폰 코드가 복사되었습니다");
    }
  };

  const openLink = () => {
    if (coupon.linkUrl) {
      window.open(coupon.linkUrl, "_blank");
    }
  };

  const bgColor = coupon.color || "#3b82f6";

  return (
    <Card 
      className="overflow-hidden shadow-medium hover:shadow-elevated transition-all duration-300"
      style={{ 
        background: `linear-gradient(135deg, ${bgColor}15, ${bgColor}05)`,
        borderColor: `${bgColor}30`
      }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {coupon.brand && (
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {coupon.brand}
              </p>
            )}
            {coupon.title && (
              <h3 className="text-xl font-bold text-foreground mb-1">
                {coupon.title}
              </h3>
            )}
            {coupon.subtitle && (
              <p className="text-sm text-muted-foreground">
                {coupon.subtitle}
              </p>
            )}
          </div>
          
          {coupon.logoDataUrl && (
            <img 
              src={coupon.logoDataUrl} 
              alt="logo" 
              className="w-12 h-12 object-contain rounded-lg ml-4"
            />
          )}
        </div>

        {coupon.badge && (
          <div 
            className="inline-block px-3 py-1 rounded-full text-sm font-semibold text-white mb-4"
            style={{ backgroundColor: bgColor }}
          >
            {coupon.badge}
          </div>
        )}

        {coupon.code && (
          <div className="bg-card rounded-lg p-4 mb-4 border-2 border-dashed" style={{ borderColor: bgColor }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">쿠폰 코드</p>
                <p className="text-lg font-mono font-bold text-foreground tracking-wider">
                  {coupon.code}
                </p>
              </div>
              {showCopyButton && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyCode}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  복사
                </Button>
              )}
            </div>
          </div>
        )}

        {(coupon.validFrom || coupon.validTo) && (
          <div className="text-sm text-muted-foreground mb-3">
            <span className="font-medium">유효기간:</span>{" "}
            {coupon.validFrom} ~ {coupon.validTo}
          </div>
        )}

        {coupon.usageGuide && (
          <div className="text-sm text-muted-foreground mb-4 p-3 bg-muted/50 rounded-lg">
            {coupon.usageGuide}
          </div>
        )}

        {coupon.linkType !== "none" && coupon.linkUrl && (
          <Button
            onClick={openLink}
            className="w-full"
            style={{ backgroundColor: bgColor }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            {coupon.linkType === "deeplink" ? "앱에서 열기" : "바로가기"}
          </Button>
        )}

        {serial && (
          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground text-center">
            Serial: {serial}
          </div>
        )}
      </div>
    </Card>
  );
}
