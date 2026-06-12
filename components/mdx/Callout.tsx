type CalloutType = "tip" | "warning" | "important" | "note" | "danger" | "success"

const labels: Record<CalloutType, string> = {
  tip:       "Tip",
  warning:   "Warning",
  important: "Important",
  note:      "Note",
  danger:    "Danger",
  success:   "Success",
}

export function Callout({ type = "note", children }: { type?: CalloutType; children: React.ReactNode }) {
  return (
    <div className={`callout ${type} my-4`}>
      <div className="callout-header">{labels[type]}</div>
      <div className="callout-body">{children}</div>
    </div>
  )
}
