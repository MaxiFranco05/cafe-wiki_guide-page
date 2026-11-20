import React from 'react';

interface IconProps {
  readonly size?: number;
}

function Stroke({ size = 16, children }: IconProps & { readonly children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const BookIcon: React.FC<IconProps> = ({ size = 20 }) => (
  <Stroke size={size}>
    <path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6.5A2.5 2.5 0 0 0 4 21.5M8 7h7M8 11h5" />
  </Stroke>
);
export const ChevronDownIcon: React.FC<IconProps> = (props) => (
  <Stroke {...props}>
    <polyline points="6 9 12 15 18 9" />
  </Stroke>
);
export const ChevronUpIcon: React.FC<IconProps> = (props) => (
  <Stroke {...props}>
    <polyline points="18 15 12 9 6 15" />
  </Stroke>
);
export const CloseIcon: React.FC<IconProps> = ({ size = 18 }) => (
  <Stroke size={size}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Stroke>
);
export const PlusIcon: React.FC<IconProps> = (props) => (
  <Stroke {...props}>
    <path d="M12 5v14M5 12h14" />
  </Stroke>
);
export const CopyIcon: React.FC<IconProps> = (props) => (
  <Stroke {...props}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </Stroke>
);
export const EditIcon: React.FC<IconProps> = (props) => (
  <Stroke {...props}>
    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
  </Stroke>
);
export const ShareIcon: React.FC<IconProps> = (props) => (
  <Stroke {...props}>
    <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </Stroke>
);
export const DownloadIcon: React.FC<IconProps> = (props) => (
  <Stroke {...props}>
    <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
    <polyline points="8 11 12 15 16 11" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </Stroke>
);
export const TrashIcon: React.FC<IconProps> = (props) => (
  <Stroke {...props}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2" />
  </Stroke>
);
export const AlertIcon: React.FC<IconProps> = (props) => (
  <Stroke {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </Stroke>
);
export const CheckIcon: React.FC<IconProps> = (props) => (
  <Stroke {...props}>
    <polyline points="20 6 9 17 4 12" />
  </Stroke>
);
export const FileIcon: React.FC<IconProps> = ({ size = 20 }) => (
  <Stroke size={size}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </Stroke>
);
export const LockIcon: React.FC<IconProps> = (props) => (
  <Stroke {...props}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </Stroke>
);
