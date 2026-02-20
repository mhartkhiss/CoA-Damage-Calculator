import React, { useState, useEffect, useRef } from 'react';
import { FaEdit, FaTrash, FaGripVertical } from 'react-icons/fa';
import type { Gear, GearSlot, CalculatorInputs, CalculationResults, OtherStat, Preset, DialogConfig, EquippedGearSlots, EquippedOtherStatSlots } from '../types';
import { countEquippedGears } from '../types';

import GearModal from './GearModal';
import OtherStatModal from './OtherStatModal';
import { formatStatValue } from '../utils/formatUtils';

// Organized layout: left side and right side
const gearSlots: GearSlot[] = [
  // Right side (columns 2-4) - now on left
  'helmet',
  'chest',
  'gloves',
  'pants',
  'boots',
  'talisman',
  // Left side (column 1) - now on right
  'weapon',
  'necklace',
  'bracers',
  'ring',
  'seal'
];

interface GearManagementProps {
  gears: Gear[];
  equippedGears: EquippedGearSlots;
  otherStats: OtherStat[];
  equippedOtherStats: EquippedOtherStatSlots;
  gearBaseContributions: Record<string, number>;
  onAddGear: (gear: Omit<Gear, 'id'>) => void;
  onEditGear: (gearId: string, updates: Omit<Gear, 'id'>) => void;
  onDeleteGear: (gearId: string) => void;
  onEquipGear: (gearId: string, subSlot: 'base' | 'secondary') => void;
  onUnequipGear: (gearId: string) => void;
  onAddOtherStat: (otherStat: Omit<OtherStat, 'id'>) => void;
  onEditOtherStat: (otherStatId: string, updates: Omit<OtherStat, 'id'>) => void;
  onDeleteOtherStat: (otherStatId: string) => void;
  onEquipOtherStat: (otherStatId: string, subSlot: 'base' | 'secondary') => void;
  onUnequipOtherStat: (otherStatId: string) => void;
  onUnequipAllOtherStats: () => void;
  inputs: CalculatorInputs;
  totalValues: Record<string, string>;
  onInputChange: (key: keyof CalculatorInputs, value: number) => void;
  results: CalculationResults;
  onResetDefaults: () => void;
  onResetModifiers: () => void;
  onImportData: () => void;
  onExportData: () => void;
  resonanceActive: boolean;
  onResonanceToggle: () => void;
  onUnequipAll: () => void;
  onMergeStats: () => void;
  onReverseMergeStats: () => void;
  onReorderGears: (reorderedGears: Gear[]) => void;
  onReorderOtherStats: (reorderedOtherStats: OtherStat[]) => void;
  presets: Preset[];
  onSavePreset: (name: string) => void;
  onLoadPreset: (presetId: string) => void;
  onDeletePreset: (presetId: string) => void;
  activePresetId: string | null;
  showDialog: (config: Omit<DialogConfig, 'isOpen'>) => void;
}

const slotLabels: Record<GearSlot, string> = {
  'helmet': 'Helmet',
  'chest': 'Chest',
  'gloves': 'Gloves',
  'pants': 'Pants',
  'boots': 'Boots',
  'seal': 'Seal',
  'talisman': 'Talisman',
  'weapon': 'Weapon',
  'necklace': 'Necklace',
  'bracers': 'Bracers',
  'ring': 'Ring'
};

const statLabels: Record<string, string> = {
  'totalPatk': 'Total ATK',
  'baseAtk': 'Base ATK',
  'atkPercent': 'ATK %',
  'strength': 'Strength',
  'strengthPercent': 'Strength %',
  'damageReduction': 'Damage Reduction %',
  'physicalPen': 'Physical PEN %',
  'pdefShred': 'DEF Shred',
  'skillMultiplier': 'Skill Multiplier %',
  'critDmg': 'Crit DMG %',
  'elementalEnh': 'Elemental ENH',
  'skillDmg': 'Skill DMG %',
  'dmgBonus': 'DMG Bonus %',
  'dmgDuringResonance': 'DMG during Resonance %',
  'dmgToBoss': 'DMG to Bosses %',
  'dmgToBeast': 'DMG to Beast %',
  'dmgToMech': 'DMG to Mech %',
  'dmgToDecayed': 'DMG to Decayed %',
  'dmgToOtherworld': 'DMG to Otherworld %',
  'dmgToDebuffed': 'DMG to Debuffed %',
  'dmgToScorched': 'DMG to Scorched %',
  'dmgToPoisoned': 'DMG to Poisoned %',
  'dmgToBleeding': 'DMG to Bleeding %',
  'dmgToVulnerable': 'DMG to Vulnerable %',
  'dmgToSlowed': 'DMG to Slowed %',
  'dmgToExhausted': 'DMG to Exhausted %',
  'additionalDmg': 'Additional DMG %'
};

