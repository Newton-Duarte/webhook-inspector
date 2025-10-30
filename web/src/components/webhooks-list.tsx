import * as Dialog from '@radix-ui/react-dialog'
import { useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { webhookListSchema } from '../http/schemas/webhooks'
import { CodeBlock } from './ui/code-block'
import { WebhooksListItem } from './webhooks-list-item'

export function WebhooksList() {
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver>(null)

  const [checkedWebhooksIds, setCheckedWebhooksIds] = useState<string[]>([])
  const [generatedHandlerCode, setGeneratedHandlerCode] = useState('')

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery({
      queryKey: ['webhooks'],
      queryFn: async ({ pageParam }) => {
        const url = new URL('http://localhost:3333/api/webhooks')

        if (pageParam) {
          url.searchParams.set('cursor', pageParam)
        }

        const response = await fetch(url)
        const data = await response.json()

        return webhookListSchema.parse(data)
      },
      getNextPageParam: (lastPage) => {
        return lastPage.nextCursor ?? undefined
      },
      initialPageParam: undefined as string | undefined,
    })

  const webhooks = data.pages.flatMap((page) => page.webhooks)

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]

        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      {
        threshold: 0.1,
      },
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [fetchNextPage, isFetchingNextPage, hasNextPage])

  const handleCheckWebhook = (webhookId: string) => {
    if (checkedWebhooksIds.includes(webhookId)) {
      setCheckedWebhooksIds((prev) =>
        prev.filter((checkedWebhookId) => checkedWebhookId !== webhookId),
      )
    } else {
      setCheckedWebhooksIds((prev) => [...prev, webhookId])
    }
  }

  const hasAnyWebhookChecked = checkedWebhooksIds.length > 0

  async function handleGenerateHandler() {
    const response = await fetch('http://localhost:3333/api/generate', {
      body: JSON.stringify({ webhooksIds: checkedWebhooksIds }),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    setGeneratedHandlerCode(data.code)
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-1 p-2">
          <button
            disabled={!hasAnyWebhookChecked}
            type="button"
            className="w-full bg-indigo-400 p-2 rounded-lg"
            onClick={handleGenerateHandler}
          >
            Gerar handler
          </button>
          {webhooks.map((webhook) => (
            <WebhooksListItem
              key={webhook.id}
              webhook={webhook}
              onWebhookChecked={handleCheckWebhook}
              isWebhookChecked={checkedWebhooksIds.includes(webhook.id)}
            />
          ))}
        </div>

        {hasNextPage && (
          <div className="p-2" ref={loadMoreRef}>
            {isFetchingNextPage && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="size-5 animate-spin text-zinc-500" />
              </div>
            )}
          </div>
        )}
      </div>
      {!!generatedHandlerCode && (
        <Dialog.Root defaultOpen>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-600 p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[900px] overflow-y-auto">
              <Dialog.Description className="text-gray-700 mb-6">
                <CodeBlock code={generatedHandlerCode} language="typescript" />
              </Dialog.Description>
              <div className="flex justify-end">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    onClick={() => setGeneratedHandlerCode('')}
                  >
                    Close
                  </button>
                </Dialog.Close>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </>
  )
}
