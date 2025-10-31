import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { CouponData } from "@/types/coupon";
import { StorageManager } from "@/lib/storage";
import { toast } from "sonner";
import { RotateCcw, Trash2 } from "lucide-react";

export default function Trash() {
  const navigate = useNavigate();
  const [trash, setTrash] = useState<CouponData[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const loadTrash = () => {
    setTrash(StorageManager.getTrash());
  };

  useEffect(() => {
    loadTrash();

    const channel = StorageManager.getChannel();
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "trash-updated") {
        loadTrash();
      }
    };

    channel.addEventListener("message", handleMessage);
    window.addEventListener("storage", loadTrash);

    return () => {
      channel.removeEventListener("message", handleMessage);
      window.removeEventListener("storage", loadTrash);
    };
  }, []);

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
    if (selected.size === trash.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(trash.map((c) => c.id)));
    }
  };

  const restoreSelected = () => {
    if (selected.size === 0) return;

    const toRestore = trash.filter((c) => selected.has(c.id));
    const remaining = trash.filter((c) => !selected.has(c.id));

    const coupons = StorageManager.getCoupons();
    StorageManager.saveCoupons([...coupons, ...toRestore]);
    StorageManager.saveTrash(remaining);

    setSelected(new Set());
    toast.success(`${toRestore.length}개의 쿠폰을 복원했습니다`);
    navigate("/admin/coupons");
  };

  const deleteSelected = () => {
    if (selected.size === 0) return;

    const remaining = trash.filter((c) => !selected.has(c.id));
    StorageManager.saveTrash(remaining);

    setSelected(new Set());
    toast.success("선택한 쿠폰을 영구 삭제했습니다");
  };

  const emptyTrash = () => {
    StorageManager.saveTrash([]);
    setSelected(new Set());
    toast.success("휴지통을 비웠습니다");
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-foreground">휴지통</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={restoreSelected} disabled={selected.size === 0}>
              <RotateCcw className="w-4 h-4 mr-2" />
              선택 복원
            </Button>
            <Button variant="outline" onClick={deleteSelected} disabled={selected.size === 0}>
              <Trash2 className="w-4 h-4 mr-2" />
              선택 영구삭제
            </Button>
            <Button variant="destructive" onClick={emptyTrash} disabled={trash.length === 0}>
              <Trash2 className="w-4 h-4 mr-2" />
              전체 비우기
            </Button>
          </div>
        </div>

        <div className="mb-4">
          <Button variant="outline" onClick={selectAll}>
            {selected.size === trash.length && trash.length > 0 ? "전체 해제" : "전체 선택"}
          </Button>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-3 text-left">
                    <Checkbox
                      checked={selected.size === trash.length && trash.length > 0}
                      onCheckedChange={selectAll}
                    />
                  </th>
                  <th className="p-3 text-left">브랜드</th>
                  <th className="p-3 text-left">제목</th>
                  <th className="p-3 text-left">코드</th>
                  <th className="p-3 text-left">유효기간</th>
                </tr>
              </thead>
              <tbody>
                {trash.map((coupon) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {trash.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            휴지통이 비어있습니다
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
