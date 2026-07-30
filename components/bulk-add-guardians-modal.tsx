"use client"

import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileSpreadsheet, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { bulkImportGuardians, BulkGuardianRow } from "@/app/(dashboard)/guardians/actions"
import { cn } from "@/lib/utils"

interface BulkAddGuardiansModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface ParsedGuardianRow extends BulkGuardianRow {
  sn?: string
  isValid: boolean
  errorReason?: string
}

export function BulkAddGuardiansModal({
  open,
  onOpenChange,
  onSuccess,
}: BulkAddGuardiansModalProps) {
  const [inputMode, setInputMode] = useState<"file" | "paste">("file")
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [pastedText, setPastedText] = useState<string>("")
  const [fileContent, setFileContent] = useState<string>("")
  const [isImporting, setIsImporting] = useState(false)

  // Read file when file is selected
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvFile(file)
    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      setFileContent(text || "")
    }
    reader.readAsText(file)
  }

  const rawDataText = inputMode === "file" ? fileContent : pastedText

  // Parse CSV or TSV (pasted table)
  const parsedRows = useMemo<ParsedGuardianRow[]>(() => {
    if (!rawDataText || !rawDataText.trim()) return []

    const lines = rawDataText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    if (lines.length === 0) return []

    // Detect delimiter
    const firstLine = lines[0]
    let delimiter = ","
    if (firstLine.includes("\t")) {
      delimiter = "\t"
    } else if (firstLine.includes(";")) {
      delimiter = ";"
    }

    // Split cell values correctly handling quotes
    const parseLine = (line: string) => {
      if (delimiter === "\t") return line.split("\t").map((cell) => cell.trim().replace(/^"|"$/g, ""))

      const result: string[] = []
      let current = ""
      let inQuotes = false
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, ""))
          current = ""
        } else {
          current += char
        }
      }
      result.push(current.trim().replace(/^"|"$/g, ""))
      return result
    }

    const headers = parseLine(lines[0]).map((h) => h.toLowerCase().trim().replace(/_/g, " "))

    // Column Detect
    const snIdx = headers.findIndex((h) => h === "sn" || h === "s/n" || h === "s_n" || h === "#")
    const fnIdx = headers.findIndex((h) => h.includes("first") || h === "firstname" || h === "name")
    const mnIdx = headers.findIndex((h) => h.includes("middle") || h === "middlename")
    const lnIdx = headers.findIndex((h) => h.includes("last") || h === "lastname" || h === "surname")
    const emailIdx = headers.findIndex((h) => h.includes("email") || h === "mail")
    const phoneIdx = headers.findIndex((h) => h.includes("phone") || h === "tel" || h === "mobile" || h === "number")
    const waIdx = headers.findIndex((h) => h.includes("whatsapp") || h === "wa")
    const addrIdx = headers.findIndex((h) => h.includes("address") || h === "addr" || h === "location")
    const occupIdx = headers.findIndex((h) => h.includes("occupation") || h === "job" || h === "work")
    const relIdx = headers.findIndex((h) => h.includes("relation") || h === "relationship")

    const dataLines = lines.slice(1)

    return dataLines
      .map((line, index) => {
        const cols = parseLine(line)
        if (cols.length === 0 || cols.every((c) => !c)) return null

        const rawSn = snIdx >= 0 ? cols[snIdx] : String(index + 1)
        const rawFn = fnIdx >= 0 ? cols[fnIdx] : cols[0] || ""
        const rawMn = mnIdx >= 0 ? cols[mnIdx] : cols[1] || ""
        const rawLn = lnIdx >= 0 ? cols[lnIdx] : cols[2] || ""
        const rawEmail = emailIdx >= 0 ? cols[emailIdx] : ""
        const rawPhone = phoneIdx >= 0 ? cols[phoneIdx] : ""
        const rawWa = waIdx >= 0 ? cols[waIdx] : ""
        const rawAddr = addrIdx >= 0 ? cols[addrIdx] : ""
        const rawOccup = occupIdx >= 0 ? cols[occupIdx] : ""
        const rawRel = relIdx >= 0 ? cols[relIdx] : "Father"

        // Capitalize Names
        const formatName = (val: string) => {
          if (!val) return ""
          return val
            .trim()
            .toLowerCase()
            .split(/\s+/)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")
        }

        const firstName = formatName(rawFn)
        const lastName = formatName(rawLn)
        let middleName: string | null = formatName(rawMn)
        if (!rawMn || rawMn.trim() === "-" || rawMn.trim() === "N/A" || rawMn.trim() === "null") {
          middleName = null
        }

        const email = rawEmail.trim().toLowerCase() || null
        const phone = rawPhone.trim()
        const whatsappNumber = rawWa.trim() || null
        const address = rawAddr.trim() || "Kaduna, Nigeria"
        const occupation = rawOccup.trim() || null
        
        let relationshipType = formatName(rawRel)
        if (!relationshipType) relationshipType = "Father"

        let isValid = true
        let errorReason = ""

        if (!firstName) {
          isValid = false
          errorReason = "First name missing"
        } else if (!lastName) {
          isValid = false
          errorReason = "Last name missing"
        } else if (!phone) {
          isValid = false
          errorReason = "Phone number missing"
        }

        return {
          sn: rawSn,
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName,
          email,
          phone,
          whatsapp_number: whatsappNumber,
          address,
          occupation,
          relationship_type: relationshipType,
          isValid,
          errorReason,
        } as ParsedGuardianRow
      })
      .filter((row): row is ParsedGuardianRow => row !== null)
  }, [rawDataText])

  const validRows = useMemo(() => parsedRows.filter((r) => r.isValid), [parsedRows])

  const handleImport = async () => {
    if (validRows.length === 0) {
      toast.error("No valid guardian rows to import.")
      return
    }

    try {
      setIsImporting(true)
      const payload = validRows.map((r) => ({
        first_name: r.first_name,
        middle_name: r.middle_name,
        last_name: r.last_name,
        email: r.email,
        phone: r.phone,
        whatsapp_number: r.whatsapp_number,
        address: r.address,
        occupation: r.occupation,
        relationship_type: r.relationship_type,
      }))

      const res = await bulkImportGuardians(payload)

      if (!res.success) {
        throw new Error(res.error || "Failed to import guardians")
      }

      toast.success("Bulk Import Successful!", {
        description: `Successfully imported ${res.count} guardians.`,
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      console.error("[BulkImportGuardians] Error:", error)
      toast.error(error.message || "Bulk import failed. Please try again.")
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black rounded-2xl">
        <DialogHeader className="px-1 pb-3 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/20">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Bulk Import Guardians</DialogTitle>
              <DialogDescription className="text-xs">
                Upload a CSV file or paste spreadsheet rows to register multiple parents/guardians at once.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-3">
          {/* Format Selector Bar */}
          <div className="p-3.5 bg-muted/40 rounded-xl border border-zinc-150 dark:border-zinc-850 flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Import Method</span>
            <Tabs
              value={inputMode}
              onValueChange={(v) => setInputMode(v as "file" | "paste")}
              className="w-72"
            >
              <TabsList className="grid grid-cols-2 h-8">
                <TabsTrigger value="file" className="text-xs gap-1">
                  <Upload className="h-3 w-3" /> CSV Upload
                </TabsTrigger>
                <TabsTrigger value="paste" className="text-xs gap-1">
                  <FileSpreadsheet className="h-3 w-3" /> Paste Excel
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Input details */}
          {inputMode === "file" ? (
            <div className="border-2 border-dashed rounded-xl p-6 text-center hover:bg-zinc-50 dark:hover:bg-zinc-900/20 border-zinc-200 dark:border-zinc-800 transition-colors">
              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-xs font-medium text-foreground mb-1">
                Drag & drop your guardian `.csv` file here, or click to browse
              </p>
              <p className="text-[10px] text-muted-foreground mb-3">
                Expected columns: <code className="font-mono text-emerald-600 dark:text-emerald-400">sn, firstname, middlename, lastname, phone, email, whatsapp, address, occupation, relationship</code>
              </p>
              <Input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="max-w-xs mx-auto text-xs h-9 cursor-pointer"
              />
              {csvFile && (
                <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Selected: {csvFile.name} ({parsedRows.length} rows parsed)
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Paste spreadsheet rows directly (Excel/Sheets)</Label>
                <span className="text-[10px] text-muted-foreground font-mono">Ensure header row is included</span>
              </div>
              <Textarea
                placeholder={`sn\tfirstname\tmiddlename\tlastname\tphone\temail\twhatsapp\taddress\toccupation\trelationship
1\tIbrahim\tMusa\tTukur\t09012348877\tibrahim@gmail.com\t09012348877\tKaduna\tTrader\tFather
2\tFatima\t-\tBello\t08035925942\tfatima@gmail.com\t-\tKano\tTeacher\tMother`}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                className="font-mono text-xs h-28 focus-visible:ring-emerald-500"
              />
            </div>
          )}

          {/* Parsing summary */}
          {parsedRows.length > 0 && (
            <div className="flex items-center justify-between bg-emerald-500/5 dark:bg-emerald-950/15 p-2.5 rounded-lg border border-emerald-500/20 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  Total parsed: {parsedRows.length} rows
                </span>
                <Badge variant="outline" className="bg-emerald-500/20 text-emerald-700 border-emerald-400 text-[10px]">
                  {validRows.length} Valid Rows Ready
                </Badge>
              </div>
            </div>
          )}

          {/* Preview grid */}
          {parsedRows.length > 0 && (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto bg-white dark:bg-zinc-950">
              <Table>
                <TableHeader className="bg-zinc-50 dark:bg-zinc-900 sticky top-0">
                  <TableRow className="h-8">
                    <TableHead className="w-10 text-center text-[10px] font-bold">#</TableHead>
                    <TableHead className="text-[10px] font-bold">Name</TableHead>
                    <TableHead className="text-[10px] font-bold">Phone</TableHead>
                    <TableHead className="text-[10px] font-bold">Email</TableHead>
                    <TableHead className="text-[10px] font-bold">Relationship</TableHead>
                    <TableHead className="text-[10px] font-bold">Address</TableHead>
                    <TableHead className="text-[10px] font-bold text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((row, idx) => (
                    <TableRow key={idx} className={cn("h-7 text-xs", !row.isValid && "bg-red-500/10")}>
                      <TableCell className="text-center font-mono text-[10px] text-muted-foreground p-1">
                        {row.sn || idx + 1}
                      </TableCell>
                      <TableCell className="font-bold p-1">
                        {row.first_name} {row.last_name}
                      </TableCell>
                      <TableCell className="font-semibold p-1">{row.phone || "—"}</TableCell>
                      <TableCell className="text-muted-foreground p-1">{row.email || "—"}</TableCell>
                      <TableCell className="p-1">
                        <Badge variant="outline" className="text-[9px] py-0 h-4 bg-zinc-50/50">
                          {row.relationship_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground p-1 truncate max-w-[120px]">{row.address}</TableCell>
                      <TableCell className="text-center p-1">
                        {row.isValid ? (
                          <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-700 border-emerald-300">
                            Ready
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[9px]">
                            {row.errorReason}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/20 dark:bg-zinc-950 flex items-center justify-between sm:justify-between -mx-6 -mb-6 p-4">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isImporting} className="h-9">
            Cancel
          </Button>

          <Button
            onClick={handleImport}
            disabled={isImporting || validRows.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs h-9 font-semibold"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing {validRows.length} Guardians...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Import {validRows.length} Guardians
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
