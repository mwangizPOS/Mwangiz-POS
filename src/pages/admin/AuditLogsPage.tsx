import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { SectionHeader } from '@/components/app/SectionHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { auditLogs } from '@/pages/mockData'

export function AuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredLogs = useMemo(() => {
    if (!searchQuery) return auditLogs
    const q = searchQuery.toLowerCase()
    return auditLogs.filter(
      (log) =>
        log.user.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.entity.toLowerCase().includes(q) ||
        log.branch.toLowerCase().includes(q)
    )
  }, [searchQuery])

  return (
    <>
      <SectionHeader
        eyebrow="Audit Logs"
        title="System activity"
        description="Who, what, when, and where activity feed."
      />

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Filter by user, action, entity, branch" 
              className="pl-10" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button type="button" variant="outline">
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Filters
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full min-w-[780px] border-collapse text-left text-sm">
            <thead className="bg-surface-alt text-xs text-secondary-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">Branch</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-secondary-foreground">
                    No matching audit logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={`${log.action}-${log.timestamp}`} className="border-t">
                    <td className="px-4 py-3 font-medium">{log.user}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{log.action}</Badge>
                    </td>
                    <td className="px-4 py-3 text-secondary-foreground">{log.entity}</td>
                    <td className="px-4 py-3 text-secondary-foreground">{log.timestamp}</td>
                    <td className="px-4 py-3">{log.branch}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  )
}
