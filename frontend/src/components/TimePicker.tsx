interface Props {
  value: string; // "HH:MM" or ""
  onChange: (val: string) => void;
  required?: boolean;
  disabled?: boolean;
  hourLabel?: string;
  minuteLabel?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

export default function TimePicker({ value, onChange, required, disabled, hourLabel = "Sati", minuteLabel = "Minute" }: Props) {
  const [h, m] = value ? value.split(":") : ["", ""];

  function setH(newH: string) {
    onChange(`${newH}:${m || "00"}`);
  }
  function setM(newM: string) {
    onChange(`${h || "08"}:${newM}`);
  }

  const selectClass =
    "appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:border-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="flex items-center gap-1" role="group">
      <select
        value={h}
        onChange={(e) => setH(e.target.value)}
        required={required}
        disabled={disabled}
        className={selectClass}
        style={{ width: "72px" }}
        aria-label={hourLabel}
      >
        {!h && <option value="" disabled>h</option>}
        {HOURS.map((hh) => (
          <option key={hh} value={hh}>{hh}</option>
        ))}
      </select>
      <span className="text-gray-400 font-bold text-lg select-none" aria-hidden="true">:</span>
      <select
        value={m}
        onChange={(e) => setM(e.target.value)}
        required={required}
        disabled={disabled}
        className={selectClass}
        style={{ width: "72px" }}
        aria-label={minuteLabel}
      >
        {!m && <option value="" disabled>min</option>}
        {MINUTES.map((mm) => (
          <option key={mm} value={mm}>{mm}</option>
        ))}
      </select>
    </div>
  );
}
