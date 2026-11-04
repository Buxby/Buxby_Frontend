import { useCallback, useEffect, useRef, useState } from 'react'

// 잠깐 보였다 사라지는 안내 문구
export function useToast(duration = 2200) {
  const [message, setMessage] = useState('')
  const timer = useRef()
  const show = useCallback(
    (text) => {
      setMessage(text)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setMessage(''), duration)
    },
    [duration],
  )
  useEffect(() => () => clearTimeout(timer.current), [])
  return [message, show]
}
