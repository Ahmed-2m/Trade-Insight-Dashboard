export interface Stage {
  number: number;
  startBalance: number;
  targetBalance: number;
  label: string;
  color: string;
}

const STAGE_COLORS = [
  '#6C5CE7', '#9B8FF7', '#0ECB81', '#22D3EE',
  '#F59E0B', '#F6465D', '#EC4899', '#8B5CF6',
  '#06B6D4', '#10B981', '#F97316', '#6366F1',
];

export const PLAN_PRESETS = [10, 50, 100, 250, 500, 1000];

// Default fallback stages (used when no plan start balance is set)
export const STAGES: Stage[] = [
  { number: 1,  startBalance: 0,    targetBalance: 100,   label: 'Stage 1',  color: STAGE_COLORS[0] },
  { number: 2,  startBalance: 100,  targetBalance: 200,   label: 'Stage 2',  color: STAGE_COLORS[1] },
  { number: 3,  startBalance: 200,  targetBalance: 300,   label: 'Stage 3',  color: STAGE_COLORS[2] },
  { number: 4,  startBalance: 300,  targetBalance: 400,   label: 'Stage 4',  color: STAGE_COLORS[3] },
  { number: 5,  startBalance: 400,  targetBalance: 600,   label: 'Stage 5',  color: STAGE_COLORS[4] },
  { number: 6,  startBalance: 600,  targetBalance: 900,   label: 'Stage 6',  color: STAGE_COLORS[5] },
  { number: 7,  startBalance: 900,  targetBalance: 1350,  label: 'Stage 7',  color: STAGE_COLORS[6] },
  { number: 8,  startBalance: 1350, targetBalance: 2000,  label: 'Stage 8',  color: STAGE_COLORS[7] },
  { number: 9,  startBalance: 2000, targetBalance: 3000,  label: 'Stage 9',  color: STAGE_COLORS[8] },
  { number: 10, startBalance: 3000, targetBalance: 5000,  label: 'Stage 10', color: STAGE_COLORS[9] },
  { number: 11, startBalance: 5000, targetBalance: 7500,  label: 'Stage 11', color: STAGE_COLORS[10] },
  { number: 12, startBalance: 7500, targetBalance: 10000, label: 'Stage 12', color: STAGE_COLORS[11] },
];

/**
 * Build 12 progressive stages from a custom starting balance.
 * Stage 1 target = 2× the start. Each subsequent stage grows ~50%.
 * Numbers are rounded to sensible precision based on magnitude.
 */
export function generateDynamicStages(planStart: number): Stage[] {
  if (planStart <= 0) return STAGES;

  const stages: Stage[] = [];
  let current = planStart;

  for (let i = 0; i < 12; i++) {
    let raw = i === 0 ? current * 2 : stages[i - 1].targetBalance * 1.5;

    // Round to clean numbers proportional to magnitude
    let target: number;
    if (raw < 10)       target = Math.round(raw * 100) / 100;
    else if (raw < 100) target = Math.round(raw * 10) / 10;
    else if (raw < 1000) target = Math.round(raw);
    else                target = Math.round(raw / 10) * 10;

    stages.push({
      number: i + 1,
      startBalance: i === 0 ? planStart : stages[i - 1].targetBalance,
      targetBalance: target,
      label: `Stage ${i + 1}`,
      color: STAGE_COLORS[i],
    });
    current = target;
  }
  return stages;
}

export function getCurrentStage(balance: number, stages: Stage[] = STAGES): Stage {
  for (let i = stages.length - 1; i >= 0; i--) {
    if (balance >= stages[i].startBalance) return stages[i];
  }
  return stages[0];
}

export function getCompletedStages(balance: number, stages: Stage[] = STAGES): Stage[] {
  return stages.filter((s) => balance >= s.targetBalance);
}

export function getStageProgress(balance: number, stage: Stage): number {
  const range = stage.targetBalance - stage.startBalance;
  const progress = balance - stage.startBalance;
  return Math.min(1, Math.max(0, progress / range));
}
