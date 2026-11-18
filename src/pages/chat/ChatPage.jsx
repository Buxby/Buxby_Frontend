import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Bot, MapPin, Send } from 'lucide-react'
import { Content, Screen, TopBar } from '../../components/layout'
import { Button, Chip } from '../../components/controls'
import { Badge, Notice, Toast } from '../../components/display'
import { sendChat } from '../../api/chat'
import { deleteReservation } from '../../api/alarm'
import { confirmScheduled } from '../../lib/alarmPlan'
import { chatAlarmState, isMissedTransit, parsePlaceCandidates } from '../../lib/chatAlarm'
import { currentPosition } from '../../lib/geolocation'
import { clockLabel } from '../../lib/time'
import { useToast } from '../../lib/useToast'
import { useAppState } from '../../store/context'

const STORAGE_KEY = 'buxby-chat-v1'
const WEEKDAYS = '일월화수목금토'
const GREETING = {
  id: 'greeting',
  role: 'bot',
  text: '안녕하세요! 도착하고 싶은 곳과 시간을 말해 주면 기상·출발 시각을 계산해 알람까지 맞춰 드려요.\n버스를 놓쳤을 때도 말해 주세요.',
}
const SUGGESTIONS = ['내일 오전 9시까지 동양미래대학교 가고 싶어', '버스 놓쳤어']

// 대화는 탭을 닫기 전까지만 남긴다 (서버 대화 세션도 일정 시간이 지나면 사라진다)
function loadChat() {
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY))
    if (saved?.messages?.length) return saved
  } catch {
    // 저장소를 쓸 수 없으면 새 대화로 시작
  }
  return { sessionId: null, messages: [GREETING] }
}

function dateTimeLabel(value) {
  if (!value) return '-'
  const d = new Date(value)
  return `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAYS[d.getDay()]}) ${clockLabel(d)}`
}

// 서버 오류(5xx)는 응답에 이유가 없어서 상태 코드로 안내한다
function friendlyError(err) {
  if (err.status === 401) return '로그인해야 AI 비서를 쓸 수 있어요.'
  if (err.status === 503) return 'AI가 지금 혼잡해서 답하지 못했어요. 잠시 후 다시 보내 주세요.'
  if (err.status === 502) return 'AI나 교통 정보 서버에서 답을 받지 못했어요. 잠시 후 다시 보내 주세요.'
  if (err.status === 504 || err.status === 0) return '응답이 너무 늦어 연결이 끊겼어요. 잠시 후 다시 보내 주세요.'
  return err.message
}

