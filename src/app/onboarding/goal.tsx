// src/app/onboarding/goal.tsx

import { useRouter } from "expo-router";
import { useState } from "react";
import OnboardingScreen from "../../components/OnboardingScreen";
import SelectableRow from "../../components/SelectableRow";
import { useOnboarding } from "../../onboarding/OnboardingContext";

const OPTIONS = [
  "Pasar menos tiempo en redes",
  "Dejar de abrirlas automáticamente",
  "Ser más productivo",
  "Dormir mejor",
  "Estudiar más",
  "Recuperar tiempo libre",
];

export default function GoalScreen() {
  const router = useRouter();
  const { setMainGoal } = useOnboarding();
  const [selected, setSelected] = useState<string | null>(null);

  function handleNext() {
    if (!selected) return;
    setMainGoal(selected);
    router.push("/onboarding/limits");
  }

  return (
    <OnboardingScreen
      step={3}
      totalSteps={5}
      title="¿Cuál es tu objetivo?"
      onNext={handleNext}
      nextDisabled={!selected}
    >
      {OPTIONS.map((option) => (
        <SelectableRow
          key={option}
          label={option}
          selected={selected === option}
          onPress={() => setSelected(option)}
        />
      ))}
    </OnboardingScreen>
  );
}
