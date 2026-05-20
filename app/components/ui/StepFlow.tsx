"use client";

type Step = 1 | 2 | 3 | 4;

type StepFlowProps = {
  step: Step;
};

export function StepFlow({ step }: StepFlowProps) {
  const steps = ["Dados", "Pagamento", "Processando", "Video"];

  return (
    <div className="flex justify-between mb-6 gap-2">
      {steps.map((label, index) => {
        const currentStep = (index + 1) as Step;
        const active = step === currentStep;

        return (
          <div key={label} className="flex-1 text-center">
            <div
              className={`mx-auto w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
                active ? "bg-orange-500 text-black" : "bg-[#333333] text-gray-400"
              }`}
            >
              {index + 1}
            </div>
            <p className="text-xs mt-1 text-gray-400">{label}</p>
          </div>
        );
      })}
    </div>
  );
}
