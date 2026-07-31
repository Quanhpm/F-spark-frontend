"use client";

import { useCallback, useEffect, useState } from "react";

type CarouselSource = "projects" | "recruitments";

type UseSynchronizedCarouselsOptions = {
  dialogOpen: boolean;
  hasNextProjectsPage: boolean;
  hasNextRecruitmentsPage: boolean;
  projectCount: number;
  recruitmentCount: number;
};

const AUTO_ADVANCE_MS = 2_000;

export function useSynchronizedCarousels({
  dialogOpen,
  hasNextProjectsPage,
  hasNextRecruitmentsPage,
  projectCount,
  recruitmentCount,
}: UseSynchronizedCarouselsOptions) {
  const [advanceSignal, setAdvanceSignal] = useState(0);
  const [cancelAnimationSignal, setCancelAnimationSignal] = useState(0);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [manualSource, setManualSource] =
    useState<CarouselSource | null>(null);
  const [projectActiveIndex, setProjectActiveIndex] = useState(0);
  const [recruitmentActiveIndex, setRecruitmentActiveIndex] = useState(0);

  useEffect(() => {
    function handleVisibilityChange() {
      setIsDocumentVisible(document.visibilityState !== "hidden");
    }

    const kickoffTimer = window.setTimeout(handleVisibilityChange, 0);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearTimeout(kickoffTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleManualInteraction = useCallback((source: CarouselSource) => {
    setManualSource(source);
    setCancelAnimationSignal((currentSignal) => currentSignal + 1);
  }, []);
  const handleProjectManualInteraction = useCallback(
    () => handleManualInteraction("projects"),
    [handleManualInteraction],
  );
  const handleRecruitmentManualInteraction = useCallback(
    () => handleManualInteraction("recruitments"),
    [handleManualInteraction],
  );
  const canProjectsAdvance =
    projectCount > 1 &&
    !(hasNextProjectsPage && projectActiveIndex >= projectCount - 1);
  const canRecruitmentsAdvance =
    recruitmentCount > 1 &&
    !(
      hasNextRecruitmentsPage &&
      recruitmentActiveIndex >= recruitmentCount - 1
    );
  const carouselsPaused = dialogOpen || !isDocumentVisible;
  const canAdvanceTogether =
    !carouselsPaused && canProjectsAdvance && canRecruitmentsAdvance;

  useEffect(() => {
    if (!canAdvanceTogether) return;

    const timer = window.setTimeout(() => {
      setManualSource(null);
      setAdvanceSignal((currentSignal) => currentSignal + 1);
    }, AUTO_ADVANCE_MS);

    return () => window.clearTimeout(timer);
  }, [advanceSignal, cancelAnimationSignal, canAdvanceTogether]);

  return {
    advanceSignal,
    cancelAnimationSignal,
    carouselsPaused,
    handleProjectManualInteraction,
    handleRecruitmentManualInteraction,
    ignoreProjectCancel: manualSource === "projects",
    ignoreRecruitmentCancel: manualSource === "recruitments",
    setProjectActiveIndex,
    setRecruitmentActiveIndex,
  };
}
