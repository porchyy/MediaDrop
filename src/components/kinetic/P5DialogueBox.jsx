import PhantomMask from './PhantomMask'

/**
 * P5DialogueBox: Persona 5 signature asymmetrical comic dialogue balloon.
 * Displays dynamic tactical commentary, speaker nameplate, and Thai subtitles.
 */
export default function P5DialogueBox({
  id,
  phase = 'idle',
  isReady = false,
  errorKind = null,
  errorMessage = null,
  onReset = null,
  className = '',
}) {
  const isAlert = phase === 'error'

  let nameplate = '[ NAVI // SYSTEM ]'
  let headline = '// INFILTRATION PROTOCOL: IDLE'
  let subtitleThai = 'วางลิงก์สื่อเป้าหมาย (YouTube, TikTok, Instagram ฯลฯ) ในช่องคอนโซลเพื่อเริ่มแทรกซึม (01 PASTE ➔ 02 PICK ➔ 03 DOWNLOAD)'

  if (phase === 'error') {
    nameplate = '[ COGNITIVE DISTORTION // ALERT ]'
    headline = errorMessage?.[0] ? `// ${errorMessage[0]}` : '// TARGET ANOMALY DETECTED'
    subtitleThai = errorMessage?.[1] || 'เกิดข้อผิดพลาดในการเข้าถึงเป้าหมาย — โปรดตรวจสอบลิงก์แล้วลองใหม่อีกครั้ง'
  } else if (phase === 'analyzing') {
    nameplate = '[ NAVI // INFILTRATING ]'
    headline = '// INFILTRATING PLATFORM SECURITY...'
    subtitleThai = 'Infiltrating platform security... extracting media treasure (กำลังเจาะระบบความปลอดภัยของแพลตฟอร์ม — กำลังถอดรหัสและดึงข้อมูลสตรีมสื่อ)'
  } else if (phase === 'preparing' || phase === 'downloading' || phase === 'processing') {
    nameplate = '[ NAVI // STEALING TREASURE ]'
    headline = '// SECURING MEDIA PAYLOAD...'
    subtitleThai = 'กำลังประมวลผลและบรรจุหีบห่อไฟล์สื่อ — ภารกิจกำลังดำเนินไปอย่างราบรื่น'
  } else if (phase === 'result') {
    nameplate = '[ HEIST // TARGET SECURED ]'
    headline = '// TREASURE SECURED // SELECT OUTPUT FORMAT'
    subtitleThai = 'Treasure secured! Select output format to complete the heist (ตรวจพบสื่อเป้าหมายสำเร็จ! เลือกฟอร์แมตผลลัพธ์และคุณภาพที่ต้องการด้านล่าง)'
  } else if (phase === 'success') {
    nameplate = '[ MISSION // ACCOMPLISHED ]'
    headline = '// EXTRACTION COMPLETE'
    subtitleThai = 'ปฏิบัติการสำเร็จลุล่วง! สื่อพร้อมให้ดาวน์โหลดเก็บเข้าคลังส่วนตัวแล้ว'
  } else if (isReady) {
    nameplate = '[ NAVI // TARGET LOCK ]'
    headline = '// READY FOR ALL-OUT ATTACK'
    subtitleThai = 'Target confirmed! Ready for All-Out Attack (ล็อคเป้าหมายสื่อเรียบร้อย! กด ALL-OUT STRIKE ด้านล่างเพื่อเริ่มการวิเคราะห์)'
  }

  return (
    <div
      id={id}
      className={`p5-dialogue-wrapper ${className}`.trim()}
      role={isAlert ? 'alert' : 'region'}
      aria-label="Tactical Dialogue Guidance"
    >
      {/* Slanted Speaker Nameplate Badge */}
      <div className="p5-dialogue-nameplate" aria-hidden="true">
        <PhantomMask size={15} color="#ffffff" />
        <span>{nameplate}</span>
      </div>

      {/* Asymmetrical Comic Balloon */}
      <div className={`p5-dialogue-balloon ${isAlert ? 'p5-dialogue-balloon--alert' : ''}`}>
        <div className="p5-punch-in" key={nameplate + headline}>
          <p
            className="p5-dialogue-headline font-display"
            style={{
              margin: '0 0 0.25rem 0',
              fontSize: '1.05rem',
              letterSpacing: '0.08em',
              color: isAlert ? 'var(--p5-red)' : 'var(--p5-white)',
              lineHeight: 1.2,
            }}
          >
            {headline}
          </p>
          <p
            className="p5-dialogue-thai"
            style={{
              margin: 0,
              fontSize: '0.85rem',
              color: 'var(--p5-gray, #A7A7A7)',
              lineHeight: 1.45,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {subtitleThai}
          </p>

          {isAlert && onReset && (
            <button
              type="button"
              onClick={onReset}
              className="p5-analyze-btn p5-retry-btn"
              style={{
                width: 'auto',
                padding: '0.35rem 1rem',
                fontSize: '0.95rem',
                marginTop: '0.65rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span className="p5-analyze-btn-inner">TRY AGAIN // ESC</span>
            </button>
          )}
        </div>

        {/* Directional Comic Speech Tail pointing down */}
        <div className="p5-dialogue-tail" aria-hidden="true" />

        {/* Pulsing Tactical Prompt Indicator */}
        {!isAlert ? (
          <div className="p5-prompt-indicator" aria-hidden="true">
            <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', letterSpacing: '0.05em' }}>NEXT</span>
            <span>▼</span>
          </div>
        ) : (
          <div className="p5-prompt-indicator p5-prompt-indicator--alert" aria-hidden="true" style={{ color: 'var(--p5-red)' }}>
            <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', letterSpacing: '0.05em' }}>RETRY</span>
            <span>▲</span>
          </div>
        )}
      </div>
    </div>
  )
}
