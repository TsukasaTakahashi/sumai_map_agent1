import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

const API_BASE = 'VITE_API_BASE_URL_PLACEHOLDER'
const GOOGLE_MAPS_API_KEY = 'VITE_GOOGLE_MAPS_JS_KEY_PLACEHOLDER'

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

  // mapDataが取得されたらページタイトルを更新
  useEffect(() => {
    if (mapData) {
      document.title = mapData.title || 'SumaiAgent - Map'
    }
  }, [mapData])

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

    // カスタムオーバーレイクラスを定義
    class CustomPopupOverlay extends window.google.maps.OverlayView {
      constructor(position, content, direction, onClose) {
        super()
        this.position = position
        this.content = content
        this.direction = direction // 'top', 'bottom', 'left', 'right', etc.
        this.onClose = onClose
        this.div = null
        this.offsetX = 0 // ユーザーが調整したX方向のオフセット
        this.offsetY = 0 // ユーザーが調整したY方向のオフセット
      }

      onAdd() {
        const div = document.createElement('div')
        div.style.position = 'absolute'
        div.style.zIndex = '1000'
        div.style.cursor = 'move'

        div.innerHTML = `
          <div style="position: relative;">
            <div class="popup-content" style="background: white; border-radius: 4px; box-shadow: 0 2px 10px rgba(0,0,0,0.3); border: 2px solid #dc3545; padding: 2px 4px; max-width: 200px; position: relative;">
              <button class="close-btn" style="position: absolute; top: 2px; right: 2px; background: transparent; border: none; font-size: 18px; cursor: pointer; color: #666; padding: 0; width: 20px; height: 20px; line-height: 18px;">&times;</button>
              ${this.content}
            </div>
          </div>
        `

        // SVG線を別要素として作成
        this.lineSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        this.lineSvg.style.position = 'absolute'
        this.lineSvg.style.pointerEvents = 'none'
        this.lineSvg.style.zIndex = '999'
        this.lineSvg.style.overflow = 'visible'

        this.lineElement = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        this.lineElement.setAttribute('stroke', '#dc3545')
        this.lineElement.setAttribute('stroke-width', '3')
        this.lineSvg.appendChild(this.lineElement)

        div.querySelector('.close-btn').addEventListener('click', () => {
          this.onClose()
        })

        // ドラッグ機能を追加
        this.isDragging = false
        this.startX = 0
        this.startY = 0
        this.initialLeft = 0
        this.initialTop = 0

        const onMouseDown = (e) => {
          // クローズボタンやリンクをクリックした場合はドラッグしない
          if (e.target.closest('.close-btn') || e.target.closest('a') || e.target.closest('button:not(.close-btn)')) {
            return
          }

          this.isDragging = true
          this.startX = e.clientX
          this.startY = e.clientY
          this.initialLeft = parseInt(div.style.left) || 0
          this.initialTop = parseInt(div.style.top) || 0
          div.style.cursor = 'grabbing'
          e.preventDefault()
          e.stopPropagation()
        }

        const onMouseMove = (e) => {
          if (!this.isDragging) return

          const deltaX = e.clientX - this.startX
          const deltaY = e.clientY - this.startY

          div.style.left = (this.initialLeft + deltaX) + 'px'
          div.style.top = (this.initialTop + deltaY) + 'px'

          // 線を更新
          this.updateLine()

          e.preventDefault()
        }

        const onMouseUp = () => {
          if (this.isDragging) {
            this.isDragging = false

            // ドラッグ後の位置から、本来の位置との差分（オフセット）を計算
            const overlayProjection = this.getProjection()
            if (overlayProjection) {
              const position = overlayProjection.fromLatLngToDivPixel(this.position)
              const popupWidth = 220
              const popupHeight = 150
              const lineLength = 80

              // 本来の位置を計算
              let defaultLeft, defaultTop
              switch(this.direction) {
                case 'bottom':
                  defaultLeft = position.x - popupWidth / 2
                  defaultTop = position.y + lineLength + 5
                  break
                case 'left':
                  defaultLeft = position.x - popupWidth - lineLength - 5
                  defaultTop = position.y - popupHeight / 2
                  break
                case 'right':
                  defaultLeft = position.x + lineLength
                  defaultTop = position.y - popupHeight / 2
                  break
                case 'top':
                default:
                  defaultLeft = position.x - popupWidth / 2
                  defaultTop = position.y - popupHeight - lineLength
                  break
              }

              // 現在の位置との差分をオフセットとして保存
              const currentLeft = parseInt(div.style.left) || 0
              const currentTop = parseInt(div.style.top) || 0
              this.offsetX = currentLeft - defaultLeft
              this.offsetY = currentTop - defaultTop
            }

            this.manuallyPositioned = true
            div.style.cursor = 'move'
          }
        }

        div.addEventListener('mousedown', onMouseDown)
        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)

        // クリーンアップ用に保存
        this.cleanupDrag = () => {
          div.removeEventListener('mousedown', onMouseDown)
          document.removeEventListener('mousemove', onMouseMove)
          document.removeEventListener('mouseup', onMouseUp)
        }

        this.div = div
        const panes = this.getPanes()
        panes.floatPane.appendChild(div)
        panes.floatPane.appendChild(this.lineSvg)
      }

      getLineStyles() {
        // ポップアップからピンまでの線を描画（青い線）
        const lineWidth = 3
        const lineColor = '#dc3545' // 赤（デバッグ用）

        switch(this.direction) {
          case 'bottom': // ピンが下にある場合、ポップアップは下に配置される
            return `
              <svg style="position: absolute; top: -80px; left: 50%; transform: translateX(-50%); width: ${lineWidth}px; height: 80px; pointer-events: none;">
                <line x1="${lineWidth/2}" y1="0" x2="${lineWidth/2}" y2="80" stroke="${lineColor}" stroke-width="${lineWidth}" />
              </svg>
            `
          case 'left': // ピンが左にある場合、ポップアップは左に配置される
            return `
              <svg style="position: absolute; right: -80px; top: 50%; transform: translateY(-50%); width: 80px; height: ${lineWidth}px; pointer-events: none;">
                <line x1="0" y1="${lineWidth/2}" x2="80" y2="${lineWidth/2}" stroke="${lineColor}" stroke-width="${lineWidth}" />
              </svg>
            `
          case 'right': // ピンが右にある場合、ポップアップは右に配置される
            return `
              <svg style="position: absolute; left: -80px; top: 50%; transform: translateY(-50%); width: 80px; height: ${lineWidth}px; pointer-events: none;">
                <line x1="0" y1="${lineWidth/2}" x2="80" y2="${lineWidth/2}" stroke="${lineColor}" stroke-width="${lineWidth}" />
              </svg>
            `
          case 'top': // ピンが上にある場合（デフォルト）、ポップアップは上に配置される
          default:
            return `
              <svg style="position: absolute; bottom: -80px; left: 50%; transform: translateX(-50%); width: ${lineWidth}px; height: 80px; pointer-events: none;">
                <line x1="${lineWidth/2}" y1="0" x2="${lineWidth/2}" y2="80" stroke="${lineColor}" stroke-width="${lineWidth}" />
              </svg>
            `
        }
      }

      draw() {
        const overlayProjection = this.getProjection()
        const position = overlayProjection.fromLatLngToDivPixel(this.position)

        if (this.div) {
          // ポップアップの幅を取得（おおよそ220px）
          const popupWidth = 220
          const popupHeight = 150
          const lineLength = 80

          let left, top

          // 方向に応じてポップアップの基本位置を計算
          switch(this.direction) {
            case 'bottom': // ピンの下に表示
              left = position.x - popupWidth / 2
              top = position.y + lineLength + 5 // +5pxで下に微調整
              break
            case 'left': // ピンの左に表示
              left = position.x - popupWidth - lineLength - 5 // -5pxで左に微調整
              top = position.y - popupHeight / 2
              break
            case 'right': // ピンの右に表示
              left = position.x + lineLength
              top = position.y - popupHeight / 2
              break
            case 'top': // ピンの上に表示（デフォルト）
            default:
              left = position.x - popupWidth / 2
              top = position.y - popupHeight - lineLength
              break
          }

          // ユーザーが手動調整したオフセットを適用
          this.div.style.left = (left + this.offsetX) + 'px'
          this.div.style.top = (top + this.offsetY) + 'px'

          // 線を更新
          this.updateLine()
        }
      }

      updateLine() {
        // ピン位置とポップアップ位置を取得して線を描画
        const overlayProjection = this.getProjection()
        if (!overlayProjection) return

        const pinPos = overlayProjection.fromLatLngToDivPixel(this.position)
        if (!this.div || !pinPos) return

        // ポップアップの中心位置を計算
        const popupRect = this.div.getBoundingClientRect()
        const popupLeft = parseInt(this.div.style.left) || 0
        const popupTop = parseInt(this.div.style.top) || 0
        const popupWidth = 220
        const popupHeight = 150

        const popupCenterX = popupLeft + popupWidth / 2
        const popupCenterY = popupTop + popupHeight / 2

        // SVGのサイズと位置を設定（ピンとポップアップを含む矩形）
        const minX = Math.min(pinPos.x, popupCenterX)
        const minY = Math.min(pinPos.y, popupCenterY)
        const maxX = Math.max(pinPos.x, popupCenterX)
        const maxY = Math.max(pinPos.y, popupCenterY)

        const svgWidth = maxX - minX + 10
        const svgHeight = maxY - minY + 10

        this.lineSvg.style.left = (minX - 5) + 'px'
        this.lineSvg.style.top = (minY - 5) + 'px'
        this.lineSvg.setAttribute('width', svgWidth)
        this.lineSvg.setAttribute('height', svgHeight)

        // 線の開始点と終了点（SVG座標系）
        const x1 = pinPos.x - minX + 5
        const y1 = pinPos.y - minY + 5
        const x2 = popupCenterX - minX + 5
        const y2 = popupCenterY - minY + 5

        this.lineElement.setAttribute('x1', x1)
        this.lineElement.setAttribute('y1', y1)
        this.lineElement.setAttribute('x2', x2)
        this.lineElement.setAttribute('y2', y2)
      }

      onRemove() {
        if (this.div) {
          this.div.parentNode.removeChild(this.div)
          this.div = null
        }
        if (this.lineSvg) {
          this.lineSvg.parentNode.removeChild(this.lineSvg)
          this.lineSvg = null
        }
      }
    }

    // カスタムオーバーレイクラスをwindowオブジェクトに保存
    window.CustomPopupOverlay = CustomPopupOverlay

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

    // 開いているInfoWindowを管理する配列
    const openInfoWindows = []

    // グループごとにマーカーを作成（1グループ = 1マーカー）
    groups.forEach((group, groupIndex) => {
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
        let content = '<div style="padding: 2px 4px; max-width: 200px;">'

        // トグルボタン
        content += `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; padding-bottom: 1px; padding-right: 24px; border-bottom: 1px solid #dee2e6;">
            <strong style="color: #495057; font-size: 11px;">${group.length}件</strong>
            <button id="toggle-btn" style="padding: 1px 4px; background-color: #6c757d; color: white; border: none; border-radius: 2px; cursor: pointer; font-size: 10px;">
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
              <div style="padding: 1px 3px; margin-bottom: ${idx < group.length - 1 ? '1px' : '0'}; background-color: #f8f9fa; border-radius: 2px; display: flex; align-items: center; gap: 3px;">
                <span style="flex-shrink: 0; width: 15px; height: 15px; background-color: #dc3545; color: white; border-radius: 50%; text-align: center; line-height: 15px; font-weight: bold; font-size: 9px;">${pinLabel}</span>
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
              <div style="margin-bottom: ${idx < group.length - 1 ? '3px' : '0'}; padding: 3px; background-color: #f8f9fa; border-radius: 2px; border-left: 2px solid #dc3545;">
                <div style="display: flex; align-items: center; gap: 3px; margin-bottom: 1px;">
                  <span style="flex-shrink: 0; width: 16px; height: 16px; background-color: #dc3545; color: white; border-radius: 50%; text-align: center; line-height: 16px; font-weight: bold; font-size: 9px;">${pinLabel}</span>
                  <h4 style="margin: 0; font-size: 11px; color: #212529; font-weight: 600;">${pin.name}</h4>
                </div>
                <p style="margin: 0 0 2px 19px; color: #6c757d; font-size: 9px; line-height: 1.1;">${pin.address}</p>
                ${pin.note ? `<p style="margin: 0 0 2px 19px; padding: 2px 3px; background-color: #ffffff; border-radius: 2px; font-size: 9px; color: #495057; line-height: 1.2;">${pin.note}</p>` : ''}
                <div style="display: flex; gap: 2px; margin-left: 19px; flex-wrap: wrap;">
                  <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pin.address)}"
                     target="_blank"
                     style="padding: 2px 4px; background-color: #007bff; color: white; text-decoration: none; border-radius: 2px; font-size: 9px;">
                    📍
                  </a>
                  <a href="https://www.google.com/maps/dir/?api=1&destination=${pin.lat},${pin.lng}"
                     target="_blank"
                     style="padding: 2px 4px; background-color: #28a745; color: white; text-decoration: none; border-radius: 2px; font-size: 9px;">
                    🚗
                  </a>
                  <a href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${pin.lat},${pin.lng}&fov=90"
                     target="_blank"
                     style="padding: 2px 4px; background-color: #17a2b8; color: white; text-decoration: none; border-radius: 2px; font-size: 9px;">
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

      // 2つの矩形が重なっているか判定
      const isOverlapping = (rect1, rect2) => {
        return !(rect1.right < rect2.left ||
                 rect1.left > rect2.right ||
                 rect1.bottom < rect2.top ||
                 rect1.top > rect2.bottom)
      }

      // マーカーの画面上の位置を取得してポップアップの矩形を計算
      const calculatePopupRect = (marker, offsetX, offsetY) => {
        const scale = Math.pow(2, map.getZoom())
        const projection = map.getProjection()
        const bounds = map.getBounds()
        const topRight = projection.fromLatLngToPoint(bounds.getNorthEast())
        const bottomLeft = projection.fromLatLngToPoint(bounds.getSouthWest())
        const worldPoint = projection.fromLatLngToPoint(marker.getPosition())

        const pixelX = (worldPoint.x - bottomLeft.x) * scale
        const pixelY = (worldPoint.y - topRight.y) * scale

        // ポップアップのサイズ（おおよそ）
        const popupWidth = 220
        const popupHeight = isMinimized ? 100 : 250

        // ポップアップはデフォルトでピンの上中央に表示される
        // offsetを適用した位置を計算
        const left = pixelX + offsetX - popupWidth / 2
        const top = pixelY + offsetY - popupHeight - 40  // 40はピンとポップアップの間隔

        return {
          left: left,
          right: left + popupWidth,
          top: top,
          bottom: top + popupHeight
        }
      }

      const showInfoWindow = () => {
        if (currentInfoWindow) {
          currentInfoWindow.setMap(null)
          // 配列から削除
          const index = openInfoWindows.indexOf(currentInfoWindow)
          if (index > -1) {
            openInfoWindows.splice(index, 1)
          }
        }

        // 試す位置のパターン: 上（デフォルト）、下、右、左
        const offsetPatterns = [
          { direction: 'top', name: '上' },
          { direction: 'bottom', name: '下' },
          { direction: 'right', name: '右' },
          { direction: 'left', name: '左' }
        ]

        let finalDirection = 'top'
        let foundNonOverlapping = false

        // 簡易的な重なりチェック（他のポップアップが開いている場合はローテーション）
        if (openInfoWindows.length > 0) {
          const patternIndex = openInfoWindows.length % offsetPatterns.length
          finalDirection = offsetPatterns[patternIndex].direction
        } else {
          finalDirection = 'top'
        }

        const content = createInfoWindowContent(isMinimized)

        currentInfoWindow = new window.CustomPopupOverlay(
          marker.getPosition(),
          content,
          finalDirection,
          () => {
            if (currentInfoWindow) {
              currentInfoWindow.setMap(null)
              const index = openInfoWindows.indexOf(currentInfoWindow)
              if (index > -1) {
                openInfoWindows.splice(index, 1)
              }
            }
          }
        )

        currentInfoWindow.setMap(map)

        // 開いているInfoWindowリストに追加
        openInfoWindows.push(currentInfoWindow)

        // トグルボタンのイベントリスナーを設定（DOMが追加された後）
        setTimeout(() => {
          const toggleBtn = currentInfoWindow.div?.querySelector('#toggle-btn')
          if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
              isMinimized = !isMinimized
              showInfoWindow()
            })
          }
        }, 100)
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
