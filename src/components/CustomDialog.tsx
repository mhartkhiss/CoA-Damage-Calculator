import React from 'react';
import type { DialogConfig } from '../types';

const CustomDialog: React.FC<{ config: DialogConfig; onClose: () => void }> = ({ config, onClose }) => {
    if (!config.isOpen) return null;

    const handleConfirm = () => {
        if (config.onConfirm) config.onConfirm();
        onClose();
    };

    const handleCancel = () => {
        if (config.onCancel) config.onCancel();
        onClose();
    };

    const getIcon = () => {
        switch (config.type) {
            case 'danger': return '⚠️';
            case 'confirm': return '❓';
            case 'alert':
            default: return 'ℹ️';
        }
    };

    return (
        <div className={`modal active dialog-overlay`}>
            <div className={`modal-content dialog-content ${config.type}`}>
                <div className="dialog-header">
                    <span className="dialog-icon">{getIcon()}</span>
                    <h3>{config.title}</h3>
                </div>
                <div className="dialog-body">
                    <p>{config.message}</p>
                </div>
                <div className="dialog-footer">
                    {config.type !== 'alert' && (
                        <button className="dialog-btn cancel" onClick={handleCancel}>
                            {config.cancelText || 'Cancel'}
                        </button>
                    )}
                    <button
                        className={`dialog-btn confirm ${config.type === 'danger' ? 'danger' : ''}`}
                        onClick={handleConfirm}
                    >
                        {config.confirmText || (config.type === 'alert' ? 'OK' : 'Confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomDialog;
