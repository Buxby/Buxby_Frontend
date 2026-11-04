import { useMemo, useState } from 'react'
import { Content, Screen, TopBar } from '../../components/layout'
import { Chip } from '../../components/controls'
import { Badge } from '../../components/display'
import { ROUTE_COMPARE } from '../../data/mock'

const SORTS = [
  { id: 'recommend', label: '추천순' },
  { id: 'fast', label: '빨리 도착' },
  { id: 'walk', label: '도보 적게' },
]

// C3 경로 옵션 비교
export default function RouteOptionsPage() {
  const [sort, setSort] = useState('recommend')
  const [selected, setSelected] = useState(ROUTE_COMPARE[0].id)

  const list = useMemo(() => {
    const copy = [...ROUTE_COMPARE]
    if (sort === 'fast') copy.sort((a, b) => a.min - b.min)
    if (sort === 'walk') copy.sort((a, b) => a.walk - b.walk)
    return copy
  }, [sort])

  return (
    <Screen>
      <TopBar title="다른 경로" />
      <Content gap={12}>
        <div className="chip-row" role="group" aria-label="정렬">
          {SORTS.map((s) => (
            <Chip key={s.id} selected={sort === s.id} onClick={() => setSort(s.id)}>
              {s.label}
            </Chip>
          ))}
        </div>
        {list.map((o) => {
          const on = selected === o.id
          const total = o.walk + o.ride
          return (
            <button key={o.id} type="button" className={`option-card ${on ? 'option-card--on' : ''}`} aria-pressed={on} onClick={() => setSelected(o.id)}>
              <span className="option-card__top">
                <span className="t-body-l-bold">
                  최소 {o.min}분 ~ 최대 {o.max}분
                </span>
                {o.recommended && <Badge tone="brand">추천</Badge>}
              </span>
              <span className="ratio-bar" aria-hidden="true">
                <span style={{ flexGrow: o.walk / total }} className="ratio-bar__walk" />
                <span style={{ flexGrow: o.ride / total }} className="ratio-bar__ride" />
              </span>
              <span className="t-body-s c-secondary">
                {o.name} · 도보 {o.walk}분 · {o.transfer}
              </span>
            </button>
          )
        })}
        <p className="t-caption c-tertiary">최소·최대 소요 시간은 최근 도착 기록의 오차를 반영해 계산해요.</p>
      </Content>
    </Screen>
  )
}
