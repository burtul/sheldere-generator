"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

interface TeamSelectorProps {
  teams: string[]
  selectedTeam: string | null
  onTeamSelect: (team: string) => void
}

export function TeamSelector({ teams, selectedTeam, onTeamSelect }: TeamSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

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
          {teams.map((team) => (
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