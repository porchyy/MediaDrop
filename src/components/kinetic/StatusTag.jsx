/**
 * StatusTag: Editorial micro-badge / technical coordinates inspired by Persona 5 UI.
 */
export default function StatusTag({
  children,
  variant = 'red', // 'red' | 'dark' | 'white' | 'outline' | 'slash'
  className = '',
  skew = true,
  ...rest
}) {
  return (
    <span
      className={`status-tag status-tag--${variant} ${skew ? 'status-tag--skew' : ''} ${className}`}
      {...rest}
    >
      <span className="status-tag-inner">{children}</span>
    </span>
  )
}
