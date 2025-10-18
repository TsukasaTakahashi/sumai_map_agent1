import React, { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const CreatePage = () => {
  const [title, setTitle] = useState('元町小学校区 おすすめ物件')
  const [pins, setPins] = useState([
    { name: 'サニーコート元町', address: '神奈川県横浜市中区元町5-200', note: '小学校まで徒歩8分・スーパー至近' },
    { name: '元町ガーデンハウス', address: '神奈川県横浜市中区元町4-170', note: '小学校まで徒歩5分・閑静な住宅街' },
    { name: 'ヒルサイドテラス山手', address: '神奈川県横浜市中区山手町230', note: '小学校まで徒歩10分・緑豊かな環境' },
  ])
  const [shareUrl, setShareUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addPin = () => {
    setPins([...pins, { name: '', address: '', note: '' }])
  }

  const removePin = (index) => {
    if (pins.length <= 1) {
      alert('最低1つの物件が必要です')
      return
    }
    setPins(pins.filter((_, i) => i !== index))
  }

  const updatePin = (index, field, value) => {
    const newPins = [...pins]
    newPins[index][field] = value
    setPins(newPins)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setShareUrl('')

    // 住所が入力されているピンのみをフィルタ
    const validPins = pins.filter(pin => pin.address.trim())

    if (validPins.length === 0) {
      setError('住所を少なくとも1つ入力してください')
      setLoading(false)
      return
    }

    // 物件名が空の場合は自動生成
    const processedPins = validPins.map((pin, index) => ({
      name: pin.name.trim() || `物件${String.fromCharCode(65 + index)}`,
      address: pin.address.trim(),
      note: pin.note.trim()
    }))

    try {
      const response = await fetch(`${API_BASE}/api/maps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          pins: processedPins,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'マップの作成に失敗しました')
      }

      const data = await response.json()
      setShareUrl(data.share_url)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl)
    alert('URLをコピーしました')
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>住まいマップ共有 - 作成</h1>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.field}>
          <label style={styles.label}>タイトル</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={styles.input}
            required
          />
        </div>

        <div style={styles.pinsContainer}>
          <label style={styles.label}>物件リスト</label>

          {pins.map((pin, index) => (
            <div key={index} style={styles.pinCard}>
              <div style={styles.pinHeader}>
                <span style={styles.pinNumber}>物件 {index + 1}</span>
                {pins.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePin(index)}
                    style={styles.removeButton}
                  >
                    ×
                  </button>
                )}
              </div>

              <div style={styles.pinInputs}>
                <input
                  type="text"
                  value={pin.name}
                  onChange={(e) => updatePin(index, 'name', e.target.value)}
                  placeholder="物件名（省略可）"
                  style={styles.input}
                />
                <input
                  type="text"
                  value={pin.address}
                  onChange={(e) => updatePin(index, 'address', e.target.value)}
                  placeholder="住所 *"
                  style={styles.input}
                  required
                />
                <input
                  type="text"
                  value={pin.note}
                  onChange={(e) => updatePin(index, 'note', e.target.value)}
                  placeholder="コメント（省略可）"
                  style={styles.input}
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addPin}
            style={styles.addButton}
          >
            + 物件を追加
          </button>
        </div>

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? '作成中...' : 'マップを作成'}
        </button>
      </form>

      {error && (
        <div style={styles.error}>
          <strong>エラー:</strong> {error}
        </div>
      )}

      {shareUrl && (
        <div style={styles.success}>
          <h2>作成完了!</h2>
          <div style={styles.urlBox}>
            <a href={shareUrl} target="_blank" rel="noopener noreferrer" style={styles.link}>
              {shareUrl}
            </a>
          </div>
          <button onClick={copyToClipboard} style={styles.copyButton}>
            URLをコピー
          </button>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'sans-serif',
  },
  title: {
    textAlign: 'center',
    color: '#333',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  label: {
    fontWeight: 'bold',
    color: '#555',
  },
  input: {
    padding: '8px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '4px',
  },
  textarea: {
    padding: '8px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontFamily: 'monospace',
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  error: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '4px',
  },
  success: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#d4edda',
    color: '#155724',
    borderRadius: '4px',
  },
  urlBox: {
    margin: '10px 0',
    padding: '10px',
    backgroundColor: '#fff',
    border: '1px solid #c3e6cb',
    borderRadius: '4px',
  },
  link: {
    color: '#007bff',
    textDecoration: 'none',
    wordBreak: 'break-all',
  },
  copyButton: {
    padding: '8px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  hint: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px',
  },
  pinsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  pinCard: {
    padding: '15px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
  },
  pinHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  pinNumber: {
    fontWeight: 'bold',
    color: '#555',
    fontSize: '14px',
  },
  removeButton: {
    padding: '4px 8px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  pinInputs: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  addButton: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
}

export default CreatePage
