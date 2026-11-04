import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowRight, BusFront, Check } from 'lucide-react'
import { Content, Footer, Screen, TopBar } from '../../components/layout'
import { Button } from '../../components/controls'
import { Badge, IconTile } from '../../components/display'
import { ROUTE_OPTIONS } from '../../data/mock'
import { useAppState } from '../../store/context'

// B7 이용 노선 선택
export default function RouteSelectPage() {
  const navigate = useNavigate()
  const { state, update } = useAppState()
  const [selected, setSelected] = useState(state.route ?? ROUTE_OPTIONS[0].no)

  return (
    <Screen>
      <TopBar title="이용 노선" />
      <Content gap={12}>
        <p className="t-body-m c-secondary">
          {state.origin?.name ?? '내 집'} → {state.destination?.name ?? '동양미래대학교'}
          <br />
          오전 9:00 도착 기준으로 추천해요
        </p>
        {ROUTE_OPTIONS.map((r) => {
          const on = selected === r.no
          return (
            <button key={r.no} type="button" className={`option-card ${on ? 'option-card--on' : ''}`} aria-pressed={on} onClick={() => setSelected(r.no)}>
              <span className="option-card__top">
                <IconTile icon={BusFront} size={32} iconSize={18} tone={on ? 'solid' : 'brand'} />
                <span className="t-body-l-bold">{r.no}번</span>
                <span className="t-caption c-secondary">{r.type}</span>
                {r.recommended && <Badge tone="brand">추천</Badge>}
                <span className="spacer" />
                {on && <Check size={20} color="var(--icon-brand)" />}
              </span>
              <span className="t-body-s c-secondary">
                {r.stop} · 도보 {r.walk}분
              </span>
              <span className="option-card__range">
                <span className="t-body-s-medium">최소 {r.min}분</span>
                <ArrowRight size={14} color="var(--icon-default)" aria-hidden="true" />
                <span className="t-body-s-medium">최대 {r.max}분</span>
                <span className="t-body-s c-secondary">· 배차 {r.headway}분</span>
              </span>
            </button>
          )
        })}
      </Content>
      <Footer>
        <Button
          onClick={() => {
            update({ route: selected })
            navigate('/home')
          }}
        >
          {selected}번으로 설정
        </Button>
      </Footer>
    </Screen>
  )
}
