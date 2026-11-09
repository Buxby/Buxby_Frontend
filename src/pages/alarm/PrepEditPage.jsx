import { Fragment, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Minus, Plus } from 'lucide-react'
import { Content, Footer, Screen, TopBar } from '../../components/layout'
import { Button, Chip } from '../../components/controls'
import { Card, Divider, MinutesField, Notice, PrepRow } from '../../components/display'
import { useAppState } from '../../store/context'
import { prepIcon } from './prepIcons'

const MODES = [
  { id: 'items', label: '항목별로' },
  { id: 'total', label: '한 번에' },
]
const PRESETS = [20, 30, 40, 50]
const STEP = 5
const MAX = 120

// D3-1 한 번에 입력: 항목을 나누지 않고 전체 준비 시간만 정함
function TotalInput({ value, onChange }) {
  const step = (d) => onChange(Math.min(MAX, Math.max(0, value + d)))
  return (
    <Card padded className="bulk-card">
      <span className="t-body-m-medium c-secondary">전체 준비 시간</span>
      <div className="bulk-card__input">
        <button type="button" className="round-btn" aria-label={`${STEP}분 줄이기`} onClick={() => step(-STEP)}>
          <Minus size={20} color="var(--icon-strong)" />
        </button>
        <MinutesField name="전체" minutes={value} onChange={onChange} size="l" />
        <button type="button" className="round-btn" aria-label={`${STEP}분 늘리기`} onClick={() => step(STEP)}>
          <Plus size={20} color="var(--icon-strong)" />
        </button>
      </div>
      <p className="t-caption c-tertiary" style={{ textAlign: 'center' }}>
        −/+는 {STEP}분씩 조절돼요
      </p>
      <div className="chip-row chip-row--fill" role="group" aria-label="자주 쓰는 시간">
        {PRESETS.map((m) => (
          <Chip key={m} selected={value === m} onClick={() => onChange(m)}>
            {m}분
          </Chip>
        ))}
      </div>
    </Card>
  )
}

// D3 준비 항목 편집 · D3-1 한 번에 입력
export default function PrepEditPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { state, update } = useAppState()
  const [mode, setMode] = useState(params.get('mode') ?? state.prepMode ?? 'items')
  const [items, setItems] = useState(state.prep)
  const itemsTotal = items.reduce((sum, p) => sum + p.minutes, 0)
  const [bulk, setBulk] = useState(state.prepTotal ?? itemsTotal)

  const change = (id, minutes) => setItems((list) => list.map((p) => (p.id === id ? { ...p, minutes } : p)))
  const addItem = () => setItems((list) => [...list, { id: `custom-${list.length}`, icon: 'etc', name: '새 준비 항목', minutes: 5 }])

  const save = () => {
    update(mode === 'total' ? { prepMode: 'total', prepTotal: bulk } : { prepMode: 'items', prep: items })
    navigate(-1)
  }

  return (
    <Screen>
      <TopBar title="준비 시간 설정" />
      <Content gap={12}>
        <p className="t-body-m c-secondary">
          일어나서 집을 나서기까지 하는 일을 적어 주세요.
          <br />
          기록이 쌓이면 최근 기록의 평균으로 바꿔 계산해요.
        </p>
        <div className="chip-row chip-row--fill" role="group" aria-label="입력 방식">
          {MODES.map((m) => (
            <Chip key={m.id} selected={mode === m.id} onClick={() => setMode(m.id)}>
              {m.label}
            </Chip>
          ))}
        </div>

        {mode === 'items' ? (
          <>
            <p className="t-caption c-brand">숫자를 눌러 직접 입력하거나, −/+로 1분씩 조절해요.</p>
            <Card>
              {items.map((p, i) => (
                <Fragment key={p.id}>
                  {i > 0 && <Divider />}
                  <PrepRow icon={prepIcon(p.icon)} name={p.name} sub={`저장값 ${state.prep.find((s) => s.id === p.id)?.minutes ?? p.minutes}분`} minutes={p.minutes} onChange={(m) => change(p.id, m)} />
                </Fragment>
              ))}
              <Divider />
              <button type="button" className="add-row t-body-m-medium c-brand" onClick={addItem}>
                <Plus size={20} color="var(--icon-brand)" /> 항목 추가
              </button>
            </Card>
            <div className="total-box">
              <span className="t-body-m-medium">합계 준비 시간</span>
              <strong className="t-title-s c-brand">{itemsTotal}분</strong>
            </div>
          </>
        ) : (
          <>
            <TotalInput value={bulk} onChange={setBulk} />
            <Notice center>항목을 나누지 않고 전체 시간만 정해요. 기록이 쌓이면 최근 기록의 평균으로 바꿔 계산해요.</Notice>
          </>
        )}
      </Content>
      <Footer>
        <Button onClick={save}>저장</Button>
      </Footer>
    </Screen>
  )
}
