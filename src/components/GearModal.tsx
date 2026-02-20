import React, { useState, useEffect, useRef } from 'react';
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

/**
 * Resizes an image file to 50x50 and returns a base64 data URL.
 */
const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const size = Math.min(img.width, img.height);
        // Do not upscale smaller images to prevent blur. Max size 128px for crisp high-DPI
        const maxSize = 128;
        const targetSize = Math.min(size, maxSize);

        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image scaled down or 1:1, maintaining aspect ratio via cover
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, targetSize, targetSize);

        // Use quality 0.95 to minimize WebP compression blur artifacts
        resolve(canvas.toDataURL('image/webp', 0.95));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
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
  const [gearImage, setGearImage] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingGear) {
      setGearName(editingGear.name);
      setGearSlot(editingGear.slot);
      setStats(editingGear.stats);
      setGearImage(editingGear.image);
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
      setGearImage(undefined);
    }
  }, [editingGear, preselectedSlot]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    try {
      const resized = await resizeImage(file);
      setGearImage(resized);
    } catch (err) {
      console.error('Image resize failed:', err);
      alert('Failed to process image');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!gearName.trim()) {
      alert('Please enter a gear name');
      return;
    }

    onSave({
      name: gearName.trim(),
      slot: gearSlot,
      stats,
      image: gearImage
    });

    setGearName('');
    setGearSlot('helmet');
    setStats({});
    setInputValues({});
    setGearImage(undefined);
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
            {/* Image upload + name row */}
            <div className="gear-form-row">
              <div className="gear-image-upload" onClick={() => fileInputRef.current?.click()}>
                {gearImage ? (
                  <img src={gearImage} alt="Gear" className="gear-image-preview" />
                ) : (
                  <div className="gear-image-placeholder">
                    <span className="gear-image-plus">+</span>
                    <span className="gear-image-label">Icon</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                {gearImage && (
                  <button
                    type="button"
                    className="gear-image-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      setGearImage(undefined);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    title="Remove image"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="gear-form-group" style={{ flex: 1 }}>
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
