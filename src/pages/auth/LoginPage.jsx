import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Content, Footer, Screen, TopBar } from '../../components/layout'
import { Button, InputField, SocialLoginButton } from '../../components/controls'
import { getMe, login, socialLogin } from '../../api/auth'
import { useAppState } from '../../store/context'

// A2 로그인 · A3 로그인 오류
export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { state } = useAppState()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(location.state?.error || '')
  const [submitting, setSubmitting] = useState(false)
  const notice = location.state?.message

  const canSubmit = email.trim() && password && !submitting

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canSubmit) return
    setError('')
    setSubmitting(true)
    try {
      await login({ email, password })
      const me = await getMe()
      if (!me) throw new Error('로그인 상태를 확인할 수 없습니다.')
      navigate(state.permissionsDone ? '/home' : '/permissions', { replace: true })
    } catch (err) {
      // 백엔드 메시지를 그대로 보여준다 (예: "이메일 또는 비밀번호가 올바르지 않습니다.")
      setError(err.message || '로그인에 실패했어요.')
      setPassword('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen bg="surface">
      <TopBar title="" backTo="/" />
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <Content gap={16}>
          <div className="heading">
            <p className="t-title-s c-brand">버스비</p>
            <h2 className="t-title-l">다시 만나서 반가워요</h2>
          </div>
          {notice && <p className="notice notice--brand t-caption-medium">{notice}</p>}
          <InputField
            label="이메일"
            type="email"
            autoComplete="email"
            placeholder="이메일을 입력하세요"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <InputField
            label="비밀번호"
            type="password"
            autoComplete="current-password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            error={error}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" disabled={!canSubmit}>
            {submitting ? '로그인 중…' : '로그인'}
          </Button>
          <div className="or-divider t-caption c-tertiary">
            <span>또는 간편 로그인</span>
          </div>
          <SocialLoginButton provider="kakao" onClick={() => socialLogin('kakao')} />
          <SocialLoginButton provider="naver" onClick={() => socialLogin('naver')} />
          <SocialLoginButton provider="google" onClick={() => socialLogin('google')} />
        </Content>
      </form>
      <Footer>
        <p className="text-link t-body-s c-secondary">
          아직 계정이 없나요?
          <Link to="/signup" className="t-body-s-medium c-brand">
            회원가입
          </Link>
        </p>
      </Footer>
    </Screen>
  )
}
