import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { CouponData, QRRecord } from "@/types/coupon";
import { StorageManager } from "@/lib/storage";
import { generateQRCode, generateSerial, getSiteUrl, encodeCouponData } from "@/lib/qr-generator";
import { toast } from "sonner";
import { Search, Trash2, Copy, QrCode, Undo } from "lucide-react";

export default function Coupons() {
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [qrSizes, setQrSizes] = useState<Record<string, number>>({});
  const [globalQrSize, setGlobalQrSize] = useState<number>(512);

  const loadCoupons = () => {
    setCoupons(StorageManager.getCoupons());
  };

  useEffect(() => {
    loadCoupons();

    const channel = StorageManager.getChannel();
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "coupons-updated" || event.data.type === "trash-updated") {
        loadCoupons();
      }
    };

    channel.addEventListener("message", handleMessage);
    window.addEventListener("storage", loadCoupons);

    return () => {
      channel.removeEventListener("message", handleMessage);
      window.removeEventListener("storage", loadCoupons);
    };
  }, []);

  const filtered = coupons.filter(
    (c) =>
      c.brand.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((c) => c.id)));
    }
  };

  const deleteSelected = () => {
    if (selected.size === 0) return;

    const undoStack = StorageManager.getUndoStack();
    undoStack.push([...coupons]);
    if (undoStack.length > 10) undoStack.shift();
    StorageManager.saveUndoStack(undoStack);

    const toDelete = coupons.filter((c) => selected.has(c.id));
    const remaining = coupons.filter((c) => !selected.has(c.id));

    const trash = StorageManager.getTrash();
    StorageManager.saveTrash([...trash, ...toDelete]);
    StorageManager.saveCoupons(remaining);

    setSelected(new Set());
    toast.success(`${toDelete.length}개의 쿠폰을 휴지통으로 이동했습니다`);
  };

  const deleteAll = () => {
    if (coupons.length === 0) return;

    const undoStack = StorageManager.getUndoStack();
    undoStack.push([...coupons]);
    if (undoStack.length > 10) undoStack.shift();
    StorageManager.saveUndoStack(undoStack);

    const trash = StorageManager.getTrash();
    StorageManager.saveTrash([...trash, ...coupons]);
    StorageManager.saveCoupons([]);

    setSelected(new Set());
    toast.success("모든 쿠폰을 휴지통으로 이동했습니다");
  };

  const undo = () => {
    const undoStack = StorageManager.getUndoStack();
    if (undoStack.length === 0) {
      toast.error("되돌릴 작업이 없습니다");
      return;
    }

    const previous = undoStack.pop()!;
    StorageManager.saveUndoStack(undoStack);
    StorageManager.saveCoupons(previous);
    toast.success("작업을 되돌렸습니다");
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("코드가 복사되었습니다");
  };

  const applyGlobalSize = () => {
    if (globalQrSize < 128 || globalQrSize > 2048) {
      toast.error("QR 크기는 128~2048px 사이여야 합니다");
      return;
    }

    const newSizes: Record<string, number> = {};
    filtered.forEach((coupon) => {
      newSizes[coupon.id] = globalQrSize;
    });
    setQrSizes({ ...qrSizes, ...newSizes });
    toast.success(`모든 쿠폰의 QR 크기를 ${globalQrSize}px로 설정했습니다`);
  };

  const generateQR = async (coupon: CouponData) => {
    const size = qrSizes[coupon.id] || 512;
    if (size < 128 || size > 2048) {
      toast.error("QR 크기는 128~2048px 사이여야 합니다");
      return;
    }

    try {
      const serial = generateSerial();
      const encoded = encodeCouponData(coupon);
      const siteUrl = getSiteUrl();
      const url = `${siteUrl}/coupon?d=${encoded}&s=${serial}`;
      const dataUrl = await generateQRCode(coupon, size);

      const qrs = StorageManager.getQRs();
      const newQR: QRRecord = {
        id: `${Date.now()}_${Math.random()}`,
        code: coupon.code,
        url,
        size,
        serial,
        dataUrl,
        createdAt: new Date().toISOString(),
      };

      StorageManager.saveQRs([...qrs, newQR]);
      toast.success("QR 코드가 생성되어 보관함에 저장되었습니다");
    } catch (error) {
      toast.error("QR 코드 생성 실패");
    }
  };

  const generateSelectedQRs = async () => {
    if (selected.size === 0) {
      toast.error("쿠폰을 선택해주세요");
      return;
    }

    const selectedCoupons = filtered.filter((c) => selected.has(c.id));
    let successCount = 0;
    let failCount = 0;

    for (const coupon of selectedCoupons) {
      try {
        await generateQR(coupon);
        successCount++;
      } catch {
        failCount++;
      }
    }

    if (failCount === 0) {
      toast.success(`${successCount}개의 QR 코드가 생성되었습니다`);
    } else {
      toast.warning(`${successCount}개 성공, ${failCount}개 실패`);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-foreground">쿠폰 리스트</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={undo} disabled={StorageManager.getUndoStack().length === 0}>
              <Undo className="w-4 h-4 mr-2" />
              되돌리기
            </Button>
            <Button variant="outline" onClick={deleteSelected} disabled={selected.size === 0}>
              <Trash2 className="w-4 h-4 mr-2" />
              선택 삭제
            </Button>
            <Button variant="destructive" onClick={deleteAll} disabled={coupons.length === 0}>
              <Trash2 className="w-4 h-4 mr-2" />
              전체 삭제
            </Button>
          </div>
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="브랜드, 제목, 코드로 검색..."
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={selectAll}>
              {selected.size === filtered.length && filtered.length > 0 ? "전체 해제" : "전체 선택"}
            </Button>
          </div>

          <Card className="p-4">
            <div className="flex gap-4 items-center">
              <span className="text-sm font-medium whitespace-nowrap">일괄 QR 크기 설정:</span>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  value={globalQrSize}
                  onChange={(e) => setGlobalQrSize(parseInt(e.target.value) || 512)}
                  className="w-24"
                  min={128}
                  max={2048}
                />
                <span className="text-xs text-muted-foreground">px</span>
                <Button variant="outline" size="sm" onClick={applyGlobalSize}>
                  전체 적용
                </Button>
              </div>
              <div className="flex-1" />
              <Button 
                onClick={generateSelectedQRs} 
                disabled={selected.size === 0}
                className="whitespace-nowrap"
              >
                <QrCode className="w-4 h-4 mr-2" />
                선택한 쿠폰 QR 생성 ({selected.size})
              </Button>
            </div>
          </Card>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-3 text-left">
                    <Checkbox
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onCheckedChange={selectAll}
                    />
                  </th>
                  <th className="p-3 text-left">브랜드</th>
                  <th className="p-3 text-left">제목</th>
                  <th className="p-3 text-left">코드</th>
                  <th className="p-3 text-left">유효기간</th>
                  <th className="p-3 text-left">QR 생성</th>
                  <th className="p-3 text-left">작업</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((coupon) => (
                  <tr key={coupon.id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <Checkbox
                        checked={selected.has(coupon.id)}
                        onCheckedChange={() => toggleSelect(coupon.id)}
                      />
                    </td>
                    <td className="p-3 font-medium">{coupon.brand}</td>
                    <td className="p-3">{coupon.title}</td>
                    <td className="p-3">
                      <code className="bg-muted px-2 py-1 rounded text-sm">{coupon.code}</code>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {coupon.validFrom} ~ {coupon.validTo}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 items-center">
                        <Input
                          type="number"
                          value={qrSizes[coupon.id] || 512}
                          onChange={(e) =>
                            setQrSizes({ ...qrSizes, [coupon.id]: parseInt(e.target.value) || 512 })
                          }
                          className="w-20"
                          min={128}
                          max={2048}
                        />
                        <span className="text-xs text-muted-foreground">px</span>
                        <Button size="sm" onClick={() => generateQR(coupon)}>
                          <QrCode className="w-4 h-4 mr-1" />
                          생성
                        </Button>
                      </div>
                    </td>
                    <td className="p-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyCode(coupon.code)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {search ? "검색 결과가 없습니다" : "저장된 쿠폰이 없습니다"}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
