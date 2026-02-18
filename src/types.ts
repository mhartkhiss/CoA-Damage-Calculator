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
  additionalDmg?: number;
}

export type GearSlot = 'helmet' | 'chest' | 'gloves' | 'pants' | 'boots' | 'seal' | 'talisman' | 'weapon' | 'necklace' | 'bracers' | 'ring';

// Dual-slot system: each gear slot type has a base and secondary sub-slot
export type EquippedGearSlots = Partial<Record<GearSlot, {
  base?: string;      // gear ID for the base sub-slot
  secondary?: string; // gear ID for the secondary sub-slot
}>>;

// Stats that are considered "Base Stats" for the dual-slot system.
// Base Slot gear only applies these stats directly; damage modifier stats are ignored.
// The delta (Secondary - Base) is calculated for ALL stats.
export const BASE_STAT_KEYS: readonly string[] = [
  'baseAtk', 'atkPercent', 'strength', 'strengthPercent',
  'damageReduction', 'physicalPen', 'pdefShred'
];

// Utility: get all equipped gear IDs from the dual-slot structure
export function getAllEquippedGearIds(slots: EquippedGearSlots): string[] {
  const ids: string[] = [];
  for (const slot in slots) {
    const slotData = slots[slot as GearSlot];
    if (slotData?.base) ids.push(slotData.base);
    if (slotData?.secondary) ids.push(slotData.secondary);
  }
  return ids;
}

// Utility: count total equipped gears
export function countEquippedGears(slots: EquippedGearSlots): number {
  let count = 0;
  for (const slot in slots) {
    const slotData = slots[slot as GearSlot];
    if (slotData?.base) count++;
    if (slotData?.secondary) count++;
  }
  return count;
}

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

// Dual-slot system for Other Stats: base group merges to base values, secondary group goes to modifiers
export interface EquippedOtherStatSlots {
  base: string[];
  secondary: string[];
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
  additionalDmg: number;

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
  additionalDmg_mod: number;
}

export interface CalculatorState extends CalculatorInputs {
  resonanceActive: boolean;
  gears: Gear[];
  equippedGears: EquippedGearSlots;
}

export interface Preset {
  id: string;
  name: string;
  inputs: CalculatorInputs;
  equippedGears: EquippedGearSlots;
  equippedOtherStats: EquippedOtherStatSlots;
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
