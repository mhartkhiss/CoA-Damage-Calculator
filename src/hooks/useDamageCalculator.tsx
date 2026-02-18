import { useMemo } from 'react';
import type { CalculatorInputs } from '../types';
import { formatStatValue } from '../utils/formatUtils';

export const useDamageCalculator = (inputs: CalculatorInputs, resonanceActive: boolean, gearBaseContributions: Record<string, number> = {}) => {

    // Calculate base ATK from total ATK, ATK %, and strength
    const calculateBaseAtk = (totalAtk: number, atkPercent: number, strength: number): number => {
        const strengthMultiplier = 1 + (strength / 1000);
        const atkMultiplier = 1 + (atkPercent / 100);
        return totalAtk / (atkMultiplier * strengthMultiplier);
    };

    // Calculate total ATK from base ATK, ATK %, and strength
    const calculateTotalAtk = (baseAtk: number, atkPercent: number, strength: number): number => {
        const strengthMultiplier = 1 + (strength / 1000);
        const atkMultiplier = 1 + (atkPercent / 100);
        return baseAtk * atkMultiplier * strengthMultiplier;
    };

    const results = useMemo(() => {
        // Get total values (base + modifier)
        const getTotalValue = (baseId: keyof CalculatorInputs, modId?: keyof CalculatorInputs): number => {
            const baseValue = inputs[baseId] || 0;
            const modifierValue = modId ? (inputs[modId] || 0) : 0;
            return baseValue + modifierValue;
        };

        // Helper: get input value + gear base contribution (for "display base" damage)
        const gb = (key: string): number => gearBaseContributions[key] || 0;

        // Calculate base ATK if totalPatk, atkPercent, and strength are provided
        let calculatedBaseAtk: number | null = null;
        if (inputs.totalPatk > 0 && inputs.atkPercent >= 0 && inputs.strength >= 0) {
            const baseEffectiveStrength = inputs.strength * (1 + inputs.strengthPercent / 100);
            calculatedBaseAtk = calculateBaseAtk(inputs.totalPatk, inputs.atkPercent, baseEffectiveStrength);
        }

        // Calculate totalPatk from baseAtk, atkPercent, and strength (with modifiers)
        const calculatedBaseAtkValue = calculatedBaseAtk !== null ? calculatedBaseAtk : 0;
        const totalBaseAtk = calculatedBaseAtkValue + (inputs.baseAtk_mod || 0);
        const totalAtkPercent = getTotalValue('atkPercent', 'atkPercent_mod');
        const totalStrength = getTotalValue('strength', 'strength_mod');
        const totalStrengthPercent = getTotalValue('strengthPercent', 'strengthPercent_mod');

        // Apply strength percent to strength
        const effectiveStrength = totalStrength * (1 + totalStrengthPercent / 100);

        // For final damage calculation (with ALL modifiers)
        const effectiveTotalPatk = totalBaseAtk > 0
            ? calculateTotalAtk(totalBaseAtk, totalAtkPercent, effectiveStrength)
            : inputs.totalPatk;

        // For "display base" damage calculation (raw inputs + gearBaseContributions)
        // This makes base-slot gear stats appear as part of "base damage" (no final damage increase)
        const adjBaseAtk = calculatedBaseAtkValue + gb('baseAtk');
        const adjAtkPercent = (inputs.atkPercent || 0) + gb('atkPercent');
        const adjStrength = (inputs.strength || 0) + gb('strength');
        const adjStrengthPercent = (inputs.strengthPercent || 0) + gb('strengthPercent');
        const adjEffectiveStrength = adjStrength * (1 + adjStrengthPercent / 100);
        const adjBasePatkForBaseDamage = adjBaseAtk > 0
            ? calculateTotalAtk(adjBaseAtk, adjAtkPercent, adjEffectiveStrength)
            : inputs.totalPatk;

        const basePatk = adjBasePatkForBaseDamage;
        const adjDamageReduction = ((inputs.damageReduction || 0) + gb('damageReduction')) / 100;
        const adjPhysicalPen = ((inputs.physicalPen || 0) + gb('physicalPen')) / 100;

        const calculateDefense = (damageReduction: number): number => {
            return Math.round((3000 * damageReduction) / (1 - damageReduction));
        };

        const calculateDamageReduction = (defense: number, pen: number): number => {
            const effectiveDefense = defense * (1 - pen);
            return effectiveDefense / (3000 + effectiveDefense);
        };

        const baseDefense = calculateDefense(adjDamageReduction);
        const effectiveDefense = Math.round(baseDefense * (1 - adjPhysicalPen));
        const actualDamageReduction = calculateDamageReduction(baseDefense, adjPhysicalPen);

        const adjPdefShred = (inputs.pdefShred || 0) + gb('pdefShred');
        const baseActualAtk = basePatk * (1 - actualDamageReduction) + adjPdefShred;

        const adjSkillMultiplier = ((inputs.skillMultiplier || 0) + gb('skillMultiplier')) / 100;
        const adjCritDmg = ((inputs.critDmg || 0) + gb('critDmg')) / 100;
        const adjElementalEnh = (inputs.elementalEnh || 0) + gb('elementalEnh');
        const adjElementalDmg = (adjElementalEnh / 11) * 0.05;

        const adjSkillDmg = ((inputs.skillDmg || 0) + gb('skillDmg')) / 100;
        const adjDmgBonus = ((inputs.dmgBonus || 0) + gb('dmgBonus')) / 100;
        const adjDmgToX = ((inputs.dmgToBoss || 0) + gb('dmgToBoss')) / 100 +
            ((inputs.dmgToBeast || 0) + gb('dmgToBeast')) / 100 +
            ((inputs.dmgToMech || 0) + gb('dmgToMech')) / 100 +
            ((inputs.dmgToDecayed || 0) + gb('dmgToDecayed')) / 100 +
            ((inputs.dmgToOtherworld || 0) + gb('dmgToOtherworld')) / 100 +
            ((inputs.dmgToDebuffed || 0) + gb('dmgToDebuffed')) / 100 +
            ((inputs.dmgToScorched || 0) + gb('dmgToScorched')) / 100 +
            ((inputs.dmgToPoisoned || 0) + gb('dmgToPoisoned')) / 100 +
            ((inputs.dmgToBleeding || 0) + gb('dmgToBleeding')) / 100 +
            ((inputs.dmgToVulnerable || 0) + gb('dmgToVulnerable')) / 100 +
            ((inputs.dmgToSlowed || 0) + gb('dmgToSlowed')) / 100 +
            ((inputs.dmgToExhausted || 0) + gb('dmgToExhausted')) / 100;

        const adjDmgDuringResonance = ((inputs.dmgDuringResonance || 0) + gb('dmgDuringResonance')) / 100;
        const adjResonanceFactor = resonanceActive ? (1 + 0.20 + adjDmgDuringResonance) : 1;
        const adjAdditionalDmg = ((inputs.additionalDmg || 0) + gb('additionalDmg')) / 100;
        const baseDamageBeforeAdditional = baseActualAtk *
            (1 + adjSkillMultiplier) *
            (1 + adjCritDmg) *
            (1 + adjElementalDmg) *
            (1 + adjSkillDmg) *
            (1 + adjDmgBonus) *
            (1 + adjDmgToX) *
            adjResonanceFactor;
        const baseDamage = baseDamageBeforeAdditional * (1 + adjAdditionalDmg);

        const totalPatk = effectiveTotalPatk;
        const totalDamageReduction = getTotalValue('damageReduction', 'damageReduction_mod') / 100;
        const totalPhysicalPen = getTotalValue('physicalPen', 'physicalPen_mod') / 100;

        const totalDefense = calculateDefense(totalDamageReduction);
        const totalEffectiveDefense = totalDefense * (1 - totalPhysicalPen);
        const totalDamageReductionAfterPen = totalEffectiveDefense / (3000 + totalEffectiveDefense);

        const pdefShred = getTotalValue('pdefShred', 'pdefShred_mod');
        const actualAtk = totalPatk * (1 - totalDamageReductionAfterPen) + pdefShred;

        const skillMultiplier = getTotalValue('skillMultiplier', 'skillMultiplier_mod') / 100;
        const critDmg = getTotalValue('critDmg', 'critDmg_mod') / 100;
        const elementalEnh = getTotalValue('elementalEnh', 'elementalEnh_mod');
        const elementalDmg = (elementalEnh / 11) * 0.05;

        const skillDmg = getTotalValue('skillDmg', 'skillDmg_mod') / 100;
        const dmgBonus = getTotalValue('dmgBonus', 'dmgBonus_mod') / 100;
        const dmgToX = (getTotalValue('dmgToBoss', 'dmgToBoss_mod') + getTotalValue('dmgToBeast', 'dmgToBeast_mod') +
            getTotalValue('dmgToMech', 'dmgToMech_mod') + getTotalValue('dmgToDecayed', 'dmgToDecayed_mod') +
            getTotalValue('dmgToOtherworld', 'dmgToOtherworld_mod') + getTotalValue('dmgToDebuffed', 'dmgToDebuffed_mod') +
            getTotalValue('dmgToScorched', 'dmgToScorched_mod') + getTotalValue('dmgToPoisoned', 'dmgToPoisoned_mod') +
            getTotalValue('dmgToBleeding', 'dmgToBleeding_mod') + getTotalValue('dmgToVulnerable', 'dmgToVulnerable_mod') +
            getTotalValue('dmgToSlowed', 'dmgToSlowed_mod') + getTotalValue('dmgToExhausted', 'dmgToExhausted_mod')) / 100;

        const dmgDuringResonance = getTotalValue('dmgDuringResonance', 'dmgDuringResonance_mod') / 100;
        const resonanceFactor = resonanceActive ? (1 + 0.20 + dmgDuringResonance) : 1;
        const additionalDmg = getTotalValue('additionalDmg', 'additionalDmg_mod') / 100;
        const finalDamageBeforeAdditional = actualAtk *
            (1 + skillMultiplier) *
            (1 + critDmg) *
            (1 + elementalDmg) *
            (1 + skillDmg) *
            (1 + dmgBonus) *
            (1 + dmgToX) *
            resonanceFactor;
        const finalDamage = finalDamageBeforeAdditional * (1 + additionalDmg);

        // Check for display-visible modifiers (raw _mod minus gearBaseContributions)
        const modifierKeys = Object.keys(inputs).filter(key => key.endsWith('_mod'));
        const hasDisplayModifiers = modifierKeys.some(key => {
            const statKey = key.replace('_mod', '');
            const rawMod = inputs[key as keyof CalculatorInputs] || 0;
            const baseContrib = gearBaseContributions[statKey] || 0;
            return Math.abs(rawMod - baseContrib) > 0.001;
        });
        const hasModifiers = hasDisplayModifiers;
        const percentageIncrease = hasModifiers ? ((finalDamage - baseDamage) / baseDamage * 100) : 0;

        return {
            actualAttack: actualAtk,
            baseDamage,
            finalDamage,
            percentageIncrease: Math.round(percentageIncrease * 100) / 100,
            hasModifiers,
            defenseTooltip: `Base Defense: ${baseDefense.toLocaleString()}`,
            penTooltip: `Effective Defense: ${effectiveDefense.toLocaleString()}\nFinal Reduction: ${formatStatValue(actualDamageReduction * 100)}%`,
            elementalDmg,
            calculatedBaseAtk,
            effectiveTotalPatk
        };
    }, [inputs, resonanceActive, gearBaseContributions]);

    const totalValues = useMemo(() => {
        const newTotalValues: Record<string, string> = {};
        const gbv = (key: string): number => gearBaseContributions[key] || 0;

        // Recompute adjusted base values for display comparison
        const calculatedBaseAtkVal = results.calculatedBaseAtk !== null ? results.calculatedBaseAtk : 0;
        const adjBaseAtk = calculatedBaseAtkVal + gbv('baseAtk');
        const adjAtkPercent = (inputs.atkPercent || 0) + gbv('atkPercent');
        const adjStrength = (inputs.strength || 0) + gbv('strength');
        const adjStrengthPercent = (inputs.strengthPercent || 0) + gbv('strengthPercent');
        const adjEffectiveStrength = adjStrength * (1 + adjStrengthPercent / 100);

        const modifierIds = [
            'totalPatk', 'baseAtk', 'atkPercent', 'strength', 'strengthPercent', 'damageReduction', 'physicalPen', 'pdefShred', 'skillMultiplier',
            'critDmg', 'elementalEnh', 'skillDmg', 'dmgBonus', 'dmgDuringResonance',
            'dmgToBoss', 'dmgToBeast', 'dmgToMech', 'dmgToDecayed', 'dmgToOtherworld',
            'dmgToDebuffed', 'dmgToScorched', 'dmgToPoisoned', 'dmgToBleeding',
            'dmgToVulnerable', 'dmgToSlowed', 'dmgToExhausted', 'additionalDmg'
        ];

        modifierIds.forEach(id => {
            const baseKey = id as keyof CalculatorInputs;
            const modKey = `${id}_mod` as keyof CalculatorInputs;
            const baseValue = inputs[baseKey] || 0;
            const modValue = inputs[modKey] || 0;
            const baseContrib = gearBaseContributions[id] || 0;
            const displayMod = modValue - baseContrib;

            if (id === 'strength') return;

            if (Math.abs(displayMod) > 0.001) {
                // Show total as (base + gearBase) + displayMod
                newTotalValues[`${id}_total`] = `= ${formatStatValue(baseValue + modValue)}`;
            } else {
                newTotalValues[`${id}_total`] = '';
            }
        });

        let calculatedBaseAtkForDisplay: number | null = results.calculatedBaseAtk;
        const baseAtkDisplayMod = (inputs.baseAtk_mod || 0) - (gearBaseContributions['baseAtk'] || 0);
        if (calculatedBaseAtkForDisplay !== null) {
            newTotalValues['baseAtk_calculated'] = formatStatValue(calculatedBaseAtkForDisplay);
            const totalBaseAtk = calculatedBaseAtkForDisplay + (inputs.baseAtk_mod || 0);
            if (Math.abs(baseAtkDisplayMod) > 0.001) {
                newTotalValues['baseAtk_total'] = `= ${formatStatValue(totalBaseAtk)}`;
            }
        } else {
            newTotalValues['baseAtk_calculated'] = '';
            if (Math.abs(baseAtkDisplayMod) > 0.001) {
                newTotalValues['baseAtk_total'] = `= ${formatStatValue(inputs.baseAtk_mod)}`;
            }
        }

        const baseAtkToUse = calculatedBaseAtkForDisplay !== null ? calculatedBaseAtkForDisplay : (inputs.baseAtk || 0);
        const totalBaseAtkForPatk = baseAtkToUse + (inputs.baseAtk_mod || 0);

        if (calculatedBaseAtkForDisplay !== null || inputs.baseAtk !== 0 || inputs.baseAtk_mod !== 0) {
            const totalAtkPercent = (inputs.atkPercent || 0) + (inputs.atkPercent_mod || 0);
            const totalStrength = (inputs.strength || 0) + (inputs.strength_mod || 0);
            const totalStrengthPercent = (inputs.strengthPercent || 0) + (inputs.strengthPercent_mod || 0);
            const effectiveStrengthResource = totalStrength * (1 + totalStrengthPercent / 100);
            const strengthMultiplier = 1 + (effectiveStrengthResource / 1000);
            const atkMultiplier = 1 + (totalAtkPercent / 100);
            const calculatedTotalPatk = totalBaseAtkForPatk * atkMultiplier * strengthMultiplier;

            // Show total PATK only if there are display-visible modifiers
            const adjBasePatkForDisplay = adjBaseAtk > 0
                ? calculateTotalAtk(adjBaseAtk, adjAtkPercent, adjEffectiveStrength)
                : inputs.totalPatk;
            if (Math.abs(calculatedTotalPatk - adjBasePatkForDisplay) > 0.01) {
                newTotalValues['totalPatk_total'] = `= ${formatStatValue(calculatedTotalPatk)}`;
            } else {
                newTotalValues['totalPatk_total'] = '';
            }
        }

        const totalStrength = (inputs.strength || 0) + (inputs.strength_mod || 0);
        const totalStrengthPercent = (inputs.strengthPercent || 0) + (inputs.strengthPercent_mod || 0);
        const effectiveStrengthValue = totalStrength * (1 + totalStrengthPercent / 100);
        const adjStrengthDisplay = ((inputs.strength || 0) + (gearBaseContributions['strength'] || 0));

        if (Math.abs(effectiveStrengthValue - adjStrengthDisplay) > 0.01) {
            newTotalValues['strength_total'] = `= ${formatStatValue(effectiveStrengthValue)}`;
        } else {
            newTotalValues['strength_total'] = '';
        }

        return newTotalValues;
    }, [inputs, results.calculatedBaseAtk, gearBaseContributions]);

    const elementalDmgDisplay = useMemo(() => {
        const elementalEnh = (inputs.elementalEnh || 0) + (inputs.elementalEnh_mod || 0);
        const elementalDmg = (elementalEnh / 11) * 0.05;
        return `Converted to: ${formatStatValue(elementalDmg * 100)}% Elemental DMG`;
    }, [inputs.elementalEnh, inputs.elementalEnh_mod]);

    return {
        results,
        totalValues,
        elementalDmgDisplay
    };
};