const GearManagement: React.FC<GearManagementProps> = ({
  gears,
  equippedGears,
  otherStats,
  equippedOtherStats,
  gearBaseContributions,
  onAddGear,
  onEditGear,
  onDeleteGear,
  onEquipGear,
  onUnequipGear,
  onAddOtherStat,
  onEditOtherStat,
  onDeleteOtherStat,
  onEquipOtherStat,
  onUnequipOtherStat,
  onUnequipAllOtherStats,
  inputs,
  totalValues,
  onInputChange,
  results,
  onResetDefaults,
  onResetModifiers,
  onImportData,
  onExportData,
  resonanceActive,
  onResonanceToggle,
  onUnequipAll,
  onMergeStats,
  onReverseMergeStats,
  onReorderGears,
  onReorderOtherStats,
  presets,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  activePresetId,
  showDialog
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOtherStatModalOpen, setIsOtherStatModalOpen] = useState(false);
  const [isOtherStatListOpen, setIsOtherStatListOpen] = useState(false);
  const [editingGear, setEditingGear] = useState<Gear | null>(null);
  const [editingOtherStat, setEditingOtherStat] = useState<OtherStat | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<GearSlot | null>(null);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [preselectedSlot, setPreselectedSlot] = useState<GearSlot | null>(null);
  const [editingStat, setEditingStat] = useState<string | null>(null);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');

  // Drag-and-drop state for gear items in slot modal
  const [draggedGearId, setDraggedGearId] = useState<string | null>(null);
  const [dragOverGearId, setDragOverGearId] = useState<string | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  // Drag-and-drop state for other stat items
  const [draggedOtherStatId, setDraggedOtherStatId] = useState<string | null>(null);
  const [dragOverOtherStatId, setDragOverOtherStatId] = useState<string | null>(null);
  const dragOtherStatNodeRef = useRef<HTMLDivElement | null>(null);


  const handleAddGearForSlot = (slot: GearSlot) => {
    setEditingGear(null);
    setPreselectedSlot(slot);
    setIsSlotModalOpen(false);
    setIsModalOpen(true);
  };

  const handleSaveGear = (gearData: Omit<Gear, 'id'>) => {
    if (editingGear) {
      onEditGear(editingGear.id, gearData);
    } else {
      onAddGear(gearData);
    }
    setIsModalOpen(false);
    // Re-open the slot selection modal to provide a consistent experience (similar to other stats)
    setSelectedSlot(gearData.slot);
    setIsSlotModalOpen(true);
  };

  const handleSaveOtherStat = (otherStatData: Omit<OtherStat, 'id'>) => {
    if (editingOtherStat) {
      onEditOtherStat(editingOtherStat.id, otherStatData);
    } else {
      onAddOtherStat(otherStatData);
    }
    setIsOtherStatModalOpen(false);
    // Re-open list if we were editing or adding (optional, but good flow)
    setIsOtherStatListOpen(true);
  };

  const handleSlotClick = (slot: GearSlot) => {
    setSelectedSlot(slot);
    setIsSlotModalOpen(true);
  };

  const getEquippedGearForSubSlot = (slot: GearSlot, subSlot: 'base' | 'secondary'): Gear | null => {
    const slotData = equippedGears[slot];
    if (!slotData) return null;
    const gearId = subSlot === 'base' ? slotData.base : slotData.secondary;
    if (!gearId) return null;
    return (gears || []).find(g => g.id === gearId) || null;
  };

  const getGearSubSlot = (gearId: string): 'base' | 'secondary' | null => {
    for (const slot in equippedGears) {
      const slotData = equippedGears[slot as GearSlot];
      if (slotData?.base === gearId) return 'base';
      if (slotData?.secondary === gearId) return 'secondary';
    }
    return null;
  };

  const getGearsForSlot = (slot: GearSlot): Gear[] => {
    return (gears || []).filter((gear: Gear) => gear.slot === slot);
  };

  // Drag-and-drop handlers for gear items
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, gearId: string) => {
    setDraggedGearId(gearId);
    dragNodeRef.current = e.currentTarget as HTMLDivElement;
    e.dataTransfer.effectAllowed = 'move';
    // Make the drag image slightly transparent
    setTimeout(() => {
      if (dragNodeRef.current) {
        dragNodeRef.current.classList.add('dragging');
      }
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, gearId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedGearId && gearId !== draggedGearId) {
      setDragOverGearId(gearId);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, gearId: string) => {
    e.preventDefault();
    if (draggedGearId && gearId !== draggedGearId) {
      setDragOverGearId(gearId);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Only clear if leaving the actual element (not entering a child)
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!e.currentTarget.contains(relatedTarget)) {
      setDragOverGearId(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetGearId: string) => {
    e.preventDefault();
    if (!draggedGearId || draggedGearId === targetGearId) return;

    const allGears = [...(gears || [])];
    const dragIndex = allGears.findIndex(g => g.id === draggedGearId);
    const targetIndex = allGears.findIndex(g => g.id === targetGearId);

    if (dragIndex === -1 || targetIndex === -1) return;

    // Remove dragged item and insert at target position
    const [draggedItem] = allGears.splice(dragIndex, 1);
    allGears.splice(targetIndex, 0, draggedItem);

    onReorderGears(allGears);
    setDraggedGearId(null);
    setDragOverGearId(null);
  };

  const handleDragEnd = () => {
    if (dragNodeRef.current) {
      dragNodeRef.current.classList.remove('dragging');
    }
    setDraggedGearId(null);
    setDragOverGearId(null);
    dragNodeRef.current = null;
  };

  const getBaseDisplayValue = (key: string): string => {
    // Special handling for baseAtk - use calculated value if available
    if (key === 'baseAtk' && totalValues.baseAtk_calculated) {
      return totalValues.baseAtk_calculated;
    }

    // Display value includes gear base contributions (merged into base, no green/red)
    const rawBase = getBaseValue(key);
    const gearBase = gearBaseContributions[key] || 0;
    const baseValue = rawBase + gearBase;
    // Format based on the type of stat
    if (key === 'totalPatk' || key === 'baseAtk' || key === 'strength' || key === 'pdefShred') {
      return baseValue.toLocaleString();
    }
    // Percentage values
    if (key.includes('Percent') || key.includes('Pen') || key === 'damageReduction' ||
      key === 'skillMultiplier' || key === 'critDmg' || key === 'skillDmg' ||
      key === 'dmgBonus' || key.includes('dmgTo') || key === 'dmgDuringResonance') {
      return formatStatValue(baseValue);
    }
    // Default formatting
    return formatStatValue(baseValue);
  };

  const getIncreaseDisplayValue = (key: string): string => {
    const modValue = getDisplayModifierValue(key);
    if (modValue === 0) return '';

    // Format based on the type of stat
    if (key === 'totalPatk' || key === 'baseAtk' || key === 'strength' || key === 'pdefShred') {
      return modValue > 0 ? `+${modValue.toLocaleString()}` : modValue.toLocaleString();
    }
    // Percentage values
    if (key.includes('Percent') || key.includes('Pen') || key === 'damageReduction' ||
      key === 'skillMultiplier' || key === 'critDmg' || key === 'skillDmg' ||
      key === 'dmgBonus' || key.includes('dmgTo') || key === 'dmgDuringResonance') {
      return modValue > 0 ? `+${formatStatValue(modValue)}` : formatStatValue(modValue);
    }
    // Default formatting
    return modValue > 0 ? `+${formatStatValue(modValue)}` : formatStatValue(modValue);
  };

  const handleStatDoubleClick = (statKey: string) => {
    // Close any currently editing stat first
    if (editingStat && editingStat !== statKey) {
      setEditingStat(null);
    }
    setEditingStat(statKey);
  };

  const handleStatValueChange = (statKey: string, value: number) => {
    const baseKey = statKey as keyof CalculatorInputs;
    if (baseKey in inputs) {
      onInputChange(baseKey, value);
    }
  };

  const handleStatModifierChange = (statKey: string, value: number) => {
    const modKey = `${statKey}_mod` as keyof CalculatorInputs;
    if (modKey in inputs) {
      onInputChange(modKey, value);
    }
  };

  const handleStatBlur = (e: React.FocusEvent) => {
    // Use setTimeout to check focus after the blur event completes
    setTimeout(() => {
      const editingItem = e.currentTarget.closest('.stats-display-item');
      if (editingItem) {
        const activeElement = document.activeElement;
        // Only close if focus moved completely outside the editing item
        if (!editingItem.contains(activeElement)) {
          setEditingStat(null);
        }
      }
    }, 100);
  };

  const handleStatInputMouseDown = (e: React.MouseEvent) => {
    // Prevent the blur event from firing when clicking between inputs
    // This allows smooth transition between base and modifier inputs
    e.stopPropagation();
  };

  // Close editing when clicking outside stats area or on another stat
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (editingStat) {
        // Check if clicking on a different stat item (not editing)
        const clickedStatItem = target.closest('.stats-display-item');
        if (clickedStatItem && !clickedStatItem.classList.contains('editing')) {
          setEditingStat(null);
          return;
        }
        // Check if clicking completely outside stats area
        if (!target.closest('.stats-display-item.editing') && !target.closest('.stats-display-container')) {
          setEditingStat(null);
        }
      }
    };

    if (editingStat) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [editingStat]);

  const getBaseValue = (key: string): number => {
    const baseKey = key as keyof CalculatorInputs;
    return inputs[baseKey] || 0;
  };

  // Raw _mod value (used in edit mode inputs)
  const getModifierValue = (key: string): number => {
    const modKey = `${key}_mod` as keyof CalculatorInputs;
    return inputs[modKey] || 0;
  };

  // Display modifier: subtracts base-slot contributions so only delta/secondary shows as green/red
  const getDisplayModifierValue = (key: string): number => {
    const rawMod = getModifierValue(key);
    const baseContrib = gearBaseContributions[key] || 0;
    return rawMod - baseContrib;
  };

  const statsToDisplay = [
    'totalPatk', 'baseAtk', 'atkPercent', 'strength', 'strengthPercent',
    'damageReduction', 'physicalPen', 'pdefShred', 'skillMultiplier',
    'critDmg', 'elementalEnh', 'skillDmg', 'dmgBonus', 'dmgDuringResonance',
    'dmgToBoss', 'dmgToBeast', 'dmgToMech', 'dmgToDecayed', 'dmgToOtherworld',
    'dmgToDebuffed', 'dmgToScorched', 'dmgToPoisoned', 'dmgToBleeding',
    'dmgToVulnerable', 'dmgToSlowed', 'dmgToExhausted', 'additionalDmg'
  ];

  return (
    <>
      <div className="gear-section">

        {/* Slot Overview Grid */}
        <div className="slot-overview">
          <div className="slot-grid">
            {gearSlots.map(slot => {
              const baseGear = getEquippedGearForSubSlot(slot, 'base');
              const secondaryGear = getEquippedGearForSubSlot(slot, 'secondary');
              const hasAnyGear = baseGear || secondaryGear;
              return (
                <div
                  key={slot}
                  className={`slot-item dual-slot ${hasAnyGear ? 'equipped' : 'empty'}`}
                  onClick={() => handleSlotClick(slot)}
                >
                  <div className="slot-icon">
                    {baseGear?.image ? (
                      <img src={baseGear.image} alt={baseGear.name} className="slot-gear-icon" />
                    ) : secondaryGear?.image ? (
                      <img src={secondaryGear.image} alt={secondaryGear.name} className="slot-gear-icon" />
                    ) : (
                      hasAnyGear ? '⚔️' : '📦'
                    )}
                  </div>
                  <div className="slot-info">
                    <div className="slot-name">{slotLabels[slot]}</div>
                    <div className="slot-sub-slots">
                      <div className={`sub-slot-line ${baseGear ? 'filled' : ''}`}>
                        <span className="sub-slot-label">B</span>
                        {baseGear?.image && (
                          <img src={baseGear.image} alt="" className="sub-slot-icon" />
                        )}
                        <span className="sub-slot-gear-name" title={baseGear ? baseGear.name : 'Empty'}>
                          {baseGear ? baseGear.name : 'Empty'}
                        </span>
                        {baseGear && (
                          <button
                            className="sub-slot-reset-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUnequipGear(baseGear.id);
                            }}
                            title="Unequip base gear"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <div className={`sub-slot-line ${secondaryGear ? 'filled' : ''}`}>
                        <span className="sub-slot-label">S</span>
                        {secondaryGear?.image && (
                          <img src={secondaryGear.image} alt="" className="sub-slot-icon" />
                        )}
                        <span className="sub-slot-gear-name" title={secondaryGear ? secondaryGear.name : 'Empty'}>
                          {secondaryGear ? secondaryGear.name : 'Empty'}
                        </span>
                        {secondaryGear && (
                          <button
                            className="sub-slot-reset-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUnequipGear(secondaryGear.id);
                            }}
                            title="Unequip secondary gear"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Other Stats Slot - Special multi-equip slot with dual sub-slots */}
            {(() => {
              const safeOther = (equippedOtherStats && typeof equippedOtherStats === 'object' && !Array.isArray(equippedOtherStats))
                ? equippedOtherStats : { base: [], secondary: [] };
              const baseCount = (safeOther.base || []).length;
              const secCount = (safeOther.secondary || []).length;
              const totalCount = baseCount + secCount;
              return (
                <div
                  className={`slot-item dual-slot other-stat-slot ${totalCount > 0 ? 'equipped' : 'empty'}`}
                  onClick={() => setIsOtherStatListOpen(true)}
                >
                  <div className="slot-info">
                    <div className="slot-name">Other Stats</div>
                    <div className="slot-sub-slots">
                      <div className="sub-slot-line">
                        <span className="sub-slot-label">B</span>
                        <span className="sub-slot-gear-name">
                          {baseCount > 0 ? `${baseCount} Item${baseCount > 1 ? 's' : ''}` : 'Empty'}
                        </span>
                      </div>
                      <div className="sub-slot-line">
                        <span className="sub-slot-label" style={{ background: '#9333ea' }}>S</span>
                        <span className="sub-slot-gear-name">
                          {secCount > 0 ? `${secCount} Item${secCount > 1 ? 's' : ''}` : 'Empty'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="slot-indicator">
                    {totalCount > 0 && (
                      <div className="slot-indicator-wrapper">
                        <span className="slot-check-icon">✓</span>
                        <button
                          className="slot-reset-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUnequipAllOtherStats();
                          }}
                          title="Unequip all other stats"
                        >
                          ↺
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Stats Display - Center Column */}
            <div className="stats-display-container">
              <div className="stats-display-header">
                <div className="button-group compact-buttons">
                  <button onClick={onResetDefaults}>Reset to Defaults</button>
                  <button className="reset-mod-btn" onClick={onResetModifiers}>Reset Increase</button>
                  <button className="merge-btn" onClick={onMergeStats}>Merge Increase</button>
                  <button className="reverse-merge-btn" onClick={onReverseMergeStats}>Reverse Merge</button>
                  <button className="unequip-all-btn" onClick={onUnequipAll}>Unequip All</button>
                  <button className="preset-btn" onClick={() => setIsPresetModalOpen(true)}>Presets</button>
                  <button className="import-btn" onClick={onImportData}>Import</button>
                  <button className="export-btn" onClick={onExportData}>Export</button>
                </div>
                <div className="actual-attack-header">
                  <h3>Actual Attack</h3>
                  <div className="actual-attack-value">{Math.round(results.actualAttack).toLocaleString()}</div>
                  <div className="actual-attack-formula">= Total ATK × (1 - Damage Reduction %) + DEF Shred</div>
                </div>
              </div>
              <div className="stats-display-content">
                {statsToDisplay.map(statKey => {
                  const isEditing = editingStat === statKey;
                  const baseValue = getBaseValue(statKey);
                  const modValue = getModifierValue(statKey); // raw _mod for edit inputs
                  const displayModValue = getDisplayModifierValue(statKey); // adjusted for display
                  const hasModifier = displayModValue !== 0;
                  const isNegative = displayModValue < 0;

                  const baseDisplay = getBaseDisplayValue(statKey);
                  const increaseDisplay = getIncreaseDisplayValue(statKey);

                  // Special handling for baseAtk - show calculated value
                  const showCalculatedBaseAtk = statKey === 'baseAtk' && totalValues.baseAtk_calculated;

                  return (
                    <div
                      key={statKey}
                      className={`stats-display-item ${hasModifier ? 'has-modifier' : ''} ${isEditing ? 'editing' : ''} ${isNegative ? 'has-negative' : ''}`}
                      onDoubleClick={() => handleStatDoubleClick(statKey)}
                      title="Double-click to edit"
                    >
                      <div className="stats-display-row">
                        <span className="stats-display-label">
                          {statLabels[statKey] || statKey}:
                          {statKey === 'dmgDuringResonance' && (
                            <button
                              type="button"
                              className={`resonance-toggle ${resonanceActive ? 'active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onResonanceToggle();
                              }}
                              title={resonanceActive ? 'Resonance Active - Click to disable' : 'Resonance Inactive - Click to enable'}
                            >
                              {resonanceActive ? 'ON' : 'OFF'}
                            </button>
                          )}
                        </span>
                        {isEditing ? (
                          <div className="stats-edit-inputs" onMouseDown={handleStatInputMouseDown} onDoubleClick={(e) => e.stopPropagation()}>
                            {showCalculatedBaseAtk ? (
                              <>
                                <div className="stats-calculated-value">
                                  {totalValues.baseAtk_calculated || '0.00'}
                                </div>
                                <span className="modifier-label">+</span>
                                <input
                                  type="number"
                                  className="stats-modifier-input"
                                  value={modValue === 0 ? '' : modValue}
                                  onChange={(e) => handleStatModifierChange(statKey, parseFloat(e.target.value) || 0)}
                                  onBlur={handleStatBlur}
                                  onFocus={(e) => e.target.select()}
                                  onWheel={(e) => e.currentTarget.blur()}
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder="0"
                                  autoFocus
                                />
                              </>
                            ) : statKey === 'totalPatk' ? (
                              <input
                                type="number"
                                className="stats-value-input"
                                value={baseValue === 0 ? '' : baseValue}
                                onChange={(e) => handleStatValueChange(statKey, parseFloat(e.target.value) || 0)}
                                onBlur={handleStatBlur}
                                onFocus={(e) => e.target.select()}
                                onWheel={(e) => e.currentTarget.blur()}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="0"
                                autoFocus
                              />
                            ) : (
                              <>
                                <input
                                  type="number"
                                  className="stats-value-input"
                                  value={baseValue === 0 ? '' : baseValue}
                                  onChange={(e) => handleStatValueChange(statKey, parseFloat(e.target.value) || 0)}
                                  onBlur={handleStatBlur}
                                  onFocus={(e) => e.target.select()}
                                  onWheel={(e) => e.currentTarget.blur()}
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder="0"
                                  autoFocus
                                />
                                <span className="modifier-label">+</span>
                                <input
                                  type="number"
                                  className="stats-modifier-input"
                                  value={modValue === 0 ? '' : modValue}
                                  onChange={(e) => handleStatModifierChange(statKey, parseFloat(e.target.value) || 0)}
                                  onBlur={handleStatBlur}
                                  onFocus={(e) => e.target.select()}
                                  onWheel={(e) => e.currentTarget.blur()}
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder="0"
                                />
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="stats-display-values">
                            <span className="stats-display-value">{baseDisplay}</span>
                            {hasModifier && (
                              <span className={`stats-display-increase ${isNegative ? 'negative' : 'positive'}`}>
                                {increaseDisplay}
                              </span>
                            )}
                            {totalValues[`${statKey}_total`] && (
                              <span className="stats-total-value">{totalValues[`${statKey}_total`]}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Gear Creation Modal */}
      <GearModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPreselectedSlot(null);
          if (selectedSlot) {
            setIsSlotModalOpen(true);
          }
        }}
        onSave={(gearData) => {
          handleSaveGear(gearData);
          setPreselectedSlot(null);
        }}
        editingGear={editingGear}
        preselectedSlot={preselectedSlot}
      />

      {/* Other Stat List Modal */}
      <div className={`modal ${isOtherStatListOpen ? 'active' : ''}`}>
        <div className="modal-content slot-modal">
          <div className="modal-header">
            <h2>Other Stats - Available</h2>
            <button className="close-modal" onClick={() => setIsOtherStatListOpen(false)}>&times;</button>
          </div>
          <div className="slot-gears-list">
            {(!Array.isArray(otherStats) || otherStats.length === 0) ? (
              <div className="no-slot-gears">
                No items created yet for Other Stats.
              </div>
            ) : (
              <>
                {(Array.isArray(otherStats) ? otherStats : []).map(otherStat => {
                  const safeOther = (equippedOtherStats && typeof equippedOtherStats === 'object' && !Array.isArray(equippedOtherStats))
                    ? equippedOtherStats : { base: [], secondary: [] };
                  const isInBase = (safeOther.base || []).includes(otherStat.id);
                  const isInSecondary = (safeOther.secondary || []).includes(otherStat.id);
                  const isEquipped = isInBase || isInSecondary;
                  const statsList = Object.entries(otherStat.stats)
                    .filter(([, value]) => value !== 0)
                    .map(([stat, value]) => (
                      <div key={stat} className="gear-stat-item">
                        <span className="gear-stat-bullet">✦</span>
                        <span className="gear-stat-label">{statLabels[stat] || stat}:</span>
                        <span className={`gear-stat-value ${value! > 0 ? 'positive' : value! < 0 ? 'negative' : ''}`}>
                          {value! > 0 ? '+' : ''}{formatStatValue(value!)}
                        </span>
                      </div>
                    ));

                  return (
                    <div
                      key={otherStat.id}
                      className={`slot-gear-item ${isEquipped ? 'equipped' : ''} ${draggedOtherStatId === otherStat.id ? 'dragging' : ''} ${dragOverOtherStatId === otherStat.id ? 'drag-over' : ''}`}
                      style={{ position: 'relative' }}
                      draggable
                      onDragStart={(e) => {
                        setDraggedOtherStatId(otherStat.id);
                        dragOtherStatNodeRef.current = e.currentTarget as HTMLDivElement;
                        e.dataTransfer.effectAllowed = 'move';
                        setTimeout(() => {
                          if (dragOtherStatNodeRef.current) {
                            dragOtherStatNodeRef.current.classList.add('dragging');
                          }
                        }, 0);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (draggedOtherStatId && otherStat.id !== draggedOtherStatId) {
                          setDragOverOtherStatId(otherStat.id);
                        }
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        if (draggedOtherStatId && otherStat.id !== draggedOtherStatId) {
                          setDragOverOtherStatId(otherStat.id);
                        }
                      }}
                      onDragLeave={(e) => {
                        const relatedTarget = e.relatedTarget as HTMLElement;
                        if (!e.currentTarget.contains(relatedTarget)) {
                          setDragOverOtherStatId(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (!draggedOtherStatId || draggedOtherStatId === otherStat.id) return;
                        const all = [...(otherStats || [])];
                        const dragIdx = all.findIndex(s => s.id === draggedOtherStatId);
                        const targetIdx = all.findIndex(s => s.id === otherStat.id);
                        if (dragIdx === -1 || targetIdx === -1) return;
                        const [dragged] = all.splice(dragIdx, 1);
                        all.splice(targetIdx, 0, dragged);
                        onReorderOtherStats(all);
                        setDraggedOtherStatId(null);
                        setDragOverOtherStatId(null);
                      }}
                      onDragEnd={() => {
                        if (dragOtherStatNodeRef.current) {
                          dragOtherStatNodeRef.current.classList.remove('dragging');
                        }
                        setDraggedOtherStatId(null);
                        setDragOverOtherStatId(null);
                        dragOtherStatNodeRef.current = null;
                      }}
                    >
                      <div className="drag-handle" title="Drag to reorder">
                        <FaGripVertical size={14} />
                      </div>
                      <div className="item-actions-top">
                        <button
                          className="minimal-action-btn edit"
                          title="Edit Item"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingOtherStat(otherStat);
                            setIsOtherStatListOpen(false);
                            setIsOtherStatModalOpen(true);
                          }}
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          className="minimal-action-btn delete"
                          title="Delete Item"
                          onClick={(e) => {
                            e.stopPropagation();
                            showDialog({
                              title: 'Delete Other Stat Item',
                              message: `Are you sure you want to delete ${otherStat.name}?`,
                              type: 'danger',
                              confirmText: 'Delete',
                              onConfirm: () => onDeleteOtherStat(otherStat.id)
                            });
                          }}
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                      <div className="slot-gear-header">
                        <span className="slot-gear-name">{otherStat.name}</span>
                        {isInBase && <span className="slot-equipped-badge" style={{ background: '#0891b2' }}>BASE</span>}
                        {isInSecondary && <span className="slot-equipped-badge" style={{ background: '#9333ea' }}>SECONDARY</span>}
                      </div>
                      {/* Hover overlay: stats + actions */}
                      <div className="slot-gear-hover-content">
                        <div className="slot-gear-stats-hover">
                          {statsList.length > 0 ? statsList : (
                            <div className="gear-stat-item">No stats added</div>
                          )}
                        </div>
                        <div className="slot-gear-actions">
                          {otherStat.isSetEffect ? (
                            <div className="set-effect-auto-badge">SET EFFECT (AUTO)</div>
                          ) : isEquipped ? (
                            <button
                              className="slot-gear-btn unequip-btn"
                              onClick={() => onUnequipOtherStat(otherStat.id)}
                            >
                              Unequip ({isInBase ? 'Base' : 'Secondary'})
                            </button>
                          ) : (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                className="slot-gear-btn equip-base-btn"
                                onClick={() => onEquipOtherStat(otherStat.id, 'base')}
                              >
                                Equip Base
                              </button>
                              <button
                                className="slot-gear-btn equip-secondary-btn"
                                onClick={() => onEquipOtherStat(otherStat.id, 'secondary')}
                              >
                                Equip Secondary
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
          <div className="modal-actions">
            <button
              className="create-gear-btn"
              style={{ width: '100%', marginTop: 0 }}
              onClick={() => {
                setEditingOtherStat(null);
                setIsOtherStatListOpen(false);
                setIsOtherStatModalOpen(true);
              }}
            >
              + Create New Other Stat Item
            </button>
          </div>
        </div>
      </div>

      {/* Other Stat Creation/Edit Modal */}
      <OtherStatModal
        isOpen={isOtherStatModalOpen}
        onClose={() => {
          setIsOtherStatModalOpen(false);
          setIsOtherStatListOpen(true); // Re-open list when closing modal
        }}
        onSave={handleSaveOtherStat}
        editingOtherStat={editingOtherStat}
        gears={gears}
      />

      {/* Slot Selection Modal - Dual Slot System */}
      {selectedSlot && (
        <div className={`modal ${isSlotModalOpen ? 'active' : ''}`}>
          <div className="modal-content slot-modal">
            <div className="modal-header">
              <h2>{slotLabels[selectedSlot]} - Gear Slots</h2>
              <button className="close-modal" onClick={() => setIsSlotModalOpen(false)}>&times;</button>
            </div>

            {/* Dual Slot Overview */}
            <div className="dual-slot-overview">
              <div className={`dual-slot-section ${getEquippedGearForSubSlot(selectedSlot, 'base') ? 'filled' : ''}`}>
                <div className="dual-slot-title">Base Slot</div>
                <div className="dual-slot-description">Contributes base stats only</div>
                <div className="dual-slot-info">
                  {getEquippedGearForSubSlot(selectedSlot, 'base')
                    ? getEquippedGearForSubSlot(selectedSlot, 'base')!.name
                    : 'Empty'}
                </div>
              </div>
              <div className={`dual-slot-section ${getEquippedGearForSubSlot(selectedSlot, 'secondary') ? 'filled' : ''}`}>
                <div className="dual-slot-title">Secondary Slot</div>
                <div className="dual-slot-description">Delta (S - B) = Modifier</div>
                <div className="dual-slot-info">
                  {getEquippedGearForSubSlot(selectedSlot, 'secondary')
                    ? getEquippedGearForSubSlot(selectedSlot, 'secondary')!.name
                    : 'Empty'}
                </div>
              </div>
            </div>

            <div className="slot-gears-list">
              {getGearsForSlot(selectedSlot).length === 0 ? (
                <div className="no-slot-gears">
                  No {slotLabels[selectedSlot].toLowerCase()} gears created yet.
                </div>
              ) : (
                <>
                  {getGearsForSlot(selectedSlot).map(gear => {
                    const subSlot = getGearSubSlot(gear.id);
                    const isEquipped = subSlot !== null;
                    const statsList = Object.entries(gear.stats)
                      .filter(([, value]) => value !== 0)
                      .map(([stat, value]) => (
                        <div key={stat} className="gear-stat-item">
                          <span className="gear-stat-bullet">✦</span>
                          <span className="gear-stat-label">{statLabels[stat] || stat}:</span>
                          <span className={`gear-stat-value ${value! > 0 ? 'positive' : value! < 0 ? 'negative' : ''}`}>
                            {value! > 0 ? '+' : ''}{formatStatValue(value!)}
                          </span>
                        </div>
                      ));

                    return (
                      <div
                        key={gear.id}
                        className={`slot-gear-item ${isEquipped ? 'equipped' : ''} ${draggedGearId === gear.id ? 'dragging' : ''} ${dragOverGearId === gear.id ? 'drag-over' : ''}`}
                        style={{ position: 'relative' }}
                        draggable
                        onDragStart={(e) => handleDragStart(e, gear.id)}
                        onDragOver={(e) => handleDragOver(e, gear.id)}
                        onDragEnter={(e) => handleDragEnter(e, gear.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, gear.id)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="drag-handle" title="Drag to reorder">
                          <FaGripVertical size={14} />
                        </div>
                        <div className="item-actions-top">
                          <button
                            className="minimal-action-btn edit"
                            title="Edit Gear"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingGear(gear);
                              setPreselectedSlot(null);
                              setIsSlotModalOpen(false);
                              setIsModalOpen(true);
                            }}
                          >
                            <FaEdit size={14} />
                          </button>
                          <button
                            className="minimal-action-btn delete"
                            title="Delete Gear"
                            onClick={(e) => {
                              e.stopPropagation();
                              showDialog({
                                title: 'Delete Gear',
                                message: `Are you sure you want to delete ${gear.name}?`,
                                type: 'danger',
                                confirmText: 'Delete',
                                onConfirm: () => onDeleteGear(gear.id)
                              });
                            }}
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                        {/* Compact: icon + name */}
                        <div className="slot-gear-header">
                          {gear.image && (
                            <img src={gear.image} alt="" className="slot-gear-item-icon" />
                          )}
                          <span className="slot-gear-name">{gear.name}</span>
                          {isEquipped && (
                            <span className="slot-equipped-badge">
                              {subSlot === 'base' ? 'BASE' : 'SECONDARY'}
                            </span>
                          )}
                        </div>
                        {/* Hover overlay: stats + actions */}
                        <div className="slot-gear-hover-content">
                          <div className="slot-gear-stats-hover">
                            {statsList.length > 0 ? statsList : (
                              <div className="gear-stat-item">No stats added</div>
                            )}
                          </div>
                          <div className="slot-gear-actions dual-slot-actions">
                            {isEquipped ? (
                              <button
                                className="slot-gear-btn unequip-btn"
                                onClick={() => onUnequipGear(gear.id)}
                              >
                                Unequip ({subSlot === 'base' ? 'Base' : 'Secondary'})
                              </button>
                            ) : (
                              <>
                                <button
                                  className="slot-gear-btn equip-base-btn"
                                  onClick={() => onEquipGear(gear.id, 'base')}
                                >
                                  Equip Base
                                </button>
                                <button
                                  className="slot-gear-btn equip-secondary-btn"
                                  onClick={() => onEquipGear(gear.id, 'secondary')}
                                >
                                  Equip Secondary
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
            <div className="modal-actions">
              <button
                className="create-gear-btn"
                style={{ width: '100%', marginTop: 0 }}
                onClick={() => handleAddGearForSlot(selectedSlot)}
              >
                + Create New {slotLabels[selectedSlot]}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Preset Modal */}
      <div className={`modal ${isPresetModalOpen ? 'active' : ''}`}>
        <div className="modal-content preset-modal">
          <div className="modal-header">
            <h2>Presets & Configurations</h2>
            <button className="close-modal" onClick={() => setIsPresetModalOpen(false)}>&times;</button>
          </div>

          <div className="preset-save-section">
            <input
              type="text"
              placeholder="New Preset Name..."
              value={presetNameInput}
              onChange={(e) => setPresetNameInput(e.target.value)}
            />
            <button
              className="create-gear-btn"
              style={{ marginTop: 0 }}
              onClick={() => {
                if (presetNameInput.trim()) {
                  onSavePreset(presetNameInput.trim());
                  setPresetNameInput('');
                } else {
                  alert('Please enter a name for the preset');
                }
              }}
            >
              Save Current State
            </button>
          </div>

          <div className="slot-gears-list">
            {(!Array.isArray(presets) || presets.length === 0) ? (
              <div className="no-slot-gears">No presets saved yet.</div>
            ) : (
              (Array.isArray(presets) ? presets : []).map(preset => {
                const isActive = activePresetId === preset.id;
                return (
                  <div key={preset.id} className={`slot-gear-item preset-item ${isActive ? 'active' : ''}`}>
                    <div className="item-actions-top">
                      <button
                        className="minimal-action-btn delete"
                        onClick={() => onDeletePreset(preset.id)}
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                    <div className="slot-gear-header">
                      <span className="slot-gear-name">{preset.name}</span>
                      {isActive && <span className="preset-badge-loaded">Loaded</span>}
                    </div>
                    <div className="slot-gear-stats">
                      <div className="gear-stat-item">
                        • {Array.isArray(preset.equippedGears)
                          ? (preset.equippedGears as unknown as string[]).length
                          : countEquippedGears(preset.equippedGears)} Gears Equipped
                      </div>
                      <div className="gear-stat-item">
                        • {(() => {
                          const raw = preset.equippedOtherStats || (preset as any).equippedCircuits || { base: [], secondary: [] };
                          if (Array.isArray(raw)) return raw.length;
                          return (raw.base || []).length + (raw.secondary || []).length;
                        })()} Other Stats Equipped
                      </div>
                    </div>
                    <div className="slot-gear-actions">
                      <button
                        className={`slot-gear-btn ${isActive ? 'unequip-btn' : 'equip-btn'}`}
                        style={{ width: '100%' }}
                        disabled={isActive}
                        onClick={() => {
                          onLoadPreset(preset.id);
                          setIsPresetModalOpen(false);
                        }}
                      >
                        {isActive ? 'Currently Active' : 'Load Preset'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default GearManagement;
