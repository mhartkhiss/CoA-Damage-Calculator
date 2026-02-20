import { useEffect, useState, useCallback } from 'react';


import './DamageCalculator.css';
import GearManagement from './components/GearManagement';
import StickyFooter from './components/StickyFooter';
import CustomDialog from './components/CustomDialog';
import SplashScreen from './components/SplashScreen';
import type { CalculatorInputs, Gear, GearSlot, OtherStat, Preset, DialogConfig, EquippedGearSlots, EquippedOtherStatSlots } from './types';
import { BASE_STAT_KEYS, getAllEquippedGearIds } from './types';

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
  additionalDmg: 0,

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
  additionalDmg_mod: 0,
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
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);
  const [gears, setGears] = useLocalStorage<Gear[]>('gears', []);
  const [equippedGears, setEquippedGears] = useLocalStorage<EquippedGearSlots>('equippedGears', {});
  const [otherStats, setOtherStats] = useLocalStorage<OtherStat[]>('otherStats', []);
  const [equippedOtherStats, setEquippedOtherStats] = useLocalStorage<EquippedOtherStatSlots>('equippedOtherStats', { base: [], secondary: [] });
  const [presets, setPresets] = useLocalStorage<Preset[]>('presets', []);
  const [gearBaseContributions, setGearBaseContributions] = useState<Record<string, number>>({});
  const [activePresetId, setActivePresetId] = useLocalStorage<string | null>('activePresetId', null);
  // Track user-manually-entered modifier values, separate from gear contributions
  const [userModifiers, setUserModifiers] = useLocalStorage<Record<string, number>>('userModifiers', {});

  const showDialog = (config: Omit<DialogConfig, 'isOpen'>) => {
    setDialog({ ...config, isOpen: true });
  };

  const closeDialog = () => {
    setDialog(prev => ({ ...prev, isOpen: false }));
  };

  // Safety check for localStorage corruption & backward compatibility
  useEffect(() => {
    if (!Array.isArray(gears)) setGears([]);
    // Backward compat: convert old string[] equippedGears to new EquippedGearSlots format
    if (Array.isArray(equippedGears)) {
      const converted: EquippedGearSlots = {};
      const validGears = Array.isArray(gears) ? gears : [];
      (equippedGears as unknown as string[]).forEach((gearId: string) => {
        const gear = validGears.find(g => g.id === gearId);
        if (gear) {
          converted[gear.slot] = { ...(converted[gear.slot] || {}), base: gearId };
        }
      });
      setEquippedGears(converted);
    } else if (equippedGears === null || equippedGears === undefined) {
      setEquippedGears({});
    }
    if (!Array.isArray(otherStats)) setOtherStats([]);
    // Backward compat: convert old string[] equippedOtherStats to new EquippedOtherStatSlots format
    if (Array.isArray(equippedOtherStats)) {
      setEquippedOtherStats({ base: equippedOtherStats as unknown as string[], secondary: [] });
    } else if (equippedOtherStats === null || equippedOtherStats === undefined) {
      setEquippedOtherStats({ base: [], secondary: [] });
    }
    if (!Array.isArray(presets)) setPresets([]);
  }, []);

  // Calculator uses raw inputs (all contributions flow through _mod)
  // gearBaseContributions adjusts the "base damage" display so base-slot items
  // show as base damage, not final damage increase
  const { results, totalValues } = useDamageCalculator(inputs, resonanceActive, gearBaseContributions);

  // Update actual attack display
  useEffect(() => {
    const actualAttackElement = document.getElementById('actualAttack');
    if (actualAttackElement) {
      actualAttackElement.textContent = Math.round(results.actualAttack).toLocaleString();
    }
  }, [results.actualAttack]);

  // Auto-equip set effects into Other Stats base group
  // A set effect is ACTIVE when: all required gear IDs are in BASE slots
  // AND none of those slots have a secondary gear equipped (secondary breaks the set)
  useEffect(() => {
    const validOtherStats = Array.isArray(otherStats) ? otherStats : [];
    const validGears = Array.isArray(gears) ? gears : [];
    const validEquippedGears = (equippedGears && typeof equippedGears === 'object' && !Array.isArray(equippedGears)) ? equippedGears : {};
    const safeEquippedOther = (equippedOtherStats && typeof equippedOtherStats === 'object' && !Array.isArray(equippedOtherStats))
      ? equippedOtherStats
      : { base: [], secondary: [] };

    const setEffectStats = validOtherStats.filter(stat => stat.isSetEffect && stat.requiredGearIds && Array.isArray(stat.requiredGearIds) && stat.requiredGearIds.length > 0);
    if (setEffectStats.length === 0) return;

    let modified = false;
    const newBaseList = [...(safeEquippedOther.base || [])];

    setEffectStats.forEach(stat => {
      // Check: all required gears must be equipped (base or secondary)
      // Breaking: if a required gear is in the base slot AND a different secondary is also in that slot
      const isSetActive = stat.requiredGearIds!.every(requiredId => {
        const gear = validGears.find(g => g.id === requiredId);
        if (!gear) return false;
        const slotData = validEquippedGears[gear.slot];
        if (!slotData) return false;

        const isInBase = slotData.base === requiredId;
        const isInSecondary = slotData.secondary === requiredId;
        // Must be equipped in at least one sub-slot
        if (!isInBase && !isInSecondary) return false;
        // If the required gear is in base and a secondary exists, the set breaks
        if (isInBase && slotData.secondary) return false;

        return true;
      });

      const isCurrentlyEquipped = newBaseList.includes(stat.id);

      if (isSetActive && !isCurrentlyEquipped) {
        newBaseList.push(stat.id);
        modified = true;
      } else if (!isSetActive && isCurrentlyEquipped) {
        const index = newBaseList.indexOf(stat.id);
        if (index > -1) {
          newBaseList.splice(index, 1);
          modified = true;
        }
      }
    });

    if (modified) {
      setEquippedOtherStats({ ...safeEquippedOther, base: newBaseList });
    }
  }, [equippedGears, gears, otherStats, equippedOtherStats, setEquippedOtherStats]);

  const handleInputChange = (key: keyof CalculatorInputs, value: number) => {
    const keyStr = key as string;
    if (keyStr.endsWith('_mod')) {
      // User is manually editing a modifier input — store only the user's manual portion
      // Current _mod = gearContribution + oldUserModifier
      // gearContribution = current _mod - oldUserModifier
      // newUserModifier = newValue - gearContribution
      const statKey = keyStr.replace('_mod', '');
      const currentModValue = inputs[key] || 0;
      const oldUserModifier = userModifiers[statKey] || 0;
      const gearContribution = currentModValue - oldUserModifier;
      const newUserModifier = value - gearContribution;
      setUserModifiers(prev => ({ ...prev, [statKey]: newUserModifier }));
      // Don't call updateInput directly; the gear useEffect will recalculate _mod = gear + user
    } else {
      updateInput(key, value);
    }
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
        setUserModifiers({});
        setActivePresetId(null);
      }
    });
  };

  const handleResetModifiers = () => {
    setUserModifiers({});
    setActivePresetId(null); // Resetting modifiers invalidates the active preset
  };

  const handleExportData = () => {
    const exportData = {
      version: '3.2', // Bump version for gear images and item ordering
      exportDate: new Date().toISOString(),
      calculatorInputs: inputs,
      resonanceActive,
      gears,
      equippedGears,
      otherStats,
      equippedOtherStats,
      userModifiers
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

              // Import equipped gears (handle both old array and new object format)
              if (importedData.equippedGears) {
                if (Array.isArray(importedData.equippedGears)) {
                  // Convert old string[] format to new EquippedGearSlots
                  const importedGearsList = importedData.gears || [];
                  const converted: EquippedGearSlots = {};
                  (importedData.equippedGears as string[]).forEach((gearId: string) => {
                    const gear = importedGearsList.find((g: Gear) => g.id === gearId);
                    if (gear) {
                      converted[gear.slot as GearSlot] = { ...(converted[gear.slot as GearSlot] || {}), base: gearId };
                    }
                  });
                  setEquippedGears(converted);
                } else {
                  setEquippedGears(importedData.equippedGears);
                }
              }

              // Import other stats
              if (Array.isArray(importedData.otherStats || importedData.circuits)) {
                setOtherStats(importedData.otherStats || importedData.circuits);
              }

              // Import equipped other stats (handle both old string[] and new EquippedOtherStatSlots)
              const importedOtherEquipped = importedData.equippedOtherStats || importedData.equippedCircuits;
              if (importedOtherEquipped) {
                if (Array.isArray(importedOtherEquipped)) {
                  setEquippedOtherStats({ base: importedOtherEquipped, secondary: [] });
                } else {
                  setEquippedOtherStats(importedOtherEquipped);
                }
              }

              setActivePresetId(null); // Imported data means no active preset

              // Import user modifiers
              if (importedData.userModifiers && typeof importedData.userModifiers === 'object') {
                setUserModifiers(importedData.userModifiers);
              } else {
                setUserModifiers({});
              }

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

  // Helper: check if a gear ID is equipped in any slot
  const isGearEquipped = (gearId: string): boolean => {
    const validSlots = (equippedGears && typeof equippedGears === 'object' && !Array.isArray(equippedGears)) ? equippedGears : {};
    return getAllEquippedGearIds(validSlots).includes(gearId);
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
    const oldGear = gears.find(g => g.id === gearId);
    setGears(gears.map(gear =>
      gear.id === gearId
        ? { ...gear, ...updates }
        : gear
    ));

    // If slot type changed and gear was equipped, unequip from old slot
    if (oldGear && oldGear.slot !== updates.slot && isGearEquipped(gearId)) {
      handleUnequipGear(gearId);
    }
    // Stats will be recalculated by the useEffect that watches gears/equippedGears
    setActivePresetId(null);
  };

  const handleDeleteGear = (gearId: string) => {
    if (isGearEquipped(gearId)) {
      handleUnequipGear(gearId);
    }
    setGears(gears.filter(gear => gear.id !== gearId));
    setActivePresetId(null);
  };

  const handleReorderGears = (reorderedGears: Gear[]) => {
    setGears(reorderedGears);
  };

  const handleReorderOtherStats = (reorderedOtherStats: OtherStat[]) => {
    setOtherStats(reorderedOtherStats);
  };

  const handleEquipGear = (gearId: string, subSlot: 'base' | 'secondary') => {
    const gear = gears.find(g => g.id === gearId);
    if (!gear) return;

    // Can't equip the same gear in both sub-slots
    const currentSlotData = equippedGears[gear.slot];
    if (subSlot === 'base' && currentSlotData?.secondary === gearId) return;
    if (subSlot === 'secondary' && currentSlotData?.base === gearId) return;

    // If gear is already equipped elsewhere, unequip it first
    if (isGearEquipped(gearId)) {
      handleUnequipGear(gearId);
    }

    setEquippedGears(prev => ({
      ...prev,
      [gear.slot]: {
        ...prev[gear.slot],
        [subSlot]: gearId
      }
    }));
    setActivePresetId(null);
  };

  const handleUnequipGear = (gearId: string) => {
    const gear = gears.find(g => g.id === gearId);
    if (!gear) return;

    setEquippedGears(prev => {
      const slotData = prev[gear.slot];
      if (!slotData) return prev;

      const newSlotData = { ...slotData };
      if (newSlotData.base === gearId) delete newSlotData.base;
      if (newSlotData.secondary === gearId) delete newSlotData.secondary;

      const newSlots = { ...prev };
      if (!newSlotData.base && !newSlotData.secondary) {
        delete newSlots[gear.slot];
      } else {
        newSlots[gear.slot] = newSlotData;
      }
      return newSlots;
    });
    setActivePresetId(null);
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
    // useEffect will recalculate stats automatically since otherStats changed
    setActivePresetId(null);
  };

  const handleDeleteOtherStat = (otherStatId: string) => {
    // Remove from equipped lists if present
    const safeEquipped = (equippedOtherStats && typeof equippedOtherStats === 'object' && !Array.isArray(equippedOtherStats))
      ? equippedOtherStats : { base: [], secondary: [] };
    const inBase = (safeEquipped.base || []).includes(otherStatId);
    const inSecondary = (safeEquipped.secondary || []).includes(otherStatId);
    if (inBase || inSecondary) {
      setEquippedOtherStats({
        base: (safeEquipped.base || []).filter(id => id !== otherStatId),
        secondary: (safeEquipped.secondary || []).filter(id => id !== otherStatId),
      });
    }
    setOtherStats(otherStats.filter(s => s.id !== otherStatId));
    setActivePresetId(null);
  };

  const handleEquipOtherStat = (otherStatId: string, subSlot: 'base' | 'secondary') => {
    const safeEquipped = (equippedOtherStats && typeof equippedOtherStats === 'object' && !Array.isArray(equippedOtherStats))
      ? equippedOtherStats : { base: [], secondary: [] };

    // Already equipped in the target group
    if (subSlot === 'base' && (safeEquipped.base || []).includes(otherStatId)) return;
    if (subSlot === 'secondary' && (safeEquipped.secondary || []).includes(otherStatId)) return;

    // Remove from the other group if present
    const newBase = (safeEquipped.base || []).filter(id => id !== otherStatId);
    const newSecondary = (safeEquipped.secondary || []).filter(id => id !== otherStatId);

    if (subSlot === 'base') {
      newBase.push(otherStatId);
    } else {
      newSecondary.push(otherStatId);
    }

    setEquippedOtherStats({ base: newBase, secondary: newSecondary });
    setActivePresetId(null);
  };

  const handleUnequipOtherStat = (otherStatId: string) => {
    const safeEquipped = (equippedOtherStats && typeof equippedOtherStats === 'object' && !Array.isArray(equippedOtherStats))
      ? equippedOtherStats : { base: [], secondary: [] };

    setEquippedOtherStats({
      base: (safeEquipped.base || []).filter(id => id !== otherStatId),
      secondary: (safeEquipped.secondary || []).filter(id => id !== otherStatId),
    });
    setActivePresetId(null);
  };

  const handleUnequipAllOtherStats = () => {
    setEquippedOtherStats({ base: [], secondary: [] });
    setActivePresetId(null);
  };

  const handleUnequipAll = () => {
    showDialog({
      title: 'Unequip All',
      message: 'Are you sure you want to unequip all gears and other stats?',
      type: 'danger',
      confirmText: 'Unequip All',
      onConfirm: () => {
        setEquippedGears({});
        setEquippedOtherStats({ base: [], secondary: [] });
        setUserModifiers({});
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
          'dmgToVulnerable', 'dmgToSlowed', 'dmgToExhausted', 'additionalDmg'
        ];

        setInputs((prevInputs: CalculatorInputs) => {
          const newInputs = { ...prevInputs };

          statsToMerge.forEach(key => {
            const modKey = `${key}_mod` as keyof CalculatorInputs;
            let mergedValue: number;

            if (key === 'totalPatk') {
              // totalPatk is special: capture the fully calculated total value
              mergedValue = results.effectiveTotalPatk;
            } else if (modKey in newInputs) {
              const currentBase = newInputs[key] || 0;
              const currentMod = newInputs[modKey] || 0;
              mergedValue = currentBase + currentMod;

              // Reset modifier to 0
              (newInputs as any)[modKey] = 0;
              window.localStorage.setItem(modKey as string, JSON.stringify(0));
            } else {
              return;
            }

            (newInputs as any)[key] = mergedValue;
            window.localStorage.setItem(key as string, JSON.stringify(mergedValue));
          });

          return newInputs;
        });

        setEquippedGears({});
        setEquippedOtherStats({ base: [], secondary: [] });
        setGearBaseContributions({});
        setUserModifiers({});
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
          'dmgToVulnerable', 'dmgToSlowed', 'dmgToExhausted', 'additionalDmg'
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

        setEquippedGears({});
        setEquippedOtherStats({ base: [], secondary: [] });
        setGearBaseContributions({});
        setUserModifiers({});
        setActivePresetId(null);
      }
    });
  };

  // Helper to convert legacy string[] equippedGears to EquippedGearSlots
  const convertLegacyEquippedGears = (legacyGears: string[]): EquippedGearSlots => {
    const converted: EquippedGearSlots = {};
    const validGears = Array.isArray(gears) ? gears : [];
    legacyGears.forEach((gearId: string) => {
      const gear = validGears.find(g => g.id === gearId);
      if (gear) {
        converted[gear.slot] = { ...(converted[gear.slot] || {}), base: gearId };
      }
    });
    return converted;
  };

  const isStateModifiedFromPreset = (preset: Preset) => {
    const inputsMatch = Object.keys(preset.inputs).every(key => {
      const k = key as keyof CalculatorInputs;
      return Math.abs(preset.inputs[k] - inputs[k]) < 0.001;
    });

    // Compare equippedGears using gear IDs (handles both old and new formats)
    const presetEquippedGears = Array.isArray(preset.equippedGears)
      ? convertLegacyEquippedGears(preset.equippedGears as unknown as string[])
      : preset.equippedGears;
    const presetGearIds = getAllEquippedGearIds(presetEquippedGears).sort();
    const currentGearIds = getAllEquippedGearIds(equippedGears).sort();
    const gearsMatch = presetGearIds.length === currentGearIds.length &&
      presetGearIds.every((id, i) => id === currentGearIds[i]);

    // Compare equippedOtherStats (handles both old string[] and new EquippedOtherStatSlots)
    const presetOtherRaw = preset.equippedOtherStats || (preset as any).equippedCircuits || { base: [], secondary: [] };
    const presetOther: EquippedOtherStatSlots = Array.isArray(presetOtherRaw)
      ? { base: presetOtherRaw as string[], secondary: [] }
      : presetOtherRaw;
    const safeCurrentOther = (equippedOtherStats && typeof equippedOtherStats === 'object' && !Array.isArray(equippedOtherStats))
      ? equippedOtherStats : { base: [], secondary: [] };
    const otherBaseMatch = (presetOther.base || []).length === (safeCurrentOther.base || []).length &&
      (presetOther.base || []).every(id => (safeCurrentOther.base || []).includes(id));
    const otherSecMatch = (presetOther.secondary || []).length === (safeCurrentOther.secondary || []).length &&
      (presetOther.secondary || []).every(id => (safeCurrentOther.secondary || []).includes(id));
    const otherStatsMatch = otherBaseMatch && otherSecMatch;

    const resonanceMatch = preset.resonanceActive === resonanceActive;

    // Compare userModifiers
    const presetUserMods = preset.userModifiers || {};
    const presetModKeys = Object.keys(presetUserMods).filter(k => (presetUserMods[k] || 0) !== 0);
    const currentModKeys = Object.keys(userModifiers).filter(k => (userModifiers[k] || 0) !== 0);
    const userModsMatch = presetModKeys.length === currentModKeys.length &&
      presetModKeys.every(k => Math.abs((presetUserMods[k] || 0) - (userModifiers[k] || 0)) < 0.001);

    return !(inputsMatch && gearsMatch && otherStatsMatch && resonanceMatch && userModsMatch);
  };

  const handleSavePreset = (name: string) => {
    const newPreset: Preset = {
      id: Date.now().toString(),
      name,
      inputs: { ...inputs },
      equippedGears: JSON.parse(JSON.stringify(equippedGears)), // deep clone
      equippedOtherStats: JSON.parse(JSON.stringify(equippedOtherStats)),
      resonanceActive,
      userModifiers: JSON.parse(JSON.stringify(userModifiers)),
    };
    setPresets([...presets, newPreset]);
    setActivePresetId(newPreset.id);
  };

  const forceLoadPreset = (preset: Preset) => {
    setResonanceActive(preset.resonanceActive);

    // Restore user modifiers (backward compat: default to empty if not present)
    setUserModifiers(preset.userModifiers || {});

    // Handle backward compatibility for equippedGears
    if (Array.isArray(preset.equippedGears)) {
      setEquippedGears(convertLegacyEquippedGears(preset.equippedGears as unknown as string[]));
    } else {
      setEquippedGears(preset.equippedGears);
    }

    // Handle backward compatibility for equippedOtherStats
    const rawOther = preset.equippedOtherStats || (preset as any).equippedCircuits || { base: [], secondary: [] };
    if (Array.isArray(rawOther)) {
      setEquippedOtherStats({ base: rawOther as string[], secondary: [] });
    } else {
      setEquippedOtherStats(rawOther);
    }

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


  // Apply equipped gear/other stat stats - DUAL-SLOT LOGIC
  // ALL contributions flow through _mod (identical to old behavior for correct calculation)
  // gearBaseContributions is computed as a DISPLAY-ONLY side product:
  //   - Display base = rawInput + gearBaseContributions (hides base-slot items from green/red)
  //   - Display modifier = _mod - gearBaseContributions (shows only delta/secondary as green/red)
  useEffect(() => {
    const allModifiers: Record<string, number> = {};
    const baseContributions: Record<string, number> = {};
    const validGears = Array.isArray(gears) ? gears : [];
    const validEquippedGears = (equippedGears && typeof equippedGears === 'object' && !Array.isArray(equippedGears)) ? equippedGears : {};

    const addStat = (stat: string, value: number) => {
      if (value && value !== 0 && stat !== 'totalPatk') {
        allModifiers[stat] = (allModifiers[stat] || 0) + value;
      }
    };
    const addBaseStat = (stat: string, value: number) => {
      if (value && value !== 0 && stat !== 'totalPatk') {
        baseContributions[stat] = (baseContributions[stat] || 0) + value;
      }
    };

    // Process gear slots with dual-slot logic
    for (const slotKey in validEquippedGears) {
      const slot = slotKey as GearSlot;
      const slotData = validEquippedGears[slot];
      if (!slotData) continue;

      const baseGear = slotData.base ? validGears.find(g => g.id === slotData.base) : null;
      const secondaryGear = slotData.secondary ? validGears.find(g => g.id === slotData.secondary) : null;

      if (baseGear && !secondaryGear) {
        // Only base slot: ALL stats → _mod AND → baseContributions (display hides green/red)
        Object.entries(baseGear.stats).forEach(([stat, value]) => {
          addStat(stat, value || 0);
          addBaseStat(stat, value || 0);
        });
      } else if (!baseGear && secondaryGear) {
        // Only secondary slot: ALL stats → _mod only (green/red shown)
        Object.entries(secondaryGear.stats).forEach(([stat, value]) => {
          addStat(stat, value || 0);
        });
      } else if (baseGear && secondaryGear) {
        // Both slots filled:
        // 1. Base gear's BASE_STAT_KEYS → _mod AND → baseContributions
        Object.entries(baseGear.stats).forEach(([stat, value]) => {
          if (value && value !== 0 && stat !== 'totalPatk' && BASE_STAT_KEYS.includes(stat)) {
            addStat(stat, value);
            addBaseStat(stat, value);
          }
        });

        // 2. Delta (secondary - base) for ALL stats → _mod only (green/red)
        const allStatKeys = new Set([
          ...Object.keys(baseGear.stats),
          ...Object.keys(secondaryGear.stats)
        ]);
        allStatKeys.forEach(stat => {
          if (stat === 'totalPatk') return;
          const secondaryValue = (secondaryGear.stats as Record<string, number | undefined>)[stat] || 0;
          const baseValue = (baseGear.stats as Record<string, number | undefined>)[stat] || 0;
          const delta = secondaryValue - baseValue;
          if (delta !== 0) {
            addStat(stat, delta);
          }
        });
      }
    }

    // Other Stats - dual-slot logic
    const validOtherStats = Array.isArray(otherStats) ? otherStats : [];
    const safeEquippedOther = (equippedOtherStats && typeof equippedOtherStats === 'object' && !Array.isArray(equippedOtherStats))
      ? equippedOtherStats
      : { base: [], secondary: [] };

    // Base group: stats → _mod AND → baseContributions (display hides green/red)
    (safeEquippedOther.base || []).forEach(otherStatId => {
      const otherStat = validOtherStats.find(s => s.id === otherStatId);
      if (otherStat) {
        Object.entries(otherStat.stats).forEach(([stat, value]) => {
          addStat(stat, value || 0);
          addBaseStat(stat, value || 0);
        });
      }
    });

    // Secondary group: stats → _mod only (green/red shown)
    (safeEquippedOther.secondary || []).forEach(otherStatId => {
      const otherStat = validOtherStats.find(s => s.id === otherStatId);
      if (otherStat) {
        Object.entries(otherStat.stats).forEach(([stat, value]) => {
          addStat(stat, value || 0);
        });
      }
    });

    // Update display-only base contributions (NOT used in calculator)
    setGearBaseContributions(baseContributions);

    // Apply ALL modifiers to _mod inputs: gear contributions + user manual modifiers
    setInputs((prevInputs: CalculatorInputs) => {
      const newInputs = { ...prevInputs };

      // 1. Reset all _mod inputs to 0
      for (const key in newInputs) {
        if (key.endsWith('_mod')) {
          (newInputs as any)[key] = 0;
        }
      }

      // 2. Apply gear/other stat contributions
      Object.entries(allModifiers).forEach(([stat, value]) => {
        const modKey = `${stat}_mod` as keyof CalculatorInputs;
        if (modKey in newInputs) {
          (newInputs as any)[modKey] = (newInputs as any)[modKey] + value;
        }
      });

      // 3. Apply user-manually-entered modifier values on top
      Object.entries(userModifiers).forEach(([stat, value]) => {
        const modKey = `${stat}_mod` as keyof CalculatorInputs;
        if (modKey in newInputs && value !== 0) {
          (newInputs as any)[modKey] = (newInputs as any)[modKey] + value;
        }
      });

      return newInputs;
    });

  }, [equippedGears, gears, equippedOtherStats, otherStats, userModifiers, setInputs]);

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} duration={3000} />}
      <div className="container">

        <GearManagement
          gears={gears}
          equippedGears={equippedGears}
          otherStats={otherStats}
          equippedOtherStats={equippedOtherStats}
          gearBaseContributions={gearBaseContributions}
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
          onReorderGears={handleReorderGears}
          onReorderOtherStats={handleReorderOtherStats}
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
    </>
  );
}

export default App;
