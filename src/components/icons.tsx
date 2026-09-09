type IconProps = { className?: string };

const base = "h-5 w-5";

export function HomeIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DocumentIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
      <path d="M6 3.5h8l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
      <path d="M14 3.5V8h4" strokeLinejoin="round" />
      <path d="M8 12.5h8M8 15.5h8M8 18.5h5" strokeLinecap="round" />
    </svg>
  );
}

export function ChecklistIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
      <rect x="4" y="3.5" width="16" height="17" rx="2" />
      <path d="m8.5 9 1.8 1.8L13.5 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 15h8M8 17.5h5" strokeLinecap="round" />
    </svg>
  );
}

export function GuideIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
      <path d="M4 5.5c2.5-1 5-1 8 0v13c-3-1-5.5-1-8 0Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 5.5c-2.5-1-5-1-8 0v13c3-1 5.5-1 8 0Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PhoneAlertIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
      <path
        d="M6 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4 6.2 2 2 0 0 1 6 4Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HelpIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.3a2.4 2.4 0 1 1 3.4 2.2c-.9.5-1 .9-1 1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="16.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function WizardIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="M8 9h8M8 12.5h8M8 16h5" strokeLinecap="round" />
    </svg>
  );
}

export function UserIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MenuIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}

export function ReceiptIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
      <path
        d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8.5 8h7M8.5 11.5h7M8.5 15h4" strokeLinecap="round" />
    </svg>
  );
}

export function CalculatorIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M8 7.5h8" strokeLinecap="round" />
      <circle cx="8.3" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15.7" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="8.3" cy="15.7" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="15.7" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15.7" cy="15.7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CalendarCheckIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" strokeLinecap="round" />
      <path d="m9 14.5 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MapPinIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
      <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="9.5" r="2.3" />
    </svg>
  );
}

export function MegaphoneIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
      <path d="M3 10v4a1 1 0 0 0 1 1h2l1 4h2l-1-4h1l9 4V6l-9 4H4a1 1 0 0 0-1 1Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 9.5a3 3 0 0 1 0 5" strokeLinecap="round" />
    </svg>
  );
}

export function BankIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
      <path d="M3 9.5 12 4l9 5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V19h14V9.5M9 19v-6M15 19v-6" strokeLinecap="round" />
      <path d="M3.5 19.5h17" strokeLinecap="round" />
    </svg>
  );
}

export function TransferIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
      <path d="M4 8h13l-3-3M20 16H7l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IdCardIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="11" r="1.8" />
      <path d="M6 15.5c.6-1.4 1.6-2 2.5-2s1.9.6 2.5 2M13.5 9.5h5M13.5 13h5" strokeLinecap="round" />
    </svg>
  );
}

export function WalletIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
      <rect x="3" y="6.5" width="18" height="12" rx="2" />
      <path d="M3 10h18" strokeLinecap="round" />
      <circle cx="16.5" cy="14.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CloseIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

export function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
