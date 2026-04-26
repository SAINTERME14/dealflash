import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Loader2, Package, Truck, ShoppingCart, AlertTriangle, TrendingUp, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Stats {
  productsTotal: number;
  productsListed: number;
  productsLowStock: number;
  suppliersActive: number;
  channelsActive: number;
  ordersPending: number;
  ordersShipped: number;
  totalCostMonth: number;
  totalRevenueMonth: number;
}

export default function AdminDropshipOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Vue d'ensemble dropshipping — Admin DealFlash";
    (async () => {
      try {
        const since = new Date();
        since.setDate(since.getDate() - 30);
        const sinceIso = since.toISOString();

        const [
          { count: productsTotal },
          { count: productsListed },
          { data: lowStock },
          { count: suppliersActive },
          { count: channelsActive },
          { count: ordersPending },
          { count: ordersShipped },
          { data: monthOrders },
        ] = await Promise.all([
          supabase.from("dealflash_products").select("*", { count: "exact", head: true }),
          supabase.from("dealflash_products").select("*", { count: "exact", head: true }).eq("status", "listed"),
          supabase.from("dealflash_products").select("id").not("stock_quantity", "is", null).lte("stock_quantity", 5),
          supabase.from("suppliers").select("*", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("sales_channels").select("*", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("dropship_orders").select("*", { count: "exact", head: true }).in("status", ["pending", "ordered"]),
          supabase.from("dropship_orders").select("*", { count: "exact", head: true }).eq("status", "shipped"),
          supabase.from("dropship_orders").select("cost_amount, dealflash_products(selling_price)").gte("created_at", sinceIso).neq("status", "cancelled"),
        ]);

        const totalCostMonth = (monthOrders ?? []).reduce((s, o: { cost_amount: number }) => s + Number(o.cost_amount || 0), 0);
        const totalRevenueMonth = (monthOrders ?? []).reduce(
          (s, o: { dealflash_products?: { selling_price?: number } | null }) =>
            s + Number(o.dealflash_products?.selling_price || 0),
          0,
        );

        setStats({
          productsTotal: productsTotal ?? 0,
          productsListed: productsListed ?? 0,
          productsLowStock: lowStock?.length ?? 0,
          suppliersActive: suppliersActive ?? 0,
          channelsActive: channelsActive ?? 0,
          ordersPending: ordersPending ?? 0,
          ordersShipped: ordersShipped ?? 0,
          totalCostMonth,
          totalRevenueMonth,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </AdminLayout>
    );
  }

  const margin = stats!.totalRevenueMonth - stats!.totalCostMonth;
  const marginPct = stats!.totalRevenueMonth > 0 ? (margin / stats!.totalRevenueMonth) * 100 : 0;

  const cards = [
    { label: "Produits au catalogue", value: stats!.productsTotal, sub: `${stats!.productsListed} en ligne`, icon: Package, link: "/admin/dropshipping" },
    { label: "Fournisseurs actifs", value: stats!.suppliersActive, sub: "Sources de produits", icon: Truck, link: "/admin/suppliers" },
    { label: "Canaux de vente", value: stats!.channelsActive, sub: "Amazon, Temu, etc.", icon: Globe, link: "/admin/sales-channels" },
    { label: "Commandes à traiter", value: stats!.ordersPending, sub: `${stats!.ordersShipped} expédiées`, icon: ShoppingCart, link: "/admin/dropship-orders" },
    { label: "Stock faible (≤5)", value: stats!.productsLowStock, sub: "Réapprovisionner", icon: AlertTriangle, link: "/admin/dropshipping" },
    { label: "Marge brute (30j)", value: `${margin.toFixed(0)} CAD`, sub: `${marginPct.toFixed(1)}% de marge`, icon: TrendingUp, link: "/admin/dropship-orders" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Vue d'ensemble dropshipping</h1>
          <p className="text-muted-foreground mt-1">Activité retail DealFlash sur les 30 derniers jours.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Link key={c.label} to={c.link}>
                <Card className="p-5 hover:shadow-md transition-shadow h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold">{c.value}</p>
                  <p className="text-sm font-medium mt-1">{c.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
                </Card>
              </Link>
            );
          })}
        </div>

        <Card className="p-6">
          <h2 className="font-semibold mb-3">Actions rapides</h2>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm"><Link to="/admin/dropshipping">Catalogue produits</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to="/admin/suppliers">Fournisseurs</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to="/admin/sales-channels">Canaux de vente</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to="/admin/dropship-orders">Commandes</Link></Button>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
