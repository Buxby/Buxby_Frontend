import { Ban, Check } from 'lucide-react'
import { Content, Footer, Screen, TopBar } from '../../components/layout'
import { Button } from '../../components/controls'
import { IconTile, Notice, Toast } from '../../components/display'
import { useToast } from '../../lib/useToast'

const PLANS = [
  { name: '무료', lines: ['AI 기상·출발 알람', '최소·최대 소요 시간', '홈·경로 화면 하단 광고'], on: false },
  { name: '광고 제거', lines: ['AI 기상·출발 알람', '최소·최대 소요 시간', '광고 없음'], on: true },
]

// E2 광고 제거 (₩3,900 일회성 결제) — 결제 연동 전
export default function AdFreePage() {
  const [toast, showToast] = useToast()
  return (
    <Screen bg="surface">
      <TopBar title="광고 제거" />
      <Content gap={16} style={{ paddingTop: 16 }}>
        <IconTile icon={Ban} size={64} iconSize={32} />
        <h1 className="t-display-l">
          광고 없이
          <br />
          버스비 쓰기
        </h1>
        <p className="t-body-m c-secondary">₩3,900을 한 번만 결제하면 계속 광고 없이 써요. 기능은 무료와 똑같아요.</p>
        <div className="two-col two-col--top">
          {PLANS.map((p) => (
            <section key={p.name} className={`plan ${p.on ? 'plan--on' : ''}`}>
              <p className={`t-body-l-bold ${p.on ? 'c-brand' : ''}`}>{p.name}</p>
              {p.lines.map((l) => (
                <p key={l} className="plan__line t-body-s">
                  <Check size={16} color={p.on ? 'var(--icon-brand)' : 'var(--icon-default)'} />
                  {l}
                </p>
              ))}
            </section>
          ))}
        </div>
        <Notice tone="neutral">알람이 울리는 화면에는 무료 이용자에게도 광고를 넣지 않아요.</Notice>
      </Content>
      <Footer>
        <Button onClick={() => showToast('결제 기능은 준비 중이에요.')}>₩3,900 결제하기</Button>
        <button type="button" className="t-body-s-medium c-secondary" onClick={() => showToast('구매 내역이 없어요.')}>
          구매 내역 복원
        </button>
      </Footer>
      <Toast message={toast} />
    </Screen>
  )
}
