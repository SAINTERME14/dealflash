import { useEffect, useState } from "react";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { sb } from "@/integrations/supabase/untyped";
import { useAuth } from "@/hooks/useAuth";
import { useAdminUser } from "@/hooks/useAdminUser";
import { logAdminAction } from "@/lib/adminAudit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, KeyRound } from "lucide-react";
import { toast } from "sonner";

async function sha256Hex(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function genCode(): string {
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(36).padStart(2, "0")).join("").slice(0, 12).toUpperCase();
}

export default function AdminV2TwoFASetup() {
  const { user } = useAuth();
  const { admin, loading } = useAdminUser();
  const [secret, setSecret] = useState<string>("");
  const [qr, setQr] = useState<string>("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  useEffect(() => { document.title = "Activer 2FA · Admin"; }, []);

  useEffect(() => {
    if (!user || !admin || admin.two_fa_enabled) return;
    const s = new OTPAuth.Secret({ size: 20 });
    setSecret(s.base32);
    const totp = new OTPAuth.TOTP({
      issuer: "DealFlash Admin", label: user.email ?? "admin",
      algorithm: "SHA1", digits: 6, period: 30, secret: s,
    });
    QRCode.toDataURL(totp.toString()).then(setQr);
  }, [user, admin]);

  async function activate() {
    if (!admin || !secret) return;
    setBusy(true);
    const totp = new OTPAuth.TOTP({
      issuer: "DealFlash Admin", label: user?.email ?? "admin",
      algorithm: "SHA1", digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(secret),
    });
    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) {
      toast.error("Code invalide");
      setBusy(false);
      return;
    }

    // Save secret
    const { error } = await sb.from("admin_users")
      .update({ two_fa_enabled: true, two_fa_secret: secret })
      .eq("id", admin.id);
    if (error) {
      toast.error(error.message);
      setBusy(false);
      return;
    }

    // Generate recovery codes
    const codes: string[] = Array.from({ length: 8 }, () => genCode());
    const hashes = await Promise.all(codes.map((c) => sha256Hex(c)));
    await sb.from("admin_recovery_codes").insert(
      hashes.map((h) => ({ admin_id: admin.id, code_hash: h }))
    );
    setRecoveryCodes(codes);

    await logAdminAction({ actionType: "admin.2fa_enabled", targetType: "admin_users", targetId: admin.user_id });
    toast.success("2FA activé");
    setBusy(false);
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  if (admin?.two_fa_enabled && recoveryCodes.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-600" /> 2FA activé</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Le 2FA est déjà activé sur votre compte.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (recoveryCodes.length > 0) {
    return (
      <div className="max-w-xl mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Codes de récupération</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-destructive font-semibold">
              ⚠ Sauvegardez ces codes maintenant. Ils ne seront plus affichés.
            </p>
            <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-muted p-4 rounded">
              {recoveryCodes.map((c) => <div key={c}>{c}</div>)}
            </div>
            <Button onClick={() => window.location.replace("/admin/v2")} className="w-full">
              J'ai sauvegardé mes codes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Activer l'authentification à deux facteurs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Scannez ce QR code avec Google Authenticator, Authy ou 1Password.
          </p>
          {qr && <img src={qr} alt="QR code 2FA" className="mx-auto border rounded" />}
          <div className="text-center text-xs">
            Ou entrez ce secret manuellement :<br />
            <code className="font-mono bg-muted px-2 py-1 rounded">{secret}</code>
          </div>
          <div className="space-y-1">
            <Label>Code à 6 chiffres</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456" inputMode="numeric" />
          </div>
          <Button onClick={activate} disabled={busy || code.length !== 6} className="w-full">
            {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Activer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
