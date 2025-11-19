import Leaderboard from "@/components/leaderboard"

export default function ClientLeaderboardPage() {
  return (
    <div className="fixed inset-0 ml-64 overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Leaderboard />
    </div>
  )
}
