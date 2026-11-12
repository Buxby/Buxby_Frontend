import { useState } from 'react'
import { BottomSheet } from './layout'
import { Button, Chip } from './controls'

// 분 단위 설정 바텀시트: 자주 쓰는 값은 칩으로 고르고, 그 밖의 값은 직접 입력
export default function MinutesSheet({ open, title, description, presets, value, min, max, onClose, onConfirm }) {
  return (
    <BottomSheet open={open} title={title} onClose={onClose}>
      {open && (
        <MinutesForm description={description} presets={presets} value={value} min={min} max={max} onConfirm={onConfirm} />
      )}
    </BottomSheet>
  )
}

function MinutesForm({ description, presets, value, min, max, onConfirm }) {
  const [draft, setDraft] = useState(String(value))
  const minutes = Number.parseInt(draft, 10)
  const valid = !Number.isNaN(minutes) && minutes >= min && minutes <= max
  const error = draft !== '' && !valid ? `${min}분에서 ${max}분 사이로 입력해 주세요.` : ''

  return (
    <>
      {description && <p className="t-body-s c-secondary">{description}</p>}
      <div className="chip-row chip-row--fill" role="group" aria-label="자주 쓰는 시간">
        {presets.map((p) => (
          <Chip key={p} selected={minutes === p} onClick={() => setDraft(String(p))}>
            {p}분
          </Chip>
        ))}
      </div>
      <p className="t-body-s-medium c-secondary">직접 입력</p>
      <label className="stepper__field stepper__field--l">
        <input
          className="stepper__input t-display-l"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={3}
          aria-label="직접 입력(분)"
          aria-invalid={!!error}
          value={draft}
          style={{ width: `${Math.max(1, draft.length)}ch` }}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && valid) onConfirm(minutes)
          }}
        />
        <span className="t-title-s c-secondary">분</span>
      </label>
      <p className={`t-caption ${error ? 'c-danger' : 'c-tertiary'}`}>{error || `${min}~${max}분까지 입력할 수 있어요.`}</p>
      <Button disabled={!valid} onClick={() => onConfirm(minutes)}>
        확인
      </Button>
    </>
  )
}
