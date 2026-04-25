import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  listingId: string;
  flashSaleId?: string;
  appointmentId?: string;
  kind: "flash" | "appointment";
  buyer: {
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
  };
  returnUrl: string;
}

export function TicketCheckout(props: Props) {
  const fetchClientSecret = async (): Promise<string> => {
    const { data, error } = await supabase.functions.invoke("create-ticket-checkout", {
      body: {
        listing_id: props.listingId,
        flash_sale_id: props.flashSaleId,
        appointment_id: props.appointmentId,
        kind: props.kind,
        buyer_first_name: props.buyer.first_name,
        buyer_last_name: props.buyer.last_name,
        buyer_phone: props.buyer.phone,
        buyer_email: props.buyer.email,
        return_url: props.returnUrl,
        environment: getStripeEnvironment(),
      },
    });
    if (error || !data?.clientSecret) {
      throw new Error(error?.message || "Échec de la création du checkout");
    }
    return data.clientSecret;
  };

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
