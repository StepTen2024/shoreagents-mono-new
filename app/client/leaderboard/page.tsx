import Leaderboard from "@/components/leaderboard"

export default function ClientLeaderboardPage() {
  return (
    <div className="fixed inset-0 ml-64 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <Leaderboard />
    </div>
  )
}
