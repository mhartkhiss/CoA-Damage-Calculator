import React from 'react';
import InputGroup from './InputGroup';
import DefenseGroup from './DefenseGroup';
import type { CalculatorInputs } from '../types';

interface CalculatorGridProps {
  inputs: CalculatorInputs;
  onInputChange: (key: keyof CalculatorInputs, value: number) => void;
  damageReductionTotal: string;
  physicalPenTotal: string;
  totalValues: Record<string, string>;
  defenseTooltip: string;
  penTooltip: string;
  elementalDmgDisplay: string;
  resonanceActive: boolean;
  onResonanceToggle: () => void;
}

const CalculatorGrid: React.FC<CalculatorGridProps> = ({
  inputs,
  onInputChange,
  damageReductionTotal,
  physicalPenTotal,
  totalValues,
  defenseTooltip,
  penTooltip,
  elementalDmgDisplay,
  resonanceActive,
  onResonanceToggle
}) => {
  return (
    <>
      <div className="actual-attack-display">
        <h3>Actual Attack</h3>
        <div className="value" id="actualAttack">0</div>
        <div className="formula">= Total ATK × (1 - Damage Reduction %) + DEF Shred</div>
      </div>

      <div className="calculator-grid">
        <InputGroup
          id="totalPatk"
          label="Total ATK"
          value={inputs.totalPatk}
          modifierValue={0}
          onValueChange={(value) => onInputChange('totalPatk', value)}
          onModifierChange={() => {}}
          hasModifier={false}
          totalValue={totalValues.totalPatk_total}
        />

        <div className="input-group">
          <label htmlFor="baseAtk" className="input-label">
            Base ATK
          </label>
          <div className="input-row">
            <div className="base-atk-display-value">
              {totalValues.baseAtk_calculated || '0.00'}
            </div>
            <span className="modifier-label">+</span>
            <input
              type="number"
              className="modifier-input"
              id="baseAtk_mod"
              value={inputs.baseAtk_mod}
              onChange={(e) => onInputChange('baseAtk_mod', parseFloat(e.target.value) || 0)}
              placeholder="+/-"
            />
          </div>
          {totalValues.baseAtk_total && <div className="total-value">{totalValues.baseAtk_total}</div>}
        </div>

        <InputGroup
          id="atkPercent"
          label="ATK %"
          value={inputs.atkPercent}
          modifierValue={inputs.atkPercent_mod}
          onValueChange={(value) => onInputChange('atkPercent', value)}
          onModifierChange={(value) => onInputChange('atkPercent_mod', value)}
          totalValue={totalValues.atkPercent_total}
        />

        <InputGroup
          id="strength"
          label="Strength"
          value={inputs.strength}
          modifierValue={inputs.strength_mod}
          onValueChange={(value) => onInputChange('strength', value)}
          onModifierChange={(value) => onInputChange('strength_mod', value)}
          totalValue={totalValues.strength_total}
        />

        <InputGroup
          id="strengthPercent"
          label="Strength %"
          value={inputs.strengthPercent}
          modifierValue={inputs.strengthPercent_mod}
          onValueChange={(value) => onInputChange('strengthPercent', value)}
          onModifierChange={(value) => onInputChange('strengthPercent_mod', value)}
          totalValue={totalValues.strengthPercent_total}
        />

        <DefenseGroup
          damageReduction={inputs.damageReduction}
          physicalPen={inputs.physicalPen}
          damageReductionMod={inputs.damageReduction_mod}
          physicalPenMod={inputs.physicalPen_mod}
          onDamageReductionChange={(value) => onInputChange('damageReduction', value)}
          onPhysicalPenChange={(value) => onInputChange('physicalPen', value)}
          onDamageReductionModChange={(value) => onInputChange('damageReduction_mod', value)}
          onPhysicalPenModChange={(value) => onInputChange('physicalPen_mod', value)}
          damageReductionTotal={damageReductionTotal}
          physicalPenTotal={physicalPenTotal}
          defenseTooltip={defenseTooltip}
          penTooltip={penTooltip}
        />

        <InputGroup
          id="pdefShred"
          label="DEF Shred"
          value={inputs.pdefShred}
          modifierValue={inputs.pdefShred_mod}
          onValueChange={(value) => onInputChange('pdefShred', value)}
          onModifierChange={(value) => onInputChange('pdefShred_mod', value)}
          totalValue={totalValues.pdefShred_total}
        />

        <InputGroup
          id="skillMultiplier"
          label="Skill Multiplier (%)"
          value={inputs.skillMultiplier}
          modifierValue={inputs.skillMultiplier_mod}
          onValueChange={(value) => onInputChange('skillMultiplier', value)}
          onModifierChange={(value) => onInputChange('skillMultiplier_mod', value)}
          tooltip="Input the skill multiplier value from one of your skills"
          totalValue={totalValues.skillMultiplier_total}
        />

        <InputGroup
          id="critDmg"
          label="Critical Damage (%)"
          value={inputs.critDmg}
          modifierValue={inputs.critDmg_mod}
          onValueChange={(value) => onInputChange('critDmg', value)}
          onModifierChange={(value) => onInputChange('critDmg_mod', value)}
          totalValue={totalValues.critDmg_total}
        />

        <InputGroup
          id="elementalEnh"
          label="Elemental ENH"
          value={inputs.elementalEnh}
          modifierValue={inputs.elementalEnh_mod}
          onValueChange={(value) => onInputChange('elementalEnh', value)}
          onModifierChange={(value) => onInputChange('elementalEnh_mod', value)}
          totalValue={totalValues.elementalEnh_total}
        >
          <div id="elementalDmgDisplay">{elementalDmgDisplay}</div>
        </InputGroup>

        <InputGroup
          id="skillDmg"
          label="Skill DMG (%)"
          value={inputs.skillDmg}
          modifierValue={inputs.skillDmg_mod}
          onValueChange={(value) => onInputChange('skillDmg', value)}
          onModifierChange={(value) => onInputChange('skillDmg_mod', value)}
          totalValue={totalValues.skillDmg_total}
        />

        <InputGroup
          id="dmgBonus"
          label="DMG Bonus (%)"
          value={inputs.dmgBonus}
          modifierValue={inputs.dmgBonus_mod}
          onValueChange={(value) => onInputChange('dmgBonus', value)}
          onModifierChange={(value) => onInputChange('dmgBonus_mod', value)}
          totalValue={totalValues.dmgBonus_total}
        />

        <InputGroup
          id="dmgDuringResonance"
          label={
            <>
              Damage during Resonance (%)
              <button
                type="button"
                id="resonanceToggle"
                className={`resonance-toggle ${resonanceActive ? 'active' : ''}`}
                onClick={onResonanceToggle}
              >
                {resonanceActive ? 'Active' : 'Inactive'}
              </button>
            </>
          }
          value={inputs.dmgDuringResonance}
          modifierValue={inputs.dmgDuringResonance_mod}
          onValueChange={(value) => onInputChange('dmgDuringResonance', value)}
          onModifierChange={(value) => onInputChange('dmgDuringResonance_mod', value)}
          totalValue={totalValues.dmgDuringResonance_total}
        />

        <InputGroup
          id="dmgToBoss"
          label="DMG to Bosses (%)"
          value={inputs.dmgToBoss}
          modifierValue={inputs.dmgToBoss_mod}
          onValueChange={(value) => onInputChange('dmgToBoss', value)}
          onModifierChange={(value) => onInputChange('dmgToBoss_mod', value)}
          totalValue={totalValues.dmgToBoss_total}
        />

        <InputGroup
          id="dmgToBeast"
          label="DMG to Beast (%)"
          value={inputs.dmgToBeast}
          modifierValue={inputs.dmgToBeast_mod}
          onValueChange={(value) => onInputChange('dmgToBeast', value)}
          onModifierChange={(value) => onInputChange('dmgToBeast_mod', value)}
          totalValue={totalValues.dmgToBeast_total}
        />

        <InputGroup
          id="dmgToMech"
          label="DMG to Mech (%)"
          value={inputs.dmgToMech}
          modifierValue={inputs.dmgToMech_mod}
          onValueChange={(value) => onInputChange('dmgToMech', value)}
          onModifierChange={(value) => onInputChange('dmgToMech_mod', value)}
          totalValue={totalValues.dmgToMech_total}
        />

        <InputGroup
          id="dmgToDecayed"
          label="DMG to Decayed (%)"
          value={inputs.dmgToDecayed}
          modifierValue={inputs.dmgToDecayed_mod}
          onValueChange={(value) => onInputChange('dmgToDecayed', value)}
          onModifierChange={(value) => onInputChange('dmgToDecayed_mod', value)}
          totalValue={totalValues.dmgToDecayed_total}
        />

        <InputGroup
          id="dmgToOtherworld"
          label="DMG to Otherworld (%)"
          value={inputs.dmgToOtherworld}
          modifierValue={inputs.dmgToOtherworld_mod}
          onValueChange={(value) => onInputChange('dmgToOtherworld', value)}
          onModifierChange={(value) => onInputChange('dmgToOtherworld_mod', value)}
          totalValue={totalValues.dmgToOtherworld_total}
        />

        <InputGroup
          id="dmgToDebuffed"
          label="DMG to Debuffed (%)"
          value={inputs.dmgToDebuffed}
          modifierValue={inputs.dmgToDebuffed_mod}
          onValueChange={(value) => onInputChange('dmgToDebuffed', value)}
          onModifierChange={(value) => onInputChange('dmgToDebuffed_mod', value)}
          totalValue={totalValues.dmgToDebuffed_total}
        />

        <InputGroup
          id="dmgToScorched"
          label="DMG to Scorched (%)"
          value={inputs.dmgToScorched}
          modifierValue={inputs.dmgToScorched_mod}
          onValueChange={(value) => onInputChange('dmgToScorched', value)}
          onModifierChange={(value) => onInputChange('dmgToScorched_mod', value)}
          totalValue={totalValues.dmgToScorched_total}
        />

        <InputGroup
          id="dmgToPoisoned"
          label="DMG to Poisoned (%)"
          value={inputs.dmgToPoisoned}
          modifierValue={inputs.dmgToPoisoned_mod}
          onValueChange={(value) => onInputChange('dmgToPoisoned', value)}
          onModifierChange={(value) => onInputChange('dmgToPoisoned_mod', value)}
          totalValue={totalValues.dmgToPoisoned_total}
        />

        <InputGroup
          id="dmgToBleeding"
          label="DMG to Bleeding (%)"
          value={inputs.dmgToBleeding}
          modifierValue={inputs.dmgToBleeding_mod}
          onValueChange={(value) => onInputChange('dmgToBleeding', value)}
          onModifierChange={(value) => onInputChange('dmgToBleeding_mod', value)}
          totalValue={totalValues.dmgToBleeding_total}
        />

        <InputGroup
          id="dmgToVulnerable"
          label="DMG to Vulnerable (%)"
          value={inputs.dmgToVulnerable}
          modifierValue={inputs.dmgToVulnerable_mod}
          onValueChange={(value) => onInputChange('dmgToVulnerable', value)}
          onModifierChange={(value) => onInputChange('dmgToVulnerable_mod', value)}
          totalValue={totalValues.dmgToVulnerable_total}
        />

        <InputGroup
          id="dmgToSlowed"
          label="DMG to Slowed (%)"
          value={inputs.dmgToSlowed}
          modifierValue={inputs.dmgToSlowed_mod}
          onValueChange={(value) => onInputChange('dmgToSlowed', value)}
          onModifierChange={(value) => onInputChange('dmgToSlowed_mod', value)}
          totalValue={totalValues.dmgToSlowed_total}
        />

        <InputGroup
          id="dmgToExhausted"
          label="DMG to Exhausted (%)"
          value={inputs.dmgToExhausted}
          modifierValue={inputs.dmgToExhausted_mod}
          onValueChange={(value) => onInputChange('dmgToExhausted', value)}
          onModifierChange={(value) => onInputChange('dmgToExhausted_mod', value)}
          totalValue={totalValues.dmgToExhausted_total}
        />
      </div>
    </>
  );
};

export default CalculatorGrid;
