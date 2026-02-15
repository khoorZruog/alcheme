interface VisibilityCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function VisibilityCheckbox({
  checked,
  onChange,
  label = "プロフィールに表示しない",
}: VisibilityCheckboxProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer mt-2">
      <input
        type="checkbox"
        checked={!checked}
        onChange={(e) => onChange(!e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 accent-neon-accent"
      />
      <span className="text-xs text-text-muted">{label}</span>
    </label>
  );
}
