// Confetti and celebration animations utility

export interface ConfettiConfig {
  particleCount?: number
  spread?: number
  origin?: { x: number; y: number }
  colors?: string[]
  shapes?: ('square' | 'circle')[]
  scalar?: number
  gravity?: number
  drift?: number
  ticks?: number
}

export interface HeartsConfig {
  count?: number
  size?: number
  speed?: number
  colors?: string[]
  duration?: number
}

// Default confetti configuration
const defaultConfettiConfig: ConfettiConfig = {
  particleCount: 50,
  spread: 45,
  origin: { x: 0.5, y: 0.5 },
  colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'],
  shapes: ['square', 'circle'],
  scalar: 1,
  gravity: 0.5,
  drift: 0,
  ticks: 200
}

// Default hearts configuration
const defaultHeartsConfig: HeartsConfig = {
  count: 20,
  size: 25,
  speed: 3,
  colors: ['#ff6b6b', '#ff8e8e', '#ffa8a8', '#ffc2c2', '#ffd6d6'],
  duration: 2500
}

// Create confetti particles
export function createConfetti(config: ConfettiConfig = {}) {
  const conf = { ...defaultConfettiConfig, ...config }
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  if (!ctx) return

  canvas.style.position = 'fixed'
  canvas.style.top = '0'
  canvas.style.left = '0'
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  canvas.style.pointerEvents = 'none'
  canvas.style.zIndex = '9999'
  
  document.body.appendChild(canvas)

  const particles: Array<{
    x: number
    y: number
    vx: number
    vy: number
    color: string
    shape: 'square' | 'circle'
    size: number
    rotation: number
    rotationSpeed: number
    life: number
  }> = []

  // Create particles
  for (let i = 0; i < conf.particleCount!; i++) {
    const angle = (Math.PI * 2 * i) / conf.particleCount! + (Math.random() - 0.5) * conf.spread! * (Math.PI / 180)
    const velocity = 10 + Math.random() * 10
    
    particles.push({
      x: window.innerWidth * conf.origin!.x,
      y: window.innerHeight * conf.origin!.y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity - 5,
      color: conf.colors![Math.floor(Math.random() * conf.colors!.length)],
      shape: conf.shapes![Math.floor(Math.random() * conf.shapes!.length)],
      size: 3 + Math.random() * 4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      life: 1
    })
  }

  let animationId: number

  function animate() {
    if (!ctx) return
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    particles.forEach((particle, index) => {
      // Update position
      particle.x += particle.vx
      particle.y += particle.vy
      particle.vy += conf.gravity!
      particle.vx += conf.drift!
      particle.rotation += particle.rotationSpeed
      particle.life -= 1 / conf.ticks!

      // Draw particle
      ctx.save()
      ctx.translate(particle.x, particle.y)
      ctx.rotate(particle.rotation)
      ctx.globalAlpha = particle.life
      ctx.fillStyle = particle.color

      if (particle.shape === 'circle') {
        ctx.beginPath()
        ctx.arc(0, 0, particle.size * conf.scalar!, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.fillRect(-particle.size * conf.scalar! / 2, -particle.size * conf.scalar! / 2, particle.size * conf.scalar!, particle.size * conf.scalar!)
      }

      ctx.restore()

      // Remove dead particles
      if (particle.life <= 0) {
        particles.splice(index, 1)
      }
    })

    if (particles.length > 0) {
      animationId = requestAnimationFrame(animate)
    } else {
      document.body.removeChild(canvas)
    }
  }

  // Set canvas size
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  animate()
}

// Create hearts animation
export function createHearts(config: HeartsConfig = {}) {
  const conf = { ...defaultHeartsConfig, ...config }
  const container = document.createElement('div')
  
  container.style.position = 'fixed'
  container.style.top = '0'
  container.style.left = '0'
  container.style.width = '100%'
  container.style.height = '100%'
  container.style.pointerEvents = 'none'
  container.style.zIndex = '9999'
  
  document.body.appendChild(container)

  // Create hearts
  for (let i = 0; i < conf.count!; i++) {
    const heart = document.createElement('div')
    heart.innerHTML = '❤️'
    heart.style.position = 'absolute'
    heart.style.fontSize = `${conf.size! + Math.random() * 10}px`
    heart.style.left = `${Math.random() * 100}%`
    heart.style.top = '100%'
    heart.style.transform = 'translateY(0)'
    heart.style.transition = `transform ${conf.duration!}ms ease-out`
    heart.style.opacity = '1'
    
    container.appendChild(heart)

    // Animate heart
    setTimeout(() => {
      heart.style.transform = `translateY(-${window.innerHeight + 100}px) rotate(${(Math.random() - 0.5) * 360}deg)`
      heart.style.opacity = '0'
    }, i * 50) // Reduced from 100ms to 50ms for faster appearance

    // Remove heart after animation
    setTimeout(() => {
      if (heart.parentNode) {
        heart.parentNode.removeChild(heart)
      }
    }, conf.duration! + i * 50)
  }

  // Remove container after all hearts are gone
  setTimeout(() => {
    if (container.parentNode) {
      container.parentNode.removeChild(container)
    }
  }, conf.duration! + conf.count! * 50)
}

// Trigger celebration based on task status
export function triggerTaskCelebration(status: string, taskTitle: string) {
  switch (status) {
    case 'COMPLETED':
      createConfetti({
        particleCount: 100,
        colors: ['#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff']
      })
      break
    default:
      // No celebration for other statuses (TODO, IN_PROGRESS, STUCK, FOR_REVIEW)
      break
  }
}
