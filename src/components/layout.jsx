import { useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router'
import { AlarmClock, ChevronLeft, Ellipsis, House, Route, X } from 'lucide-react'

// 화면 틀: 상단바 · 스크롤 영역 · 하단(버튼/탭)을 세로로 배치
export function Screen({ bg = 'canvas', className = '', children }) {
  return <div className={`screen screen--${bg} ${className}`}>{children}</div>
}

export function Content({ className = '', gap = 16, children, style }) {
  return (
    <main className={`screen__content ${className}`} style={{ gap, ...style }}>
      {children}
    </main>
  )
}

export function Footer({ children }) {
  return <div className="screen__footer">{children}</div>
}

export function Spacer() {
  return <div className="spacer" aria-hidden="true" />
}

// 피그마 TopBar (Type=Back / Type=Large)
export function TopBar({ variant = 'back', title, action, right, backTo }) {
  const navigate = useNavigate()
  const goBack = () => {
    if (backTo) navigate(backTo)
    else if (window.history.length > 1) navigate(-1)
    else navigate('/home')
  }

  if (variant === 'large') {
    return (
      <header className="topbar topbar--large">
        <h1 className="t-title-l">{title}</h1>
        <div className="topbar__right">{right}</div>
      </header>
    )
  }

  return (
    <header className="topbar">
      <div className="topbar__side">
        <button type="button" className="icon-button" onClick={goBack} aria-label="뒤로 가기">
          <ChevronLeft size={24} color="var(--icon-strong)" />
        </button>
      </div>
      <h1 className="topbar__title t-title-s">{title}</h1>
      <div className="topbar__side topbar__side--right">
        {action && (
          <button type="button" className="topbar__action t-caption-medium" onClick={action.onClick}>
            {action.label}
          </button>
        )}
        {right}
      </div>
    </header>
  )
}

const NAV_ITEMS = [
  { to: '/home', label: '홈', Icon: House },
  { to: '/alarm', label: '알람', Icon: AlarmClock },
  { to: '/route', label: '경로', Icon: Route },
  { to: '/more', label: '더보기', Icon: Ellipsis },
]

// 피그마 BottomNav: 홈 · 알람 · 경로 · 더보기
export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      {NAV_ITEMS.map((item) => {
        const NavIcon = item.Icon
        return (
          <NavLink key={item.to} to={item.to} className="bottom-nav__item">
            {({ isActive }) => (
              <>
                <NavIcon size={24} color={isActive ? 'var(--icon-brand)' : 'var(--icon-default)'} />
                <span className={`t-label-nav ${isActive ? 'c-brand' : 'c-secondary'}`}>{item.label}</span>
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}

// 피그마 SheetHeader + 바텀시트
export function BottomSheet({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="sheet-layer">
      <button type="button" className="sheet-dim" aria-label="닫기" onClick={onClose} />
      <section className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet__handle" aria-hidden="true" />
        <div className="sheet__header">
          <h2 className="t-title-m">{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="닫기">
            <X size={24} color="var(--icon-default)" />
          </button>
        </div>
        <div className="sheet__body">{children}</div>
      </section>
    </div>
  )
}
