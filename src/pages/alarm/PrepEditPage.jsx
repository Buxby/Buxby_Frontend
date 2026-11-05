import { Fragment, useState } from 'react'
import { useNavigate } from 'react-router'
import { Plus } from 'lucide-react'
import { Content, Footer, Screen, TopBar } from '../../components/layout'
import { Button } from '../../components/controls'
import { Card, Divider, PrepRow } from '../../components/display'
import { useAppState } from '../../store/context'
import { prepIcon } from './prepIcons'

// D3 준비 항목 편집
export default function PrepEditPage() {
  const navigate = useNavigate()
  const { state, update } = useAppState()
  const [items, setItems] = useState(state.prep)
  const total = items.reduce((sum, p) => sum + p.minutes, 0)

  const change = (id, minutes) => setItems((list) => list.map((p) => (p.id === id ? { ...p, minutes } : p)))
  const addItem = () => setItems((list) => [...list, { id: `custom-${list.length}`, icon: 'etc', name: '새 준비 항목', minutes: 5 }])

  return (
    <Screen>
      <TopBar title="준비 시간 설정" />
      <Content gap={16}>
        <p className="t-body-m c-secondary">
          일어나서 집을 나서기까지 하는 일을 적어 주세요.
          <br />
          기록이 쌓이면 AI가 시간을 보정해요.
        </p>
        <p className="t-caption c-brand">숫자를 눌러 직접 입력하거나, −/+로 1분씩 조절해요.</p>
        <Card>
          {items.map((p, i) => (
            <Fragment key={p.id}>
              {i > 0 && <Divider />}
              <PrepRow icon={prepIcon(p.icon)} name={p.name} sub={`평균 ${state.prep.find((s) => s.id === p.id)?.minutes ?? p.minutes}분`} minutes={p.minutes} onChange={(m) => change(p.id, m)} />
            </Fragment>
          ))}
          <Divider />
          <button type="button" className="add-row t-body-m-medium c-brand" onClick={addItem}>
            <Plus size={20} color="var(--icon-brand)" /> 항목 추가
          </button>
        </Card>
        <div className="total-box">
          <span className="t-body-m-medium">합계 준비 시간</span>
          <strong className="t-title-s c-brand">{total}분</strong>
        </div>
      </Content>
      <Footer>
        <Button
          onClick={() => {
            update({ prep: items })
            navigate(-1)
          }}
        >
          저장
        </Button>
      </Footer>
    </Screen>
  )
}
