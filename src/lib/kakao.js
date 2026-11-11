// 카카오 지도 SDK 로더 (test_frontend의 MapView 로딩 방식을 공용 함수로 분리)
// .env.local 에 VITE_KAKAO_MAP_KEY(카카오 JavaScript 키)를 넣으면 실제 지도를 쓴다.
let loading = null

export function hasKakaoKey() {
  return Boolean(import.meta.env.VITE_KAKAO_MAP_KEY)
}

export function loadKakaoMaps() {
  if (loading) return loading
  const key = import.meta.env.VITE_KAKAO_MAP_KEY
  if (!key) return Promise.reject(new Error('카카오 지도 API 키가 없습니다.'))

  loading = new Promise((resolve, reject) => {
    const ready = () => {
      if (!window.kakao?.maps) {
        reject(new Error('카카오 지도 SDK를 불러오지 못했습니다.'))
        return
      }
      window.kakao.maps.load(() => resolve(window.kakao))
    }

    if (window.kakao?.maps) {
      ready()
      return
    }

    let script = document.getElementById('kakao-map-sdk')
    if (!script) {
      script = document.createElement('script')
      script.id = 'kakao-map-sdk'
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services`
      script.async = true
      document.head.appendChild(script)
    }
    script.addEventListener('load', ready)
    script.addEventListener('error', () => reject(new Error('카카오 지도 SDK 로딩에 실패했습니다.')))
  }).catch((error) => {
    loading = null
    throw error
  })

  return loading
}

// 좌표 → 주소 (도로명 우선). SDK가 없거나 못 찾으면 null을 돌려준다.
export async function addressAt(lat, lng) {
  try {
    const kakao = await loadKakaoMaps()
    const geocoder = new kakao.maps.services.Geocoder()
    return await new Promise((resolve) => {
      geocoder.coord2Address(lng, lat, (result, status) => {
        if (status !== kakao.maps.services.Status.OK || !result[0]) return resolve(null)
        const { road_address: road, address } = result[0]
        resolve(road?.address_name || address?.address_name || null)
      })
    })
  } catch {
    return null
  }
}

// 카카오 장소 검색 (Places). SDK가 없으면 null을 돌려준다.
export async function searchPlaces(keyword) {
  try {
    const kakao = await loadKakaoMaps()
    const places = new kakao.maps.services.Places()
    return await new Promise((resolve) => {
      places.keywordSearch(keyword, (data, status) => {
        if (status === kakao.maps.services.Status.OK) {
          resolve(
            data.map((p) => ({
              id: p.id,
              name: p.place_name,
              address: p.road_address_name || p.address_name,
              category: p.category_group_name || p.category_name?.split(' > ').pop() || '장소',
              lat: Number(p.y),
              lng: Number(p.x),
            })),
          )
        } else {
          resolve([])
        }
      })
    })
  } catch {
    return null
  }
}
