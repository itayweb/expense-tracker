import { Suspense } from "react";
import WizardContent from "./WizardContent";

export default function WizardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <WizardContent />
    </Suspense>
  );
}
