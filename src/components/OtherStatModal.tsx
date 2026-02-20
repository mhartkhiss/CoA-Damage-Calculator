import React, { useState, useEffect } from 'react';
import type { GearStats, OtherStat, Gear } from '../types';

interface OtherStatModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (otherStat: Omit<OtherStat, 'id'>) => void;
    editingOtherStat?: OtherStat | null;
    gears: Gear[];
}

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

const slotLabels: Record<string, string> = {
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

const gearStatsList = [
    'baseAtk', 'atkPercent', 'strength', 'strengthPercent', 'physicalPen', 'pdefShred', 'critDmg', 'elementalEnh',
    'skillDmg', 'dmgBonus', 'dmgDuringResonance', 'dmgToBoss', 'dmgToBeast',
    'dmgToMech', 'dmgToDecayed', 'dmgToOtherworld', 'dmgToDebuffed',
    'dmgToScorched', 'dmgToPoisoned', 'dmgToBleeding', 'dmgToVulnerable',
    'dmgToSlowed', 'dmgToExhausted', 'additionalDmg'
];

const OtherStatModal: React.FC<OtherStatModalProps> = ({
    isOpen,
    onClose,
    onSave,
    editingOtherStat,
    gears
}) => {
    const [itemName, setItemName] = useState('');
    const [stats, setStats] = useState<GearStats>({});
    const [inputValues, setInputValues] = useState<Record<string, string>>({});
    const [isSetEffect, setIsSetEffect] = useState(false);
    const [requiredGearIds, setRequiredGearIds] = useState<string[]>([]);
    const [requiredGearCount, setRequiredGearCount] = useState<number>(0);
    const [gearSearch, setGearSearch] = useState('');
    const [isGearModalOpen, setIsGearModalOpen] = useState(false);

    useEffect(() => {
        if (editingOtherStat) {
            setItemName(editingOtherStat.name);
            setStats(editingOtherStat.stats);
            setIsSetEffect(editingOtherStat.isSetEffect || false);
            setRequiredGearIds(editingOtherStat.requiredGearIds || []);
            setRequiredGearCount(editingOtherStat.requiredGearCount || editingOtherStat.requiredGearIds?.length || 0);
            // Initialize input values from stats
            const initialInputs: Record<string, string> = {};
            Object.entries(editingOtherStat.stats).forEach(([key, value]) => {
                initialInputs[key] = value.toString();
            });
            setInputValues(initialInputs);
        } else {
            setItemName('');
            setStats({});
            setInputValues({});
            setIsSetEffect(false);
            setRequiredGearIds([]);
            setRequiredGearCount(0);
        }
        setGearSearch('');
    }, [editingOtherStat, isOpen]); // Reset when opening new

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!itemName.trim()) {
            alert('Please enter an item name');
            return;
        }

        if (isSetEffect && requiredGearIds.length === 0) {
            alert('Please select at least one gear for the set effect');
            return;
        }

        onSave({
            name: itemName.trim(),
            stats,
            isSetEffect,
            requiredGearIds: isSetEffect ? requiredGearIds : [],
            requiredGearCount: isSetEffect ? Math.max(1, requiredGearCount) : undefined
        });

        setItemName('');
        setStats({});
        setInputValues({});
        setIsSetEffect(false);
        setRequiredGearIds([]);
        setRequiredGearCount(0);
        onClose();
    };

    const handleStatChange = (stat: string, value: number) => {
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

    const toggleGearSelection = (gearId: string) => {
        const hasId = requiredGearIds.includes(gearId);
        const nextIds = hasId
            ? requiredGearIds.filter(id => id !== gearId)
            : [...requiredGearIds, gearId];

        setRequiredGearIds(nextIds);

        if (hasId && requiredGearCount > nextIds.length) {
            setRequiredGearCount(nextIds.length);
        } else if (!hasId && requiredGearCount === requiredGearIds.length) {
            setRequiredGearCount(nextIds.length);
        }
    };

    const filteredGears = gears.filter(gear =>
        gear.name.toLowerCase().includes(gearSearch.toLowerCase()) ||
        slotLabels[gear.slot].toLowerCase().includes(gearSearch.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <>
            <div className="modal active">
                <div className="modal-content">
                    <div className="modal-header">
                        <h2 id="modalTitle">{editingOtherStat ? 'Edit Other Stat Item' : 'Add New Other Stat Item'}</h2>
                        <button className="close-modal" onClick={onClose}>&times;</button>
                    </div>
                    <form id="otherStatForm" onSubmit={handleSubmit}>
                        <div className="modal-scroll-content">
                            <div className="gear-form-group">
                                <label htmlFor="itemName">Item Name *</label>
                                <input
                                    type="text"
                                    id="itemName"
                                    value={itemName}
                                    onChange={(e) => setItemName(e.target.value)}
                                    required
                                    placeholder="e.g., Support Module"
                                />
                            </div>

                            <div className="gear-form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                <input
                                    type="checkbox"
                                    id="isSetEffect"
                                    checked={isSetEffect}
                                    onChange={(e) => setIsSetEffect(e.target.checked)}
                                    style={{ width: 'auto', margin: 0 }}
                                />
                                <label htmlFor="isSetEffect" style={{ margin: 0 }}>Is Set Effect? (Auto-equipped)</label>
                            </div>

                            {isSetEffect && (
                                <div className="gear-form-group">
                                    <label>Set Conditions</label>
                                    <div className="set-conditions-summary" style={{
                                        padding: '12px',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid var(--border-subtle)',
                                        borderRadius: 'var(--radius-md)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '10px'
                                    }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {requiredGearIds.length === 0 ? (
                                                'No gears selected for this condition.'
                                            ) : (
                                                `Selected: ${requiredGearIds.length} gear(s)`
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            className="modal-btn"
                                            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
                                            onClick={() => setIsGearModalOpen(true)}
                                        >
                                            {requiredGearIds.length === 0 ? 'Select Required Gears' : 'Modify Gear Selection'}
                                        </button>

                                        {requiredGearIds.length > 0 && (
                                            <div style={{ marginTop: '5px' }}>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                                    Minimum Required Gears to Equip:
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <input
                                                        type="number"
                                                        value={requiredGearCount || ''}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value);
                                                            if (!isNaN(val)) {
                                                                setRequiredGearCount(Math.min(Math.max(1, val), requiredGearIds.length));
                                                            } else {
                                                                setRequiredGearCount(0);
                                                            }
                                                        }}
                                                        min={1}
                                                        max={requiredGearIds.length}
                                                        style={{ width: '80px', padding: '6px' }}
                                                    />
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>out of {requiredGearIds.length} gear(s)</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="gear-form-group">
                                <label>Item Stats (leave 0 if not applicable)</label>
                                <div className="gear-stats-grid">
                                    {gearStatsList.map(stat => (
                                        <div key={stat} className="stat-input-group">
                                            <label htmlFor={`other_stat_${stat}`}>{statLabels[stat]}</label>
                                            <input
                                                type="number"
                                                id={`other_stat_${stat}`}
                                                value={inputValues[stat] ?? (stats[stat as keyof GearStats] !== undefined && stats[stat as keyof GearStats] !== null ? stats[stat as keyof GearStats]!.toString() : '')}
                                                onChange={(e) => {
                                                    const inputValue = e.target.value;
                                                    setInputValues({
                                                        ...inputValues,
                                                        [stat]: inputValue
                                                    });

                                                    if (inputValue === '' || inputValue === '-') {
                                                        const newStats = { ...stats };
                                                        delete newStats[stat as keyof GearStats];
                                                        setStats(newStats);
                                                        return;
                                                    }

                                                    const numValue = parseFloat(inputValue);
                                                    if (!isNaN(numValue)) {
                                                        handleStatChange(stat, numValue);
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
                                Save Item
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Gear Selection Sub-Modal */}
            {isGearModalOpen && (
                <div className="modal active" style={{ zIndex: 2100 }}>
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2>Select Required Gears</h2>
                            <button className="close-modal" onClick={() => setIsGearModalOpen(false)}>&times;</button>
                        </div>
                        <div className="modal-scroll-content">
                            <div className="gear-search-container" style={{ marginBottom: '15px' }}>
                                <input
                                    type="text"
                                    placeholder="Search gears by name or slot..."
                                    value={gearSearch}
                                    onChange={(e) => setGearSearch(e.target.value)}
                                    className="gear-search-input"
                                    style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
                                />
                            </div>

                            <div className="gears-selection-list">
                                {gears.length === 0 ? (
                                    <div className="no-gears-msg">No gears created yet. Create gears first to set conditions.</div>
                                ) : filteredGears.length === 0 ? (
                                    <div className="no-gears-msg">No gears match your search.</div>
                                ) : (
                                    <div className="gears-selection-grid">
                                        {filteredGears.map(gear => (
                                            <div
                                                key={gear.id}
                                                className={`gear-select-item ${requiredGearIds.includes(gear.id) ? 'selected' : ''}`}
                                                onClick={() => toggleGearSelection(gear.id)}
                                            >
                                                <span className="gear-select-slot">[{slotLabels[gear.slot]}]</span>
                                                <span className="gear-select-name">{gear.name}</span>
                                                <span className="gear-select-check">{requiredGearIds.includes(gear.id) ? '✓' : ''}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="modal-btn save-gear-btn" style={{ width: '100%' }} onClick={() => setIsGearModalOpen(false)}>
                                Done ({requiredGearIds.length} Selected)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default OtherStatModal;
