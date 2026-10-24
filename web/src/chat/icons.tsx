import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>
const base = (size: number): P => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
})

export const PanelIcon = (p: P) => (<svg {...base(20)} {...p}><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M9 4v16" /></svg>)
export const NewChatIcon = (p: P) => (<svg {...base(20)} {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>)
export const MenuIcon = (p: P) => (<svg {...base(22)} {...p}><path d="M4 7h16M4 12h16M4 17h10" /></svg>)
export const PlusIcon = (p: P) => (<svg {...base(16)} strokeWidth={2} {...p}><path d="M12 5v14M5 12h14" /></svg>)
export const LogoutIcon = (p: P) => (<svg {...base(16)} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>)
export const CheckIcon = (p: P) => (<svg {...base(14)} strokeWidth={2.4} {...p}><path d="m5 12 5 5L20 7" /></svg>)
export const ChevronIcon = (p: P) => (<svg {...base(14)} strokeWidth={2} {...p}><path d="m6 9 6 6 6-6" /></svg>)
export const GlobeIcon = (p: P) => (<svg {...base(13)} strokeWidth={2} {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>)
export const PageIcon = (p: P) => (<svg {...base(13)} strokeWidth={2} {...p}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6M8 13h8M8 17h5" /></svg>)
export const CloudIcon = (p: P) => (<svg {...base(13)} strokeWidth={2} {...p}><path d="M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6 9.5 4.25 4.25 0 0 0 7 18Z" /></svg>)
export const BookmarkIcon = (p: P) => (<svg {...base(13)} strokeWidth={2} {...p}><path d="M6 3h12v18l-6-4-6 4Z" /></svg>)
export const TodoIcon = (p: P) => (<svg {...base(13)} strokeWidth={2} {...p}><rect x="4" y="4" width="16" height="16" rx="3" /><path d="m8.5 12 2.5 2.5 4.5-5" /></svg>)
export const CopyIcon = (p: P) => (<svg {...base(14)} {...p}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" /></svg>)
export const RefreshIcon = (p: P) => (<svg {...base(14)} strokeWidth={2} {...p}><path d="M21 12a9 9 0 1 1-2.6-6.4L21 8" /><path d="M21 3v5h-5" /></svg>)
export const AlertIcon = (p: P) => (<svg {...base(18)} strokeWidth={2} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8v4.5M12 16h.01" /></svg>)
export const ClockIcon = (p: P) => (<svg {...base(15)} strokeWidth={2} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>)
export const WifiOffIcon = (p: P) => (<svg {...base(15)} strokeWidth={2} {...p}><path d="M2 2l20 20" /><path d="M8.5 16.5a5 5 0 0 1 7 0" /><path d="M5 12.9a10 10 0 0 1 5.2-2.8" /><path d="M19 12.9a10 10 0 0 0-2.3-1.6" /><path d="M12 20h.01" /></svg>)
export const SendIcon = (p: P) => (<svg {...base(16)} strokeWidth={2.2} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>)
export const TrashIcon = (p: P) => (<svg {...base(15)} {...p}><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></svg>)
