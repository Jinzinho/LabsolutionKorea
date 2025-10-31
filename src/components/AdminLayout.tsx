import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileEdit, List, Trash2, QrCode } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  
  const navItems = [
    { path: "/admin/coupon-builder", icon: FileEdit, label: "쿠폰 제작" },
    { path: "/admin/coupons", icon: List, label: "쿠폰 리스트" },
    { path: "/admin/trash", icon: Trash2, label: "휴지통" },
    { path: "/admin/qrs", icon: QrCode, label: "QR 보관함" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/admin/coupon-builder" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-foreground">쿠폰 관리 시스템</h1>
            </Link>
            
            <nav className="flex gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.path}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    asChild
                  >
                    <Link to={item.path}>
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Link>
                  </Button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
