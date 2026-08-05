"use client"

import { useState, useMemo, useEffect } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, Sparkles, PlusCircle } from "lucide-react"
import { toast } from "sonner"
import { bulkImportStudents, BulkStudentRow } from "@/app/(dashboard)/students/actions"
import { cn } from "@/lib/utils"

interface BulkAddStudentsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sections?: any[]
  existingClasses?: any[]
  onSuccess?: () => void
}

interface ParsedStudentRow extends BulkStudentRow {
  sn?: string
  isValid: boolean
  isNewClass: boolean
  errorReason?: string
}

export function BulkAddStudentsModal({
  open,
  onOpenChange,
  sections = [],
  existingClasses = [],
  onSuccess,
}: BulkAddStudentsModalProps) {
  const [selectedSectionId, setSelectedSectionId] = useState<string>("")
  const [customSectionName, setCustomSectionName] = useState<string>("")
  const [isCustomSection, setIsCustomSection] = useState(false)

  const [inputMode, setInputMode] = useState<"file" | "paste">("file")
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [pastedText, setPastedText] = useState<string>("")
  const [fileContent, setFileContent] = useState<string>("")

  const [isImporting, setIsImporting] = useState(false)

  // Auto-select first section if available
  useEffect(() => {
    if (sections.length > 0 && !selectedSectionId) {
      setSelectedSectionId(sections[0].id)
    }
  }, [sections, selectedSectionId])

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
  const parsedRows = useMemo<ParsedStudentRow[]>(() => {
    if (!rawDataText || !rawDataText.trim()) return []

    const lines = rawDataText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    if (lines.length === 0) return []

    // Detect delimiter (, or \t or ;)
    const firstLine = lines[0]
    let delimiter = ","
    if (firstLine.includes("\t")) {
      delimiter = "\t"
    } else if (firstLine.includes(";")) {
      delimiter = ";"
    }

    // Split line function handling quotes
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

    // Column Index Detection
    const snIdx = headers.findIndex((h) => h === "sn" || h === "s/n" || h === "s_n" || h === "#")
    const fnIdx = headers.findIndex((h) => h.includes("first") || h === "firstname" || h === "name")
    const mnIdx = headers.findIndex((h) => h.includes("middle") || h === "middlename")
    const lnIdx = headers.findIndex((h) => h.includes("last") || h === "lastname" || h === "surname")
    const admIdx = headers.findIndex(
      (h) => h.includes("admission") || h.includes("student id") || h.includes("reg") || h === "adm no"
    )
    const classIdx = headers.findIndex((h) => h.includes("class"))
    const genderIdx = headers.findIndex((h) => h.includes("gender") || h === "sex")

    const dataLines = lines.slice(1)
    const sectionClasses = existingClasses.filter((c) => c.section_id === selectedSectionId)
    const existingClassNamesLower = new Set(sectionClasses.map((c) => c.name.trim().toLowerCase()))

    return dataLines
      .map((line, index) => {
        const cols = parseLine(line)
        if (cols.length === 0 || cols.every((c) => !c)) return null

        const rawSn = snIdx >= 0 ? cols[snIdx] : String(index + 1)
        const rawFn = fnIdx >= 0 ? cols[fnIdx] : cols[0] || ""
        const rawMn = mnIdx >= 0 ? cols[mnIdx] : cols[1] || ""
        const rawLn = lnIdx >= 0 ? cols[lnIdx] : cols[2] || ""
        const rawAdm = admIdx >= 0 ? cols[admIdx] : cols[3] || ""
        const rawClass = classIdx >= 0 ? cols[classIdx] : cols[4] || ""
        const rawGender = genderIdx >= 0 ? cols[genderIdx] : cols[5] || ""

        // Format names: capitalize title case
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

        // Middle name: if "-" or empty or "N/A" -> null
        let middleName: string | null = formatName(rawMn)
        if (!rawMn || rawMn.trim() === "-" || rawMn.trim() === "N/A" || rawMn.trim() === "null") {
          middleName = null
        }

        const studentId = rawAdm.trim().toUpperCase()
        const className = rawClass.trim().toUpperCase() || "RAUDAH 1"

        const isNewClass = !existingClassNamesLower.has(className.toLowerCase())

        let isValid = true
        let errorReason = ""

        if (!firstName) {
          isValid = false
          errorReason = "First name missing"
        } else if (!lastName) {
          isValid = false
          errorReason = "Last name missing"
        } else if (!studentId) {
          isValid = false
          errorReason = "Admission No missing"
        }

        // Normalize gender: M/F shorthand, fallback to empty string if not found
        let gender = "Male"
        if (rawGender) {
          const g = rawGender.trim().toUpperCase()
          if (g === "M" || g === "MALE") gender = "Male"
          else if (g === "F" || g === "FEMALE") gender = "Female"
          else gender = rawGender.trim() // keep raw if something else
        }

        return {
          sn: rawSn,
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName,
          student_id: studentId,
          class_name: className,
          gender,
          isValid,
          isNewClass,
          errorReason,
        } as ParsedStudentRow
      })
      .filter((row): row is ParsedStudentRow => row !== null)
  }, [rawDataText, selectedSectionId, existingClasses, inputMode])

  const validRows = useMemo(() => parsedRows.filter((r) => r.isValid), [parsedRows])
  const newClassesSet = useMemo(() => {
    return Array.from(new Set(parsedRows.filter((r) => r.isValid && r.isNewClass).map((r) => r.class_name)))
  }, [parsedRows])

  const handleImport = async () => {
    if (validRows.length === 0) {
      toast.error("No valid student rows to import.")
      return
    }

    const targetSection = isCustomSection ? customSectionName.trim() : selectedSectionId
    if (!targetSection) {
      toast.error("Please select or specify a target Section.")
      return
    }

    try {
      setIsImporting(true)

      const payload = {
        sectionId: isCustomSection ? "" : selectedSectionId,
        sectionName: isCustomSection ? customSectionName.trim() : undefined,
        students: validRows.map((r) => ({
          first_name: r.first_name,
          middle_name: r.middle_name,
          last_name: r.last_name,
          student_id: r.student_id,
          class_name: r.class_name,
          gender: r.gender,
        })),
      }

      const res = await bulkImportStudents(payload)

      if (!res.success) {
        throw new Error(res.error || "Failed to import students")
      }

      toast.success("Bulk Import Successful!", {
        description: `Successfully imported ${res.count} students. ${
          res.createdClassesCount && res.createdClassesCount > 0
            ? `${res.createdClassesCount} new classes were auto-created.`
            : ""
        }`,
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      console.error("[BulkImportModal] Error:", error)
      toast.error(error.message || "Bulk import failed. Please try again.")
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader className="px-1 pb-3 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-md font-bold">Bulk Import Students</DialogTitle>
              <DialogDescription className="text-xs">
                Upload a CSV file or paste table data directly from Excel / Google Sheets to enroll students.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-3">
          {/* Section Selection Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/40 p-3.5 rounded-lg border">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Target Section</Label>
              {!isCustomSection ? (
                <Select
                  value={selectedSectionId}
                  onValueChange={(val) => {
                    if (val === "NEW_SECTION") {
                      setIsCustomSection(true)
                    } else {
                      setSelectedSectionId(val)
                    }
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select target section..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((sec) => (
                      <SelectItem key={sec.id} value={sec.id} className="text-xs">
                        {sec.name} Section
                      </SelectItem>
                    ))}
                    <SelectItem value="NEW_SECTION" className="text-xs text-emerald-600 font-semibold">
                      + Create New Section
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="e.g. Combined, Married Women"
                    value={customSectionName}
                    onChange={(e) => setCustomSectionName(e.target.value)}
                    className="h-9 text-xs"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs h-9"
                    onClick={() => setIsCustomSection(false)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Import Format</Label>
              <Tabs
                value={inputMode}
                onValueChange={(v) => setInputMode(v as "file" | "paste")}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 h-9">
                  <TabsTrigger value="file" className="text-xs gap-1.5">
                    <Upload className="h-3.5 w-3.5" /> CSV File Upload
                  </TabsTrigger>
                  <TabsTrigger value="paste" className="text-xs gap-1.5">
                    <FileSpreadsheet className="h-3.5 w-3.5" /> Paste Excel Data
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Data Input Section */}
          {inputMode === "file" ? (
            <div className="border-2 border-dashed rounded-lg p-5 text-center hover:bg-accent/30 transition-colors">
              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-xs font-medium text-foreground mb-1">
                Drag & drop your student `.csv` file here, or click to browse
              </p>
              <p className="text-[11px] text-muted-foreground mb-3">
                Expected columns: <code className="font-mono text-emerald-600">sn, firstname, middlename, lastname, admission no, class, gender</code>
              </p>
              <Input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="max-w-xs mx-auto text-xs h-9 cursor-pointer"
              />
              {csvFile && (
                <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Selected file: {csvFile.name} ({parsedRows.length} rows parsed)
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Paste Copied Cells from Excel / Google Sheets</Label>
                <span className="text-[10px] text-muted-foreground font-mono">Header row included</span>
              </div>
              <Textarea
                placeholder={`sn\tfirstname\tmiddlename\tlastname\tadmission no\tclass\tgender
1\tAISHA\t-\tBASHIR\tABYI/CMB/25/001\tRAUDAH 1\tFemale
2\tYUSUF\tMUSA\tYARO\tABYI/CMB/25/002\tRAUDAH 1\tMale`}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                className="font-mono text-xs h-28 focus-visible:ring-emerald-500"
              />
            </div>
          )}

          {/* Validation Summary Strip */}
          {parsedRows.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-500/10 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-500/20 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                  Total Parsed: {parsedRows.length} rows
                </span>
                <Badge variant="outline" className="bg-emerald-500/20 text-emerald-700 border-emerald-400 text-[10px]">
                  {validRows.length} Valid
                </Badge>
                {newClassesSet.length > 0 && (
                  <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 border-amber-400 text-[10px]">
                    + {newClassesSet.length} New Classes Will Be Created
                  </Badge>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground">
                Section: <strong className="text-foreground">{isCustomSection ? customSectionName || "New Section" : sections.find(s => s.id === selectedSectionId)?.name}</strong>
              </span>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="border rounded-lg overflow-hidden max-h-56 overflow-y-auto">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0">
                  <TableRow className="h-8">
                    <TableHead className="w-10 text-center text-[11px] font-bold">#</TableHead>
                    <TableHead className="text-[11px] font-bold">Admission No</TableHead>
                    <TableHead className="text-[11px] font-bold">First Name</TableHead>
                    <TableHead className="text-[11px] font-bold">Middle Name</TableHead>
                    <TableHead className="text-[11px] font-bold">Last Name</TableHead>
                    <TableHead className="text-[11px] font-bold">Gender</TableHead>
                    <TableHead className="text-[11px] font-bold">Target Class</TableHead>
                    <TableHead className="text-[11px] font-bold text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((row, idx) => (
                    <TableRow key={idx} className={cn("h-7 text-xs", !row.isValid && "bg-red-500/10")}>
                      <TableCell className="text-center font-mono text-[10px] text-muted-foreground p-1">
                        {row.sn || idx + 1}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-[11px] p-1">{row.student_id}</TableCell>
                      <TableCell className="font-medium p-1">{row.first_name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground p-1">{row.middle_name || "—"}</TableCell>
                      <TableCell className="font-medium p-1">{row.last_name || "—"}</TableCell>
                      <TableCell className="p-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5 py-0",
                            row.gender === "Female"
                              ? "bg-pink-500/10 text-pink-700 border-pink-300"
                              : "bg-blue-500/10 text-blue-700 border-blue-300"
                          )}
                        >
                          {row.gender || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-1">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {row.class_name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center p-1">
                        {row.isValid ? (
                          row.isNewClass ? (
                            <Badge variant="secondary" className="text-[9px] bg-amber-500/15 text-amber-700 border-amber-300">
                              New Class
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] bg-emerald-500/15 text-emerald-700 border-emerald-300">
                              Ready
                            </Badge>
                          )
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

        <DialogFooter className="px-1 pt-3 border-t flex items-center justify-between sm:justify-between">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={isImporting}>
            Cancel
          </Button>

          <Button
            onClick={handleImport}
            disabled={isImporting || validRows.length === 0 || (isCustomSection && !customSectionName.trim())}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing {validRows.length} Students...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Import {validRows.length} Students
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
