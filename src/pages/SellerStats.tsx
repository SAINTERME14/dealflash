import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Seo } from "@/components/seo/Seo";
import { Loader2, DollarSign, Eye, Ticket, ShoppingBag, TrendingUp, Star } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { StarRating } from "@/components/reviews/StarRating";
import { useSellerRatingStats } from "@/hooks/useReviews";

type DailyPoint = { date: string; revenue: number; tickets: number };

export default function SellerStats() {
  const { user } = useAuth();
  const { data: rating } = useSellerRatingStats(user?.id);

  const { data, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["seller-stats", user?.id],
    queryFn: async () => {
      const sellerId = user!.id;
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const sinceIso = since.toISOString();

      const [listingsAgg, ticketsAgg, viewsAgg, dailyTickets] = await Promise.all([
        supabase
          .from("listings")
          .select("id, view_count, status", { count: "exact" })
          .eq("seller_id", sellerId),
        supabase
          .from("tickets")
          .select("id, total_paid, platform_fee, status, created_at")
          .eq("seller_id", sellerId)
          .gte("created_at", sinceIso),
        supabase
          .from("listings")
          .select("view_count")
          .eq("seller_id", sellerId),
        supabase
          .from("tickets")
          .select("created_at, total_paid, platform_fee, status")
          .eq("seller_id", sellerId)
          .gte("created_at", sinceIso)
          .order("created_at", { ascending: true }),
      ]);

      const totalListings = listingsAgg.count ?? 0;
      const activeListings = (listingsAgg.data ?? []).filter((l) => l.status === "active").length;
      const totalViews = (viewsAgg.data ?? []).reduce((s, l) => s + (l.view_count ?? 0), 0);

      const tickets = ticketsAgg.data ?? [];
      const paidTickets = tickets.filter((t) => t.status === "paid" || t.status === "validated");
      const grossRevenue = paidTickets.reduce((s, t) => s + Number(t.total_paid ?? 0), 0);
      const fees = paidTickets.reduce((s, t) => s + Number(t.platform_fee ?? 0), 0);
      const netRevenue = grossRevenue - fees;

      // Daily aggregates
      const map: Record<string, DailyPoint> = {};
      for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        const key = d.toISOString().slice(0, 10);
        map[key] = { date: key.slice(5), revenue: 0, tickets: 0 };
      }
      for (const t of dailyTickets.data ?? []) {
        const key = String(t.created_at).slice(0, 10);
        if (map[key] && (t.status === "paid" || t.status === "validated")) {
          map[key].revenue += Number(t.total_paid ?? 0) - Number(t.platform_fee ?? 0);
          map[key].tickets += 1;
        }
      }
      const series = Object.values(map);

      const conversionRate = totalViews > 0 ? (paidTickets.length / totalViews) * 100 : 0;

      return {
        totalListings,
        activeListings,
        totalViews,
        ticketsCount: paidTickets.length,
        grossRevenue,
        netRevenue,
        fees,
        conversionRate,
        series,
      };
    },
  });

  if (isLoading || !data) {
    return (
      <div className="container py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 2 }).format(n);

  const kpis = [
    { label: "Revenu net (30j)", value: fmtMoney(data.netRevenue), icon: DollarSign, hint: `Brut: ${fmtMoney(data.grossRevenue)}` },
    { label: "Tickets vendus (30j)", value: data.ticketsCount, icon: Ticket, hint: `Frais plateforme: ${fmtMoney(data.fees)}` },
    { label: "Vues totales", value: data.totalViews.toLocaleString("fr-CA"), icon: Eye, hint: `${data.activeListings} annonces actives` },
    { label: "Taux de conversion", value: `${data.conversionRate.toFixed(2)}%`, icon: TrendingUp, hint: "Tickets payés / vues" },
  ];

  return (
    <div className="container py-8 max-w-6xl">
      <Seo title="Statistiques vendeur — DealFlash" description="Vos revenus, ventes et performances sur les 30 derniers jours." />

      <header className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Statistiques vendeur</h1>
          <p className="text-muted-foreground mt-1">Performances des 30 derniers jours</p>
        </div>
        {rating && rating.total > 0 && (
          <Card className="px-4 py-3 flex items-center gap-3">
            <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
            <div>
              <div className="flex items-center gap-2">
                <StarRating value={rating.avg} size="sm" />
                <span className="font-bold">{rating.avg.toFixed(1)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{rating.total} avis reçus</p>
            </div>
          </Card>
        )}
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5">
            <k.icon className="h-5 w-5 text-primary mb-2" />
            <p className="text-2xl font-bold">{k.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
            <p className="text-xs text-muted-foreground/80 mt-1">{k.hint}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" /> Revenus net par jour
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.series}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v: number) => fmtMoney(v)}
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }}
                />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-accent" /> Tickets vendus par jour
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.series}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="tickets" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold mb-2">Récapitulatif annonces</h2>
        <p className="text-sm text-muted-foreground">
          {data.totalListings} annonce{data.totalListings > 1 ? "s" : ""} au total — {data.activeListings} active{data.activeListings > 1 ? "s" : ""}.
        </p>
      </Card>
    </div>
  );
}
