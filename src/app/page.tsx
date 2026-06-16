/* =========================================================
   BLOCK A : imports
========================================================= */

"use client";

import { useRef, useState, useEffect } from "react";

import Map, {
  Source,
  Layer,
  Marker,
  MapRef,
} from "react-map-gl/maplibre";

import "maplibre-gl/dist/maplibre-gl.css";


/* =========================================================
   BLOCK B : component
========================================================= */

export default function Home() {

/* =========================================================
   BLOCK B-1 : refs / states
========================================================= */

const mapRef = useRef<MapRef>(null);

const [isMobile, setIsMobile] =
  useState(false);

useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };

  checkMobile();

  window.addEventListener(
    "resize",
    checkMobile
  );

  return () =>
    window.removeEventListener(
      "resize",
      checkMobile
    );
}, []);

const [isochroneA, setIsochroneA] =
  useState<any>(null);

const [isochroneB, setIsochroneB] =
  useState<any>(null);

const [loading, setLoading] =
  useState(false);

const [minutes, setMinutes] =
  useState(30);

const [useHighway, setUseHighway] =
  useState(false);



const [locationA, setLocationA] =
  useState<{
    lng: number;
    lat: number;
  } | null>(null);

const [locationB, setLocationB] =
  useState<{
    lng: number;
    lat: number;
  } | null>(null);

const [activePin, setActivePin] =
  useState<"A" | "B">("A");

// 不動産検索エリア名
const [areaName, setAreaName] =
  useState("");

  const [panelOpen, setPanelOpen] =
  useState(true);

  const [infoOpen, setInfoOpen] =
  useState(false);



/* =========================================================
   BLOCK B-2 : traffic multiplier
========================================================= */

  // 現実寄り補正
  const trafficMultiplier = useHighway ? 0.25 : 0.12;

