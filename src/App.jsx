
import { useEffect, useState } from 'react'

function App() {
  const [serverData, setServerData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/health')
      .then((response) => {
        if (!response.ok) {
          throw new Error('서버 요청 실패')
        }
        return response.json()
      })
      .then((data) => {
        setServerData(data)
      })
      .catch((error) => {
        setError(error.message)
      })
  }, [])

  return (
    <div>
      <h1>교통비서</h1>

      <h2>백엔드 연결 테스트</h2>

      {serverData && (
        <div>
          <p>상태: {serverData.status}</p>
          <p>메시지: {serverData.message}</p>
        </div>
      )}

      {error && <p>오류: {error}</p>}

      {!serverData && !error && (
        <p>서버 연결 확인 중...</p>
      )}
    </div>
  )
}

export default App
