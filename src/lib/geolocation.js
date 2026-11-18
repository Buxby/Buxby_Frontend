// 현재 위치 한 번 조회 ({ lat, lng }). 권한 거부·시간 초과면 오류 메시지와 함께 실패한다
export function currentPosition({ timeout = 10000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('이 브라우저는 현재 위치를 지원하지 않아요.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(err.code === 1
        ? '위치 권한이 꺼져 있어요. 브라우저 설정에서 위치 권한을 허용해 주세요.'
        : '현재 위치를 확인하지 못했어요.')),
      { enableHighAccuracy: true, timeout, maximumAge: 60000 },
    )
  })
}