function PlanCard({ journey }) {
  const range = journey.minRouteMinutes && journey.maxRouteMinutes && journey.minRouteMinutes !== journey.maxRouteMinutes
    ? `${journey.minRouteMinutes}~${journey.maxRouteMinutes}분`
    : `${journey.routeMinutes}분`
  return (
    <dl className="chat-plan">
      {[
        ['기상', dateTimeLabel(journey.wakeTime)],
        ['출발', dateTimeLabel(journey.leaveHomeTime)],
        ['도착', dateTimeLabel(journey.desiredArrivalTime)],
        ['이동', range],
        ['준비', `${journey.preparationMinutes}분`],
      ].map(([k, v]) => (
        <div key={k} className="chat-plan__row">
          <dt className="t-caption c-secondary">{k}</dt>
          <dd className="t-body-s-medium">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

// AI 비서 (/api/ai/chat): 자연어로 경로·알람 계산 → 확인 후 저장 → 홈 알람으로 사용, 버스 놓침 대체 경로
export default function ChatPage() {
  const navigate = useNavigate()
  const { state, update } = useAppState()
  const [chat, setChat] = useState(loadChat)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [toast, showToast] = useToast()
  const endRef = useRef(null)
  const { messages, sessionId } = chat
  const last = messages[messages.length - 1]

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(chat))
    } catch {
      // 저장하지 못해도 대화는 계속할 수 있다
    }
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [chat])

  const push = (message) => setChat((c) => ({ ...c, messages: [...c.messages, { id: `${Date.now()}-${c.messages.length}`, ...message }] }))

  // extra: 서버로 함께 보낼 값 (선택한 목적지 주소, 저장 확인, 현재 위치 등)
  const send = async (text, extra = {}, shown = text) => {
    const message = text.trim()
    if (!message || sending) return
    setSending(true)
    setInput('')
    push({ role: 'user', text: shown })

    const body = { message, sessionId, bufferMinutes: state.settings.bufferMinutes, ...extra }
    // 출발지는 홈에서 정한 위치. '놓쳤어'나 위치 요청에 답할 때는 현재 위치로 쓰이므로 보내지 않는다
    const waitingLocation = last?.status === 'LOCATION_REQUIRED'
    if (state.origin && !extra.startLatitude && !waitingLocation && !isMissedTransit(message)) {
      body.startLatitude = state.origin.lat
      body.startLongitude = state.origin.lng
    }

    try {
      const res = await sendChat(body)
      setChat((c) => ({
        sessionId: res.sessionId ?? c.sessionId,
        messages: [...c.messages, {
          id: `${Date.now()}-bot`,
          role: 'bot',
          text: res.reply,
          status: res.status,
          journey: res.journey,
          reservationId: res.reservationId,
          missingFields: res.missingFields ?? [],
        }],
      }))
    } catch (err) {
      push({ role: 'bot', text: friendlyError(err), status: err.status === 401 ? 'LOGIN' : 'ERROR' })
    } finally {
      setSending(false)
    }
  }

  const sendLocation = async (useOrigin) => {
    try {
      const pos = useOrigin ? state.origin : await currentPosition()
      await send('현재 위치야', { startLatitude: pos.lat, startLongitude: pos.lng }, useOrigin ? `${state.origin.name}에서 출발할게` : '📍 현재 위치 보내기')
    } catch (err) {
      showToast(err.message)
    }
  }

  // 저장된 예약을 홈 알람으로 쓴다. 지금 맞춰 둔 알람이 있으면 그 예약은 지운다
  const applyAsHomeAlarm = async (msg) => {
    const next = chatAlarmState(msg.journey, msg.reservationId, state.origin)
    if (!next) {
      showToast('이 일정은 홈 알람으로 바꿀 수 없어요. 홈에서 직접 맞춰 주세요.')
      return
    }
    const previous = state.alarmSet && state.plan ? state.plan.reservationId : null
    update({ ...next, origin: state.origin, alarmFired: {} })
    await confirmScheduled(msg.reservationId, msg.journey.wakeTime)
    if (previous && previous !== msg.reservationId) deleteReservation(previous).catch(() => {})
    navigate('/home', { state: { toast: 'AI 비서가 계산한 일정으로 알람을 맞췄어요.' } })
  }

  const newChat = () => setChat({ sessionId: null, messages: [GREETING] })

  return (
    <Screen>
      <TopBar title="AI 비서" backTo="/home" action={messages.length > 1 ? { label: '새 대화', onClick: newChat } : undefined} />
      <Content gap={12} className="chat-list">
        {!state.origin && (
          <Notice>홈에서 출발 위치를 먼저 정해 두면 경로를 바로 계산할 수 있어요.</Notice>
        )}
        {messages.map((msg) => {
          const candidates = msg.status === 'SELECT_DESTINATION' ? parsePlaceCandidates(msg.text) : []
          const isLast = msg === last
          return (
            <div key={msg.id} className={`chat-row chat-row--${msg.role}`}>
              {msg.role === 'bot' && <Bot size={20} className="chat-row__avatar" color="var(--icon-brand)" aria-hidden="true" />}
              <div className={`chat-bubble chat-bubble--${msg.role}`}>
                {candidates.length > 0 ? (
                  <>
                    <p className="t-body-s">목적지가 여러 곳 검색됐어요. 하나를 골라 주세요.</p>
                    <div className="chat-choices">
                      {candidates.map((p) => (
                        <button
                          key={p.address}
                          type="button"
                          className="chat-choice"
                          disabled={!isLast || sending}
                          // 장소 이름을 다시 보내면 새 목적지로 검색되므로, 이름 없이 주소만 골라 보낸다
                          onClick={() => send('이 주소로 경로 계산해줘', { selectedDestinationAddress: p.address }, `${p.name} (${p.address})`)}
                        >
                          <span className="t-body-s-medium">{p.name}</span>
                          <span className="t-caption c-secondary">{p.address}</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="t-body-s chat-bubble__text">{msg.text}</p>
                )}

                {msg.journey && ['PLANNED', 'RESERVED', 'ALREADY_SAVED'].includes(msg.status) && <PlanCard journey={msg.journey} />}

                {msg.status === 'PLANNED' && isLast && (
                  <Button size="m" disabled={sending} onClick={() => send('이 일정으로 알람 저장해줘', { confirmReservation: true })}>
                    이 일정으로 알람 저장
                  </Button>
                )}
                {['RESERVED', 'ALREADY_SAVED'].includes(msg.status) && msg.reservationId && (
                  <>
                    <Badge tone="success">예약 {msg.reservationId}번 저장됨</Badge>
                    <Button size="m" variant="secondary" disabled={!state.origin} onClick={() => applyAsHomeAlarm(msg)}>
                      홈 알람으로 사용하기
                    </Button>
                    {state.alarmSet && state.plan && (
                      <span className="t-caption c-secondary">지금 맞춰 둔 알람은 이 일정으로 바뀌어요.</span>
                    )}
                  </>
                )}
                {msg.status === 'LOCATION_REQUIRED' && isLast && (
                  <div className="chat-choices">
                    <Button size="m" disabled={sending} onClick={() => sendLocation(false)}>
                      <MapPin size={16} /> 현재 위치 보내기
                    </Button>
                    {state.origin && (
                      <Button size="m" variant="tertiary" disabled={sending} onClick={() => sendLocation(true)}>
                        {state.origin.name}에서 출발
                      </Button>
                    )}
                  </div>
                )}
                {msg.status === 'LOGIN' && (
                  <Button size="m" variant="secondary" onClick={() => navigate('/login')}>
                    로그인
                  </Button>
                )}
              </div>
            </div>
          )
        })}
        {sending && (
          <div className="chat-row chat-row--bot">
            <Bot size={20} className="chat-row__avatar" color="var(--icon-brand)" aria-hidden="true" />
            <div className="chat-bubble chat-bubble--bot">
              <p className="t-body-s c-secondary">생각하는 중…</p>
            </div>
          </div>
        )}
        {messages.length === 1 && (
          <div className="chat-suggestions" role="group" aria-label="예시 질문">
            {SUGGESTIONS.map((s) => (
              <Chip key={s} onClick={() => send(s)}>{s}</Chip>
            ))}
          </div>
        )}
        <div ref={endRef} />
      </Content>
      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
      >
        <input
          className="chat-input__field t-body-m"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="예: 내일 9시까지 학교 가는 알람 맞춰줘"
          maxLength={1000}
          aria-label="AI 비서에게 보낼 메시지"
        />
        <button type="submit" className="chat-input__send" disabled={!input.trim() || sending} aria-label="보내기">
          <Send size={20} />
        </button>
      </form>
      <Toast message={toast} />
    </Screen>
  )
}
