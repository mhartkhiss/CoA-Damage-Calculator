import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import type { Gear, GearSlot, CalculatorInputs, CalculationResults, OtherStat, Preset, DialogConfig } from '../types';

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
  equippedGears: string[];
  otherStats: OtherStat[];
  equippedOtherStats: string[];
  onAddGear: (gear: Omit<Gear, 'id'>) => void;
  onEditGear: (gearId: string, updates: Omit<Gear, 'id'>) => void;
  onDeleteGear: (gearId: string) => void;
  onEquipGear: (gearId: string) => void;
  onUnequipGear: (gearId: string) => void;
  onAddOtherStat: (otherStat: Omit<OtherStat, 'id'>) => void;
  onEditOtherStat: (otherStatId: string, updates: Omit<OtherStat, 'id'>) => void;
  onDeleteOtherStat: (otherStatId: string) => void;
  onEquipOtherStat: (otherStatId: string) => void;
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
  'dmgToExhausted': 'DMG to Exhausted %'
};

const GearManagement: React.FC<GearManagementProps> = ({
  gears,
  equippedGears,
  otherStats,
  equippedOtherStats,
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

  const getEquippedGearForSlot = (slot: GearSlot): Gear | null => {
    const gearsToSearch = Array.isArray(equippedGears) ? equippedGears : [];
    const equippedGearId = gearsToSearch.find((gearId: string) => {
      const gear = (gears || []).find(g => g.id === gearId);
      return gear && gear.slot === slot;
    });
    return equippedGearId ? (gears || []).find(g => g.id === equippedGearId) || null : null;
  };

  const getGearsForSlot = (slot: GearSlot): Gear[] => {
    return (gears || []).filter((gear: Gear) => gear.slot === slot);
  };

  const getBaseDisplayValue = (key: string): string => {
    // Special handling for baseAtk - use calculated value if available
    if (key === 'baseAtk' && totalValues.baseAtk_calculated) {
      return totalValues.baseAtk_calculated;
    }

    const baseValue = getBaseValue(key);
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
    const modValue = getModifierValue(key);
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

  const getModifierValue = (key: string): number => {
    const modKey = `${key}_mod` as keyof CalculatorInputs;
    return inputs[modKey] || 0;
  };

  const statsToDisplay = [
    'totalPatk', 'baseAtk', 'atkPercent', 'strength', 'strengthPercent',
    'damageReduction', 'physicalPen', 'pdefShred', 'skillMultiplier',
    'critDmg', 'elementalEnh', 'skillDmg', 'dmgBonus', 'dmgDuringResonance',
    'dmgToBoss', 'dmgToBeast', 'dmgToMech', 'dmgToDecayed', 'dmgToOtherworld',
    'dmgToDebuffed', 'dmgToScorched', 'dmgToPoisoned', 'dmgToBleeding',
    'dmgToVulnerable', 'dmgToSlowed', 'dmgToExhausted'
  ];

  return (
    <>
      <div className="gear-section">
        <div className="gear-header">
          <div className="button-group">
            <button onClick={onResetDefaults}>Reset to Defaults</button>
            <button className="reset-mod-btn" onClick={onResetModifiers}>Reset Increase</button>
            <button className="merge-btn" onClick={onMergeStats}>Merge Increase</button>
            <button className="reverse-merge-btn" onClick={onReverseMergeStats}>Reverse Merge</button>
            <button className="unequip-all-btn" onClick={onUnequipAll}>Unequip All</button>
            <button className="preset-btn" onClick={() => setIsPresetModalOpen(true)}>Presets</button>
            <button className="import-btn" onClick={onImportData}>Import</button>
            <button className="export-btn" onClick={onExportData}>Export</button>
          </div>
        </div>

        {/* Slot Overview Grid */}
        <div className="slot-overview">
          <div className="slot-grid">
            {gearSlots.map(slot => {
              const equippedGear = getEquippedGearForSlot(slot);
              return (
                <div
                  key={slot}
                  className={`slot-item ${equippedGear ? 'equipped' : 'empty'}`}
                  onClick={() => handleSlotClick(slot)}
                >
                  <div className="slot-icon">
                    {equippedGear ? '⚔️' : '📦'}
                  </div>
                  <div className="slot-info">
                    <div className="slot-name">{slotLabels[slot]}</div>
                    <div className="slot-gear-name">
                      {equippedGear ? equippedGear.name : 'Empty'}
                    </div>
                  </div>
                  <div className="slot-indicator">
                    {equippedGear ? (
                      <div className="slot-indicator-wrapper">
                        <span className="slot-check-icon">✓</span>
                        <button
                          className="slot-reset-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUnequipGear(equippedGear.id);
                          }}
                          title="Unequip gear"
                        >
                          ↺
                        </button>
                      </div>
                    ) : (
                      <div className="slot-indicator-wrapper">
                        <span className="slot-plus">+</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Other Stats Slot - Special multi-equip slot */}
            <div
              className={`slot-item other-stat-slot ${Array.isArray(equippedOtherStats) && equippedOtherStats.length > 0 ? 'equipped' : 'empty'}`}
              onClick={() => setIsOtherStatListOpen(true)}
            >
              <div className="slot-icon">
                {Array.isArray(equippedOtherStats) && equippedOtherStats.length > 0 ? '💠' : '➕'}
              </div>
              <div className="slot-info">
                <div className="slot-name">Other Stats</div>
                <div className="slot-gear-name">
                  {Array.isArray(equippedOtherStats) && equippedOtherStats.length > 0
                    ? `${equippedOtherStats.length} Item${equippedOtherStats.length > 1 ? 's' : ''} Equipped`
                    : 'Empty'}
                </div>
              </div>
              <div className="slot-indicator">
                {Array.isArray(equippedOtherStats) && equippedOtherStats.length > 0 && (
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

            {/* Stats Display - Center Column */}
            <div className="stats-display-container">
              <div className="stats-display-header">
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
                  const modValue = getModifierValue(statKey);
                  const hasModifier = modValue !== 0;
                  const isNegative = modValue < 0;

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
                  const isEquipped = Array.isArray(equippedOtherStats) && equippedOtherStats.includes(otherStat.id);
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
                    <div key={otherStat.id} className={`slot-gear-item ${isEquipped ? 'equipped' : ''}`} style={{ position: 'relative' }}>
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
                        {isEquipped && <span className="slot-equipped-badge">EQUIPPED</span>}
                      </div>
                      <div className="slot-gear-stats">
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
                            Unequip
                          </button>
                        ) : (
                          <button
                            className="slot-gear-btn equip-btn"
                            onClick={() => onEquipOtherStat(otherStat.id)}
                          >
                            Equip
                          </button>
                        )}
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

      {/* Slot Selection Modal */}
      {selectedSlot && (
        <div className={`modal ${isSlotModalOpen ? 'active' : ''}`}>
          <div className="modal-content slot-modal">
            <div className="modal-header">
              <h2>{slotLabels[selectedSlot]} - Available Gears</h2>
              <button className="close-modal" onClick={() => setIsSlotModalOpen(false)}>&times;</button>
            </div>
            <div className="slot-gears-list">
              {getGearsForSlot(selectedSlot).length === 0 ? (
                <div className="no-slot-gears">
                  No {slotLabels[selectedSlot].toLowerCase()} gears created yet.
                </div>
              ) : (
                <>
                  {getGearsForSlot(selectedSlot).map(gear => {
                    const isEquipped = equippedGears.includes(gear.id);
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
                      <div key={gear.id} className={`slot-gear-item ${isEquipped ? 'equipped' : ''}`} style={{ position: 'relative' }}>
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
                        <div className="slot-gear-header">
                          <span className="slot-gear-name">{gear.name}</span>
                          {isEquipped && <span className="slot-equipped-badge">EQUIPPED</span>}
                        </div>
                        <div className="slot-gear-stats">
                          {statsList.length > 0 ? statsList : (
                            <div className="gear-stat-item">No stats added</div>
                          )}
                        </div>
                        <div className="slot-gear-actions">
                          {isEquipped ? (
                            <button
                              className="slot-gear-btn unequip-btn"
                              onClick={() => onUnequipGear(gear.id)}
                            >
                              Unequip
                            </button>
                          ) : (
                            <button
                              className="slot-gear-btn equip-btn"
                              onClick={() => onEquipGear(gear.id)}
                            >
                              Equip
                            </button>
                          )}
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
                        • {preset.equippedGears.length} Gears Equipped
                      </div>
                      <div className="gear-stat-item">
                        • {(preset.equippedOtherStats || (preset as any).equippedCircuits || []).length} Other Stats Equipped
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