/* =========================================================
   BLOCK C : draw isochrone
========================================================= */

  async function drawIsochrone(
    lng: number,
    lat: number,
    target: "A" | "B"
  ) {
    setLoading(true);

    try {
      const adjustedMinutes = minutes * trafficMultiplier;

      const body: any = {
        locations: [[lng, lat]],
        range: [adjustedMinutes * 60],
      };

      // 一般道のみ
      if (!useHighway) {
        body.options = {
          avoid_features: ["highways"],
        };
      }

      const response = await fetch(
        "https://api.openrouteservice.org/v2/isochrones/driving-car",
        {
          method: "POST",
          headers: {
            Authorization:
              process.env.NEXT_PUBLIC_ORS_API_KEY!,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        throw new Error("Isochrone API Error");
      }

      const data = await response.json();

      // A/Bで保存先分岐
      if (target === "A") {
        setIsochroneA(data);
      } else {
        setIsochroneB(data);
      }

    } catch (error) {
      console.error(error);

      alert("到達圏の取得に失敗しました");

    } finally {
      setLoading(false);
    }
  }





/* =========================================================
   BLOCK E : share url
========================================================= */

  function copyShareUrl() {

    const url = new URL(window.location.href);

    if (locationA) {
      url.searchParams.set(
        "aLng",
        String(locationA.lng)
      );

      url.searchParams.set(
        "aLat",
        String(locationA.lat)
      );
    }

    if (locationB) {
      url.searchParams.set(
        "bLng",
        String(locationB.lng)
      );

      url.searchParams.set(
        "bLat",
        String(locationB.lat)
      );
    }

    url.searchParams.set(
      "minutes",
      String(minutes)
    );

    url.searchParams.set(
      "highway",
      String(useHighway)
    );

    navigator.clipboard.writeText(url.toString());

    alert("検索結果共有URLをコピーしました");
  }


/* =========================================================
   BLOCK E-2 : real estate search
========================================================= */

async function openRealEstateSearch(
    site: "suumo" | "homes" | "yahoo"
  ) {

    try {

      const center =
        mapRef.current
          ?.getMap()
          .getCenter();

      if (!center) {

        alert(
          "地図中心を取得できません"
        );

        return;
      }

      // Reverse Geocoding
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${center.lng},${center.lat}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&language=ja`
      );

      const data =
        await response.json();

      const placeName =
        data.features?.[0]
          ?.place_name_ja ||
        data.features?.[0]
          ?.place_name ||
        "";

      setAreaName(placeName);

      const encoded =
        encodeURIComponent(
          placeName
        );

      let url = "";

      // 後でASPリンクへ変更可能

      if (site === "suumo") {

        url =
          `https://suumo.jp/jj/chintai/ichiran/FR301FC005/?kw=${encoded}`;
      }

      if (site === "homes") {

        url =
          `https://www.homes.co.jp/chintai/search/?keyword=${encoded}`;
      }

      if (site === "yahoo") {

        url =
          `https://realestate.yahoo.co.jp/rent/search/?q=${encoded}`;
      }

      window.open(url, "_blank");

    } catch (error) {

      console.error(error);

      alert(
        "不動産検索に失敗しました"
      );
    }
  }
/* =========================================================
   BLOCK F : render
========================================================= */

  return (
    <main
      style={{
        width: "100vw",
        height: "100vh",
      }}
    >




<Map
  ref={mapRef}
    initialViewState={{
    longitude: 136.9066,
    latitude: 35.1815,
    zoom: 10,
  }}
  mapStyle="https://tile.openstreetmap.jp/styles/osm-bright-ja/style.json"
  onLoad={(e) => {
    console.log(
      e.target.getStyle()
    );
  }}
  cursor={loading ? "wait" : "grab"}
  onClick={async (e) => {
    const { lng, lat } = e.lngLat;

    if (activePin === "A") {
      setLocationA({ lng, lat });
      await drawIsochrone(lng, lat, "A");
    } else {
      setLocationB({ lng, lat });
      await drawIsochrone(lng, lat, "B");
    }
  }}
>
{/* =========================================================
   BLOCK F-2 : isochrone A
========================================================= */}

        {isochroneA && (
          <Source
            id="isochrone-a"
            type="geojson"
            data={isochroneA}
          >
            <Layer
              id="isochrone-fill-a"
              type="fill"
              paint={{
                "fill-color": "#ef4444",
                "fill-opacity": 0.25,
              }}
            />

            <Layer
              id="isochrone-line-a"
              type="line"
              paint={{
                "line-color": "#dc2626",
                "line-width": 3,
              }}
            />
          </Source>
        )}

{/* =========================================================
   BLOCK F-3 : isochrone B
========================================================= */}

        {isochroneB && (
          <Source
            id="isochrone-b"
            type="geojson"
            data={isochroneB}
          >
            <Layer
              id="isochrone-fill-b"
              type="fill"
              paint={{
                "fill-color": "#3b82f6",
                "fill-opacity": 0.25,
              }}
            />

            <Layer
              id="isochrone-line-b"
              type="line"
              paint={{
                "line-color": "#2563eb",
                "line-width": 3,
              }}
            />
          </Source>
        )}


{/* =========================================================
   BLOCK F-4 : marker A
========================================================= */}

        {locationA && (
          <Marker
            longitude={locationA.lng}
            latitude={locationA.lat}
            color="red"
            draggable

            onDragEnd={async (e) => {

              const lng = e.lngLat.lng;
              const lat = e.lngLat.lat;

              setLocationA({ lng, lat });

              await drawIsochrone(
                lng,
                lat,
                "A"
              );
            }}
          />
        )}

{/* =========================================================
   BLOCK F-5 : marker B
========================================================= */}

        {locationB && (
          <Marker
            longitude={locationB.lng}
            latitude={locationB.lat}
            color="blue"
            draggable

            onDragEnd={async (e) => {

              const lng = e.lngLat.lng;
              const lat = e.lngLat.lat;

              setLocationB({ lng, lat });

              await drawIsochrone(
                lng,
                lat,
                "B"
              );
            }}
          />
        )}
      </Map>



      <button
  onClick={() =>
    setInfoOpen(!infoOpen)
  }
  style={{
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 1000,
    width: isMobile ? "42px" : "48px",
    height: isMobile ? "42px" : "48px",
    border: "none",
    borderRadius: "50%",
    background: "#1f2937",
    color: "white",
    fontSize: "22px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow:
      "0 2px 8px rgba(0,0,0,0.3)",
  }}
>
  {infoOpen ? "✕" : "ⓘ"}
</button>

{infoOpen && (
  <div
    style={{
      position: "absolute",
      top: 70,
      right: 20,
      width: isMobile ? "220px" : "320px",
      maxHeight: "80vh",
      overflowY: "auto",
      background: "white",
      padding: "16px",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      zIndex: 999,
      lineHeight: 1.7,
color: "#111827",
    }}
  >

<h3
  style={{
    marginTop: 0,
    marginBottom: "12px",
    fontSize: "20px",
    fontWeight: "bold",
    color: "#111827",
  }}
>
  このサイトについて
</h3>

<div
  style={{
    background: "#f3f4f6",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "16px",
  }}
>
  <p style={{ marginTop: 0 }}>
    自身が設定した通勤時間でどこまで到達できるかを
    地図上に表示するサービスです。
  </p>

  <p>
    勤務地や駅を指定すると、
    その場所から設定時間以内で
    到達できる範囲を可視化できます。
  </p>

  <p style={{ marginBottom: 0 }}>
    通勤30分以内で住める場所探しや、
    夫婦それぞれの勤務地に通いやすい
    エリア探しに活用できます。
  </p>
</div>

<h3
  style={{
    marginBottom: "12px",
  }}
>
  活用例
</h3>

<div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "20px",
  }}
>
  <div>🏠 通勤30分以内で住めるエリアを探す</div>
  <div>👫 夫婦の勤務地の中間地点を探す</div>
  <div>🚚 転勤先で住居候補を検討する</div>
  <div>📦 引越し前に通勤負担を比較する</div>
  <div>🏡 住宅購入前に通勤圏を確認する</div>
</div>

<details>
  <summary
    style={{
      cursor: "pointer",
      fontWeight: "bold",
    }}
  >
    プライバシーポリシー
  </summary>

  <p>
    当サイトでは、サービス改善および
    利用状況の分析のため、
    Google Analyticsを利用しています。
  </p>

  <p>
    Google AnalyticsはCookieを利用して
    利用状況を収集します。
    収集される情報は匿名であり、
    個人を特定するものではありません。
  </p>

  <p>
    ユーザーはブラウザ設定により
    Cookieを無効化することができます。
  </p>

  <p>
    当サイトでは今後、
    アフィリエイト広告や
    第三者配信広告を掲載する場合があります。
  </p>

  <p>
    その際、広告配信事業者が
    Cookie等を利用して
    ユーザーの興味に応じた広告を
    配信する場合があります。
  </p>

  <p>
    お問い合わせは下記メールアドレスまで
    ご連絡ください。
  </p>

  <p>
    （問い合わせ先を後で記載）
  </p>
</details>
<div
  style={{
    marginTop: "20px",
  }}
>
  <a
    href="/contact"
    style={{
      color: "#2563eb",
      fontWeight: "bold",
      textDecoration: "none",
    }}
  >
    お問い合わせはこちら
  </a>
</div>
  </div>
)}
{/* =========================================================
   BLOCK G : control panel
========================================================= */}

