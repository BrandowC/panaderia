import type { SVGProps } from 'react';

/** Iconografia coherente en SVG: sin dependencias y consistente entre sistemas. */
function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5 shrink-0"
      aria-hidden="true"
      {...props}
    />
  );
}

export function HomeIcon() {
  return (
    <Icon>
      <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-5H9v5H5a1 1 0 0 1-1-1v-8.5Z" />
    </Icon>
  );
}

export function CountIcon() {
  return (
    <Icon>
      <rect x="4" y="3" width="16" height="18" rx="2.5" />
      <path d="M8 8h8M8 12h4M8 16h6" />
    </Icon>
  );
}

export function ReportIcon() {
  return (
    <Icon>
      <path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v5h4M8 13h8M8 17h5" />
    </Icon>
  );
}

export function BreadIcon() {
  return (
    <Icon>
      <path d="M4 14c0-3.6 3.6-6.4 8-6.4s8 2.8 8 6.4v1.6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V14Z" />
      <path d="M9 12c.6-.7 1.4-1.1 2.3-1.1M14 10.9c.9 0 1.7.4 2.3 1.1" />
    </Icon>
  );
}

export function UsersIcon() {
  return (
    <Icon>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M16 6.5a3 3 0 0 1 0 5.6M17.5 19.5c0-2-.8-3.6-2-4.6" />
    </Icon>
  );
}

export function LogoutIcon() {
  return (
    <Icon>
      <path d="M14 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7" />
      <path d="m17 15 3-3-3-3M20 12h-9" />
    </Icon>
  );
}

export function MenuIcon() {
  return (
    <Icon>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  );
}

export function CloseIcon() {
  return (
    <Icon>
      <path d="m6 6 12 12M18 6 6 18" />
    </Icon>
  );
}
