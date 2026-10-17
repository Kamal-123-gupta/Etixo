import { useId } from 'react';

export default function BrandLogo({ size = 36, className = '', title = 'Etixo' }) {
  const uid = useId().replace(/:/g, '');
  const gradId = `etixo-grad-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient id={gradId} x1="8" y1="58" x2="56" y2="6" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0E2C28" />
          <stop offset="0.5" stopColor="#175049" />
          <stop offset="1" stopColor="#2F7A71" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradId})`}
        fillRule="evenodd"
        d="M17 7h30a9 9 0 0 1 9 9v32a9 9 0 0 1-9 9H17a9 9 0 0 1-9-9V16a9 9 0 0 1 9-9ZM2.5 32a5.5 5.5 0 1 0 11 0 5.5 5.5 0 0 0-11 0Zm48 0a5.5 5.5 0 1 0 11 0 5.5 5.5 0 0 0-11 0Z"
      />
      <path
        fill="#fff"
        d="M21.2 19.2h21.6c1.05 0 1.9.85 1.9 1.9s-.85 1.9-1.9 1.9H25.1v4.4h14.6c1.05 0 1.9.85 1.9 1.9s-.85 1.9-1.9 1.9H25.1v4.4h17.7c1.05 0 1.9.85 1.9 1.9s-.85 1.9-1.9 1.9H21.2c-1.05 0-1.9-.85-1.9-1.9V21.1c0-1.05.85-1.9 1.9-1.9Z"
      />
    </svg>
  );
}
