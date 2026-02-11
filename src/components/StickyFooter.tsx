import { formatStatValue } from '../utils/formatUtils';

interface StickyFooterProps {
    baseDamage: number;
    finalDamage: number;
    hasModifiers: boolean;
    percentageIncrease: number;
}

export default function StickyFooter({
    baseDamage,
    finalDamage,
    hasModifiers,
    percentageIncrease
}: StickyFooterProps) {
    return (
        <div className="sticky-footer">
            <div className="damage-display">
                <div className="damage-item">
                    <span className="damage-label">Base Damage</span>
                    <span className="damage-value">{Math.round(baseDamage).toLocaleString()}</span>
                </div>
                {hasModifiers && (
                    <>
                        <span className="damage-arrow">→</span>
                        <div className="damage-item">
                            <span className="damage-label">Final Damage</span>
                            <span className={`damage-value final ${percentageIncrease < 0 ? 'decrease' : ''}`}>
                                {Math.round(finalDamage).toLocaleString()}
                            </span>
                        </div>
                        <div className={`damage-increase ${percentageIncrease >= 0 ? 'increase' : 'decrease'}`}>
                            {percentageIncrease >= 0 ? '+' : ''}{formatStatValue(percentageIncrease)}%
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
