import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { QRRecord } from "@/types/coupon";
import { StorageManager } from "@/lib/storage";
import { downloadQRCode, downloadQRCodesAsZip } from "@/lib/qr-generator";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function QRStorage() {
  const [qrs, setQrs] = useState<QRRecord[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const loadQRs = () => {
    setQrs(StorageManager.getQRs());
  };

  useEffect(() => {
    loadQRs();

    const channel = StorageManager.getChannel();
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "qrs-updated") {
        loadQRs();
      }
    };

    channel.addEventListener("message", handleMessage);
    window.addEventListener("storage", loadQRs);

    return () => {
      channel.removeEventListener("message", handleMessage);
      window.removeEventListener("storage", loadQRs);
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
    if (selected.size === qrs.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(qrs.map((q) => q.id)));
    }
  };

  const downloadSelected = () => {
    if (selected.size === 0) return;

    qrs.forEach((qr) => {
      if (selected.has(qr.id)) {
        downloadQRCode(qr.dataUrl, `qr-${qr.code}-${qr.size}px-${qr.serial}.png`);
      }
    });

    toast.success(`${selected.size}개의 QR 코드를 다운로드했습니다`);
  };

  const downloadAll = async () => {
    if (qrs.length === 0) return;

    try {
      const qrFiles = qrs.map((qr) => ({
        dataUrl: qr.dataUrl,
        filename: `qr-${qr.code}-${qr.size}px-${qr.serial}.png`,
      }));

      await downloadQRCodesAsZip(qrFiles, `qr-codes-${Date.now()}.zip`);
      toast.success(`모든 QR 코드를 ZIP 파일로 다운로드했습니다`);
    } catch (error) {
      toast.error("ZIP 파일 생성 중 오류가 발생했습니다");
    }
  };

  const deleteSelected = () => {
    if (selected.size === 0) return;

    const remaining = qrs.filter((q) => !selected.has(q.id));
    StorageManager.saveQRs(remaining);

    setSelected(new Set());
    toast.success("선택한 QR 코드를 삭제했습니다");
  };

  const deleteAll = () => {
    if (qrs.length === 0) return;

    StorageManager.saveQRs([]);
    setSelected(new Set());
    toast.success("모든 QR 코드를 삭제했습니다");
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-foreground">QR 보관함</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadSelected} disabled={selected.size === 0}>
              <Download className="w-4 h-4 mr-2" />
              선택 다운로드
            </Button>
            <Button variant="outline" onClick={downloadAll} disabled={qrs.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              전체 다운로드
            </Button>
            <Button variant="outline" onClick={deleteSelected} disabled={selected.size === 0}>
              <Trash2 className="w-4 h-4 mr-2" />
              선택 삭제
            </Button>
            <Button variant="destructive" onClick={deleteAll} disabled={qrs.length === 0}>
              <Trash2 className="w-4 h-4 mr-2" />
              전체 삭제
            </Button>
          </div>
        </div>

        {qrs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            저장된 QR 코드가 없습니다
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selected.size === qrs.length && qrs.length > 0}
                      onCheckedChange={selectAll}
                    />
                  </TableHead>
                  <TableHead className="w-24">QR 미리보기</TableHead>
                  <TableHead>쿠폰 코드</TableHead>
                  <TableHead className="w-24">사이즈</TableHead>
                  <TableHead className="w-20">Serial</TableHead>
                  <TableHead className="max-w-xs">URL</TableHead>
                  <TableHead className="w-32">생성일시</TableHead>
                  <TableHead className="w-32 text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qrs.map((qr) => (
                  <TableRow
                    key={qr.id}
                    className={`cursor-pointer ${
                      selected.has(qr.id) ? "bg-accent" : ""
                    }`}
                    onClick={() => toggleSelect(qr.id)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selected.has(qr.id)}
                        onCheckedChange={() => toggleSelect(qr.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <img
                        src={qr.dataUrl}
                        alt={`QR-${qr.code}`}
                        className="w-16 h-16 object-contain bg-white rounded border"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{qr.code}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {qr.size}px
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {qr.serial}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-muted-foreground" title={qr.url}>
                      {qr.url}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(qr.createdAt).toLocaleString('ko-KR', {
                        year: '2-digit',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          downloadQRCode(qr.dataUrl, `qr-${qr.code}-${qr.size}px-${qr.serial}.png`);
                          toast.success("QR 코드를 다운로드했습니다");
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
