import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { MapPin, Search, X } from 'lucide-react'
import { Content, Screen, TopBar } from '../../components/layout'
import { Badge } from '../../components/display'
import { DESTINATION_RESULTS, RECENT_SEARCHES } from '../../data/mock'
import { searchPlaces } from '../../lib/kakao'
import { useAppState } from '../../store/context'

// B4 목적지 검색 (카카오 장소 검색, 키가 없으면 예시 결과)
export default function DestinationSearchPage() {
  const navigate = useNavigate()
  const { update } = useAppState()
  const [keyword, setKeyword] = useState('동양미래')
  const [results, setResults] = useState(DESTINATION_RESULTS)

  useEffect(() => {
    const q = keyword.trim()
    let cancelled = false
    const timer = setTimeout(async () => {
      if (!q) {
        if (!cancelled) setResults([])
        return
      }
      const found = await searchPlaces(q)
      if (cancelled) return
      setResults(found ?? DESTINATION_RESULTS.filter((p) => p.name.includes(q) || p.address.includes(q)))
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [keyword])

  const select = (place) => {
    // 목적지가 바뀌면 이전 경로는 쓸 수 없다
    update({ destination: place, route: null, routeDetail: null, routeOptions: null })
    navigate('/home')
  }

  return (
    <Screen bg="surface">
      <TopBar title="목적지" />
      <Content gap={16}>
        <label className="search-box">
          <Search size={20} color="var(--icon-default)" />
          <input
            className="search-box__input t-body-m"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="학교, 회사, 장소 이름"
            aria-label="목적지 검색"
            autoFocus
          />
          {keyword && (
            <button type="button" className="icon-button" onClick={() => setKeyword('')} aria-label="검색어 지우기">
              <X size={18} color="var(--icon-default)" />
            </button>
          )}
        </label>
        <div className="recent">
          <span className="t-caption-medium c-secondary">최근</span>
          {RECENT_SEARCHES.map((w) => (
            <button key={w} type="button" className="pill t-caption c-secondary" onClick={() => setKeyword(w)}>
              {w}
            </button>
          ))}
        </div>
        <p className="t-body-s-medium c-secondary">검색 결과 {results.length}</p>
        <ul className="result-list">
          {results.map((p, i) => (
            <li key={p.id}>
              <button type="button" className="result" onClick={() => select(p)}>
                <MapPin size={20} color={i === 0 ? 'var(--icon-brand)' : 'var(--icon-default)'} />
                <span className="result__text">
                  <span className="t-body-m-medium">{p.name}</span>
                  <span className="t-caption c-secondary">{p.address}</span>
                </span>
                <Badge tone="neutral">{p.category}</Badge>
              </button>
            </li>
          ))}
        </ul>
        <p className="t-caption c-tertiary">장소 검색은 카카오 장소 검색(Places) 결과를 보여줘요.</p>
      </Content>
    </Screen>
  )
}
