interface DocumentSourceBadgeProps {
  source: 'ADMIN' | 'STAFF' | 'CLIENT'
  className?: string
}

export function DocumentSourceBadge({ source, className = "" }: DocumentSourceBadgeProps) {
  const getBadgeStyles = () => {
    switch (source) {
      case 'ADMIN':
        return {
          bg: 'bg-red-500/20',
          text: 'text-red-400',
          border: 'border-red-500/30',
          ring: 'ring-red-500/20',
          label: 'Admin',
          emoji: '🔴'
        }
      case 'STAFF':
        return {
          bg: 'bg-purple-500/20',
          text: 'text-purple-400',
          border: 'border-purple-500/30',
          ring: 'ring-purple-500/20',
          label: 'Staff',
          emoji: '🟣'
        }
      case 'CLIENT':
        return {
          bg: 'bg-blue-500/20',
          text: 'text-blue-400',
          border: 'border-blue-500/30',
          ring: 'ring-blue-500/20',
          label: 'Client',
          emoji: '🔵'
        }
    }
  }

  const styles = getBadgeStyles()

  return (
    <span 
      className={`
        inline-flex items-center gap-1 
        rounded-full px-2 py-0.5 
        text-[10px] font-medium 
        border 
        ${styles.bg} ${styles.text} ${styles.border} ${styles.ring}
        ${className}
      `.trim()}
    >
      <span>{styles.emoji}</span>
      <span>{styles.label}</span>
    </span>
  )
}

// Light theme variant for client-facing pages
export function DocumentSourceBadgeLight({ source, className = "" }: DocumentSourceBadgeProps) {
  const getBadgeStyles = () => {
    switch (source) {
      case 'ADMIN':
        return {
          bg: 'bg-red-50',
          text: 'text-red-700',
          border: 'border-red-300',
          label: 'Admin',
          emoji: '🔴'
        }
      case 'STAFF':
        return {
          bg: 'bg-purple-50',
          text: 'text-purple-700',
          border: 'border-purple-300',
          label: 'Staff',
          emoji: '🟣'
        }
      case 'CLIENT':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-300',
          label: 'Client',
          emoji: '🔵'
        }
    }
  }

  const styles = getBadgeStyles()

  return (
    <span 
      className={`
        inline-flex items-center gap-1 
        rounded-full px-2 py-0.5 
        text-[10px] font-medium 
        border 
        ${styles.bg} ${styles.text} ${styles.border}
        ${className}
      `.trim()}
    >
      <span>{styles.emoji}</span>
      <span>{styles.label}</span>
    </span>
  )
}

