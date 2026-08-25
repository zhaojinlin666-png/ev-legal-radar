function UploadedDocumentPreview({ document }) {
  if (!document) {
    return (
      <section className="uploaded-document-preview uploaded-document-preview--empty">
        <p>Select a .txt document to preview its contents locally.</p>
      </section>
    )
  }

  return (
    <section
      className="uploaded-document-preview"
      aria-labelledby="uploaded-preview-title"
    >
      <p className="uploaded-document-preview__success">
        Document loaded successfully. The document is ready for preliminary
        review.
      </p>

      <dl className="uploaded-document-metadata">
        <div>
          <dt>Document Name</dt>
          <dd>{document.name}</dd>
        </div>
        <div>
          <dt>File Size</dt>
          <dd>{document.size.toLocaleString('en-US')} bytes</dd>
        </div>
        <div>
          <dt>File Type</dt>
          <dd>{document.type || 'Not provided'}</dd>
        </div>
        <div>
          <dt>Character Count</dt>
          <dd>{document.characterCount.toLocaleString('en-US')}</dd>
        </div>
      </dl>

      <div className="uploaded-document-content">
        <h2 id="uploaded-preview-title">Document Preview</h2>
        <pre>{document.content}</pre>
      </div>
    </section>
  )
}

export default UploadedDocumentPreview
