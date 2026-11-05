import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { Content, Screen } from '../components/layout'
import { Card } from '../components/display'
import { useAppState } from '../store/context'

// 디자인 검수용 화면 목록 — 피그마 03 Screens 번호와 같음
const GROUPS = [
  {
    title: 'A. 로그인·간편 로그인',
    items: [
      ['A1', '시작 화면', '/'],
      ['A2', '로그인', '/login'],
      ['A3', '로그인 오류 (잘못된 비밀번호로 로그인 시도)', '/login'],
      ['A4', '회원가입', '/signup'],
      ['A5', '위치·알림 권한 안내', '/permissions'],
    ],
  },
  {
    title: 'B. 홈·일정 설정',
    items: [
      ['B1', '홈 · 첫 사용', '/home', 'empty'],
      ['B2', '홈 · 일정 입력 완료', '/home', 'filled'],
      ['B3', '홈 · 알람 설정됨', '/home', 'alarm'],
      ['B4', '목적지 검색', '/schedule/destination'],
      ['B5', '출발 위치 선택', '/schedule/origin'],
      ['B6', '도착 희망 시간 (홈에서 시간 행 누르기)', '/home', 'filled'],
      ['B7', '이용 노선 선택', '/schedule/route'],
    ],
  },
  {
    title: 'C. 카카오맵 지도·대중교통 노선',
    items: [
      ['C1', '추천 경로', '/route'],
      ['C2', '노선 상세', '/route/detail'],
      ['C3', '경로 옵션 비교', '/route/options'],
      ['C4', '추천 경로 · 불러오는 중', '/route?state=loading'],
      ['C5', '추천 경로 · 불러오기 실패', '/route?state=error'],
      ['C6', '추천 경로 · 곧 도착 (5분 이하 빨간색)', '/route?state=soon'],
    ],
  },
  {
    title: 'D. 기상·출발 알람',
    items: [
      ['D1', '준비 시간 학습', '/alarm'],
      ['D2', '준비 시간 학습 · 기록 부족', '/alarm?state=learning'],
      ['D3', '준비 항목 편집', '/alarm/prep'],
      ['D4', '알람 설정', '/alarm/settings'],
      ['D5', '기상 알람', '/alarm/wake'],
      ['D6', '출발 알람', '/alarm/depart'],
      ['D7', '알람 자동 연기 알림', '/alarm/postponed'],
      ['D8', '버스 지연 안내', '/route/delay'],
      ['D9', 'DRT 안내 (지연 안내에서 DRT 행 누르기)', '/route/delay'],
    ],
  },
  {
    title: 'E. 더보기',
    items: [
      ['E1', '더보기', '/more'],
      ['E2', '광고 제거', '/more/ad-free'],
      ['E3', '권한·알림 설정', '/more/permissions'],
    ],
  },
]

const FILLED = {
  destination: { id: 'dmu', name: '동양미래대학교', address: '서울 구로구 경인로 445', lat: 37.5004, lng: 126.8677 },
  arrival: { ampm: '오전', hour: 9, minute: 0 },
  origin: { name: '내 집', address: '서울 구로구 구로동', lat: 37.4878, lng: 126.8983 },
  route: '160',
}

export default function ScreensPage() {
  const { update } = useAppState()
  const prepare = (preset) => {
    if (preset === 'empty') update({ destination: null, arrival: null, origin: null, route: null, alarmSet: false })
    if (preset === 'filled') update({ ...FILLED, alarmSet: false })
    if (preset === 'alarm') update({ ...FILLED, alarmSet: true })
  }

  return (
    <Screen>
      <Content gap={16} style={{ paddingTop: 24 }}>
        <h1 className="t-title-l">버스비 화면 목록</h1>
        <p className="t-body-s c-secondary">피그마 03 Screens와 같은 번호예요. 눌러서 각 화면을 확인하세요.</p>
        {GROUPS.map((g) => (
          <section key={g.title} className="screens-group">
            <h2 className="t-body-s-medium c-secondary">{g.title}</h2>
            <Card>
              {g.items.map(([no, name, to, preset]) => (
                <Link key={no} to={to} className="screens-row" onClick={() => prepare(preset)}>
                  <span className="t-body-s-medium c-brand screens-row__no">{no}</span>
                  <span className="t-body-m">{name}</span>
                  <ChevronRight size={18} color="var(--icon-default)" />
                </Link>
              ))}
            </Card>
          </section>
        ))}
      </Content>
    </Screen>
  )
}
