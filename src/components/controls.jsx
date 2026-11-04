import { useId, useState } from 'react'
import { Check, Eye, EyeOff } from 'lucide-react'
import { GoogleLogo, KakaoLogo, NaverLogo } from './BrandLogos'

// 피그마 Button: Style(Primary/Secondary/Tertiary) × Size(L/M) × State(Default/Disabled)
export function Button({ variant = 'primary', size = 'l', type = 'button', className = '', children, ...rest }) {
  return (
    <button
      type={type}
      className={`btn btn--${variant} btn--${size} ${size === 'l' ? 't-body-l-bold' : 't-body-s-medium'} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

const SOCIAL = {
  kakao: { label: '카카오로 계속하기', Logo: KakaoLogo },
  naver: { label: '네이버로 계속하기', Logo: NaverLogo },
  google: { label: 'Google로 계속하기', Logo: GoogleLogo },
}

// 피그마 SocialLoginButton: Provider=Kakao/Naver/Google
export function SocialLoginButton({ provider, onClick }) {
  const { label, Logo } = SOCIAL[provider]
  return (
    <button type="button" className={`social-btn social-btn--${provider} t-body-m-medium`} onClick={onClick}>
      <Logo size={20} />
      {label}
    </button>
  )
}

// 피그마 InputField: State=Default/Focus/Error (포커스는 CSS가 처리)
export function InputField({ label, error, helper, type = 'text', className = '', ...rest }) {
  const id = useId()
  const [reveal, setReveal] = useState(false)
  const isPassword = type === 'password'
  const message = error || helper
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id} className="t-body-s-medium c-secondary">
        {label}
      </label>
      <div className={`field__box ${error ? 'field__box--error' : ''}`}>
        <input
          id={id}
          className="field__input t-body-m"
          type={isPassword && reveal ? 'text' : type}
          aria-invalid={!!error}
          aria-describedby={message ? `${id}-msg` : undefined}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            className="icon-button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? '비밀번호 숨기기' : '비밀번호 보기'}
          >
            {reveal ? <EyeOff size={22} color="var(--icon-default)" /> : <Eye size={22} color="var(--icon-default)" />}
          </button>
        )}
      </div>
      {message && (
        <p id={`${id}-msg`} className={`t-caption ${error ? 'c-danger' : 'c-secondary'}`}>
          {message}
        </p>
      )}
    </div>
  )
}

// 피그마 Chip: 일정 유형 · 정렬 · 대안 경로 탭
export function Chip({ selected, icon: ChipIcon, onClick, children, className = '' }) {
  return (
    <button
      type="button"
      className={`chip ${selected ? 'chip--selected' : ''} t-body-m-medium ${className}`}
      aria-pressed={!!selected}
      onClick={onClick}
    >
      {ChipIcon && <ChipIcon size={20} color={selected ? 'var(--icon-inverse)' : 'var(--icon-strong)'} />}
      {children}
    </button>
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`toggle ${checked ? 'toggle--on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle__knob" />
    </button>
  )
}

export function Checkbox({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      className={`checkbox ${checked ? 'checkbox--on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      {checked && <Check size={16} color="var(--icon-inverse)" strokeWidth={3} />}
    </button>
  )
}

export function DayChip({ selected, onClick, children }) {
  return (
    <button
      type="button"
      className={`day-chip ${selected ? 'day-chip--on' : ''} t-body-s-medium`}
      aria-pressed={!!selected}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
