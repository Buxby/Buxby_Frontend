const WEEKDAYS = '일월화수목금토'
const pad = (n) => String(n).padStart(2, '0')

export const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60000)

// 백엔드 LocalDateTime 형식 (시간대 표기 없음)
export function toLocalDateTime(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}

export function clock(d) {
  return `${((d.getHours() + 11) % 12) + 1}:${pad(d.getMinutes())}`
}

export function clockLabel(d) {
  return `${d.getHours() < 12 ? '오전' : '오후'} ${clock(d)}`
}

// 반복 요일 중 준비·이동 시간을 확보할 수 있는 가장 가까운 도착 시각
export function nextArrival(arrival, days, leadMinutes, now = new Date()) {
  const hour = (arrival.hour % 12) + (arrival.ampm === '오후' ? 12 : 0)
  for (let offset = 0; offset <= 8; offset += 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, hour, arrival.minute)
    const allowed = !days?.length || days.includes(WEEKDAYS[date.getDay()])
    if (allowed && addMinutes(date, -leadMinutes) > now) return date
  }
  throw new Error('알람을 맞출 수 있는 날짜를 찾지 못했어요. 도착 시간을 확인해 주세요.')
}

function dayLabel(date, now) {
  const start = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diff = Math.round((start(date) - start(now)) / 86400000)
  const weekday = WEEKDAYS[date.getDay()]
  if (diff === 0) return `오늘(${weekday})`
  if (diff === 1) return `내일(${weekday})`
  return `${date.getMonth() + 1}월 ${date.getDate()}일(${weekday})`
}

// 저장된 알람 계획을 화면 표시 값으로 변환
export function alarmView(plan, now = new Date()) {
  const wake = new Date(plan.wakeTime)
  return {
    wake: clock(wake),
    wakeLabel: clockLabel(wake),
    dayLabel: dayLabel(wake, now),
    date: `${wake.getMonth() + 1}월 ${wake.getDate()}일 (${WEEKDAYS[wake.getDay()]})`,
    depart: clock(new Date(plan.leaveHomeTime)),
    board: clock(new Date(plan.boardingTime)),
    arrive: clock(new Date(plan.arrivalTime)),
    expired: wake <= now,
  }
}

// 백엔드 준비 시간 기록 허용 범위(1~240분)를 벗어나면 기록하지 않는다
export function prepMinutesSince(wakeOffAt, now = new Date()) {
  if (!wakeOffAt) return null
  const minutes = Math.round((now - new Date(wakeOffAt)) / 60000)
  return minutes >= 1 && minutes <= 240 ? minutes : null
}
