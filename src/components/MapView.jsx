
import { useEffect, useRef, useState } from "react";

function MapView() {

    // 지도 관련 참조
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const placesServiceRef = useRef(null);

    // 마커 관련 참조
    const currentMarkerRef = useRef(null);
    const originMarkerRef = useRef(null);
    const destinationMarkerRef = useRef(null);

    // 사용자가 장소를 선택했는지 확인
    const hasUserSelectedRef = useRef(false);

    // 지도 상태
    const [mapReady, setMapReady] = useState(false);
    const [mapError, setMapError] = useState("");

    // 출발지 검색 상태
    const [originKeyword, setOriginKeyword] = useState("");
    const [originResults, setOriginResults] = useState([]);
    const [selectedOrigin, setSelectedOrigin] = useState(null);
    const [originMessage, setOriginMessage] = useState("");

    // 목적지 검색 상태
    const [destinationKeyword, setDestinationKeyword] = useState("");
    const [destinationResults, setDestinationResults] = useState([]);
    const [selectedDestination, setSelectedDestination] = useState(null);
    const [destinationMessage, setDestinationMessage] = useState("");


    // =====================================
    // 1. 카카오 지도 초기화
    // =====================================

    useEffect(() => {

        let cancelled = false;

        const key = import.meta.env.VITE_KAKAO_MAP_KEY;

        if (!key) {
            setMapError("카카오 지도 API 키가 없습니다.");
            return;
        }

        const initializeMap = () => {

            if (cancelled || mapInstanceRef.current) return;

            if (!window.kakao?.maps) {
                setMapError("카카오 지도 SDK를 불러오지 못했습니다.");
                return;
            }

            window.kakao.maps.load(() => {

                if (cancelled || !mapContainerRef.current) return;

                if (!window.kakao.maps.services) {
                    setMapError(
                        "장소 검색 서비스를 불러오지 못했습니다. services 라이브러리를 확인해 주세요."
                    );
                    return;
                }

                // 기본 위치: 서울시청
                const defaultPosition =
                    new window.kakao.maps.LatLng(
                        37.5665,
                        126.9780
                    );

                // 지도 생성
                const map = new window.kakao.maps.Map(
                    mapContainerRef.current,
                    {
                        center: defaultPosition,
                        level: 5
                    }
                );

                mapInstanceRef.current = map;

                // 장소 검색 객체 생성
                placesServiceRef.current =
                    new window.kakao.maps.services.Places();

                setMapReady(true);

                // 현재 위치 가져오기
                if (navigator.geolocation) {

                    navigator.geolocation.getCurrentPosition(

                        (position) => {

                            if (cancelled) return;

                            const latitude = position.coords.latitude;
                            const longitude = position.coords.longitude;

                            const currentPosition =
                                new window.kakao.maps.LatLng(
                                    latitude,
                                    longitude
                                );

                            // 현재 위치 마커
                            currentMarkerRef.current =
                                new window.kakao.maps.Marker({
                                    map: map,
                                    position: currentPosition
                                });

                            // 아직 출발지나 목적지를 선택하지 않았다면
                            // 현재 위치를 지도 중심으로 설정
                            if (!hasUserSelectedRef.current) {
                                map.setCenter(currentPosition);
                            }

                        },

                        (error) => {
                            console.warn(
                                "현재 위치를 가져오지 못했습니다.",
                                error
                            );
                        },

                        {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 0
                        }

                    );
                }

            });

        };


        // 기존 SDK가 이미 로드되어 있는지 확인
        let script = document.getElementById("kakao-map-sdk");

        if (window.kakao?.maps) {

            initializeMap();

        } else {

            if (!script) {

                script = document.createElement("script");

                script.id = "kakao-map-sdk";

                script.src =
                    `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services`;

                script.async = true;

            }

            const handleLoad = () => initializeMap();

            const handleError = () => {
                if (!cancelled) {
                    setMapError("카카오 지도 SDK 로딩에 실패했습니다.");
                }
            };

            script.addEventListener("load", handleLoad);
            script.addEventListener("error", handleError);

            if (!script.parentNode) {
                document.head.appendChild(script);
            }

        }

        return () => {
            cancelled = true;
        };

    }, []);


    // =====================================
    // 2. 출발지 / 목적지 장소 검색
    // =====================================

    const searchPlaces = (type) => {

        const isOrigin = type === "origin";

        const keyword = isOrigin
            ? originKeyword
            : destinationKeyword;

        const setResults = isOrigin
            ? setOriginResults
            : setDestinationResults;

        const setMessage = isOrigin
            ? setOriginMessage
            : setDestinationMessage;

        // 검색어 확인
        if (!keyword.trim()) {
            setResults([]);
            setMessage("검색어를 입력해 주세요.");
            return;
        }

        // 지도 SDK 확인
        if (!placesServiceRef.current) {
            setMessage("지도 서비스를 준비하고 있습니다.");
            return;
        }

        setResults([]);
        setMessage("검색 중입니다...");

        // 카카오 장소 검색
        placesServiceRef.current.keywordSearch(
            keyword.trim(),

            (data, status) => {

                if (
                    status === window.kakao.maps.services.Status.OK
                ) {

                    setResults(data);

                    setMessage(
                        `${data.length}개의 검색 결과가 있습니다.`
                    );

                } else if (
                    status === window.kakao.maps.services.Status.ZERO_RESULT
                ) {

                    setResults([]);
                    setMessage("검색 결과가 없습니다.");

                } else {

                    setResults([]);
                    setMessage("검색 중 오류가 발생했습니다.");

                }

            }

        );

    };


    // =====================================
    // 3. 검색 결과에서 장소 선택
    // =====================================

    const selectPlace = (type, place) => {

        const map = mapInstanceRef.current;

        if (!map) return;

        // 카카오 검색 결과의 좌표
        const position = new window.kakao.maps.LatLng(
            Number(place.y),
            Number(place.x)
        );

        // 출발지 또는 목적지에 기존 마커가 있다면 제거
        const isOrigin = type === "origin";

        const previousMarker = isOrigin
            ? originMarkerRef.current
            : destinationMarkerRef.current;

        if (previousMarker) {
            previousMarker.setMap(null);
        }

        // 새 마커 생성
        const marker = new window.kakao.maps.Marker({
            map: map,
            position: position
        });

        // 선택한 위치에 해당하는 마커 저장
        if (isOrigin) {

            originMarkerRef.current = marker;

            setSelectedOrigin(place);
            setOriginKeyword(place.place_name);
            setOriginResults([]);
            setOriginMessage("출발지가 선택되었습니다.");

        } else {

            destinationMarkerRef.current = marker;

            setSelectedDestination(place);
            setDestinationKeyword(place.place_name);
            setDestinationResults([]);
            setDestinationMessage("목적지가 선택되었습니다.");

        }

        hasUserSelectedRef.current = true;


        // 출발지와 목적지가 모두 선택되었다면
        // 두 위치가 모두 보이도록 지도 범위 조정
        if (
            originMarkerRef.current &&
            destinationMarkerRef.current
        ) {

            const bounds =
                new window.kakao.maps.LatLngBounds();

            bounds.extend(
                originMarkerRef.current.getPosition()
            );

            bounds.extend(
                destinationMarkerRef.current.getPosition()
            );

            map.setBounds(bounds);

        } else {

            // 하나만 선택되었다면 해당 장소 중심으로 이동
            map.setCenter(position);
            map.setLevel(3);

        }

    };


    // =====================================
    // 4. 화면 디자인 및 출력
    // =====================================

    const inputStyle = {
        width: "100%",
        padding: "12px",
        boxSizing: "border-box",
        border: "1px solid #ccc",
        borderRadius: "8px",
        fontSize: "14px"
    };

    const buttonStyle = {
        padding: "12px 18px",
        border: "none",
        borderRadius: "8px",
        backgroundColor: "#2563eb",
        color: "white",
        cursor: "pointer",
        fontWeight: "bold"
    };

    const resultStyle = {
        display: "block",
        width: "100%",
        padding: "12px",
        marginTop: "8px",
        textAlign: "left",
        border: "1px solid #ddd",
        borderRadius: "8px",
        backgroundColor: "white",
        cursor: "pointer"
    };

    const selectedStyle = {
        marginTop: "12px",
        padding: "12px",
        backgroundColor: "#f0fdf4",
        border: "1px solid #bbf7d0",
        borderRadius: "8px",
        fontSize: "13px"
    };


    return (

        <div style={{
            maxWidth: "1000px",
            margin: "0 auto",
            padding: "20px"
        }}>

            <h2>교통비서</h2>

            <p>출발지와 목적지를 검색해 주세요.</p>


            {/* 출발지 / 목적지 검색 영역 */}

            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "16px",
                marginBottom: "20px"
            }}>


                {/* 출발지 */}

                <section>

                    <h3>🟢 출발지</h3>

                    <form onSubmit={(e) => {
                        e.preventDefault();
                        searchPlaces("origin");
                    }}>

                        <input
                            type="text"
                            placeholder="출발지를 검색하세요."
                            value={originKeyword}
                            onChange={(e) =>
                                setOriginKeyword(e.target.value)
                            }
                            style={inputStyle}
                        />

                        <button
                            type="submit"
                            disabled={!mapReady}
                            style={{
                                ...buttonStyle,
                                width: "100%",
                                marginTop: "8px",
                                opacity: mapReady ? 1 : 0.5
                            }}
                        >
                            출발지 검색
                        </button>

                    </form>


                    <p>{originMessage}</p>


                    {originResults.map((place) => (

                        <button
                            key={place.id}
                            type="button"
                            style={resultStyle}
                            onClick={() =>
                                selectPlace("origin", place)
                            }
                        >

                            <strong>{place.place_name}</strong>

                            <p style={{
                                fontSize: "12px",
                                color: "#666",
                                marginBottom: "0"
                            }}>
                                {place.road_address_name ||
                                 place.address_name ||
                                 "주소 정보 없음"}
                            </p>

                            {place.category_name && (

                                <p style={{
                                    fontSize: "11px",
                                    color: "#999",
                                    marginBottom: "0"
                                }}>
                                    {place.category_name}
                                </p>

                            )}

                        </button>

                    ))}


                    {selectedOrigin && (

                        <div style={selectedStyle}>

                            <strong>선택된 출발지</strong>

                            <p>{selectedOrigin.place_name}</p>

                            <p>
                                위도: {selectedOrigin.y}
                                <br />
                                경도: {selectedOrigin.x}
                            </p>

                        </div>

                    )}

                </section>



                {/* 목적지 */}

                <section>

                    <h3>🔴 목적지</h3>

                    <form onSubmit={(e) => {
                        e.preventDefault();
                        searchPlaces("destination");
                    }}>

                        <input
                            type="text"
                            placeholder="목적지를 검색하세요."
                            value={destinationKeyword}
                            onChange={(e) =>
                                setDestinationKeyword(e.target.value)
                            }
                            style={inputStyle}
                        />

                        <button
                            type="submit"
                            disabled={!mapReady}
                            style={{
                                ...buttonStyle,
                                width: "100%",
                                marginTop: "8px",
                                opacity: mapReady ? 1 : 0.5
                            }}
                        >
                            목적지 검색
                        </button>

                    </form>


                    <p>{destinationMessage}</p>


                    {destinationResults.map((place) => (

                        <button
                            key={place.id}
                            type="button"
                            style={resultStyle}
                            onClick={() =>
                                selectPlace("destination", place)
                            }
                        >

                            <strong>{place.place_name}</strong>

                            <p style={{
                                fontSize: "12px",
                                color: "#666",
                                marginBottom: "0"
                            }}>
                                {place.road_address_name ||
                                 place.address_name ||
                                 "주소 정보 없음"}
                            </p>

                            {place.category_name && (

                                <p style={{
                                    fontSize: "11px",
                                    color: "#999",
                                    marginBottom: "0"
                                }}>
                                    {place.category_name}
                                </p>

                            )}

                        </button>

                    ))}


                    {selectedDestination && (

                        <div style={selectedStyle}>

                            <strong>선택된 목적지</strong>

                            <p>{selectedDestination.place_name}</p>

                            <p>
                                위도: {selectedDestination.y}
                                <br />
                                경도: {selectedDestination.x}
                            </p>

                        </div>

                    )}

                </section>

            </div>


            {/* 지도 */}

            <h3>지도</h3>

            {mapError && (
                <p style={{ color: "red" }}>
                    {mapError}
                </p>
            )}

            {!mapReady && !mapError && (
                <p>지도를 불러오는 중입니다.</p>
            )}

            <div
                ref={mapContainerRef}
                style={{
                    width: "100%",
                    height: "500px",
                    borderRadius: "12px",
                    overflow: "hidden"
                }}
            />

        </div>

    );

}

export default MapView;
