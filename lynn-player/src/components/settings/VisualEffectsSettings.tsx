import { useVisualStore } from '../../stores/visualStore';

const versionLabels: Record<string, string> = {
  win11: 'Windows 11',
  win10: 'Windows 10',
  win8: 'Windows 8',
  win7: 'Windows 7',
  unknown: '非 Windows 系统',
};

export default function VisualEffectsSettings() {
  const {
    windowsVersion,
    currentEffect,
    effectOpacity,
    accentColor,
    setEffectOpacity,
    setAccentColor,
    applyEffect,
  } = useVisualStore();

  const availableEffects = (() => {
    if (windowsVersion === 'win11') {
      return [
        { value: 'mica' as const, label: 'Mica' },
        { value: 'acrylic' as const, label: 'Acrylic' },
        { value: 'standard' as const, label: '标准' },
      ];
    }
    if (windowsVersion === 'win10') {
      return [
        { value: 'acrylic' as const, label: 'Acrylic' },
        { value: 'standard' as const, label: '标准' },
      ];
    }
    return [
      { value: 'standard' as const, label: '标准' },
    ];
  })();

  const handleApplyEffect = async (effect: 'mica' | 'acrylic' | 'standard') => {
    await applyEffect(effect);
  };

  return (
    <div className="visual-effects-settings">
      <div className="visual-effects-settings__section">
        <h4 className="visual-effects-settings__label">系统版本</h4>
        <span className="visual-effects-settings__version">
          {versionLabels[windowsVersion] || windowsVersion}
        </span>
      </div>

      <div className="visual-effects-settings__section">
        <h4 className="visual-effects-settings__label">视觉效果</h4>
        <div className="visual-effects-settings__effects">
          {availableEffects.map((effect) => (
            <label key={effect.value} className="visual-effects-settings__radio">
              <input
                type="radio"
                name="visual-effect"
                value={effect.value}
                checked={currentEffect === effect.value}
                onChange={() => handleApplyEffect(effect.value)}
              />
              <span>{effect.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="visual-effects-settings__section">
        <h4 className="visual-effects-settings__label">
          不透明度 <span className="visual-effects-settings__value">{effectOpacity}%</span>
        </h4>
        <input
          type="range"
          min="0"
          max="100"
          value={effectOpacity}
          onChange={(e) => setEffectOpacity(Number(e.target.value))}
          className="visual-effects-settings__slider"
        />
      </div>

      <div className="visual-effects-settings__section">
        <h4 className="visual-effects-settings__label">强调色</h4>
        <div className="visual-effects-settings__color-picker">
          <input
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="visual-effects-settings__color-input"
          />
          <span className="visual-effects-settings__color-value">{accentColor}</span>
        </div>
      </div>

      <button
        className="visual-effects-settings__apply-btn"
        onClick={() => applyEffect(currentEffect)}
      >
        应用效果
      </button>
    </div>
  );
}
