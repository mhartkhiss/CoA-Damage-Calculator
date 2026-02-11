import { useMemo } from 'react';
import type { CalculatorInputs } from '../types';
import { formatStatValue } from '../utils/formatUtils';

export const useDamageCalculator = (inputs: CalculatorInputs, resonanceActive: boolean) => {

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

        // For base damage calculation (without modifiers)
        const baseStrength = inputs.strength;
        const baseStrengthPercent = inputs.strengthPercent;
        const baseEffectiveStrength = baseStrength * (1 + baseStrengthPercent / 100);
        const basePatkForBaseDamage = calculatedBaseAtk !== null
            ? calculateTotalAtk(calculatedBaseAtk, inputs.atkPercent, baseEffectiveStrength)
            : inputs.totalPatk;

        // For final damage calculation (with modifiers)
        const effectiveTotalPatk = totalBaseAtk > 0
            ? calculateTotalAtk(totalBaseAtk, totalAtkPercent, effectiveStrength)
            : inputs.totalPatk;

        const basePatk = basePatkForBaseDamage;
        const baseDamageReduction = (inputs.damageReduction || 0) / 100;
        const basePhysicalPen = (inputs.physicalPen || 0) / 100;

        const calculateDefense = (damageReduction: number): number => {
            return Math.round((3000 * damageReduction) / (1 - damageReduction));
        };

        const calculateDamageReduction = (defense: number, pen: number): number => {
            const effectiveDefense = defense * (1 - pen);
            return effectiveDefense / (3000 + effectiveDefense);
        };

        const baseDefense = calculateDefense(baseDamageReduction);
        const effectiveDefense = Math.round(baseDefense * (1 - basePhysicalPen));
        const actualDamageReduction = calculateDamageReduction(baseDefense, basePhysicalPen);

        const basePdefShred = inputs.pdefShred || 0;
        const baseActualAtk = basePatk * (1 - actualDamageReduction) + basePdefShred;

        const baseSkillMultiplier = (inputs.skillMultiplier || 0) / 100;
        const baseCritDmg = (inputs.critDmg || 0) / 100;
        const baseElementalEnh = inputs.elementalEnh || 0;
        const baseElementalDmg = (baseElementalEnh / 11) * 0.05;

        const baseSkillDmg = (inputs.skillDmg || 0) / 100;
        const baseDmgBonus = (inputs.dmgBonus || 0) / 100;
        const baseDmgToX = (inputs.dmgToBoss || 0) / 100 + (inputs.dmgToBeast || 0) / 100 + (inputs.dmgToMech || 0) / 100 +
            (inputs.dmgToDecayed || 0) / 100 + (inputs.dmgToOtherworld || 0) / 100 + (inputs.dmgToDebuffed || 0) / 100 +
            (inputs.dmgToScorched || 0) / 100 + (inputs.dmgToPoisoned || 0) / 100 + (inputs.dmgToBleeding || 0) / 100 +
            (inputs.dmgToVulnerable || 0) / 100 + (inputs.dmgToSlowed || 0) / 100 + (inputs.dmgToExhausted || 0) / 100;

        const baseDmgDuringResonance = (inputs.dmgDuringResonance || 0) / 100;
        const baseResonanceFactor = resonanceActive ? (1 + 0.20 + baseDmgDuringResonance) : 1;
        const baseDamage = baseActualAtk *
            (1 + baseSkillMultiplier) *
            (1 + baseCritDmg) *
            (1 + baseElementalDmg) *
            (1 + baseSkillDmg) *
            (1 + baseDmgBonus) *
            (1 + baseDmgToX) *
            baseResonanceFactor;

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
        const finalDamage = actualAtk *
            (1 + skillMultiplier) *
            (1 + critDmg) *
            (1 + elementalDmg) *
            (1 + skillDmg) *
            (1 + dmgBonus) *
            (1 + dmgToX) *
            resonanceFactor;

        const modifierKeys = Object.keys(inputs).filter(key => key.endsWith('_mod'));
        const hasModifiers = modifierKeys.some(key => inputs[key as keyof CalculatorInputs] !== 0);
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
    }, [inputs, resonanceActive]);

    const totalValues = useMemo(() => {
        const newTotalValues: Record<string, string> = {};
        const modifierIds = [
            'totalPatk', 'baseAtk', 'atkPercent', 'strength', 'strengthPercent', 'damageReduction', 'physicalPen', 'pdefShred', 'skillMultiplier',
            'critDmg', 'elementalEnh', 'skillDmg', 'dmgBonus', 'dmgDuringResonance',
            'dmgToBoss', 'dmgToBeast', 'dmgToMech', 'dmgToDecayed', 'dmgToOtherworld',
            'dmgToDebuffed', 'dmgToScorched', 'dmgToPoisoned', 'dmgToBleeding',
            'dmgToVulnerable', 'dmgToSlowed', 'dmgToExhausted'
        ];

        modifierIds.forEach(id => {
            const baseKey = id as keyof CalculatorInputs;
            const modKey = `${id}_mod` as keyof CalculatorInputs;
            const baseValue = inputs[baseKey] || 0;
            const modValue = inputs[modKey] || 0;

            if (id === 'strength') return;

            if (modValue !== 0) {
                newTotalValues[`${id}_total`] = `= ${formatStatValue(baseValue + modValue)}`;
            } else {
                newTotalValues[`${id}_total`] = '';
            }
        });

        let calculatedBaseAtkForDisplay: number | null = results.calculatedBaseAtk;
        if (calculatedBaseAtkForDisplay !== null) {
            newTotalValues['baseAtk_calculated'] = formatStatValue(calculatedBaseAtkForDisplay);
            const totalBaseAtk = calculatedBaseAtkForDisplay + (inputs.baseAtk_mod || 0);
            if (inputs.baseAtk_mod !== 0) {
                newTotalValues['baseAtk_total'] = `= ${formatStatValue(totalBaseAtk)}`;
            }
        } else {
            newTotalValues['baseAtk_calculated'] = '';
            if (inputs.baseAtk_mod !== 0) {
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

            if (Math.abs(calculatedTotalPatk - inputs.totalPatk) > 0.01) {
                newTotalValues['totalPatk_total'] = `= ${formatStatValue(calculatedTotalPatk)}`;
            } else {
                newTotalValues['totalPatk_total'] = '';
            }
        }

        const totalStrength = (inputs.strength || 0) + (inputs.strength_mod || 0);
        const totalStrengthPercent = (inputs.strengthPercent || 0) + (inputs.strengthPercent_mod || 0);
        const effectiveStrengthValue = totalStrength * (1 + totalStrengthPercent / 100);

        if (Math.abs(effectiveStrengthValue - inputs.strength) > 0.01) {
            newTotalValues['strength_total'] = `= ${formatStatValue(effectiveStrengthValue)}`;
        } else {
            newTotalValues['strength_total'] = '';
        }

        return newTotalValues;
    }, [inputs, results.calculatedBaseAtk]);

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
