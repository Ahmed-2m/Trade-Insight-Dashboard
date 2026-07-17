export interface Stage {
  number: number;
  startBalance: number;
  targetBalance: number;
  label: string;
  color: string;
}

export const STAGES: Stage[] = [
  { number: 1, startBalance: 0, targetBalance: 100, label: 'Stage 1', color: '#6C5CE7' },
  { number: 2, startBalance: 100, targetBalance: 200, label: 'Stage 2', color: '#9B8FF7' },
  { number: 3, startBalance: 200, targetBalance: 300, label: 'Stage 3', color: '#0ECB81' },
  { number: 4, startBalance: 300, targetBalance: 400, label: 'Stage 4', color: '#22D3EE' },
  { number: 5, startBalance: 400, targetBalance: 600, label: 'Stage 5', color: '#F59E0B' },
  { number: 6, startBalance: 600, targetBalance: 900, label: 'Stage 6', color: '#F6465D' },
  { number: 7, startBalance: 900, targetBalance: 1350, label: 'Stage 7', color: '#EC4899' },
  { number: 8, startBalance: 1350, targetBalance: 2000, label: 'Stage 8', color: '#8B5CF6' },
  { number: 9, startBalance: 2000, targetBalance: 3000, label: 'Stage 9', color: '#06B6D4' },
  { number: 10, startBalance: 3000, targetBalance: 5000, label: 'Stage 10', color: '#10B981' },
  { number: 11, startBalance: 5000, targetBalance: 7500, label: 'Stage 11', color: '#F59E0B' },
  { number: 12, startBalance: 7500, targetBalance: 10000, label: 'Stage 12', color: '#6366F1' },
];

export function getCurrentStage(balance: number): Stage {
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (balance >= STAGES[i].startBalance) {
      return STAGES[i];
    }
  }
  return STAGES[0];
}

export function getCompletedStages(balance: number): Stage[] {
  return STAGES.filter((s) => balance >= s.targetBalance);
}

export function getStageProgress(balance: number, stage: Stage): number {
  const range = stage.targetBalance - stage.startBalance;
  const progress = balance - stage.startBalance;
  return Math.min(1, Math.max(0, progress / range));
}
