
import { useEffect, useState } from 'react'
import './App.css'

import {
  signup,
  login,
  getMe,
  logout,
  socialLogin
} from './api/auth'

import MapView from "./components/MapView";

function App() {
  // 화면 모드
  const [mode, setMode] = useState('login')

  // 입력 데이터
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')

  // 로그인 사용자
  const [user, setUser] = useState(null)

  // 화면 상태
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // 최초 실행 시 로그인 상태 확인
  useEffect(() => {
    let cancelled = false

    async function checkLogin() {
      try {
        const data = await getMe()

        if (!cancelled) {
          setUser(data)
        }
      } catch (error) {
        if (!cancelled) {
          setError(error.message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    checkLogin()

    return () => {
      cancelled = true
    }
  }, [])

  // 회원가입 또는 로그인
  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setMessage('')

    try {
      if (mode === 'signup') {
        await signup({
          email,
          password,
          nickname,
        })

        setMessage('회원가입이 완료되었습니다. 로그인해 주세요.')
        setMode('login')
        setPassword('')
      } else {
        await login({
          email,
          password,
        })

        const data = await getMe()

        if (!data) {
          throw new Error('로그인 상태를 확인할 수 없습니다.')
        }

        setUser(data)
        setPassword('')
      }
    } catch (error) {
      setError(error.message)
    }
  }

  // 로그아웃
  const handleLogout = async () => {
    try {
      await logout()

      setUser(null)
      setEmail('')
      setPassword('')
      setNickname('')
      setMessage('로그아웃되었습니다.')
      setError('')
    } catch (error) {
      setError(error.message)
    }
  }

  // 최초 로그인 확인 중
  if (loading) {
    return (
      <main className="container">
        <p>로그인 상태를 확인하고 있습니다.</p>
      </main>
    )
  }

  // 로그인 성공 화면
  if (user) {
    return (
      <main className="container">
        <section className="card">
          <h1>교통비서</h1>

          <p className="subtitle">
            로그인이 완료되었습니다.
          </p>

          <div className="user-info">
            <h2>환영합니다!</h2>

            <p>
              <strong>닉네임:</strong> {user.nickname}
            </p>

            <p>
              <strong>이메일:</strong> {user.email}
            </p>

            <p>
              <strong>로그인 방식:</strong> {user.provider}
            </p>
            <MapView />
          </div>

          <button
            className="main-button"
            onClick={handleLogout}
          >
            로그아웃
          </button>

          {error && (
            <p className="error">{error}</p>
          )}
        </section>
      </main>
    )
  }

  // 로그인 / 회원가입 화면
  return (
    <main className="container">
      <section className="card">
        <h1>교통비서</h1>

        <p className="subtitle">
          편리한 대중교통 이용을 위한 나만의 비서
        </p>

        <div className="tab-menu">
          <button
            className={mode === 'login' ? 'active' : ''}
            onClick={() => {
              setMode('login')
              setError('')
              setMessage('')
            }}
          >
            로그인
          </button>

          <button
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => {
              setMode('signup')
              setError('')
              setMessage('')
            }}
          >
            회원가입
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="form-group">
              <label>닉네임</label>

              <input
                type="text"
                placeholder="닉네임을 입력하세요"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={30}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>이메일</label>

            <input
              type="email"
              placeholder="이메일을 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>비밀번호</label>

            <input
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={mode === 'signup' ? 8 : undefined}
              maxLength={64}
              required
            />
          </div>

          {error && (
            <p className="error">{error}</p>
          )}

          {message && (
            <p className="success">{message}</p>
          )}

          <button
            type="submit"
            className="main-button"
          >
            {mode === 'login' ? '로그인' : '회원가입'}
          </button>
          <button onClick={() => socialLogin('kakao')}>
            카카오 로그인
          </button>

          <button onClick={() => socialLogin('google')}>
            Google 로그인
          </button>

          <button onClick={() => socialLogin('naver')}>
            네이버 로그인
          </button>
        </form>
      </section>
    </main>
  )
}

export default App
