export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

function fallbackMessage(status) {
  if (status === 400) return '입력한 시간이나 위치를 다시 확인해 주세요.'
  if (status === 502 || status === 503) return '교통 정보를 가져오지 못했어요. 잠시 후 다시 시도해 주세요.'
  return `요청을 처리하지 못했어요. (${status})`
}

// 백엔드 JSON API 공통 호출. 세션 쿠키를 함께 보낸다.
export async function request(path, { method = 'GET', query, body } = {}) {
  const url = query ? `${path}?${new URLSearchParams(query)}` : path
  let response
  try {
    response = await fetch(url, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.', 0)
  }

  const text = await response.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    // 프록시 오류 페이지처럼 JSON이 아닌 응답은 상태 코드로만 처리한다
  }

  if (!response.ok) throw new ApiError(data?.message || fallbackMessage(response.status), response.status)
  return data
}
