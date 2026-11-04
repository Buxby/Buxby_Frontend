import { ArrowRight, BusFront, CarFront, ChevronRight, Info, Minus, Plus, Sparkle, SquareArrowOutUpRight } from 'lucide-react'
import { Toggle } from './controls'

export function Card({ as: Tag = 'section', className = '', padded = false, children, ...rest }) {
  return (
    <Tag className={`card ${padded ? 'card--padded' : ''} ${className}`} {...rest}>
      {children}
    </Tag>
  )
}

export function Divider() {
  return <hr className="divider" />
}

export function IconTile({ icon: TileIcon, size = 44, iconSize = 24, tone = 'brand', round = false }) {
  return (
    <span
      className={`icon-tile icon-tile--${tone} ${round ? 'icon-tile--round' : ''}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <TileIcon size={iconSize} />
    </span>
  )
}

// 피그마 ListRow: 라벨 위 · 값 아래 · 화살표
export function ListRow({ icon: RowIcon, label, value, placeholder, onClick, chevron = true, badge }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag type={onClick ? 'button' : undefined} className="list-row" onClick={onClick}>
      {RowIcon && <RowIcon size={24} color="var(--icon-strong)" />}
      <span className="list-row__text">
        <span className="t-body-s c-secondary">{label}</span>
        <span className={`t-body-l-bold ${value ? '' : 'c-tertiary'}`}>
          {value || placeholder}
          {badge}
        </span>
      </span>
      {chevron && <ChevronRight size={24} color="var(--icon-default)" />}
    </Tag>
  )
}

// 피그마 SettingRow: Control=Toggle / Value
export function SettingRow({ title, description, checked, onToggle, value, onClick }) {
  const isToggle = typeof onToggle === 'function'
  const Tag = !isToggle && onClick ? 'button' : 'div'
  return (
    <Tag type={Tag === 'button' ? 'button' : undefined} className="setting-row" onClick={isToggle ? undefined : onClick}>
      <span className="setting-row__text">
        <span className="t-body-m-medium">{title}</span>
        {description && <span className="t-caption c-secondary">{description}</span>}
      </span>
      {isToggle ? (
        <Toggle checked={checked} onChange={onToggle} label={title} />
      ) : (
        <span className="setting-row__value">
          <span className="t-body-m-medium c-brand">{value}</span>
          <ChevronRight size={20} color="var(--icon-default)" />
        </span>
      )}
    </Tag>
  )
}

// 피그마 Badge: Tone=Success(실시간)/Danger(지연)/Brand(추천)/Neutral(광고)
export function Badge({ tone = 'brand', children }) {
  return <span className={`badge badge--${tone} t-caption-medium`}>{children}</span>
}

// 피그마 AlertBanner: Tone=Danger/Info
export function AlertBanner({ tone = 'info', icon: BannerIcon = tone === 'danger' ? BusFront : Info, title, children }) {
  return (
    <div className={`alert alert--${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <span className="alert__tile" aria-hidden="true">
        <BannerIcon size={28} />
      </span>
      <div className="alert__text">
        {title && <p className={`t-title-s ${tone === 'danger' ? 'c-danger' : 'c-brand'}`}>{title}</p>}
        <p className="t-body-s">{children}</p>
      </div>
    </div>
  )
}

const BUS_ROW = {
  bus: { tone: 'brand', Icon: BusFront, Trail: ChevronRight },
  alt: { tone: 'danger', Icon: BusFront, Trail: ChevronRight },
  drt: { tone: 'success', Icon: CarFront, Trail: SquareArrowOutUpRight },
}

// 피그마 BusRow: Type=Bus/AltBus/DRT
export function BusRow({ type = 'bus', route, tag, sub, onClick }) {
  const { tone, Icon, Trail } = BUS_ROW[type]
  return (
    <button type="button" className="bus-row" onClick={onClick}>
      <IconTile icon={Icon} tone={tone} />
      <span className="bus-row__text">
        <span className="bus-row__title">
          <span className="t-body-l-bold">{route}</span>
          {tag && <span className="t-body-s c-secondary">{tag}</span>}
        </span>
        <span className="t-body-s c-secondary">{sub}</span>
      </span>
      <Trail size={24} color={type === 'drt' ? 'var(--icon-strong)' : 'var(--icon-default)'} />
    </button>
  )
}

// 피그마 TimeRange: 최소·최대 소요 시간
export function TimeRange({ min, max, header = '예상 소요 시간 (도보 포함)' }) {
  return (
    <div className="time-range">
      <p className="t-body-s-medium c-secondary">{header}</p>
      <div className="time-range__row">
        <span className="time-range__box">
          <span className="t-body-s c-secondary">최소</span>
          <strong className="t-title-s">{min}분</strong>
        </span>
        <ArrowRight size={24} color="var(--icon-default)" aria-hidden="true" />
        <span className="time-range__box">
          <span className="t-body-s c-secondary">최대</span>
          <strong className="t-title-s">{max}분</strong>
        </span>
      </div>
    </div>
  )
}

// 피그마 AdBanner: 무료 이용자 광고 자리 (홈·경로 하단만, 알람 화면 제외)
export function AdBanner({ hidden }) {
  if (hidden) return null
  return (
    <aside className="ad-banner" aria-label="광고">
      <Badge tone="neutral">광고</Badge>
      <span className="ad-banner__text">
        <span className="t-body-s-medium c-secondary">광고 영역</span>
        <span className="t-caption c-tertiary">광고 제거 ₩3,900 (한 번 결제)</span>
      </span>
    </aside>
  )
}

// 피그마 PrepRow: Mode=View/Edit
export function PrepRow({ icon, name, sub, minutes, onChange }) {
  return (
    <div className="prep-row">
      <IconTile icon={icon} tone="brand-strong" />
      <span className="prep-row__text">
        <span className="t-body-m-medium">{name}</span>
        <span className="t-body-s c-secondary">{sub}</span>
      </span>
      {onChange && (
        <span className="stepper">
          <button type="button" className="stepper__btn" aria-label={`${name} 1분 줄이기`} onClick={() => onChange(Math.max(0, minutes - 1))}>
            <Minus size={16} color="var(--icon-strong)" />
          </button>
          <span className="stepper__value t-body-m-medium">{minutes}분</span>
          <button type="button" className="stepper__btn" aria-label={`${name} 1분 늘리기`} onClick={() => onChange(minutes + 1)}>
            <Plus size={16} color="var(--icon-strong)" />
          </button>
        </span>
      )}
    </div>
  )
}

// 피그마 RouteStep: Type=Walk/Board/Ride/Alight/Arrive
export function RouteStep({ type, title, sub }) {
  return (
    <li className={`route-step route-step--${type}`}>
      <span className="route-step__rail" aria-hidden="true">
        <span className="route-step__dot" />
        <span className="route-step__line" />
      </span>
      <span className="route-step__text">
        <span className={type === 'ride' ? 't-body-s c-secondary' : 't-body-m-medium'}>{title}</span>
        <span className="t-caption c-secondary">{sub}</span>
      </span>
    </li>
  )
}

// 피그마 NotificationCard: 푸시 알림
export function NotificationCard({ icon: CardIcon = BusFront, title, body, time = '지금', onClick }) {
  return (
    <button type="button" className="noti-card" onClick={onClick}>
      <span className="noti-card__icon" aria-hidden="true">
        <CardIcon size={20} color="var(--icon-inverse)" />
      </span>
      <span className="noti-card__text">
        <span className="noti-card__top">
          <span className="t-caption-medium c-secondary">버스비</span>
          <span className="t-caption c-tertiary">{time}</span>
        </span>
        <span className="t-body-m-medium">{title}</span>
        <span className="t-body-s c-secondary">{body}</span>
      </span>
    </button>
  )
}

// 일러스트 자리 (디자인 보완 요청 대상)
export function IllustrationSlot({ height = 96, width, label }) {
  return (
    <div className="illust-slot" style={{ height, width }} role="img" aria-label={label || '일러스트'}>
      <Sparkle size={height > 120 ? 40 : 28} color="var(--icon-brand)" />
      {label && <span className="t-caption c-brand">{label}</span>}
    </div>
  )
}

export function SectionLabel({ children }) {
  return <p className="section-label t-body-s-medium c-secondary">{children}</p>
}

export function Notice({ icon: NoticeIcon = Info, tone = 'brand', children }) {
  return (
    <p className={`notice notice--${tone}`}>
      <NoticeIcon size={18} aria-hidden="true" />
      <span className="t-caption-medium">{children}</span>
    </p>
  )
}

export function Toast({ message }) {
  if (!message) return null
  return (
    <div className="toast t-body-s-medium" role="status">
      {message}
    </div>
  )
}
