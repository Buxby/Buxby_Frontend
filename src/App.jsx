import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router'
import { useAppState } from './store/context'

import StartPage from './pages/auth/StartPage'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import PermissionPage from './pages/auth/PermissionPage'
import HomePage from './pages/home/HomePage'
import DestinationSearchPage from './pages/home/DestinationSearchPage'
import OriginSelectPage from './pages/home/OriginSelectPage'
import RouteSelectPage from './pages/home/RouteSelectPage'
import RecommendRoutePage from './pages/route/RecommendRoutePage'
import RouteDetailPage from './pages/route/RouteDetailPage'
import RouteOptionsPage from './pages/route/RouteOptionsPage'
import DelayPage from './pages/route/DelayPage'
import PrepLearningPage from './pages/alarm/PrepLearningPage'
import PrepEditPage from './pages/alarm/PrepEditPage'
import AlarmSettingsPage from './pages/alarm/AlarmSettingsPage'
import WakeAlarmPage from './pages/alarm/WakeAlarmPage'
import DepartAlarmPage from './pages/alarm/DepartAlarmPage'
import PostponedPage from './pages/alarm/PostponedPage'
import MorePage from './pages/more/MorePage'
import AdFreePage from './pages/more/AdFreePage'
import PermissionSettingsPage from './pages/more/PermissionSettingsPage'
import ScreensPage from './pages/ScreensPage'

// 간편 로그인 후 백엔드가 /?socialLogin=success|failed 로 돌려보낸다
function SocialLoginRedirect() {
  const location = useLocation()
  const navigate = useNavigate()
  const { state } = useAppState()

  useEffect(() => {
    const result = new URLSearchParams(location.search).get('socialLogin')
    if (result === 'success') navigate(state.permissionsDone ? '/home' : '/permissions', { replace: true })
    if (result === 'failed') navigate('/login', { replace: true, state: { error: '간편 로그인에 실패했어요. 다시 시도해 주세요.' } })
  }, [location.search, navigate, state.permissionsDone])

  return null
}

export default function App() {
  return (
    <div className="app-column">
      <SocialLoginRedirect />
      <Routes>
        {/* A. 로그인·간편 로그인 */}
        <Route path="/" element={<StartPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/permissions" element={<PermissionPage />} />

        {/* B. 홈·일정 설정 */}
        <Route path="/home" element={<HomePage />} />
        <Route path="/schedule/destination" element={<DestinationSearchPage />} />
        <Route path="/schedule/origin" element={<OriginSelectPage />} />
        <Route path="/schedule/route" element={<RouteSelectPage />} />

        {/* C. 카카오맵 지도·대중교통 노선 */}
        <Route path="/route" element={<RecommendRoutePage />} />
        <Route path="/route/detail" element={<RouteDetailPage />} />
        <Route path="/route/options" element={<RouteOptionsPage />} />
        <Route path="/route/delay" element={<DelayPage />} />

        {/* D. 기상·출발 알람 */}
        <Route path="/alarm" element={<PrepLearningPage />} />
        <Route path="/alarm/prep" element={<PrepEditPage />} />
        <Route path="/alarm/settings" element={<AlarmSettingsPage />} />
        <Route path="/alarm/wake" element={<WakeAlarmPage />} />
        <Route path="/alarm/depart" element={<DepartAlarmPage />} />
        <Route path="/alarm/postponed" element={<PostponedPage />} />

        {/* E. 더보기 */}
        <Route path="/more" element={<MorePage />} />
        <Route path="/more/ad-free" element={<AdFreePage />} />
        <Route path="/more/permissions" element={<PermissionSettingsPage />} />

        {/* 화면 목록 (디자인 검수용) */}
        <Route path="/screens" element={<ScreensPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
