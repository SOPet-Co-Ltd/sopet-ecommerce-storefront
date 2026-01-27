const SEARCH_HISTORY_KEY = "search_history"
const MAX_HISTORY_ITEMS = 20

export const getSearchHistory = (): string[] => {
  if (typeof window === "undefined") return []

  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY)
    return history ? JSON.parse(history) : []
  } catch (error) {
    console.error("Error reading search history:", error)
    return []
  }
}

export const addSearchHistory = (query: string): void => {
  if (typeof window === "undefined" || !query.trim()) return

  try {
    const history = getSearchHistory()

    // Remove the query if it already exists
    const filteredHistory = history.filter((item) => item !== query)

    // Add the new query at the beginning
    const updatedHistory = [query, ...filteredHistory].slice(
      0,
      MAX_HISTORY_ITEMS
    )

    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory))
  } catch (error) {
    console.error("Error saving search history:", error)
  }
}

export const clearSearchHistory = (): void => {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY)
  } catch (error) {
    console.error("Error clearing search history:", error)
  }
}

export const removeSearchHistoryItem = (query: string): void => {
  if (typeof window === "undefined") return

  try {
    const history = getSearchHistory()
    const updatedHistory = history.filter((item) => item !== query)
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory))
  } catch (error) {
    console.error("Error removing search history item:", error)
  }
}
