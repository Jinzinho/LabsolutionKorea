import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import CouponCard from "@/components/CouponCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CouponData, STORAGE_KEYS } from "@/types/coupon";
import { StorageManager } from "@/lib/storage";
import { compressImage } from "@/lib/qr-generator";
import { toast } from "sonner";
import { Save, Download, Upload, Plus, FileUp } from "lucide-react";
import Papa from "papaparse";

export default function CouponBuilder() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<CouponData>>({
    brand: "",
    title: "",
    subtitle: "",
    badge: "",
    code: "",
    validFrom: "",
    validTo: "",
    usageGuide: "",
    linkType: "none",
    linkUrl: "",
    memo: "",
    color: "#3b82f6",
    logoDataUrl: "",
  });

  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = StorageManager.getFormData();
    if (saved) {
      setFormData(saved);
    }

    const handleBeforeUnload = () => {
      StorageManager.saveFormData(formData);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
    };
  }, []);

  const autoSave = useCallback(() => {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    const timer = setTimeout(() => {
      StorageManager.saveFormData(formData);
    }, 1000);
    setAutoSaveTimer(timer);
  }, [formData, autoSaveTimer]);

  useEffect(() => {
    autoSave();
  }, [formData]);

  const updateField = (field: keyof CouponData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      const compressed = await compressImage(dataUrl);
      updateField("logoDataUrl", compressed);
    };
    reader.readAsDataURL(file);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const codes: string[] = [];
        
        // 첫 번째 열(시리얼 번호)만 추출
        results.data.forEach((row: any) => {
          if (typeof row === "object") {
            // 첫 번째 열 값 가져오기 (시리얼 번호)
            const firstKey = Object.keys(row)[0];
            if (firstKey && row[firstKey]) {
              const serialNumber = String(row[firstKey]).trim();
              // BOM 제거 및 유효성 검사
              const cleanSerial = serialNumber.replace(/^\uFEFF/, '');
              if (cleanSerial && cleanSerial.length >= 4 && cleanSerial !== '시리얼 번호') {
                codes.push(cleanSerial);
              }
            }
          }
        });

        if (codes.length > 0) {
          const coupons = StorageManager.getCoupons();
          const newCoupons = codes.map((code, idx) => ({
            ...formData,
            id: `${Date.now()}_${idx}`,
            code,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as CouponData));

          StorageManager.saveCoupons([...coupons, ...newCoupons]);
          toast.success(`${codes.length}개의 쿠폰이 리스트에 저장되었습니다`);
          navigate("/admin/coupons");
        } else {
          toast.error("유효한 시리얼 번호를 찾을 수 없습니다");
        }
      },
      error: () => {
        toast.error("CSV 파일을 읽을 수 없습니다");
      },
    });
  };

  const saveToList = () => {
    if (!formData.code?.trim()) {
      toast.error("쿠폰 코드를 입력해주세요");
      return;
    }

    const coupons = StorageManager.getCoupons();
    const newCoupon: CouponData = {
      ...formData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as CouponData;

    StorageManager.saveCoupons([...coupons, newCoupon]);
    toast.success("리스트에 저장되었습니다");
    navigate("/admin/coupons");
  };

  const exportJSON = () => {
    const json = JSON.stringify(formData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `coupon-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        setFormData(data);
        toast.success("JSON을 불러왔습니다");
      } catch {
        toast.error("잘못된 JSON 파일입니다");
      }
    };
    reader.readAsText(file);
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-foreground">쿠폰 제작</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportJSON}>
              <Download className="w-4 h-4 mr-2" />
              JSON 내보내기
            </Button>
            <Button variant="outline" asChild>
              <label>
                <Upload className="w-4 h-4 mr-2" />
                JSON 불러오기
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={importJSON}
                />
              </label>
            </Button>
            <Button variant="outline" asChild>
              <label>
                <FileUp className="w-4 h-4 mr-2" />
                CSV 대량 업로드
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleCSVUpload}
                />
              </label>
            </Button>
            <Button onClick={saveToList}>
              <Plus className="w-4 h-4 mr-2" />
              리스트에 저장
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">쿠폰 정보 입력</h3>
            <div className="space-y-4">
              <div>
                <Label>브랜드</Label>
                <Input
                  value={formData.brand}
                  onChange={(e) => updateField("brand", e.target.value)}
                />
              </div>

              <div>
                <Label>제목</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                />
              </div>

              <div>
                <Label>부제</Label>
                <Input
                  value={formData.subtitle}
                  onChange={(e) => updateField("subtitle", e.target.value)}
                />
              </div>

              <div>
                <Label>혜택 뱃지</Label>
                <Input
                  value={formData.badge}
                  onChange={(e) => updateField("badge", e.target.value)}
                />
              </div>

              <div>
                <Label>쿠폰 코드</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => updateField("code", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>유효기간 시작</Label>
                  <Input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => updateField("validFrom", e.target.value)}
                  />
                </div>
                <div>
                  <Label>유효기간 종료</Label>
                  <Input
                    type="date"
                    value={formData.validTo}
                    onChange={(e) => updateField("validTo", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>이용 안내</Label>
                <Textarea
                  value={formData.usageGuide}
                  onChange={(e) => updateField("usageGuide", e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label>링크 유형</Label>
                <Select
                  value={formData.linkType}
                  onValueChange={(value) => updateField("linkType", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">링크 없음</SelectItem>
                    <SelectItem value="direct">일반 링크</SelectItem>
                    <SelectItem value="deeplink">딥링크</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.linkType !== "none" && (
                <div>
                  <Label>링크 URL</Label>
                  <Input
                    value={formData.linkUrl}
                    onChange={(e) => updateField("linkUrl", e.target.value)}
                  />
                </div>
              )}

              <div>
                <Label>메모</Label>
                <Textarea
                  value={formData.memo}
                  onChange={(e) => updateField("memo", e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <Label>색상</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => updateField("color", e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => updateField("color", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label>로고 이미지</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
                {formData.logoDataUrl && (
                  <img
                    src={formData.logoDataUrl}
                    alt="preview"
                    className="mt-2 w-20 h-20 object-contain border rounded"
                  />
                )}
              </div>
            </div>
          </Card>

          <div>
            <h3 className="text-xl font-semibold mb-4">미리보기</h3>
            <CouponCard coupon={formData} showCopyButton />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
