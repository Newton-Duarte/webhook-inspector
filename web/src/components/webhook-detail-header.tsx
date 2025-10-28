import { Badge } from './ui'

export function WebhookDetailHeader() {
  return (
    <div className="space-y-4 border-b bg-zinc-700 p-6">
      <div className="flex items-center gap-3">
        <Badge>POST</Badge>
        <span className="text-lg font-medium text-zinc-300">videos/status</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-sm text-zinc-400">
          <span>From IP</span>
          <span className="underline underline-offset-4">123.123.123.23</span>
        </div>
        <span className="w-px h-4 bg-zinc-600" />
        <div className="flex items-center gap-1 text-sm text-zinc-400">
          <span>at</span>
          <span>April 18th, 14pm</span>
        </div>
      </div>
    </div>
  )
}
