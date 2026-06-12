export function Steps({ children }: { children: React.ReactNode }) {
  return (
    <ol className="relative border-l border-gray-200 ml-3 space-y-6 my-6">
      {children}
    </ol>
  )
}

export function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="ml-6">
      <span className="absolute -left-3.5 flex items-center justify-center w-7 h-7 bg-blue-600 text-white rounded-full text-xs font-bold">
        {n}
      </span>
      <h3 className="font-semibold mb-1">{title}</h3>
      <div className="text-sm text-gray-700">{children}</div>
    </li>
  )
}
