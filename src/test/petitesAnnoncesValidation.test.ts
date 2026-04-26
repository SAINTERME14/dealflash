import { describe, it, expect } from "vitest";
import { validatePetitesAnnonces } from "@/lib/petitesAnnoncesValidation";

describe("validatePetitesAnnonces — autos-occasion", () => {
  it("accepts a valid car listing", () => {
    const r = validatePetitesAnnonces("autos-occasion", {
      year: "2020",
      mileage_km: "45000",
      transmission: "automatic",
      fuel: "gasoline",
      vin: "1HGBH41JXMN109186",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.year).toBe("2020");
      expect(r.data.vin).toBe("1HGBH41JXMN109186");
    }
  });

  it("rejects an out-of-range year and reports a fieldError", () => {
    const r = validatePetitesAnnonces("autos-occasion", {
      year: "1700",
      mileage_km: "10000",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.fieldErrors.year).toBeDefined();
    }
  });

  it("rejects a malformed VIN", () => {
    const r = validatePetitesAnnonces("autos-occasion", {
      year: "2020",
      mileage_km: "10000",
      vin: "INVALIDVIN0000000",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.fieldErrors.vin).toBeDefined();
    }
  });

  it("rejects negative mileage", () => {
    const r = validatePetitesAnnonces("autos-occasion", {
      year: "2020",
      mileage_km: "-1",
    });
    expect(r.ok).toBe(false);
  });
});

describe("validatePetitesAnnonces — colocation-pa", () => {
  it("accepts a valid colocation listing", () => {
    const r = validatePetitesAnnonces("colocation-pa", {
      budget_max: "800",
      room_type: "private",
      available_from: "2026-05-01",
      furnished: "yes",
    });
    expect(r.ok).toBe(true);
  });

  it("rejects an invalid date", () => {
    const r = validatePetitesAnnonces("colocation-pa", {
      budget_max: "800",
      room_type: "private",
      available_from: "31-12-2026",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.fieldErrors.available_from).toBeDefined();
    }
  });

  it("rejects a budget over the cap", () => {
    const r = validatePetitesAnnonces("colocation-pa", {
      budget_max: "999999",
      room_type: "private",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.fieldErrors.budget_max).toBeDefined();
    }
  });
});

describe("validatePetitesAnnonces — objets-divers", () => {
  it("accepts a valid item listing", () => {
    const r = validatePetitesAnnonces("objets-divers", {
      condition: "good",
      brand: "Ikea",
    });
    expect(r.ok).toBe(true);
  });

  it("requires condition", () => {
    const r = validatePetitesAnnonces("objets-divers", { brand: "Sony" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.fieldErrors.condition).toBeDefined();
    }
  });
});
