// Type definitions for the CoA Damage Calculator

export interface GearStats {
  totalPatk?: number;
  baseAtk?: number;
  atkPercent?: number;
  strength?: number;
  strengthPercent?: number;
  physicalPen?: number;
  pdefShred?: number;
  critDmg?: number;
  elementalEnh?: number;
  skillDmg?: number;
  dmgBonus?: number;
  dmgDuringResonance?: number;
  dmgToBoss?: number;
  dmgToBeast?: number;
  dmgToMech?: number;
  dmgToDecayed?: number;
  dmgToOtherworld?: number;
  dmgToDebuffed?: number;
  dmgToScorched?: number;
  dmgToPoisoned?: number;
  dmgToBleeding?: number;
  dmgToVulnerable?: number;
  dmgToSlowed?: number;
  dmgToExhausted?: number;
}

export type GearSlot = 'helmet' | 'chest' | 'gloves' | 'pants' | 'boots' | 'seal' | 'talisman' | 'weapon' | 'necklace' | 'bracers' | 'ring';

export interface Gear {
  id: string;
  name: string;
  slot: GearSlot;
  stats: GearStats;
}

export interface OtherStat {
  id: string;
  name: string;
  stats: GearStats;
  isSetEffect?: boolean;
  requiredGearIds?: string[];
}

// Export CalculatorInputs interface
export interface CalculatorInputs {
  // Base values
  totalPatk: number;
  baseAtk: number;
  atkPercent: number;
  strength: number;
  strengthPercent: number;
  damageReduction: number;
  physicalPen: number;
  pdefShred: number;
  skillMultiplier: number;
  critDmg: number;
  elementalEnh: number;
  skillDmg: number;
  dmgBonus: number;
  dmgDuringResonance: number;
  dmgToBoss: number;
  dmgToBeast: number;
  dmgToMech: number;
  dmgToDecayed: number;
  dmgToOtherworld: number;
  dmgToDebuffed: number;
  dmgToScorched: number;
  dmgToPoisoned: number;
  dmgToBleeding: number;
  dmgToVulnerable: number;
  dmgToSlowed: number;
  dmgToExhausted: number;

  // Modifiers
  baseAtk_mod: number;
  atkPercent_mod: number;
  strength_mod: number;
  strengthPercent_mod: number;
  damageReduction_mod: number;
  physicalPen_mod: number;
  pdefShred_mod: number;
  skillMultiplier_mod: number;
  critDmg_mod: number;
  elementalEnh_mod: number;
  skillDmg_mod: number;
  dmgBonus_mod: number;
  dmgDuringResonance_mod: number;
  dmgToBoss_mod: number;
  dmgToBeast_mod: number;
  dmgToMech_mod: number;
  dmgToDecayed_mod: number;
  dmgToOtherworld_mod: number;
  dmgToDebuffed_mod: number;
  dmgToScorched_mod: number;
  dmgToPoisoned_mod: number;
  dmgToBleeding_mod: number;
  dmgToVulnerable_mod: number;
  dmgToSlowed_mod: number;
  dmgToExhausted_mod: number;
}

export interface CalculatorState extends CalculatorInputs {
  resonanceActive: boolean;
  gears: Gear[];
  equippedGears: string[];
}

export interface Preset {
  id: string;
  name: string;
  inputs: CalculatorInputs;
  equippedGears: string[];
  equippedOtherStats: string[];
  resonanceActive: boolean;
}

export type DialogType = 'alert' | 'confirm' | 'danger';

export interface DialogConfig {
  isOpen: boolean;
  title: string;
  message: string;
  type: DialogType;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export interface CalculationResults {
  actualAttack: number;
  baseDamage: number;
  finalDamage: number;
  percentageIncrease: number;
  hasModifiers: boolean;
  defenseTooltip: string;
  penTooltip: string;
  elementalDmg: number;
  calculatedBaseAtk: number | null;
  effectiveTotalPatk: number;
}
