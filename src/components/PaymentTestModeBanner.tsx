const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN;

export function PaymentTestModeBanner() {
  if (!clientToken?.startsWith("pk_test_")) return null;
  return (
    <div className="w-full bg-warning/15 border-b border-warning/40 px-4 py-2 text-center text-sm text-warning-foreground">
      Tous les paiements en preview sont en mode test.{" "}
      <a
        href="https://docs.lovable.dev/features/payments#test-and-live-environments"
        target="_blank"
        rel="noopener noreferrer"
        className="underline font-medium"
      >
        En savoir plus
      </a>
    </div>
  );
}
