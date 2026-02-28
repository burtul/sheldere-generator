"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

interface TeamSelectorProps {
  teams: string[]
  selectedTeam: string | null
  onTeamSelect: (team: string) => void
  scheduleType?: "2x2" | "5days"
  schedule5DayType?: "8hours" | "8-15"
}

export function TeamSelector({ teams, selectedTeam, onTeamSelect, scheduleType = "2x2", schedule5DayType = "8hours" }: TeamSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Определяем доступные команды в зависимости от типа графика
  const availableTeams = scheduleType === "5days"
    ? ["8 часов", "8 ч 15 м"]
    : teams

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <span className="text-lg font-medium">{selectedTeam || "Выбрать бригаду"}</span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {isOpen && (
        <div className="absolute mt-2 w-full bg-card rounded-lg p-2 border border-border shadow-lg z-50">
          {availableTeams.map((team) => (
            <Button
              key={team}
              variant="ghost"
              onClick={() => {
                onTeamSelect(team)
                setIsOpen(false)
              }}
              className="w-full justify-start py-2"
            >
              <span className="text-lg font-medium">{team}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}