import { Wrench } from "lucide-react";

// Jól látható, elvethetetlen állapotsáv: a Jurai átmeneti fejlesztési időszakát jelzi.
// A root layoutban, a tartalom fölött jelenik meg minden oldalon.
export function MaintenanceBanner() {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="sticky top-0 z-[200] w-full border-y border-amber-600 bg-amber-500 text-amber-950 shadow-md"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-1.5 px-4 py-3 text-center sm:flex-row sm:justify-center sm:gap-4">
        <span className="flex items-center gap-2 text-base font-semibold sm:text-lg">
          <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-700 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-800" />
          </span>
          <Wrench className="h-5 w-5 shrink-0" aria-hidden="true" />
          A Jurai átmenetileg technológiai fejlesztés alatt áll
        </span>
        <span className="text-sm font-medium text-amber-900">
          Hamarosan pontosabb és megbízhatóbb jogi válaszokkal térünk vissza.
          Várható elérhetőség:{" "}
          <span className="font-semibold underline decoration-amber-700 underline-offset-2">
            2026. június 18.
          </span>
        </span>
      </div>
    </div>
  );
}
