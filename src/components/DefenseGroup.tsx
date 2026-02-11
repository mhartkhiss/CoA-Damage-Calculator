import React from 'react';
import InputGroup from './InputGroup';

interface PresetButtonProps {
  label: string;
  value: string;
  onClick: (value: number) => void;
}

const PresetButton: React.FC<PresetButtonProps> = ({ label, value, onClick }) => (
  <button
    className="preset-button"
    onClick={() => onClick(parseFloat(value))}
  >
    {label}
    <span className="preset-value">{value}%</span>
  </button>
);

interface DefenseGroupProps {
  damageReduction: number;
  physicalPen: number;
  damageReductionMod: number;
  physicalPenMod: number;
  onDamageReductionChange: (value: number) => void;
  onPhysicalPenChange: (value: number) => void;
  onDamageReductionModChange: (value: number) => void;
  onPhysicalPenModChange: (value: number) => void;
  damageReductionTotal: string;
  physicalPenTotal: string;
  defenseTooltip: string;
  penTooltip: string;
}

const DefenseGroup: React.FC<DefenseGroupProps> = ({
  damageReduction,
  physicalPen,
  damageReductionMod,
  physicalPenMod,
  onDamageReductionChange,
  onPhysicalPenChange,
  onDamageReductionModChange,
  onPhysicalPenModChange,
  damageReductionTotal,
  physicalPenTotal,
  defenseTooltip,
  penTooltip
}) => {
  return (
    <div className="defense-group">
      <div className="defense-group-title">Defense & Penetration</div>

      <InputGroup
        id="damageReduction"
        label="Damage Reduction (%)"
        value={damageReduction}
        modifierValue={damageReductionMod}
        onValueChange={onDamageReductionChange}
        onModifierChange={onDamageReductionModChange}
        min={0}
        max={100}
        totalValue={damageReductionTotal}
        tooltip={defenseTooltip}
      >
        <div className="presets-container">
          <PresetButton
            label="HexChess King"
            value="62.84"
            onClick={onDamageReductionChange}
          />
          <PresetButton
            label="GoldenFleece Boss"
            value="51.26"
            onClick={onDamageReductionChange}
          />
        </div>
      </InputGroup>

      <InputGroup
        id="physicalPen"
        label="Physical PEN (%)"
        value={physicalPen}
        modifierValue={physicalPenMod}
        onValueChange={onPhysicalPenChange}
        onModifierChange={onPhysicalPenModChange}
        min={0}
        max={100}
        totalValue={physicalPenTotal}
        tooltip={penTooltip}
      />
    </div>
  );
};

export default DefenseGroup;
