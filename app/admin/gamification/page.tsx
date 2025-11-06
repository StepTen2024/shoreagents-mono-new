"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function GamificationPage() {
  const leaderboard = [
    { rank: 1, name: "Sarah Chen", points: 2847, badges: 12, level: "Diamond", streak: 45 },
    { rank: 2, name: "Mike Johnson", points: 2654, badges: 11, level: "Diamond", streak: 38 },
    { rank: 3, name: "Emily Rodriguez", points: 2431, badges: 10, level: "Platinum", streak: 42 },
    { rank: 4, name: "David Kim", points: 2289, badges: 9, level: "Platinum", streak: 31 },
    { rank: 5, name: "Lisa Wang", points: 2156, badges: 9, level: "Platinum", streak: 28 },
  ]

  const achievements = [
    { name: "Perfect Week", description: "100% attendance for a week", icon: "🏆", rarity: "Gold", earned: 23 },
    { name: "Speed Demon", description: "Complete 50 tasks in a day", icon: "⚡", rarity: "Silver", earned: 15 },
    { name: "Team Player", description: "Help 10 colleagues", icon: "🤝", rarity: "Bronze", earned: 34 },
    { name: "Night Owl", description: "Work late shift 20 times", icon: "🦉", rarity: "Silver", earned: 12 },
  ]

  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Gamification</h1>
            <p className="text-sm text-gray-400 mt-1">Staff achievements and leaderboards</p>
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700">Create Achievement</Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-950 border-white/20 p-4">
            <p className="text-sm text-gray-400">Total Points Awarded</p>
            <p className="text-2xl font-bold text-white mt-1">124,567</p>
            <p className="text-xs text-emerald-400 mt-1">↑ 18% this month</p>
          </Card>
          <Card className="bg-zinc-950 border-white/20 p-4">
            <p className="text-sm text-gray-400">Active Challenges</p>
            <p className="text-2xl font-bold text-white mt-1">8</p>
            <p className="text-xs text-gray-400 mt-1">3 ending this week</p>
          </Card>
          <Card className="bg-zinc-950 border-white/20 p-4">
            <p className="text-sm text-gray-400">Badges Earned</p>
            <p className="text-2xl font-bold text-white mt-1">456</p>
            <p className="text-xs text-gray-400 mt-1">This month</p>
          </Card>
          <Card className="bg-zinc-950 border-white/20 p-4">
            <p className="text-sm text-gray-400">Avg Engagement</p>
            <p className="text-2xl font-bold text-white mt-1">87%</p>
            <p className="text-xs text-emerald-400 mt-1">↑ 5% from last month</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leaderboard */}
          <Card className="bg-zinc-950 border-white/20">
            <div className="p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Top Performers</h2>
              <p className="text-sm text-gray-400 mt-1">This month's leaderboard</p>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {leaderboard.map((person) => (
                  <div key={person.rank} className="flex items-center gap-4 p-3 bg-black/30 rounded-lg">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        person.rank === 1
                          ? "bg-yellow-500/20 text-yellow-400"
                          : person.rank === 2
                            ? "bg-gray-400/20 text-gray-300"
                            : person.rank === 3
                              ? "bg-orange-500/20 text-orange-400"
                              : "bg-indigo-500/20 text-indigo-400"
                      }`}
                    >
                      {person.rank}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{person.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 text-xs">
                          {person.level}
                        </Badge>
                        <span className="text-xs text-gray-400">{person.badges} badges</span>
                        <span className="text-xs text-gray-400">• {person.streak} day streak</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">{person.points}</p>
                      <p className="text-xs text-gray-400">points</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Achievements */}
          <Card className="bg-zinc-950 border-white/20">
            <div className="p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Achievements</h2>
              <p className="text-sm text-gray-400 mt-1">Available badges and rewards</p>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {achievements.map((achievement) => (
                  <div key={achievement.name} className="flex items-center gap-4 p-3 bg-black/30 rounded-lg">
                    <div className="w-12 h-12 bg-indigo-600/20 rounded-lg flex items-center justify-center text-2xl">
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{achievement.name}</p>
                        <Badge
                          variant="outline"
                          className={
                            achievement.rarity === "Gold"
                              ? "border-yellow-500/30 text-yellow-400"
                              : achievement.rarity === "Silver"
                                ? "border-gray-400/30 text-gray-300"
                                : "border-orange-500/30 text-orange-400"
                          }
                        >
                          {achievement.rarity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{achievement.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{achievement.earned} staff earned this</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    
  )
}
