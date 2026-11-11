const API_URL = '/api/auth'

// 서버 응답 처리 공통 함수
async function handleResponse(response) {
  const text = await response.text()

  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(
      data?.message || `요청 실패 (${response.status})`
    )
  }

  return data
}

// 회원가입
export async function signup(userData) {
  const response = await fetch(`${API_URL}/signup`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  })

  return handleResponse(response)
}

// 로그인
export async function login(userData) {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  })

  return handleResponse(response)
}

// 현재 로그인한 사용자 조회
export async function getMe() {
  const response = await fetch(`${API_URL}/me`, {
    method: 'GET',
    credentials: 'include',
  })

  if (response.status === 401) {
    return null
  }

  return handleResponse(response)
}



// 로그아웃
export async function logout() {
  const response = await fetch(`${API_URL}/logout`, {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`로그아웃 실패 (${response.status})`)
  }
}

// 소셜 로그인 시작 (배포에서는 Vercel이 /oauth2를 백엔드로 넘기므로 같은 도메인을 쓴다)
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:8080' : '')

export function socialLogin(provider) {

  const allowedProviders = ['kakao', 'google', 'naver']

  if (!allowedProviders.includes(provider)) {
    throw new Error('지원하지 않는 로그인 방식입니다.')
  }

  window.location.href =
    `${BACKEND_URL}/oauth2/authorization/${provider}`
}