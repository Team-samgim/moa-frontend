import OrbitBeam from './OrbitBeam'

const RADIUS = 260

const Dot = ({ angleDeg, radius = RADIUS, offsetX = 0, offsetY = 0 }) => {
  const rad = (angleDeg * Math.PI) / 180
  const x = radius * Math.cos(rad)
  const y = radius * -Math.sin(rad)

  return (
    <div
      className='absolute'
      style={{
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) translate(${x + offsetX}px, ${y + offsetY}px)`,
      }}
    >
      {/* 여기에서만 scale/opacity 애니메이션 → 좌표 transform과 안 겹침 */}
      <div className='relative flex items-center justify-center w-10 h-10 orbit-dot-glow'>
        {/* 바깥쪽 부드러운 퍼짐 영역 */}
        <div
          className='absolute inset-0 rounded-full opacity-70
          bg-[radial-gradient(circle,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.35)_40%,rgba(15,23,42,0)_70%)]'
        />

        {/* 중심 코어 점 + 샤프한 glow */}
        <div className='relative w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]' />
      </div>
    </div>
  )
}

const OrbitFeatures = () => {
  return (
    <>
      {/* 왼쪽 상단: delay 0초 */}
      <OrbitBeam angleDeg={120} offsetX={-150} variant='tl' delay={0} />
      <Dot angleDeg={120} offsetX={-150} />

      {/* 오른쪽 상단: delay 2초 */}
      <OrbitBeam angleDeg={60} offsetX={150} variant='tr' delay={2} />
      <Dot angleDeg={60} offsetX={150} />

      {/* 왼쪽 하단: delay 4초 */}
      <OrbitBeam angleDeg={-60} offsetX={150} variant='br' delay={4} />
      <Dot angleDeg={-60} offsetX={150} />

      {/* 오른쪽 하단: delay 6초 */}
      <OrbitBeam angleDeg={-120} offsetX={-150} variant='bl' delay={6} />
      <Dot angleDeg={-120} offsetX={-150} />
    </>
  )
}

export default OrbitFeatures
