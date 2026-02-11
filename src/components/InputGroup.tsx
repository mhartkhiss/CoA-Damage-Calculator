import React from 'react';

interface TooltipProps {
  text: string;
}

const Tooltip: React.FC<TooltipProps> = ({ text }) => (
  <div className="tooltip-container">
    <div className="tooltip-icon">?</div>
    <span className="tooltip-text">{text}</span>
  </div>
);

interface InputGroupProps {
  id: string;
  label: React.ReactNode;
  value: number;
  modifierValue: number;
  onValueChange: (value: number) => void;
  onModifierChange: (value: number) => void;
  min?: number;
  max?: number;
  totalValue?: string;
  tooltip?: string;
  hasModifier?: boolean;
  placeholder?: string;
  modifierPlaceholder?: string;
  children?: React.ReactNode;
}

const InputGroup: React.FC<InputGroupProps> = ({
  id,
  label,
  value,
  modifierValue,
  onValueChange,
  onModifierChange,
  min = 0,
  max,
  totalValue,
  tooltip,
  hasModifier = true,
  placeholder,
  modifierPlaceholder = "+/-",
  children
}) => {
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value) || 0;
    onValueChange(newValue);
  };

  const handleModifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value) || 0;
    onModifierChange(newValue);
  };

  return (
    <div className="input-group">
      <label htmlFor={id} className="input-label">
        {label}
        {tooltip && <Tooltip text={tooltip} />}
      </label>
      <div className="input-row">
        <input
          type="number"
          id={id}
          value={value}
          onChange={handleValueChange}
          min={min}
          max={max}
          placeholder={placeholder}
          className="main-input"
        />
        {hasModifier && (
          <>
            <span className="modifier-label">+</span>
            <input
              type="number"
              className="modifier-input"
              id={`${id}_mod`}
              value={modifierValue}
              onChange={handleModifierChange}
              placeholder={modifierPlaceholder}
            />
          </>
        )}
      </div>
      {totalValue && <div className="total-value">{totalValue}</div>}
      {children}
    </div>
  );
};

export default InputGroup;
