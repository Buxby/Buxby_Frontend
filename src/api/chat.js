import { request } from './client'

// AI 비서 대화. sessionId를 이어 보내면 이전 대화(목적지·시간)를 이어서 이해한다
export function sendChat(body) {
  return request('/api/ai/chat', { method: 'POST', body })
}
