export function loadGeocodeCache() {
  if (typeof window === "undefined") {
    return {}
  }

  try {
    const cache = localStorage.getItem("school-directory-geocode-cache")
    if (cache) {
      return JSON.parse(cache)
    }
  } catch (error) {
    console.error("Error loading geocode cache:", error)
  }

  return {}
}

export function saveGeocodeCache(cache: any): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    localStorage.setItem("school-directory-geocode-cache", JSON.stringify(cache))
  } catch (error) {
    console.error("Error saving geocode cache:", error)
  }
}

