export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '2px solid var(--border)',
        backgroundColor: 'var(--surface)',
        padding: '1.5rem 1.5rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      <p
        style={{
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: '0.9rem',
          color: 'var(--accent)',
          margin: 0,
          letterSpacing: '0.08em',
        }}
      >
        Simple&nbsp;•&nbsp;Fast&nbsp;•&nbsp;Private
      </p>
      <p
        style={{
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: '0.75rem',
          color: 'var(--muted)',
          margin: 0,
        }}
      >
        © {new Date().getFullYear()} MediaDrop
      </p>
    </footer>
  )
}
