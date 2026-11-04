import { Fragment, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { AlarmClock, Bed, Bell, ChevronRight, LogOut, MapPin, ShieldCheck, User } from 'lucide-react'
import { BottomNav, Content, Screen, TopBar } from '../../components/layout'
import { Button } from '../../components/controls'
import { Card, Divider, IconTile } from '../../components/display'
import { getMe, logout } from '../../api/auth'

const PROVIDER = {
  KAKAO: { label: '카카오', className: 'provider--kakao' },
  NAVER: { label: '네이버', className: 'provider--naver' },
  GOOGLE: { label: 'Google', className: 'provider--google' },
  LOCAL: { label: '이메일', className: 'provider--local' },
}

const MENUS = [
  { icon: AlarmClock, label: '알람 설정', to: '/alarm/settings' },
  { icon: Bed, label: '준비 시간 학습', to: '/alarm' },
  { icon: Bell, label: '권한·알림 설정', to: '/more/permissions' },
  { icon: MapPin, label: '서비스 지역 안내 (경기도 우선)', to: null },
  { icon: ShieldCheck, label: '이용약관·위치기반서비스 약관', to: null },
]

function MenuRow({ icon: RowIcon, label, onClick, danger }) {
  return (
    <button type="button" className="menu-row" onClick={onClick}>
      <RowIcon size={20} color={danger ? 'var(--icon-danger)' : 'var(--icon-strong)'} />
      <span className={`t-body-m-medium ${danger ? 'c-danger' : ''}`}>{label}</span>
      <ChevronRight size={18} color="var(--icon-default)" />
    </button>
  )
}

// E1 더보기
export default function MorePage() {
  const navigate = useNavigate()
  const [me, setMe] = useState(undefined)

  useEffect(() => {
    let cancelled = false
    getMe()
      .then((data) => !cancelled && setMe(data))
      .catch(() => !cancelled && setMe(null))
    return () => {
      cancelled = true
    }
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      // 이미 로그아웃된 상태여도 로그인 화면으로 보낸다
    }
    navigate('/login', { replace: true })
  }

  const provider = PROVIDER[me?.provider] ?? PROVIDER.LOCAL

  return (
    <Screen>
      <TopBar variant="large" title="더보기" />
      <Content gap={16}>
        <Card padded className="profile-card">
          <IconTile icon={User} size={52} iconSize={26} round />
          {me ? (
            <>
              <div className="profile-card__text">
                <p className="t-body-l-bold">{me.nickname} 님</p>
                <p className="t-body-s c-secondary">{me.email ?? '이메일 정보 없음'}</p>
              </div>
              <span className={`provider ${provider.className} t-caption-medium`}>{provider.label}</span>
            </>
          ) : (
            <>
              <div className="profile-card__text">
                <p className="t-body-l-bold">{me === undefined ? '불러오는 중…' : '로그인이 필요해요'}</p>
                <p className="t-body-s c-secondary">일정과 알람을 계정에 저장해요</p>
              </div>
              {me === null && (
                <Button size="m" variant="secondary" onClick={() => navigate('/login')}>
                  로그인
                </Button>
              )}
            </>
          )}
        </Card>
        <section className="ad-free-card">
          <div>
            <p className="t-body-l-bold">광고 없이 쓰기</p>
            <p className="t-body-s">₩3,900 · 한 번만 결제</p>
          </div>
          <Button size="m" variant="secondary" onClick={() => navigate('/more/ad-free')}>
            자세히
          </Button>
        </section>
        <Card>
          {MENUS.map((m, i) => (
            <Fragment key={m.label}>
              {i > 0 && <Divider />}
              <MenuRow icon={m.icon} label={m.label} onClick={() => m.to && navigate(m.to)} />
            </Fragment>
          ))}
        </Card>
        <Card>
          <MenuRow icon={LogOut} label="로그아웃" danger onClick={handleLogout} />
        </Card>
      </Content>
      <BottomNav />
    </Screen>
  )
}