<button
  onClick={() =>
    setPanelOpen(!panelOpen)
  }
  style={{
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 1000,
    padding: "10px 14px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  }}
>
  {panelOpen ? "✕" : "☰"}
</button>

{panelOpen && (

<div
   style={{
    position: "absolute",
    top: 70,
    left: 20,
    background: "white",
    padding: isMobile ? "8px" : "16px",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    gap: isMobile ? "8px" : "16px",

    width: isMobile
  ? "170px"
  : "340px",
    maxWidth: "calc(100vw - 20px)",
  }}
>

{/* =========================================================
   BLOCK G-1 : pin mode
========================================================= */}

        <div>
          <div
            style={{
              fontWeight: "bold",
              color: "#111",
              marginBottom: "8px",
            }}
          >
            配置する地点
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
            }}
          >
            <button
              onClick={() => {
                setActivePin("A");
              }}
              style={{
                flex: 1,
                padding: "10px",
                border: "none",
                borderRadius: "6px",
                background:
                activePin === "A"
                    ? "#ef4444"
                    : "#ddd",
                color:
                activePin === "A"
                    ? "white"
                    : "#111",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              地点A
            </button>

            <button
              onClick={() => {
                setActivePin("B");
              }}
              style={{
                flex: 1,
                padding: "10px",
                border: "none",
                borderRadius: "6px",
                background:
                activePin === "B"
                    ? "#2563eb"
                    : "#ddd",
                color:
                activePin === "B"
                    ? "white"
                    : "#111",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              地点B
            </button>
          </div>
        </div>

{/* =========================================================
   BLOCK G-2 : instructions
========================================================= */}

        <div
          style={{
            fontSize: isMobile
  ? "11px"
  : "14px",
            color: "#111",
            fontWeight: "bold",
            lineHeight: 1.5,
          }}
        >
          📍 地図クリックで地点を配置
          <br />
          ピンはドラッグで調整可能
        </div>


{/* =========================================================
   BLOCK G-4 : minutes
========================================================= */}

        <div>

          <label
            style={{
              fontWeight: "bold",
              color: "#111",
            }}
          >
            所要時間（分）
          </label>

          <input
            type="number"
            min={5}
            max={120}
            step={5}
            value={minutes}

            onChange={(e) => {

              const value = Number(e.target.value);

              if (
                value >= 5 &&
                value <= 120
              ) {
                setMinutes(value);
              }
            }}

            style={{
              width: "100%",
              marginTop: "8px",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: "16px",
              color: "#111",
              fontWeight: "bold",
            }}
          />
        </div>

{/* =========================================================
   BLOCK G-5 : highway
========================================================= */}

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: "bold",
            color: "#111",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={useHighway}

            onChange={(e) => {
              setUseHighway(
                e.target.checked
              );
            }}
          />

          高速道路を使う
        </label>

{/* =========================================================
   BLOCK G-6 : share
========================================================= */}

        <button
          onClick={copyShareUrl}
          style={{
            padding: isMobile
  ? "5px"
  : "10px",

fontSize: isMobile
  ? "12px"
  : "16px",
            border: "none",
            borderRadius: "6px",
            background: "#10b981",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          検索結果を共有
        </button>

{/* =========================================================
   BLOCK G-7 : reset
========================================================= */}

        <button
          onClick={() => {

            setIsochroneA(null);
            setIsochroneB(null);

            setLocationA(null);
            setLocationB(null);

            

            setAreaName("");

          }}

          style={{
            padding: isMobile
  ? "5px"
  : "10px",

fontSize: isMobile
  ? "12px"
  : "16px",
            border: "none",
            borderRadius: "6px",
            background: "#ef4444",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          リセット
        </button>
{/* =========================================================
   BLOCK G-8 : real estate section
========================================================= */}

        {(locationA || locationB) && (

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginTop: "8px",
              paddingTop: "12px",
              borderTop:
                "1px solid #ddd",
            }}
          >

            <div
              style={{
                fontWeight: "bold",
                color: "#111",
                lineHeight: 1.5,
              }}
            >

              {locationA &&
              locationB ? (

                <>
                  重なった部分の
                  物件を見る
                </>

              ) : (

                <>
                  検索結果の
                  物件を見る
                </>
              )}
            </div>


            <div
              style={{
                display: "flex",
                gap: "8px",
              }}
            >

              <button
                onClick={() => {

                  openRealEstateSearch(
                    "suumo"
                  );

                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  border: "none",
                  borderRadius: "6px",
                  background:
                    "#16a34a",
                  color: "white",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                SUUMO
              </button>


              <button
                onClick={() => {

                  openRealEstateSearch(
                    "homes"
                  );

                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  border: "none",
                  borderRadius: "6px",
                  background:
                    "#2563eb",
                  color: "white",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                HOME'S
              </button>


              <button
                onClick={() => {

                  openRealEstateSearch(
                    "yahoo"
                  );

                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  border: "none",
                  borderRadius: "6px",
                  background:
                    "#7c3aed",
                  color: "white",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Yahoo
              </button>

            </div>

          </div>
        )}
      </div>
)}
    
{/* =========================================================
   BLOCK H : loading
========================================================= */}

      {loading && (
        <div
          style={{
            position: "absolute",
            top: 520,
            left: 20,
            background: "white",
            color: "black",
            fontWeight: "bold",
            padding: "10px 16px",
            borderRadius: "8px",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.2)",
            zIndex: 10,
          }}
        >
          計算中...
        </div>
      )}
    </main>
  );
}