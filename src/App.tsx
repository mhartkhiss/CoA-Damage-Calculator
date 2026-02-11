import { useEffect } from 'react';


import './DamageCalculator.css';
import GearManagement from './components/GearManagement';
import StickyFooter from './components/StickyFooter';
import CustomDialog from './components/CustomDialog';
import type { CalculatorInputs, Gear, OtherStat, Preset, DialogConfig } from './types';

import { useDamageCalculator } from './hooks/useDamageCalculator';
import { useLocalStorage, useLocalStorageInputs } from './hooks/useLocalStorage';

const defaultInputs: CalculatorInputs = {
  // Base values
  totalPatk: 1000,
  baseAtk: 0,
  atkPercent: 0,
  strength: 0,
  strengthPercent: 0,
  damageReduction: 0,
  physicalPen: 0,
  pdefShred: 0,
  skillMultiplier: 100,
  critDmg: 150,
  elementalEnh: 0,
  skillDmg: 0,
  dmgBonus: 0,
  dmgDuringResonance: 0,
  dmgToBoss: 0,
  dmgToBeast: 0,
  dmgToMech: 0,
  dmgToDecayed: 0,
  dmgToOtherworld: 0,
  dmgToDebuffed: 0,
  dmgToScorched: 0,
  dmgToPoisoned: 0,
  dmgToBleeding: 0,
  dmgToVulnerable: 0,
  dmgToSlowed: 0,
  dmgToExhausted: 0,

  // Modifiers
  baseAtk_mod: 0,
  atkPercent_mod: 0,
  strength_mod: 0,
  strengthPercent_mod: 0,
  damageReduction_mod: 0,
  physicalPen_mod: 0,
  pdefShred_mod: 0,
  skillMultiplier_mod: 0,
  critDmg_mod: 0,
  elementalEnh_mod: 0,
  skillDmg_mod: 0,
  dmgBonus_mod: 0,
  dmgDuringResonance_mod: 0,
  dmgToBoss_mod: 0,
  dmgToBeast_mod: 0,
  dmgToMech_mod: 0,
  dmgToDecayed_mod: 0,
  dmgToOtherworld_mod: 0,
  dmgToDebuffed_mod: 0,
  dmgToScorched_mod: 0,
  dmgToPoisoned_mod: 0,
  dmgToBleeding_mod: 0,
  dmgToVulnerable_mod: 0,
  dmgToSlowed_mod: 0,
  dmgToExhausted_mod: 0,
};

const inputKeys = Object.keys(defaultInputs) as (keyof CalculatorInputs)[];

