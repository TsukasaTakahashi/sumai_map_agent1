import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

const API_BASE = 'http://localhost:8000'
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_JS_KEY

const SharedMap = () => {
  const { mapId } = useParams()
  const [mapData, setMapData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mapInstance, setMapInstance] = useState(null)

  const handlePrint = () => {
    window.print()
  }

  useEffect(() => {
    // ページタイトルを変更
    document.title = 'XXXX様ご住居探し'

    // Google Maps APIスクリプトを動的に読み込み
    if (!window.google) {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => {
        fetchMapData()
      }
      document.head.appendChild(script)
    } else {
      fetchMapData()
    }
  }, [mapId])

  const fetchMapData = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/maps/${mapId}`)
      if (!response.ok) {
        throw new Error('マップが見つかりません')
      }
      const data = await response.json()
      setMapData(data)
      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (mapData && window.google && !mapInstance) {
      initializeMap()
    }
  }, [mapData, mapInstance])

  const initializeMap = () => {
    const { pins } = mapData

    // 重心（中心点）を計算
    const centerLat = pins.reduce((sum, pin) => sum + pin.lat, 0) / pins.length
    const centerLng = pins.reduce((sum, pin) => sum + pin.lng, 0) / pins.length

    // マップを初期化（重心を中心に）
    const map = new window.google.maps.Map(document.getElementById('map'), {
      zoom: 12,
      center: { lat: centerLat, lng: centerLng },
    })

    // マーカーと範囲を計算するためのBounds
    const bounds = new window.google.maps.LatLngBounds()

    // 2点間の距離を計算（メートル単位）
    const calculateDistance = (lat1, lng1, lat2, lng2) => {
      const R = 6371000 // 地球の半径（メートル）
      const dLat = (lat2 - lat1) * Math.PI / 180
      const dLng = (lng2 - lng1) * Math.PI / 180
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c
    }

    // 10m以内の重複を検出してグループ化
    const groups = []
    const processed = new Set()

    pins.forEach((pin, index) => {
      if (processed.has(index)) return

      const group = [{ pin, index }]
      processed.add(index)

      // 他のピンで10m以内のものを探す
      pins.forEach((otherPin, otherIndex) => {
        if (processed.has(otherIndex)) return

        const distance = calculateDistance(pin.lat, pin.lng, otherPin.lat, otherPin.lng)
        if (distance <= 10) {
          group.push({ pin: otherPin, index: otherIndex })
          processed.add(otherIndex)
        }
      })

      groups.push(group)
    })

    // グループごとにマーカーを作成（1グループ = 1マーカー）
    groups.forEach((group) => {
      const firstPin = group[0].pin
      const position = { lat: firstPin.lat, lng: firstPin.lng }

      // ラベルの作成（複数ある場合は "A,B,C" のように表示）
      const labelText = group.map(g => String.fromCharCode(65 + g.index)).join(',')
      const label = {
        text: labelText,
        color: '#FFFFFF',
        fontSize: group.length > 1 ? '12px' : '14px',
        fontWeight: 'bold'
      }

      const marker = new window.google.maps.Marker({
        position,
        map,
        title: group.map(g => g.pin.name).join(', '),
        label: label,
        animation: window.google.maps.Animation.DROP
      })

      // 詳細表示/最小表示を切り替える関数
      let isMinimized = false
      let currentInfoWindow = null

      const createInfoWindowContent = (minimized) => {
        let content = '<div style="padding: 6px; max-width: 200px;">'

        // トグルボタン
        content += `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; padding-bottom: 4px; border-bottom: 1px solid #dee2e6;">
            <strong style="color: #495057; font-size: 11px;">${group.length}件</strong>
            <button id="toggle-btn" style="padding: 3px 6px; background-color: #6c757d; color: white; border: none; border-radius: 2px; cursor: pointer; font-size: 10px;">
              ${minimized ? '詳細' : '最小'}
            </button>
          </div>
        `

        if (minimized) {
          // 最小表示: 物件名とラベルのみ（超コンパクト）
          content += '<div style="max-height: 150px; overflow-y: auto;">'
          group.forEach((item, idx) => {
            const pin = item.pin
            const pinLabel = String.fromCharCode(65 + item.index)

            content += `
              <div style="padding: 3px 5px; margin-bottom: ${idx < group.length - 1 ? '2px' : '0'}; background-color: #f8f9fa; border-radius: 2px; display: flex; align-items: center; gap: 5px;">
                <span style="flex-shrink: 0; width: 16px; height: 16px; background-color: #dc3545; color: white; border-radius: 50%; text-align: center; line-height: 16px; font-weight: bold; font-size: 9px;">${pinLabel}</span>
                <span style="font-size: 10px; color: #212529; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${pin.name}</span>
              </div>
            `
          })
          content += '</div>'
        } else {
          // 詳細表示: 全情報（超コンパクト版）
          content += '<div style="max-height: 280px; overflow-y: auto;">'
          group.forEach((item, idx) => {
            const pin = item.pin
            const pinLabel = String.fromCharCode(65 + item.index)

            content += `
              <div style="margin-bottom: ${idx < group.length - 1 ? '8px' : '0'}; padding: 5px; background-color: #f8f9fa; border-radius: 3px; border-left: 2px solid #dc3545;">
                <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 3px;">
                  <span style="flex-shrink: 0; width: 18px; height: 18px; background-color: #dc3545; color: white; border-radius: 50%; text-align: center; line-height: 18px; font-weight: bold; font-size: 10px;">${pinLabel}</span>
                  <h4 style="margin: 0; font-size: 12px; color: #212529; font-weight: 600;">${pin.name}</h4>
                </div>
                <p style="margin: 0 0 4px 23px; color: #6c757d; font-size: 9px; line-height: 1.2;">${pin.address}</p>
                ${pin.note ? `<p style="margin: 0 0 5px 23px; padding: 4px 5px; background-color: #ffffff; border-radius: 2px; font-size: 10px; color: #495057; line-height: 1.3;">${pin.note}</p>` : ''}
                <div style="display: flex; gap: 3px; margin-left: 23px; flex-wrap: wrap;">
                  <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pin.address)}"
                     target="_blank"
                     style="padding: 3px 6px; background-color: #007bff; color: white; text-decoration: none; border-radius: 2px; font-size: 9px;">
                    📍
                  </a>
                  <a href="https://www.google.com/maps/dir/?api=1&destination=${pin.lat},${pin.lng}"
                     target="_blank"
                     style="padding: 3px 6px; background-color: #28a745; color: white; text-decoration: none; border-radius: 2px; font-size: 9px;">
                    🚗
                  </a>
                  <a href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${pin.lat},${pin.lng}&fov=90"
                     target="_blank"
                     style="padding: 3px 6px; background-color: #17a2b8; color: white; text-decoration: none; border-radius: 2px; font-size: 9px;">
                    👁️
                  </a>
                </div>
              </div>
            `
          })
          content += '</div>'
        }

        content += '</div>'
        return content
      }

      const showInfoWindow = () => {
        if (currentInfoWindow) {
          currentInfoWindow.close()
        }

        currentInfoWindow = new window.google.maps.InfoWindow({
          content: createInfoWindowContent(isMinimized),
          maxWidth: 200
        })

        currentInfoWindow.open(map, marker)

        // トグルボタンのイベントリスナー
        window.google.maps.event.addListenerOnce(currentInfoWindow, 'domready', () => {
          const toggleBtn = document.getElementById('toggle-btn')
          if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
              isMinimized = !isMinimized
              showInfoWindow()
            })
          }
        })
      }

      // マーカークリックでInfoWindow表示
      marker.addListener('click', () => {
        showInfoWindow()
      })

      // Boundsに追加
      bounds.extend(position)
    })

    // ピンの数に応じて表示を調整
    if (pins.length === 1) {
      // 1つの場合: ピンを中心に、適度にズーム
      map.setCenter({ lat: pins[0].lat, lng: pins[0].lng })
      map.setZoom(14)  // 少し引いて余白を確保
    } else {
      // 2つ以上の場合: すべてのピンが収まるようにfitBounds
      map.fitBounds(bounds, {
        top: 80,      // ヘッダー分の余白
        bottom: 50,   // 下部の余白
        left: 50,     // 左側の余白
        right: 50     // 右側の余白
      })

      // fitBoundsの後、さらにズームアウトして余白を確保
      window.google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
        const currentZoom = map.getZoom()
        // 1段階ズームアウトして印刷時に余裕を持たせる
        if (currentZoom > 1) {
          map.setZoom(currentZoom - 1)
        }
      })
    }

    setMapInstance(map)
  }

  if (loading) {
    return <div style={styles.container}>読み込み中...</div>
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>エラー: {error}</div>
      </div>
    )
  }

  return (
    <div style={styles.fullContainer}>
      <div id="map" style={styles.map}></div>
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          #map {
            width: 100% !important;
            height: 100vh !important;
            page-break-after: avoid;
          }
        }
      `}</style>
    </div>
  )
}

const styles = {
  fullContainer: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    margin: 0,
    padding: 0,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #dee2e6',
  },
  printHeader: {
    padding: '15px 20px',
    backgroundColor: '#fff',
    borderBottom: '2px solid #333',
    textAlign: 'center',
  },
  printTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
  },
  headerTitle: {
    margin: 0,
    fontSize: '20px',
    color: '#333',
  },
  headerButtons: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  printButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  headerLink: {
    color: '#007bff',
    textDecoration: 'none',
  },
  map: {
    flex: 1,
    width: '100%',
  },
  container: {
    maxWidth: '600px',
    margin: '50px auto',
    padding: '20px',
    fontFamily: 'sans-serif',
    textAlign: 'center',
  },
  error: {
    padding: '15px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '4px',
  },
}

export default SharedMap
