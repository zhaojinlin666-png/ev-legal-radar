import { useState } from 'react'

function DocumentUploader({ onDocumentLoaded }) {
  const [error, setError] = useState('')
  const [isReading, setIsReading] = useState(false)

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    setError('')
    setIsReading(false)
    onDocumentLoaded(null)

    if (!file.name.toLowerCase().endsWith('.txt')) {
      setError('Unsupported file type. Please upload a .txt document.')
      return
    }

    const reader = new FileReader()
    setIsReading(true)

    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : ''
      setIsReading(false)

      if (content.length === 0) {
        setError('The uploaded document is empty.')
        return
      }

      onDocumentLoaded({
        name: file.name,
        size: file.size,
        type: file.type,
        characterCount: content.length,
        content,
      })
    }

    reader.onerror = () => {
      setIsReading(false)
      setError('The document could not be read. Please try another .txt file.')
    }

    reader.readAsText(file)
  }

  return (
    <section className="document-uploader" aria-labelledby="upload-title">
      <div className="document-uploader__heading">
        <p className="section-kicker">Local document</p>
        <h2 id="upload-title">Upload Document for Review</h2>
        <p>Upload a plain text document to prepare it for legal review.</p>
      </div>

      <label className="document-uploader__control">
        <span>Select TXT document</span>
        <input type="file" accept=".txt" onChange={handleFileChange} />
      </label>

      <p className="document-uploader__notice">
        File reading and preview stay in this browser. Rule-based review remains
        local. When you start AI-assisted review, the text is sent through the
        local backend to OpenAI.
      </p>

      {isReading ? (
        <p className="document-uploader__reading" aria-live="polite">
          Reading document…
        </p>
      ) : null}

      {error ? (
        <p className="document-uploader__error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  )
}

export default DocumentUploader
