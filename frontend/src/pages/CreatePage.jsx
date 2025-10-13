import React, { useState } from 'react'

const API_BASE = 'http://localhost:8000'

const CreatePage = () => {
  const [title, setTitle] = useState('元町小学校区 おすすめ物件')
  const [addresses, setAddresses] = useState(
    'サニーコート元町|神奈川県横浜市中区元町5-200|小学校まで徒歩8分・スーパー至近\n元町ガーデンハウス|神奈川県横浜市中区元町4-170|小学校まで徒歩5分・閑静な住宅街\nヒルサイドテラス山手|神奈川県横浜市中区山手町230|小学校まで徒歩10分・緑豊かな環境'
  )
  const [shareUrl, setShareUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setShareUrl('')

    // 住所を行ごとに分割してピン配列を作成
    // 形式: "物件名|住所|メモ" または "住所|メモ" または "住所"
    const lines = addresses.split('\n').filter((line) => line.trim())
    const pins = lines.map((line, index) => {
      const parts = line.split('|').map(p => p.trim())

      let name, address, note

      if (parts.length >= 3) {
        // 3つ以上の場合: 物件名|住所|メモ
        name = parts[0]
        address = parts[1]
        note = parts[2]
      } else if (parts.length === 2) {
        // 2つの場合: 住所|メモ (物件名は自動生成)
        name = `物件${String.fromCharCode(65 + index)}` // A, B, C...
        address = parts[0]
        note = parts[1]
      } else {
        // 1つの場合: 住所のみ
        name = `物件${String.fromCharCode(65 + index)}`
        address = parts[0]
        note = ''
      }

      return {
        name: name,
        address: address,
        note: note
      }
    })

    if (pins.length === 0) {
      setError('住所を少なくとも1つ入力してください')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE}/api/maps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          pins,
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

        <div style={styles.field}>
          <label style={styles.label}>物件リスト（1行1物件、「 | 」で区切る）</label>
          <textarea
            value={addresses}
            onChange={(e) => setAddresses(e.target.value)}
            style={styles.textarea}
            rows={10}
            placeholder="例: サニーコート元町|神奈川県横浜市中区元町5-200|小学校まで徒歩8分"
            required
          />
          <small style={styles.hint}>
            形式: 物件名|住所|メモ（物件名とメモは任意）<br/>
            ・物件名|住所|メモ → すべて指定<br/>
            ・住所|メモ → 物件名は自動生成（物件A, 物件B...）<br/>
            ・住所 → 物件名とメモは自動生成
          </small>
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
}

export default CreatePage
