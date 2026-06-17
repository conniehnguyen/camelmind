"use client"

import { FileText, Download } from "lucide-react"

type Props = {
  file: string
  downloadPdf?: string
}

export function DocActions({ file, downloadPdf }: Props) {
  const rawBase = `/api/raw?file=${encodeURIComponent(file)}`

  return (
    <div className="flex items-center gap-5 mb-6 pb-5 border-b border-gray-200">
      <a
        href={rawBase}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
      >
        <FileText size={14} />
        View as Markdown
      </a>
      <a
        href={`${rawBase}&download=1`}
        download
        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
      >
        <Download size={14} />
        Download Markdown
      </a>
      {downloadPdf && (
        <a
          href={downloadPdf}
          download
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <Download size={14} />
          Download PDF
        </a>
      )}
    </div>
  )
}
