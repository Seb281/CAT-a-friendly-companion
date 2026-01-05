import { createRoot, type Root } from "react-dom/client"
import { Button } from "@/components/ui/button"
import { Languages } from "lucide-react"

const tooltip = {
  element: null as HTMLElement | null,

  tooltipRoot: null as Root | null,

  onTranslateCallback: null as (() => void) | null,

  init(callback: () => void): void {
    this.onTranslateCallback = callback
  },

  show(x: number, y: number): void {
    if (!this.element) {
      this.create()
    }

    if (this.element) {
      this.element.style.left = `${x}px`
      this.element.style.top = `${y - 35}px`
      this.element.style.pointerEvents = "auto"
      this.element.style.opacity = "1"
      this.element.style.transform = "translateY(0)"
    }
  },

  hide(): void {
    if (this.element) {
      this.element.style.opacity = "0"
      this.element.style.transform = "translateY(-10px)"
      this.element.style.pointerEvents = "none"
    }
  },

  create(): void {
    const container = document.createElement("div")
    container.id = "context-translator-tooltip"

    container.style.cssText = `position: absolute; 
    z-index: 999999; opacity: 0; 
    transform: translateY(-10px); 
    transition: opacity 0.2s ease, transform 0.2s ease; 
    pointer-events: none;`

    document.body.appendChild(container)

    const root = createRoot(container)
    root.render(
      <Button
        size="sm"
        className="shadow-lg hover:shadow-xl transition-all"
        onClick={(e) => {
          e.stopPropagation()
          if (tooltip.onTranslateCallback) {
            tooltip.onTranslateCallback()
          }
        }}
      >
        <Languages className="h-4 w-4 mr-2" />
        Translate
      </Button>
    )

    this.element = container
    this.tooltipRoot = root
  },
}

export default tooltip
