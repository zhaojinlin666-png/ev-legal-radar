function DemoDocumentPanel({ document }) {
  return (
    <details className="demo-document-panel">
      <summary>
        <span>
          <strong>View Demo Document</strong>
          <small>{document.type}</small>
        </span>
        <span className="demo-document-panel__toggle" aria-hidden="true">
          +
        </span>
      </summary>

      <div className="demo-document-panel__content">
        <header>
          <p>{document.type}</p>
          <h2>{document.title}</h2>
          <span>{document.disclaimer}</span>
        </header>

        <div className="demo-document-sections">
          {document.sections.map((section) => (
            <section key={section.title}>
              <h3>{section.title}</h3>
              {section.introduction ? <p>{section.introduction}</p> : null}
              {section.bullets ? (
                <ul>
                  {section.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </details>
  )
}

export default DemoDocumentPanel
