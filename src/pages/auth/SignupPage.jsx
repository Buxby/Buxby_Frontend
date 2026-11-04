import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { Content, Footer, Screen, TopBar } from '../../components/layout'
import { Button, Checkbox, InputField } from '../../components/controls'
import { signup } from '../../api/auth'

const AGREEMENTS = [
  { id: 'terms', required: true, label: '서비스 이용약관 동의' },
  { id: 'location', required: true, label: '위치기반서비스 이용약관 동의' },
  { id: 'marketing', required: false, label: '버스 지연·이벤트 알림 수신' },
]
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// A4 회원가입 (백엔드 제약: 닉네임 30자, 비밀번호 8~64자)
export default function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nickname: '', email: '', password: '' })
  const [agreed, setAgreed] = useState({ terms: false, location: false, marketing: false })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const allAgreed = AGREEMENTS.every((a) => agreed[a.id])
  const requiredAgreed = AGREEMENTS.filter((a) => a.required).every((a) => agreed[a.id])
  const filled = form.nickname.trim() && form.email.trim() && form.password

  const validate = () => {
    const next = {}
    if (form.nickname.trim().length > 30) next.nickname = '닉네임은 30자까지 쓸 수 있어요.'
    if (!EMAIL_RE.test(form.email.trim())) next.email = '이메일 형식을 확인해 주세요.'
    if (form.password.length < 8 || form.password.length > 64) next.password = '비밀번호는 8~64자로 입력해 주세요.'
    return next
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length || !requiredAgreed) return
    setSubmitting(true)
    try {
      await signup({ nickname: form.nickname.trim(), email: form.email.trim(), password: form.password })
      navigate('/login', { replace: true, state: { message: '회원가입이 완료되었어요. 로그인해 주세요.' } })
    } catch (err) {
      const message = err.message || '회원가입에 실패했어요.'
      setErrors(message.includes('이메일') ? { email: message } : { form: message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen bg="surface">
      <TopBar title="회원가입" />
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <Content gap={16}>
          <InputField label="닉네임" placeholder="닉네임을 입력하세요" maxLength={30} value={form.nickname} onChange={set('nickname')} helper="최대 30자" error={errors.nickname} />
          <InputField label="이메일" type="email" autoComplete="email" placeholder="이메일을 입력하세요" value={form.email} onChange={set('email')} error={errors.email} />
          <InputField
            label="비밀번호"
            type="password"
            autoComplete="new-password"
            placeholder="비밀번호를 입력하세요"
            maxLength={64}
            value={form.password}
            onChange={set('password')}
            helper="8~64자로 입력해 주세요"
            error={errors.password}
          />
          <div className="agreements">
            <div className="agreements__row">
              <Checkbox
                checked={allAgreed}
                label="전체 동의"
                onChange={(v) => setAgreed({ terms: v, location: v, marketing: v })}
              />
              <span className="t-body-l-bold">전체 동의</span>
            </div>
            {AGREEMENTS.map((a) => (
              <div key={a.id} className="agreements__row">
                <Checkbox checked={agreed[a.id]} label={a.label} onChange={(v) => setAgreed((s) => ({ ...s, [a.id]: v }))} />
                <span className="t-body-s agreements__label">
                  <span className={`t-body-s-medium ${a.required ? 'c-brand' : 'c-secondary'}`}>[{a.required ? '필수' : '선택'}]</span> {a.label}
                </span>
                <ChevronRight size={16} color="var(--icon-default)" aria-hidden="true" />
              </div>
            ))}
          </div>
          <p className="t-caption c-tertiary">위치정보는 출발 감지와 경로 계산에만 사용해요. (위치정보법에 따른 위치기반서비스 신고 예정)</p>
          {errors.form && <p className="t-caption c-danger">{errors.form}</p>}
        </Content>
        <Footer>
          <Button type="submit" disabled={!filled || !requiredAgreed || submitting}>
            {submitting ? '가입 중…' : '가입하기'}
          </Button>
        </Footer>
      </form>
    </Screen>
  )
}
