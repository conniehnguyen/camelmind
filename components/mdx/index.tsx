import { Callout } from "./Callout"
import { Steps, Step } from "./Steps"
import { Tabs, Tab } from "./Tabs"
import { Icon } from "./Icon"
import { CodeBlock } from "@/components/Code/CodeBlock"

export const mdxComponents = {
  Callout,
  Steps,
  Step,
  Tabs,
  Tab,
  Icon,
  pre: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  code: ({ className, children }: { className?: string; children: string }) => {
    if (className) {
      return <CodeBlock className={className}>{children}</CodeBlock>
    }
    return <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
  },
}
