import { useState } from 'react'
import { ChevronDown, ChevronUp, Info } from 'lucide-react'
import { BottomSheet } from '../../components/layout'
import { Button, DayChip } from '../../components/controls'
import { DAYS } from '../../store/context'

const AMPM = ['오전', '오후']
const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const MINUTES = [0, 10, 20, 30, 40, 50]

function WheelColumn({ label, items, value, onChange, format = (v) => v }) {
  const index = items.indexOf(value)
  const at = (i) => items[(i + items.length) % items.length]
  return (
    <div className="wheel__col" role="group" aria-label={label}>
      <button type="button" className="wheel__nav" aria-label={`${label} 이전`} onClick={() => onChange(at(index - 1))}>
        <ChevronUp size={18} color="var(--icon-default)" />
      </button>
      <span className="wheel__cell t-body-l c-tertiary">{format(at(index - 1))}</span>
      <span className="wheel__cell wheel__cell--on t-title-m" aria-live="polite">
        {format(value)}
      </span>
      <span className="wheel__cell t-body-l c-tertiary">{format(at(index + 1))}</span>
      <button type="button" className="wheel__nav" aria-label={`${label} 다음`} onClick={() => onChange(at(index + 1))}>
        <ChevronDown size={18} color="var(--icon-default)" />
      </button>
    </div>
  )
}

// B6 도착 희망 시간 선택 (바텀시트)
export default function ArrivalSheet({ open, initial, days, bufferMinutes, onClose, onConfirm }) {
  return (
    <BottomSheet open={open} title="도착 희망 시간" onClose={onClose}>
      {open && <ArrivalForm initial={initial} days={days} bufferMinutes={bufferMinutes} onConfirm={onConfirm} />}
    </BottomSheet>
  )
}

function ArrivalForm({ initial, days, bufferMinutes, onConfirm }) {
  const [time, setTime] = useState(initial ?? { ampm: '오전', hour: 9, minute: 0 })
  const [picked, setPicked] = useState(days ?? [])
  const toggleDay = (d) => setPicked((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d]))

  return (
    <>
      <div className="wheel">
        <WheelColumn label="오전·오후" items={AMPM} value={time.ampm} onChange={(ampm) => setTime((t) => ({ ...t, ampm }))} />
        <WheelColumn label="시" items={HOURS} value={time.hour} onChange={(hour) => setTime((t) => ({ ...t, hour }))} />
        <WheelColumn label="분" items={MINUTES} value={time.minute} onChange={(minute) => setTime((t) => ({ ...t, minute }))} format={(m) => String(m).padStart(2, '0')} />
      </div>
      <p className="t-body-s-medium c-secondary">반복 요일</p>
      <div className="day-row">
        {DAYS.map((d) => (
          <DayChip key={d} selected={picked.includes(d)} onClick={() => toggleDay(d)}>
            {d}
          </DayChip>
        ))}
      </div>
      <p className="notice notice--brand">
        <Info size={18} aria-hidden="true" />
        <span className="t-caption-medium">기본 여유 시간 {bufferMinutes}분을 더해 계산해요 (알람 설정에서 변경)</span>
      </p>
      <Button onClick={() => onConfirm(time, picked)}>확인</Button>
    </>
  )
}
