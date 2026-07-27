import { useEffect, useRef, useState } from "react";

const COUNTRIES = [
  { dial: "+57", flag: "🇨🇴", name: "Colombia" },
  { dial: "+1",  flag: "🇺🇸", name: "United States" },
  { dial: "+52", flag: "🇲🇽", name: "México" },
  { dial: "+34", flag: "🇪🇸", name: "España" },
  { dial: "+55", flag: "🇧🇷", name: "Brasil" },
  { dial: "+54", flag: "🇦🇷", name: "Argentina" },
  { dial: "+58", flag: "🇻🇪", name: "Venezuela" },
  { dial: "+51", flag: "🇵🇪", name: "Perú" },
];

function parse(value: string) {
  const country =
    COUNTRIES.find((c) => value.startsWith(c.dial)) ?? COUNTRIES[0];
  const number = value.startsWith(country.dial)
    ? value.slice(country.dial.length)
    : value;
  return { country, number };
}

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function PhoneInput({ value, onChange }: Props) {
  const { country: initCountry, number: initNumber } = parse(value);
  const [country, setCountry] = useState(initCountry);
  const [number, setNumber] = useState(initNumber);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function selectCountry(c: (typeof COUNTRIES)[0]) {
    setCountry(c);
    setOpen(false);
    onChange(`${c.dial}${number}`);
  }

  function handleNumber(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 12);
    setNumber(raw);
    onChange(`${country.dial}${raw}`);
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex rounded-xl border border-gray-200 overflow-visible focus-within:ring-2 focus-within:ring-gray-900 focus-within:border-transparent transition-shadow">
        {/* Country selector trigger */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-50 border-r border-gray-200 hover:bg-gray-100 transition-colors shrink-0 rounded-l-xl"
        >
          <span className="text-base leading-none">{country.flag}</span>
          <span className="text-xs font-medium text-gray-500 tabular-nums">
            {country.dial}
          </span>
          <svg
            className={`h-3 w-3 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Number input */}
        <input
          type="tel"
          inputMode="numeric"
          placeholder="310 000 0000"
          value={number}
          onChange={handleNumber}
          className="flex-1 min-w-0 px-3 py-2.5 text-sm text-gray-900 bg-white outline-none placeholder:text-gray-300 rounded-r-xl"
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1.5 w-56 rounded-xl border border-gray-100 bg-white shadow-xl overflow-hidden">
          {COUNTRIES.map((c) => (
            <button
              key={c.dial}
              type="button"
              onClick={() => selectCountry(c)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${
                c.dial === country.dial ? "bg-gray-50" : ""
              }`}
            >
              <span className="text-base shrink-0">{c.flag}</span>
              <span className="w-9 shrink-0 text-xs text-gray-400 tabular-nums text-left">
                {c.dial}
              </span>
              <span className="truncate text-gray-700">{c.name}</span>
              {c.dial === country.dial && (
                <svg
                  className="ml-auto h-3.5 w-3.5 shrink-0 text-gray-900"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
