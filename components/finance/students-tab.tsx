"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter, Download, Plus, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { StudentsTable } from "./students-table"
import { StudentDetailsSheet } from "@/components/student-details-sheet"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

interface StudentFinancial {
    id: string
    name: string
    studentId: string
    className: string
    classId: string
    totalInvoiced: number
    totalPaid: number
    balance: number
    lastPaymentDate: string | null
    status: string
    sectionName?: string
}

export function StudentsTab({
    onCollectPayment,
    initialDebtorsOnly = false
}: {
    onCollectPayment?: (studentId: string) => void,
    initialDebtorsOnly?: boolean
}) {
    const [students, setStudents] = useState<StudentFinancial[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [showDebtorsOnly, setShowDebtorsOnly] = useState(initialDebtorsOnly)
    const [classFilter, setClassFilter] = useState("all")
    const [classes, setClasses] = useState<any[]>([])
    const [sessions, setSessions] = useState<any[]>([])
    const [terms, setTerms] = useState<any[]>([])
    const [selectedSession, setSelectedSession] = useState<string>("all")
    const [selectedTerm, setSelectedTerm] = useState<string>("all")

    // Advanced filters
    const [minBalance, setMinBalance] = useState<string>("")
    const [maxBalance, setMaxBalance] = useState<string>("")
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

    // Sheet state
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
    const [showStudentSheet, setShowStudentSheet] = useState(false)

    const supabase = createBrowserClient()
    const { toast } = useToast()

    useEffect(() => {
        fetchInitialData()
    }, [])

    useEffect(() => {
        fetchStudentFinancials()
    }, [selectedSession, selectedTerm])

    const fetchInitialData = async () => {
        try {
            // Fetch classes
            const { data: classesData } = await supabase
                .from("classes")
                .select("id, name")
                .eq("active", true)
                .order("name")
            setClasses(classesData || [])

            // Fetch sessions
            const { data: sessionsData } = await supabase
                .from("academic_sessions")
                .select("id, name, is_current")
                .order("start_date", { ascending: false })
            setSessions(sessionsData || [])

            // Fetch terms
            const { data: termsData } = await supabase
                .from("terms")
                .select("id, name")
                .order("name")
            setTerms(termsData || [])

            // Initial fetch of financials
            await fetchStudentFinancials()
        } catch (error) {
            console.error("Error fetching initial data", error)
        }
    }

    const fetchStudentFinancials = async () => {
        setLoading(true)
        try {
            // 1. Fetch students
            const { data: studentsData, error: studentsError } = await supabase
                .from("students")
                .select(`
          id, 
          first_name, 
          last_name, 
          student_id,
          student_enrollments(
            class_id,
            is_active,
            classes(
              name,
              section:section_id(name)
            )
          )
        `)

            if (studentsError) throw studentsError

            // 2. Fetch invoices (respecting session/term filters)
            const { data: invoicesData, error: invoicesError } = await supabase
                .from("invoices")
                .select("id, student_id, total_amount, amount_paid, balance, status, due_date, session_id, term_id")
                .is("deleted_at", null)

            if (invoicesError) throw invoicesError

            // 3. Fetch payments
            const { data: paymentsData, error: paymentsError } = await supabase
                .from("payments")
                .select("id, amount, payment_date, invoices(student_id)")
                .eq("status", "completed")

            if (paymentsError) throw paymentsError

            // Process Payments
            const lastPaymentMap: Record<string, string> = {}
            paymentsData?.forEach((p: any) => {
                const studentId = p.invoices?.student_id
                if (studentId) {
                    if (!lastPaymentMap[studentId] || new Date(p.payment_date) > new Date(lastPaymentMap[studentId])) {
                        lastPaymentMap[studentId] = p.payment_date
                    }
                }
            })

            // Aggregate Financials
            const financialsMap: Record<string, { totalInvoiced: number, totalPaid: number, balance: number }> = {}

            invoicesData?.forEach(inv => {
                // Initialize if needed
                if (!financialsMap[inv.student_id]) {
                    financialsMap[inv.student_id] = { totalInvoiced: 0, totalPaid: 0, balance: 0 }
                }

                // Filter by session if selected
                if (selectedSession !== "all" && inv.session_id !== selectedSession) return

                // Filter by term if selected
                if (selectedTerm !== "all" && inv.term_id !== selectedTerm) return

                financialsMap[inv.student_id].totalInvoiced += Number(inv.total_amount)
                financialsMap[inv.student_id].totalPaid += Number(inv.amount_paid)
                financialsMap[inv.student_id].balance += Number(inv.balance)
            })

            // Combine Data
            const processedStudents = studentsData.map(student => {
                const financials = financialsMap[student.id] || { totalInvoiced: 0, totalPaid: 0, balance: 0 }
                const activeEnrollment = student.student_enrollments?.find((e: any) => e.is_active) || student.student_enrollments?.[0]
                const className = activeEnrollment?.classes?.name || "N/A"
                const sectionName = activeEnrollment?.classes?.section?.name || ""

                return {
                    id: student.id,
                    name: `${student.first_name} ${student.last_name}`,
                    studentId: student.student_id,
                    className: className,
                    sectionName: sectionName,
                    classId: activeEnrollment?.class_id,
                    totalInvoiced: financials.totalInvoiced,
                    totalPaid: financials.totalPaid,
                    balance: financials.balance,
                    lastPaymentDate: lastPaymentMap[student.id] || null,
                    status: financials.balance <= 0 && financials.totalInvoiced > 0 ? "Paid" :
                        financials.balance < financials.totalInvoiced && financials.balance > 0 ? "Partial" :
                            financials.totalInvoiced === 0 ? "No Invoices" : "Unpaid"
                }
            })

            setStudents(processedStudents)
        } catch (error) {
            console.error("Error fetching student financials:", error)
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load student data"
            })
        } finally {
            setLoading(false)
        }
    }

    // Client-side Filtering
    const filteredStudents = students.filter(student => {
        // 1. Search
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.studentId?.toLowerCase().includes(searchTerm.toLowerCase())

        // 2. Status
        const matchesStatus = statusFilter === "all" || student.status.toLowerCase() === statusFilter.toLowerCase()

        // 3. Class
        const matchesClass = classFilter === "all" || student.classId === classFilter

        // 4. Balance Range
        const balance = student.balance
        const min = minBalance ? parseFloat(minBalance) : Number.NEGATIVE_INFINITY
        const max = maxBalance ? parseFloat(maxBalance) : Number.POSITIVE_INFINITY
        const matchesBalance = balance >= min && balance <= max

        // 5. Debtors Only
        const matchesDebtors = !showDebtorsOnly || student.balance > 0

        return matchesSearch && matchesStatus && matchesClass && matchesBalance && matchesDebtors
    })

    // Count active filters for badge
    const activeFilterCount = [
        statusFilter !== "all",
        classFilter !== "all",
        selectedSession !== "all",
        selectedTerm !== "all",
        minBalance !== "",
        selectedTerm !== "all",
        minBalance !== "",
        maxBalance !== "",
        showDebtorsOnly
    ].filter(Boolean).length

    return (
        <Card className="shadow-none border-none">
            <CardHeader className="px-0 pt-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Student Accounts</CardTitle>
                        <CardDescription>Accounts receivable overview per student</CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant={showDebtorsOnly ? "default" : "outline"}
                            size="sm"
                            onClick={() => setShowDebtorsOnly(!showDebtorsOnly)}
                            className={showDebtorsOnly ? "bg-red-600 hover:bg-red-700 text-white border-transparent" : "text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"}
                        >
                            {showDebtorsOnly ? "Show All" : "Debtors Only"}
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Download className="h-4 w-4" />
                            Export
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-0">
                {/* Filters Top Bar */}
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-3">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by student name or ID..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Primary Filters */}
                        <Select value={classFilter} onValueChange={setClassFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Class" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Classes</SelectItem>
                                {classes.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="partial">Partial</SelectItem>
                                <SelectItem value="unpaid">Unpaid</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Advanced Filter Popover */}
                        <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="gap-2 relative">
                                    <Filter className="h-4 w-4" />
                                    More Filters
                                    {activeFilterCount > 0 && (
                                        <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                                            {activeFilterCount}
                                        </Badge>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-4" align="end">
                                <div className="space-y-4">
                                    <h4 className="font-medium leading-none">Advanced Filters</h4>

                                    <div className="space-y-2">
                                        <Label>Academic Session</Label>
                                        <Select value={selectedSession} onValueChange={setSelectedSession}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="All Sessions" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Sessions</SelectItem>
                                                {sessions.map((s) => (
                                                    <SelectItem key={s.id} value={s.id}>
                                                        {s.name} {s.is_current ? '(Current)' : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Term</Label>
                                        <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="All Terms" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Terms</SelectItem>
                                                {terms.map((t) => (
                                                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Outstanding Balance Range (₦)</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                placeholder="Min"
                                                type="number"
                                                value={minBalance}
                                                onChange={(e) => setMinBalance(e.target.value)}
                                                className="h-8"
                                            />
                                            <span className="text-muted-foreground">-</span>
                                            <Input
                                                placeholder="Max"
                                                type="number"
                                                value={maxBalance}
                                                onChange={(e) => setMaxBalance(e.target.value)}
                                                className="h-8"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2 flex justify-end">
                                        <Button variant="ghost" size="sm" onClick={() => {
                                            setStatusFilter("all")
                                            setClassFilter("all")
                                            setSelectedSession("all")
                                            setSelectedTerm("all")
                                            setMinBalance("")
                                            setMaxBalance("")
                                            setShowDebtorsOnly(false)
                                        }}>
                                            Reset All
                                        </Button>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Active Filters Display (Optional but nice) */}
                    {(minBalance || maxBalance || selectedSession !== "all" || selectedTerm !== "all") && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                            <span>Applied:</span>
                            {selectedSession !== "all" && (
                                <Badge variant="outline" className="gap-1">
                                    Session: {sessions.find(s => s.id === selectedSession)?.name}
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedSession("all")} />
                                </Badge>
                            )}
                            {selectedTerm !== "all" && (
                                <Badge variant="outline" className="gap-1">
                                    Term: {terms.find(t => t.id === selectedTerm)?.name}
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedTerm("all")} />
                                </Badge>
                            )}
                            {(minBalance || maxBalance) && (
                                <Badge variant="outline" className="gap-1">
                                    Balance: {minBalance || "0"} - {maxBalance || "∞"}
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => { setMinBalance(""); setMaxBalance("") }} />
                                </Badge>
                            )}
                        </div>
                    )}
                </div>

                {/* Table */}
                <StudentsTable
                    data={filteredStudents}
                    loading={loading}
                    onViewStudent={(student) => {
                        setSelectedStudentId(student.id)
                        setShowStudentSheet(true)
                    }}
                    onCollectPayment={(student) => {
                        if (onCollectPayment) {
                            onCollectPayment(student.id)
                        } else {
                            // Fallback if not controlled (though it should be)
                            // router.push... but we can just leave it or log
                            console.log("Collect", student.id)
                        }
                    }}
                />
            </CardContent>

            {/* Student Details Sheet */}
            {
                selectedStudentId && (
                    <StudentDetailsSheet
                        studentId={selectedStudentId}
                        open={showStudentSheet}
                        onOpenChange={(open) => {
                            setShowStudentSheet(open)
                            if (!open) setSelectedStudentId(null)
                        }}
                        sessions={sessions}
                        terms={terms}
                        classes={classes}
                    />
                )
            }
        </Card >
    )
}
