import { Link, useNavigate } from 'react-router'
import { BusFront, Sparkle, Timer } from 'lucide-react'
import { Content, Footer, Screen } from '../../components/layout'
import { Button } from '../../components/controls'
import { IconTile, IllustrationSlot } from '../../components/display'

const VALUES = [
  { icon: Sparkle, text: 'AI가 나의 평균 준비 시간을 학습해요' },
  { icon: BusFront, text: '버스가 늦으면 알람도 자동으로 미뤄져요' },
  { icon: Timer, text: '최소·최대 소요 시간을 함께 알려줘요' },
]

// A1 시작 화면
export default function StartPage() {
  const navigate = useNavigate()
  return (
    <Screen bg="surface">
      <Content gap={12} style={{ paddingTop: 24 }}>
        <IllustrationSlot height={260} label="일러스트 자리 · 침대에서 일어나는 사람 (보완 요청)" />
        <p className="t-title-s c-brand" style={{ marginTop: 12 }}>버스비</p>
        <h1 className="t-display-l">
          버스에 맞춰 깨우는
          <br />
          AI 기상 알람
        </h1>
        <p className="t-body-l c-secondary">
          정류장에서 기다리는 시간을 줄이고,
          <br />
          여유롭게 준비하는 시간을 돌려드려요.
        </p>
        <ul className="value-list">
          {VALUES.map(({ icon, text }) => (
            <li key={text}>
              <IconTile icon={icon} size={32} iconSize={18} />
              <span className="t-body-m-medium">{text}</span>
            </li>
          ))}
        </ul>
      </Content>
      <Footer>
        <Button onClick={() => navigate('/signup')}>시작하기</Button>
        <p className="text-link t-body-s c-secondary">
          이미 계정이 있나요?
          <Link to="/login" className="t-body-s-medium c-brand">
            로그인
          </Link>
        </p>
      </Footer>
    </Screen>
  )
}
