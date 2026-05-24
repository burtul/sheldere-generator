"use client"

import { useState, useEffect } from "react"

export interface UsePersistedStateOptions<T> {
  serialize?: (value: T) => string
  deserialize?: (raw: string) => T
}

/**
 * Состояние, синхронизированное с localStorage.
 * При монтировании читает значение по ключу; при изменении — записывает.
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T,
  options?: UsePersistedStateOptions<T>
): [T, (value: T | ((prev: T) => T)) => void] {
  const serialize = options?.serialize ?? ((v: T) => JSON.stringify(v))
  const deserialize =
    options?.deserialize ??
    ((raw: string): T => {
      try {
        return JSON.parse(raw) as T
      } catch {
        return initialValue
      }
    })

  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue
    const raw = localStorage.getItem(key)
    if (raw == null) return initialValue
    try {
      return deserialize(raw)
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = serialize(value)
      localStorage.setItem(key, raw)
    } catch {
      // ignore serialization errors
    }
  }, [key, value, serialize])

  return [value, setValue]
}
