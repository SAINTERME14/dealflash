import { Button } from "@/components/ui/button";
import { DEAL_TYPE_LABELS, DealType } from "@/hooks/useRankedListings";

interface Props {
  value: DealType | null;
  onChange: (v: DealType | null) => void;
}

const ORDER: DealType[] = [
  "trending",
  "promo_40plus",
  "clearance",
  "overstock",
  "end_of_season",
  "damaged_packaging",
];

export function DealTypeFilter({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant={value === null ? "default" : "outline"}
        size="sm"
        onClick={() => onChange(null)}
      >
        Tous
      </Button>
      {ORDER.map((dt) => (
        <Button
          key={dt}
          type="button"
          variant={value === dt ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(value === dt ? null : dt)}
        >
          {DEAL_TYPE_LABELS[dt]}
        </Button>
      ))}
    </div>
  );
}
