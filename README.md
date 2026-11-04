# Buxby_Frontend

IT창업실무 A조 **버스비** 프론트엔드입니다. 버스 도착 시각과 개인 준비 시간에 맞춰 알람이 스스로 바뀌는 AI 기상 알람 서비스의 모바일 웹(390px 기준)입니다.

- 디자인: [피그마 IT창업실무_버스비](https://www.figma.com/design/97gyvhoo6qvDfaYZObyHAM) (01 Foundations · 02 Components · 03 Screens)
- 기술: React 19 · Vite 8 · React Router 7 · lucide-react

## 실행

```bash
npm install
npm run dev
```

- 개발 서버는 `http://localhost:5173` 에서 열리고, `/api` 요청은 `vite.config.js` 설정대로 백엔드(`http://localhost:8080`)로 전달됩니다.
- 간편 로그인 후 백엔드가 `http://localhost:5173/?socialLogin=success|failed` 로 돌려보냅니다.

## 환경 변수

`.env.example` 을 복사해 `.env.local` 을 만들고 값을 넣습니다. `.env*` 파일은 git에 올리지 않습니다.

| 이름 | 설명 |
|---|---|
| `VITE_KAKAO_MAP_KEY` | 카카오 지도 **JavaScript 키**. 없으면 지도 자리에 미리보기 그림이 나옵니다. |
| `VITE_BACKEND_URL` | 간편 로그인 이동 주소(기본 `http://localhost:8080`) |

## 화면

`/screens` 에서 피그마 03 Screens와 같은 번호(A1~E3)로 모든 화면을 열어볼 수 있습니다.

| 구분 | 경로 |
|---|---|
| A. 로그인·간편 로그인 | `/` `/login` `/signup` `/permissions` |
| B. 홈·일정 설정 | `/home` `/schedule/destination` `/schedule/origin` `/schedule/route` |
| C. 지도·대중교통 노선 | `/route` `/route/detail` `/route/options` (`/route?state=loading`, `?state=error`) |
| D. 기상·출발 알람 | `/alarm` (`?state=learning`) `/alarm/prep` `/alarm/settings` `/alarm/wake` `/alarm/depart` `/alarm/postponed` `/route/delay` |
| E. 더보기 | `/more` `/more/ad-free` `/more/permissions` |

## 폴더

```
src/
  api/        백엔드 요청 (auth.js: 회원가입·로그인·내 정보·로그아웃·간편 로그인)
  components/ 피그마 컴포넌트와 같은 공용 UI, KakaoMap
  data/       노선·알람 API 연동 전 예시 데이터 (mock.js)
  lib/        카카오 SDK 로더, 토스트 훅
  pages/      화면 (auth · home · route · alarm · more)
  store/      일정·알람 설정 상태 (브라우저 localStorage에 저장)
  styles/     디자인 토큰 (피그마 Variables와 같은 이름)
```

## 아직 연동 전인 것

- 노선·버스 도착·알람 계산은 `src/data/mock.js` 의 예시 값입니다. 백엔드 노선·알람 API가 나오면 교체합니다.
- 모바일 웹은 버스비를 열어 둔 상태에서만 알람이 울립니다. 잠금화면 알람은 앱 버전에서 다룹니다.
- 광고 제거 결제, DRT 운영사 앱 연결 주소는 정해지면 연결합니다.