function App() {
  const [inputs, updateInput, setInputs] = useLocalStorageInputs(inputKeys, defaultInputs);
  const [dialog, setDialog] = useLocalStorage<DialogConfig>('dialog', {
    isOpen: false,
    title: '',
    message: '',
    type: 'alert'
  });

  const [resonanceActive, setResonanceActive] = useLocalStorage('resonanceActive', false);
  const [gears, setGears] = useLocalStorage<Gear[]>('gears', []);
  const [equippedGears, setEquippedGears] = useLocalStorage<string[]>('equippedGears', []);
  const [otherStats, setOtherStats] = useLocalStorage<OtherStat[]>('otherStats', []);
  const [equippedOtherStats, setEquippedOtherStats] = useLocalStorage<string[]>('equippedOtherStats', []);
  const [presets, setPresets] = useLocalStorage<Preset[]>('presets', []);
  const [activePresetId, setActivePresetId] = useLocalStorage<string | null>('activePresetId', null);

  const showDialog = (config: Omit<DialogConfig, 'isOpen'>) => {
    setDialog({ ...config, isOpen: true });
  };

  const closeDialog = () => {
    setDialog(prev => ({ ...prev, isOpen: false }));
  };

  // Safety check for localStorage corruption
  useEffect(() => {
    if (!Array.isArray(gears)) setGears([]);
    if (!Array.isArray(equippedGears)) setEquippedGears([]);
    if (!Array.isArray(otherStats)) setOtherStats([]);
    if (!Array.isArray(equippedOtherStats)) setEquippedOtherStats([]);
    if (!Array.isArray(presets)) setPresets([]);
  }, []);


  const { results, totalValues } = useDamageCalculator(inputs, resonanceActive);

  // Update actual attack display
  useEffect(() => {
    const actualAttackElement = document.getElementById('actualAttack');
    if (actualAttackElement) {
      actualAttackElement.textContent = Math.round(results.actualAttack).toLocaleString();
    }
  }, [results.actualAttack]);

  // Auto-equip set effects
  useEffect(() => {
    const validOtherStats = Array.isArray(otherStats) ? otherStats : [];
    const validEquippedGears = Array.isArray(equippedGears) ? equippedGears : [];
    const validEquippedOtherStats = Array.isArray(equippedOtherStats) ? equippedOtherStats : [];

    const setEffectStats = validOtherStats.filter(stat => stat.isSetEffect && stat.requiredGearIds && Array.isArray(stat.requiredGearIds) && stat.requiredGearIds.length > 0);
    if (setEffectStats.length === 0) return;

    let modified = false;
    const newEquippedOtherStats = [...validEquippedOtherStats];

    setEffectStats.forEach(stat => {
      const allRequiredEquipped = stat.requiredGearIds!.every(id => validEquippedGears.includes(id));
      const isCurrentlyEquipped = newEquippedOtherStats.includes(stat.id);

      if (allRequiredEquipped && !isCurrentlyEquipped) {
        newEquippedOtherStats.push(stat.id);
        modified = true;
      } else if (!allRequiredEquipped && isCurrentlyEquipped) {
        const index = newEquippedOtherStats.indexOf(stat.id);
        if (index > -1) {
          newEquippedOtherStats.splice(index, 1);
          modified = true;
        }
      }
    });

    if (modified) {
      setEquippedOtherStats(newEquippedOtherStats);
    }
  }, [equippedGears, otherStats, equippedOtherStats, setEquippedOtherStats]);

  const handleInputChange = (key: keyof CalculatorInputs, value: number) => {
    updateInput(key, value);
    setActivePresetId(null); // Any manual input change invalidates the active preset
  };

  const handleResonanceToggle = () => {
    setResonanceActive(!resonanceActive);
    setActivePresetId(null); // Toggling resonance invalidates the active preset
  };

  const handleResetDefaults = () => {
    showDialog({
      title: 'Reset to Defaults',
      message: 'Are you sure you want to reset all values and resonance to defaults?',
      type: 'danger',
      confirmText: 'Reset All',
      onConfirm: () => {
        Object.keys(defaultInputs).forEach(key => {
          updateInput(key as keyof CalculatorInputs, defaultInputs[key as keyof CalculatorInputs]);
        });
        setResonanceActive(false);
        setActivePresetId(null);
      }
    });
  };

  const handleResetModifiers = () => {
    const modifierKeys = inputKeys.filter(key => key.endsWith('_mod'));
    modifierKeys.forEach(key => {
      updateInput(key, 0);
    });
    setActivePresetId(null); // Resetting modifiers invalidates the active preset
  };

  const handleExportData = () => {
    const exportData = {
      version: '1.2', // Bump version for other stats rename
      exportDate: new Date().toISOString(),
      calculatorInputs: inputs,
      resonanceActive,
      gears,
      equippedGears,
      otherStats,
      equippedOtherStats
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `coa - damage - calculator -export -${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      showDialog({
        title: 'Import Data',
        message: 'Importing data will replace all current values and gears. Continue?',
        type: 'danger',
        confirmText: 'Import & Replace',
        onConfirm: () => {
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const importedData = JSON.parse(event.target?.result as string);

              // Import calculator inputs
              if (importedData.calculatorInputs) {
                Object.keys(importedData.calculatorInputs).forEach(key => {
                  if (key in inputs) {
                    updateInput(key as keyof CalculatorInputs, importedData.calculatorInputs[key]);
                  }
                });
              }

              // Import resonance state
              if (typeof importedData.resonanceActive === 'boolean') {
                setResonanceActive(importedData.resonanceActive);
              }

              // Import gears
              if (Array.isArray(importedData.gears)) {
                setGears(importedData.gears);
              }

              // Import equipped gears
              if (Array.isArray(importedData.equippedGears)) {
                setEquippedGears(importedData.equippedGears);
              }

              // Import other stats
              if (Array.isArray(importedData.otherStats || importedData.circuits)) {
                setOtherStats(importedData.otherStats || importedData.circuits);
              }

              // Import equipped other stats
              if (Array.isArray(importedData.equippedOtherStats || importedData.equippedCircuits)) {
                setEquippedOtherStats(importedData.equippedOtherStats || importedData.equippedCircuits);
              }

              setActivePresetId(null); // Imported data means no active preset

              showDialog({
                title: 'Success',
                message: 'Data imported successfully!',
                type: 'alert'
              });
            } catch (error) {
              showDialog({
                title: 'Import Error',
                message: 'Invalid file format',
                type: 'alert'
              });
              console.error('Import error:', error);
            }
          };
          reader.readAsText(file);
        }
      });
    };
    input.click();
  };

  // Gear Handlers
  const handleAddGear = (gearData: Omit<Gear, 'id'>) => {
    const newGear: Gear = {
      ...gearData,
      id: Date.now().toString(),
    };
    setGears([...gears, newGear]);
  };

  const handleEditGear = (gearId: string, updates: Omit<Gear, 'id'>) => {
    setGears(gears.map(gear =>
      gear.id === gearId
        ? { ...gear, ...updates }
        : gear
    ));

    // If gear is equipped, unequip and re-equip to apply changes
    if (Array.isArray(equippedGears) && equippedGears.includes(gearId)) {
      handleUnequipGear(gearId);
      setTimeout(() => handleEquipGear(gearId), 0);
    }
    setActivePresetId(null); // Editing gear invalidates the active preset
  };

  const handleDeleteGear = (gearId: string) => {
    // Unequip if equipped
    if (Array.isArray(equippedGears) && equippedGears.includes(gearId)) {
      handleUnequipGear(gearId);
    }
    setGears(gears.filter(gear => gear.id !== gearId));
    setActivePresetId(null); // Deleting gear invalidates the active preset
  };

  const handleEquipGear = (gearId: string) => {
    if (!Array.isArray(equippedGears) || equippedGears.includes(gearId)) return;

    const gear = gears.find(g => g.id === gearId);
    if (!gear) return;

    // Check if there's already an equipped item of the same slot
    const existingEquippedGearOfSlot = gears.find(g =>
      Array.isArray(equippedGears) && equippedGears.includes(g.id) && g.slot === gear.slot
    );

    // Calculate new equipped gears array
    let newEquippedGears = Array.isArray(equippedGears) ? [...equippedGears] : [];

    // If there's an existing equipped gear of the same slot, unequip it first
    if (existingEquippedGearOfSlot) {
      // Remove the existing gear's stats from modifier inputs
      Object.entries(existingEquippedGearOfSlot.stats).forEach(([stat, value]) => {
        if (value && value !== 0) {
          if (stat === 'totalPatk') return;
          const modKey = `${stat}_mod` as keyof CalculatorInputs;

          if (modKey in inputs) {
            const currentValue = inputs[modKey] || 0;
            updateInput(modKey, currentValue - value);
          }
        }
      });

      // Remove from equipped gears array
      newEquippedGears = newEquippedGears.filter(id => id !== existingEquippedGearOfSlot.id);
    }

    // Add new gear stats to modifier inputs
    Object.entries(gear.stats).forEach(([stat, value]) => {
      if (value && value !== 0) {
        if (stat === 'totalPatk') {
          console.warn('Gear stat "totalPatk" is deprecated.');
          return;
        }
        const modKey = `${stat}_mod` as keyof CalculatorInputs;

        if (modKey in inputs) {
          const currentValue = inputs[modKey] || 0;
          updateInput(modKey, currentValue + value);
        }
      }
    });

    // Add new gear to equipped array
    newEquippedGears.push(gearId);

    setEquippedGears(newEquippedGears);
    setActivePresetId(null); // Equipping gear invalidates the active preset
  };

  const handleUnequipGear = (gearId: string) => {
    if (!Array.isArray(equippedGears) || !equippedGears.includes(gearId)) return;

    const gear = gears.find(g => g.id === gearId);
    if (!gear) return;

    // Remove gear stats from modifier inputs
    Object.entries(gear.stats).forEach(([stat, value]) => {
      if (value && value !== 0) {
        if (stat === 'totalPatk') return;
        const modKey = `${stat}_mod` as keyof CalculatorInputs;

        if (modKey in inputs) {
          const currentValue = inputs[modKey] || 0;
          updateInput(modKey, currentValue - value);
        }
      }
    });

    setEquippedGears((Array.isArray(equippedGears) ? equippedGears : []).filter(id => id !== gearId));
    setActivePresetId(null); // Unequipping gear invalidates the active preset
  };

  // Other Stat Handlers
  const handleAddOtherStat = (otherStatData: Omit<OtherStat, 'id'>) => {
    const newOtherStat: OtherStat = {
      ...otherStatData,
      id: Date.now().toString(),
    };
    setOtherStats([...otherStats, newOtherStat]);
  };

  const handleEditOtherStat = (otherStatId: string, updates: Omit<OtherStat, 'id'>) => {
    setOtherStats(otherStats.map(stat =>
      stat.id === otherStatId
        ? { ...stat, ...updates }
        : stat
    ));

    // If other stat is equipped, unequip and re-equip to apply changes
    if (Array.isArray(equippedOtherStats) && equippedOtherStats.includes(otherStatId)) {
      handleUnequipOtherStat(otherStatId);
      setTimeout(() => handleEquipOtherStat(otherStatId), 0);
    }
    setActivePresetId(null); // Editing other stat invalidates the active preset
  };

  const handleDeleteOtherStat = (otherStatId: string) => {
    if (Array.isArray(equippedOtherStats) && equippedOtherStats.includes(otherStatId)) {
      handleUnequipOtherStat(otherStatId);
    }
    setOtherStats(otherStats.filter(s => s.id !== otherStatId));
    setActivePresetId(null); // Deleting other stat invalidates the active preset
  };

  const handleEquipOtherStat = (otherStatId: string) => {
    if (!Array.isArray(equippedOtherStats) || equippedOtherStats.includes(otherStatId)) return;

    const otherStat = otherStats.find(s => s.id === otherStatId);
    if (!otherStat) return;

    const newEquippedOtherStats = [...equippedOtherStats];

    // Add new other stat stats
    Object.entries(otherStat.stats).forEach(([stat, value]) => {
      if (value && value !== 0) {
        if (stat === 'totalPatk') return;
        const modKey = `${stat}_mod` as keyof CalculatorInputs;

        if (modKey in inputs) {
          const currentValue = inputs[modKey] || 0;
          updateInput(modKey, currentValue + value);
        }
      }
    });
    newEquippedOtherStats.push(otherStatId);
    setEquippedOtherStats(newEquippedOtherStats);
    setActivePresetId(null); // Equipping other stat invalidates the active preset
  };

  const handleUnequipOtherStat = (otherStatId: string) => {
    if (!Array.isArray(equippedOtherStats) || !equippedOtherStats.includes(otherStatId)) return;

    const otherStat = otherStats.find(s => s.id === otherStatId);
    if (!otherStat) return;

    Object.entries(otherStat.stats).forEach(([stat, value]) => {
      if (value && value !== 0) {
        if (stat === 'totalPatk') return;
        const modKey = `${stat}_mod` as keyof CalculatorInputs;

        if (modKey in inputs) {
          const currentValue = inputs[modKey] || 0;
          updateInput(modKey, currentValue - value);
        }
      }
    });

    setEquippedOtherStats((Array.isArray(equippedOtherStats) ? equippedOtherStats : []).filter(id => id !== otherStatId));
    setActivePresetId(null); // Unequipping other stat invalidates the active preset
  };

  const handleUnequipAllOtherStats = () => {
    if (!Array.isArray(equippedOtherStats) || equippedOtherStats.length === 0) return;

    setEquippedOtherStats([]);
    setActivePresetId(null);
  };

  const handleUnequipAll = () => {
    showDialog({
      title: 'Unequip All',
      message: 'Are you sure you want to unequip all gears and other stats?',
      type: 'danger',
      confirmText: 'Unequip All',
      onConfirm: () => {
        const modifierKeys = Object.keys(inputs).filter(key => key.endsWith('_mod')) as (keyof CalculatorInputs)[];
        modifierKeys.forEach(key => {
          updateInput(key, 0);
        });
        setEquippedGears([]);
        setEquippedOtherStats([]);
        setActivePresetId(null);
      }
    });
  };

  const handleMergeStats = () => {
    showDialog({
      title: 'Merge Increases to Base',
      message: 'This will add all current increases (from gear and modifiers) to your base values, then unequip all items and reset increases to 0. Continue?',
      type: 'confirm',
      confirmText: 'Merge & Unequip',
      onConfirm: () => {
        const statsToMerge: (keyof CalculatorInputs)[] = [
          'totalPatk', 'baseAtk', 'atkPercent', 'strength', 'strengthPercent',
          'damageReduction', 'physicalPen', 'pdefShred', 'skillMultiplier',
          'critDmg', 'elementalEnh', 'skillDmg', 'dmgBonus', 'dmgDuringResonance',
          'dmgToBoss', 'dmgToBeast', 'dmgToMech', 'dmgToDecayed', 'dmgToOtherworld',
          'dmgToDebuffed', 'dmgToScorched', 'dmgToPoisoned', 'dmgToBleeding',
          'dmgToVulnerable', 'dmgToSlowed', 'dmgToExhausted'
        ];

        setInputs((prevInputs: CalculatorInputs) => {
          const newInputs = { ...prevInputs };

          statsToMerge.forEach(key => {
            const modKey = `${key}_mod` as keyof CalculatorInputs;
            let mergedValue: number;

            if (key === 'totalPatk') {
              // totalPatk is special: it doesn't have a _mod counterpart, 
              // but we want to capture the fully calculated total value
              mergedValue = results.effectiveTotalPatk;
            } else if (modKey in newInputs) {
              const currentBase = newInputs[key] || 0;
              const currentMod = newInputs[modKey] || 0;
              mergedValue = currentBase + currentMod;

              // Key has a modifier, reset it to 0
              (newInputs as any)[modKey] = 0;
              window.localStorage.setItem(modKey as string, JSON.stringify(0));
            } else {
              // Not totalPatk and no _mod found, skip
              return;
            }

            // Apply merged value to base stat
            (newInputs as any)[key] = mergedValue;

            // Sync to localStorage
            window.localStorage.setItem(key as string, JSON.stringify(mergedValue));
          });

          return newInputs;
        });

        setEquippedGears([]);
        setEquippedOtherStats([]);
        setActivePresetId(null);
      }
    });
  };

  const handleReverseMergeStats = () => {
    showDialog({
      title: 'Reverse Merge - Subtract Increases from Base',
      message: 'This will subtract all current increases (from gear and modifiers) from your base values, then unequip all items and reset increases to 0. Continue?',
      type: 'confirm',
      confirmText: 'Subtract & Unequip',
      onConfirm: () => {
        const statsToMerge: (keyof CalculatorInputs)[] = [
          'baseAtk', 'atkPercent', 'strength', 'strengthPercent',
          'damageReduction', 'physicalPen', 'pdefShred', 'skillMultiplier',
          'critDmg', 'elementalEnh', 'skillDmg', 'dmgBonus', 'dmgDuringResonance',
          'dmgToBoss', 'dmgToBeast', 'dmgToMech', 'dmgToDecayed', 'dmgToOtherworld',
          'dmgToDebuffed', 'dmgToScorched', 'dmgToPoisoned', 'dmgToBleeding',
          'dmgToVulnerable', 'dmgToSlowed', 'dmgToExhausted'
        ];

        setInputs((prevInputs: CalculatorInputs) => {
          const newInputs = { ...prevInputs };

          // Get current BASE values (stored inputs without _mod)
          const currentBaseAtkPercent = newInputs.atkPercent || 0;
          const currentBaseStrength = newInputs.strength || 0;
          const currentBaseStrengthPercent = newInputs.strengthPercent || 0;

          // Get current MODIFIERS (these will be subtracted)
          const atkPercentMod = newInputs.atkPercent_mod || 0;
          const strengthMod = newInputs.strength_mod || 0;
          const strengthPercentMod = newInputs.strengthPercent_mod || 0;

          // Calculate NEW BASE values after subtraction
          const newBaseAtkPercent = currentBaseAtkPercent - atkPercentMod;
          const newBaseStrength = currentBaseStrength - strengthMod;
          const newBaseStrengthPercent = currentBaseStrengthPercent - strengthPercentMod;

          // Calculate effective base strength for both states
          const currentEffectiveBaseStrength = currentBaseStrength * (1 + currentBaseStrengthPercent / 100);
          const newEffectiveBaseStrength = newBaseStrength * (1 + newBaseStrengthPercent / 100);

          // Calculate multipliers using BASE values only (this matches calculatedBaseAtk formula)
          // Formula: calculatedBaseAtk = totalPatk / ((1 + atkPercent/100) * (1 + effectiveStrength/1000))
          const currentMultiplier = (1 + currentBaseAtkPercent / 100) * (1 + currentEffectiveBaseStrength / 1000);
          const newMultiplier = (1 + newBaseAtkPercent / 100) * (1 + newEffectiveBaseStrength / 1000);

          // Adjust totalPatk to preserve calculatedBaseAtk
          // baseAtk = totalPatk / multiplier
          // To keep baseAtk constant: new_totalPatk = old_totalPatk * (newMultiplier / currentMultiplier)
          if (newInputs.totalPatk > 0 && currentMultiplier > 0) {
            const adjustmentRatio = newMultiplier / currentMultiplier;
            const newTotalPatk = newInputs.totalPatk * adjustmentRatio;

            newInputs.totalPatk = newTotalPatk;
            window.localStorage.setItem('totalPatk', JSON.stringify(newTotalPatk));
          }

          // Now subtract modifiers from other stats
          statsToMerge.forEach(key => {
            const modKey = `${key}_mod` as keyof CalculatorInputs;

            if (modKey in newInputs) {
              const currentBase = newInputs[key] || 0;
              const currentMod = newInputs[modKey] || 0;
              // Subtract the modifier from the base instead of adding
              const mergedValue = currentBase - currentMod;

              // Key has a modifier, reset it to 0
              (newInputs as any)[modKey] = 0;
              window.localStorage.setItem(modKey as string, JSON.stringify(0));

              // Apply merged value to base stat
              (newInputs as any)[key] = mergedValue;

              // Sync to localStorage
              window.localStorage.setItem(key as string, JSON.stringify(mergedValue));
            }
          });

          return newInputs;
        });

        setEquippedGears([]);
        setEquippedOtherStats([]);
        setActivePresetId(null);
      }
    });
  };

  const isStateModifiedFromPreset = (preset: Preset) => {
    // Helper to check if current state matches the preset
    const inputsMatch = Object.keys(preset.inputs).every(key => {
      const k = key as keyof CalculatorInputs;
      // Use a small epsilon for floating point comparisons
      return Math.abs(preset.inputs[k] - inputs[k]) < 0.001;
    });

    const gearsMatch = preset.equippedGears.length === equippedGears.length &&
      preset.equippedGears.every(id => equippedGears.includes(id));

    const presetOtherStats = preset.equippedOtherStats || (preset as any).equippedCircuits || [];
    const otherStatsMatch = presetOtherStats.length === equippedOtherStats.length &&
      presetOtherStats.every(id => equippedOtherStats.includes(id));

    const resonanceMatch = preset.resonanceActive === resonanceActive;

    return !(inputsMatch && gearsMatch && otherStatsMatch && resonanceMatch);
  };

  const handleSavePreset = (name: string) => {
    const newPreset: Preset = {
      id: Date.now().toString(),
      name,
      inputs: { ...inputs },
      equippedGears: [...equippedGears],
      equippedOtherStats: [...equippedOtherStats],
      resonanceActive
    };
    setPresets([...presets, newPreset]);
    setActivePresetId(newPreset.id);
  };

  const forceLoadPreset = (preset: Preset) => {
    setResonanceActive(preset.resonanceActive);
    setEquippedGears(preset.equippedGears);
    setEquippedOtherStats(preset.equippedOtherStats || (preset as any).equippedCircuits || []);

    const newInputs = { ...preset.inputs };
    setInputs(newInputs);

    // Sync localStorage for each key since setInputs only update state
    // This is important because useLocalStorageInputs reads from localStorage on mount
    Object.keys(newInputs).forEach(key => {
      window.localStorage.setItem(key, JSON.stringify(newInputs[key as keyof CalculatorInputs]));
    });

    setActivePresetId(preset.id);
  };

  const handleLoadPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;

    // If the preset is already active, no need to load again
    if (activePresetId === presetId && !isStateModifiedFromPreset(preset)) {
      return;
    }

    // Check if current state is different from any active preset or just has manual changes
    const currentActivePreset = (activePresetId && Array.isArray(presets)) ? presets.find(p => p.id === activePresetId) : null;
    const modified = currentActivePreset ? isStateModifiedFromPreset(currentActivePreset) : true;

    if (modified && activePresetId !== preset.id) {
      showDialog({
        title: 'Unsaved Changes',
        message: 'Your current configuration has unsaved changes. Loading this preset will overwrite them. Continue?',
        type: 'confirm',
        confirmText: 'Load & Overwrite',
        onConfirm: () => forceLoadPreset(preset)
      });
    } else {
      forceLoadPreset(preset);
    }
  };

  const handleDeletePreset = (presetId: string) => {
    showDialog({
      title: 'Delete Preset',
      message: 'Are you sure you want to delete this preset?',
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: () => {
        setPresets((Array.isArray(presets) ? presets : []).filter(p => p.id !== presetId));
        if (activePresetId === presetId) setActivePresetId(null);
      }
    });
  };


  // Apply equipped gear/other stat stats on load
  useEffect(() => {
    // Calculate final modifiers from valid equipped gears and other stats
    const allModifiers: Record<string, number> = {};

    // Gears
    (Array.isArray(equippedGears) ? equippedGears : []).forEach(gearId => {
      const gear = (Array.isArray(gears) ? gears : []).find(g => g.id === gearId);
      if (gear) {
        Object.entries(gear.stats).forEach(([stat, value]) => {
          if (value && value !== 0 && stat !== 'totalPatk') {
            allModifiers[stat] = (allModifiers[stat] || 0) + value;
          }
        });
      }
    });

    // Other Stats
    (Array.isArray(equippedOtherStats) ? equippedOtherStats : []).forEach(otherStatId => {
      const otherStat = (Array.isArray(otherStats) ? otherStats : []).find(s => s.id === otherStatId);
      if (otherStat) {
        Object.entries(otherStat.stats).forEach(([stat, value]) => {
          if (value && value !== 0 && stat !== 'totalPatk') {
            allModifiers[stat] = (allModifiers[stat] || 0) + value;
          }
        });
      }
    });

    // Apply all modifiers in a single atomic update
    setInputs((prevInputs: CalculatorInputs) => {
      const newInputs = { ...prevInputs };

      // 1. Reset all _mod inputs to 0
      for (const key in newInputs) {
        if (key.endsWith('_mod')) {
          (newInputs as any)[key] = 0;
        }
      }

      // 2. Apply the calculated modifiers
      Object.entries(allModifiers).forEach(([stat, value]) => {
        const modKey = `${stat}_mod` as keyof CalculatorInputs;
        if (modKey in newInputs) {
          (newInputs as any)[modKey] = value;
        }
      });

      return newInputs;
    });

  }, [equippedGears, gears, equippedOtherStats, otherStats, setInputs]);

  return (
    <div className="container">
      <h1>CoA Damage Calculator</h1>

      <GearManagement
        gears={gears}
        equippedGears={equippedGears}
        otherStats={otherStats}
        equippedOtherStats={equippedOtherStats}
        onAddGear={handleAddGear}
        onEditGear={handleEditGear}
        onDeleteGear={handleDeleteGear}
        onEquipGear={handleEquipGear}
        onUnequipGear={handleUnequipGear}
        onAddOtherStat={handleAddOtherStat}
        onEditOtherStat={handleEditOtherStat}
        onDeleteOtherStat={handleDeleteOtherStat}
        onEquipOtherStat={handleEquipOtherStat}
        onUnequipOtherStat={handleUnequipOtherStat}
        onUnequipAllOtherStats={handleUnequipAllOtherStats}
        inputs={inputs}
        totalValues={totalValues}
        onInputChange={handleInputChange}
        results={results}
        onResetDefaults={handleResetDefaults}
        onResetModifiers={handleResetModifiers}
        onImportData={handleImportData}
        onExportData={handleExportData}
        resonanceActive={resonanceActive}
        onResonanceToggle={handleResonanceToggle}
        onUnequipAll={handleUnequipAll}
        onMergeStats={handleMergeStats}
        onReverseMergeStats={handleReverseMergeStats}
        presets={presets}
        onSavePreset={handleSavePreset}
        onLoadPreset={handleLoadPreset}
        onDeletePreset={handleDeletePreset}
        activePresetId={activePresetId}
        showDialog={showDialog}
      />

      <CustomDialog config={dialog} onClose={closeDialog} />

      <StickyFooter
        baseDamage={results.baseDamage}
        finalDamage={results.finalDamage}
        hasModifiers={results.hasModifiers}
        percentageIncrease={results.percentageIncrease}
      />
    </div>
  );
}

export default App;
