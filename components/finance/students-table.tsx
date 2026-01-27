"use client"

import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { MoreHorizontal, ArrowUpDown, Loader2, CreditCard, Eye, FileText } from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"

interface StudentFinancial {
    id: string
    name: string
    studentId: string
    className: string
    sectionName?: string
    totalInvoiced: number
    totalPaid: number
    balance: number
    status: string
    lastPaymentDate: string | null
}

interface StudentsTableProps {
    data: StudentFinancial[]
    loading: boolean
    onViewStudent?: (student: StudentFinancial) => void
    onCollectPayment?: (student: StudentFinancial) => void
}

export function StudentsTable({ data, loading, onViewStudent, onCollectPayment }: StudentsTableProps) {
    const router = useRouter()
    const [sortField, setSortField] = useState<keyof StudentFinancial>("name")
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    const handleSort = (field: keyof StudentFinancial) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortDirection("asc")
        }
    }

    const sortedData = [...data].sort((a, b) => {
        const aValue = a[sortField]
        const bValue = b[sortField]

        if (aValue == null) return 1
        if (bValue == null) return -1
        if (aValue === bValue) return 0

        const comparison = aValue > bValue ? 1 : -1
        return sortDirection === "asc" ? comparison : -comparison
    })

    // Pagination
    const totalPages = Math.ceil(sortedData.length / itemsPerPage)
    const paginatedData = sortedData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case "paid":
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>
            case "partial":
                return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Partial</Badge>
            case "unpaid":
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Unpaid</Badge>
            default: // No Invoices
                return <Badge variant="secondary" className="text-muted-foreground">{status}</Badge>
        }
    }

    const handleCollect = (student: StudentFinancial, e?: React.MouseEvent) => {
        e?.stopPropagation()
        if (onCollectPayment) {
            onCollectPayment(student);
            return;
        }
        console.log("Collect payment for", student.id);
    }

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const newSelected = new Set(paginatedData.map(s => s.id))
            setSelectedStudents(newSelected)
        } else {
            setSelectedStudents(new Set())
        }
    }

    const handleSelectStudent = (studentId: string, checked: boolean) => {
        const newSelected = new Set(selectedStudents)
        if (checked) {
            newSelected.add(studentId)
        } else {
            newSelected.delete(studentId)
        }
        setSelectedStudents(newSelected)
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "—"
        return format(new Date(dateString), "dd/MM/yyyy")
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-muted/10">
                <p className="text-lg font-medium text-muted-foreground">No students found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={paginatedData.length > 0 && selectedStudents.size === paginatedData.length}
                                    onCheckedChange={handleSelectAll}
                                />
                            </TableHead>
                            <TableHead className="w-[50px]">SN</TableHead>
                            <TableHead className="w-[200px] cursor-pointer" onClick={() => handleSort("name")}>
                                <div className="flex items-center gap-1">
                                    Student <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort("className")}>
                                <div className="flex items-center gap-1">
                                    Class <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead className="text-right cursor-pointer" onClick={() => handleSort("totalInvoiced")}>
                                <div className="flex items-center justify-end gap-1">
                                    Total Invoiced <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead className="text-right cursor-pointer" onClick={() => handleSort("totalPaid")}>
                                <div className="flex items-center justify-end gap-1">
                                    Paid <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead className="text-right cursor-pointer" onClick={() => handleSort("balance")}>
                                <div className="flex items-center justify-end gap-1">
                                    Balance <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                                <div className="flex items-center gap-1">
                                    Status <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead className="text-right cursor-pointer" onClick={() => handleSort("lastPaymentDate")}>
                                <div className="flex items-center justify-end gap-1">
                                    Last Payment <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.map((student, index) => (
                            <TableRow
                                key={student.id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => onViewStudent?.(student)}
                            >
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        checked={selectedStudents.has(student.id)}
                                        onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                                    />
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs">
                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                </TableCell>
                                <TableCell className="font-medium">
                                    <div>
                                        {student.name}
                                        <div className="text-xs text-muted-foreground">{student.studentId}</div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>{student.className}</span>
                                        {student.sectionName && (
                                            <span className="text-xs text-muted-foreground">{student.sectionName}</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-mono">₦{student.totalInvoiced.toLocaleString()}</TableCell>
                                <TableCell className="text-right font-mono">₦{student.totalPaid.toLocaleString()}</TableCell>
                                <TableCell className="text-right font-mono font-semibold">
                                    {student.balance > 0 ? (
                                        <span className="text-red-600">₦{student.balance.toLocaleString()}</span>
                                    ) : (
                                        <span className="text-green-600">₦0</span>
                                    )}
                                </TableCell>
                                <TableCell>{getStatusBadge(student.status)}</TableCell>
                                <TableCell className="text-right font-mono text-sm">
                                    {formatDate(student.lastPaymentDate)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {(student.status.toLowerCase() === "partial" || student.status.toLowerCase() === "unpaid") && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50 px-2"
                                                onClick={(e) => handleCollect(student, e)}
                                            >
                                                Collect
                                            </Button>
                                        )}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => onViewStudent?.(student)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCollect(student); }}>
                                                    <CreditCard className="mr-2 h-4 w-4" />
                                                    Collect Payment
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onViewStudent?.(student)}>
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    Invoice History
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {
                totalPages > 1 && (
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <div className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                )
            }
        </div >
    )
}
