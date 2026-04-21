/**
 * Icon component that renders SVG icons
 * @param {string} name - Icon name (e.g., 'plus', 'minus', 'info', 'alert', 'close', 'arrow-left', 'arrow-right', 'check', 'trash', 'menu')
 * @param {string} size - Icon size (default: '1em')
 * @param {string} color - Icon color (default: 'currentColor')
 * @param {string} className - Additional CSS classes
 */
export default function Icon({ name, size = '1em', color = 'currentColor', className = '', ...props }) {
  const icons = {
    plus: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4v16m8-8H4"
      />
    ),
    minus: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 12H4"
      />
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" d="M12 16v-4m0-4h.01" />
      </>
    ),
    alert: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </>
    ),
    close: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    ),
    'arrow-left': (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19l-7-7 7-7"
      />
    ),
    'arrow-right': (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5l7 7-7 7"
      />
    ),
    'arrow-up': (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 15l7-7 7 7"
      />
    ),
    'arrow-down': (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 9l-7 7-7-7"
      />
    ),
    check: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    ),
    trash: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </>
    ),
    menu: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6h16M4 12h16M4 18h16"
      />
    ),
    chevron: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5l7 7-7 7"
      />
    ),
    'insert-before': (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5l7 7-7 7M4 5v14"
      />
    ),
    'insert-after': (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 5l-7 7 7 7M20 5v14"
      />
    ),
    question: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path
          strokeLinecap="round"
          d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3m.08 4h.01"
        />
      </>
    ),
    book: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
      />
    ),
  }

  const icon = icons[name]

  if (!icon) {
    console.warn(`Icon "${name}" not found`)
    return null
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {icon}
    </svg>
  )
}
