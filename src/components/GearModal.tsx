import React, { useState, useEffect } from 'react';
import type { Gear, GearStats, GearSlot } from '../types';

interface GearModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (gear: Omit<Gear, 'id'>) => void;
  editingGear: Gear | null;
  preselectedSlot?: GearSlot | null;
}

const gearSlots: GearSlot[] = [
  'helmet', 'chest', 'gloves', 'pants', 'boots', 'seal', 'talisman',
  'weapon', 'necklace', 'bracers', 'ring'
];

const gearStatsList = [
  'baseAtk', 'atkPercent', 'strength', 'strengthPercent', 'physicalPen', 'pdefShred', 'critDmg', 'elementalEnh',
  'skillDmg', 'dmgBonus', 'dmgDuringResonance', 'dmgToBoss', 'dmgToBeast',
  'dmgToMech', 'dmgToDecayed', 'dmgToOtherworld', 'dmgToDebuffed',
  'dmgToScorched', 'dmgToPoisoned', 'dmgToBleeding', 'dmgToVulnerable',
  'dmgToSlowed', 'dmgToExhausted', 'additionalDmg'
];

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
  'physicalPen': 'Physical PEN (%)',
  'pdefShred': 'DEF Shred',
  'critDmg': 'Critical Damage (%)',
  'elementalEnh': 'Elemental ENH',
  'skillDmg': 'Skill DMG (%)',
  'dmgBonus': 'DMG Bonus (%)',
  'dmgDuringResonance': 'DMG during Resonance (%)',
  'dmgToBoss': 'DMG to Bosses (%)',
  'dmgToBeast': 'DMG to Beast (%)',
  'dmgToMech': 'DMG to Mech (%)',
  'dmgToDecayed': 'DMG to Decayed (%)',
  'dmgToOtherworld': 'DMG to Otherworld (%)',
  'dmgToDebuffed': 'DMG to Debuffed (%)',
  'dmgToScorched': 'DMG to Scorched (%)',
  'dmgToPoisoned': 'DMG to Poisoned (%)',
  'dmgToBleeding': 'DMG to Bleeding (%)',
  'dmgToVulnerable': 'DMG to Vulnerable (%)',
  'dmgToSlowed': 'DMG to Slowed (%)',
  'dmgToExhausted': 'DMG to Exhausted (%)',
  'additionalDmg': 'Additional DMG (%)'
};

const GearModal: React.FC<GearModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingGear,
  preselectedSlot
}) => {
  const [gearName, setGearName] = useState('');
  const [gearSlot, setGearSlot] = useState<GearSlot>('helmet');
  const [stats, setStats] = useState<GearStats>({});
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingGear) {
      setGearName(editingGear.name);
      setGearSlot(editingGear.slot);
      setStats(editingGear.stats);
      // Initialize input values from stats
      const initialInputs: Record<string, string> = {};
      Object.entries(editingGear.stats).forEach(([key, value]) => {
        initialInputs[key] = value.toString();
      });
      setInputValues(initialInputs);
    } else {
      setGearName('');
      // Use preselected slot if available, otherwise default to helmet
      setGearSlot(preselectedSlot || 'helmet');
      setStats({});
      setInputValues({});
    }
  }, [editingGear, preselectedSlot]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!gearName.trim()) {
      alert('Please enter a gear name');
      return;
    }

    onSave({
      name: gearName.trim(),
      slot: gearSlot,
      stats
    });

    setGearName('');
    setGearSlot('helmet');
    setStats({});
    setInputValues({});
  };

  const handleStatChange = (stat: string, value: number) => {
    // Save the value (including negative values)
    // Only delete if it's exactly 0 (positive zero)
    if (value === 0) {
      const newStats = { ...stats };
      delete newStats[stat as keyof GearStats];
      setStats(newStats);
    } else {
      setStats({
        ...stats,
        [stat]: value
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal active">
      <div className="modal-content">
        <div className="modal-header">
          <h2 id="modalTitle">{editingGear ? 'Edit Gear' : 'Add New Gear'}</h2>
          <button className="close-modal" onClick={onClose}>&times;</button>
        </div>
        <form id="gearForm" onSubmit={handleSubmit}>
          <div className="modal-scroll-content">
            <div className="gear-form-group">
              <label htmlFor="gearName">Gear Name *</label>
            <input
              type="text"
              id="gearName"
              value={gearName}
              onChange={(e) => setGearName(e.target.value)}
              required
              placeholder="e.g., Legendary Sword"
            />
          </div>
          <div className="gear-form-group">
            <label htmlFor="gearSlot">Slot Type *</label>
            <select
              id="gearSlot"
              value={gearSlot}
              onChange={(e) => setGearSlot(e.target.value as GearSlot)}
              required
              className="gear-slot-select"
              disabled={!!preselectedSlot}
            >
              {gearSlots.map(slot => (
                <option key={slot} value={slot}>
                  {slotLabels[slot]}
                </option>
              ))}
            </select>
            {preselectedSlot && (
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.8em', marginTop: '4px', display: 'block' }}>
                Slot type is set based on the selected slot
              </small>
            )}
          </div>
          <div className="gear-form-group">
            <label>Gear Stats (leave 0 if not applicable)</label>
            <div className="gear-stats-grid">
              {gearStatsList.map(stat => (
                <div key={stat} className="stat-input-group">
                  <label htmlFor={`gear_${stat}`}>{statLabels[stat]}</label>
                  <input
                    type="number"
                    id={`gear_${stat}`}
                    value={inputValues[stat] ?? (stats[stat as keyof GearStats] !== undefined && stats[stat as keyof GearStats] !== null ? stats[stat as keyof GearStats]!.toString() : '')}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      // Update input value immediately for responsive typing
                      setInputValues({
                        ...inputValues,
                        [stat]: inputValue
                      });

                      if (inputValue === '' || inputValue === '-') {
                        // Allow empty or just minus sign while typing
                        const newStats = { ...stats };
                        delete newStats[stat as keyof GearStats];
                        setStats(newStats);
                        return;
                      }

                      const numValue = parseFloat(inputValue);
                      if (!isNaN(numValue)) {
                        // Save the value (negative values are allowed)
                        handleStatChange(stat, numValue);
                        // Clear the input value since we're storing it in stats
                        const newInputValues = { ...inputValues };
                        delete newInputValues[stat];
                        setInputValues(newInputValues);
                      }
                    }}
                    step="any"
                    placeholder="0"
                    onWheel={(e) => (e.target as HTMLElement).blur()}
                  />
                </div>
              ))}
            </div>
          </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="modal-btn cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-btn save-gear-btn">
              Save Gear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GearModal;
