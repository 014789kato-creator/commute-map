/* =========================================================
   BLOCK A : imports
========================================================= */

"use client";

import { useRef, useState } from "react";

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

const [searchText, setSearchText] =
  useState("");

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
   BLOCK D : address search
========================================================= */

  async function searchAddress() {

    if (!searchText) return;

    setLoading(true);

    try {

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchText
        )}.json?access_token=${
          process.env.NEXT_PUBLIC_MAPBOX_TOKEN
        }&language=ja&country=jp&types=address,place,locality,neighborhood&limit=1`
      );

      if (!response.ok) {
        throw new Error("Geocoding Error");
      }

      const data = await response.json();

      if (!data.features || data.features.length === 0) {
        alert("住所が見つかりませんでした");
        return;
      }

      const [lng, lat] = data.features[0].center;

      // A/Bで分岐
      if (activePin === "A") {
        setLocationA({ lng, lat });
      } else {
        setLocationB({ lng, lat });
      }

      mapRef.current?.flyTo({
        center: [lng, lat],
        zoom: 12,
        duration: 1500,
      });

      await drawIsochrone(lng, lat, activePin);

    } catch (error) {

      console.error(error);

      alert("住所検索に失敗しました");

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

{/* =========================================================
   BLOCK G : control panel
========================================================= */}

      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          background: "white",
          padding: "16px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          minWidth: "340px",
width: "340px",
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
            fontSize: "14px",
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
   BLOCK G-3 : address search
========================================================= */}

        <div>

          <label
            style={{
              fontWeight: "bold",
              color: "#111",
            }}
          >
            住所ジャンプ
          </label>

          <div
            style={{
              display: "flex",
              gap: "8px",
              marginTop: "8px",
            }}
          >
            <input
              type="text"
              placeholder="住所のみ対応"
              value={searchText}

              onChange={(e) => {
                setSearchText(e.target.value);
              }}

              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  searchAddress();
                }
              }}

              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                color: "#111",
              }}
            />

            <button
              onClick={searchAddress}
              style={{
                padding: "8px 12px",
                border: "none",
                borderRadius: "6px",
                background: "#2563eb",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              移動
            </button>
          </div>
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
            padding: "10px",
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

            setSearchText("");

            setAreaName("");

          }}

          style={{
            padding: "10px",
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