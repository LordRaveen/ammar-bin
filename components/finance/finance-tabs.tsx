"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DollarSign,
    FileText,
    Receipt,
    TrendingUp,
    Calendar,
    Search,
    CreditCard,
    FileCheck,
    InboxIcon,
    ArrowUpRight,
    Smartphone,
    Wallet,
    Building2,
    Clock,
    ArrowRightCircle,
    BadgePercent
} from "lucide-react"
import Link from "next/link"
import { CollectPayment } from "@/components/finance/collect-payment"
import { InvoicesTab } from "@/components/finance/invoices-tab"
import { FeesTab } from "@/components/finance/fees-tab"
import { StudentsTab } from "@/components/finance/students-tab"
import { PaymentsTab } from "@/components/finance/payments-tab"
import { ReversalsTab } from "@/components/finance/reversals-tab"
import { ReportsTab } from "@/components/finance/reports-tab"
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    Cell,
    PieChart,
    Pie,
} from "recharts"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

import { createBrowserClient } from "@/lib/supabase/client"

interface FinanceTabsProps {
    initialInvoices: any[]
    initialPayments: any[]
    userRole?: "admin" | "accountant" | "super_admin"
}

export function FinanceTabs({
    initialInvoices = [],
    initialPayments = [],
    userRole = "admin"
}: FinanceTabsProps) {
    const [activeTab, setActiveTab] = useState("overview")
    const [invoices, setInvoices] = useState(initialInvoices)
    const [payments, setPayments] = useState(initialPayments)
    const [loading, setLoading] = useState(false)
    const supabase = createBrowserClient()
    const searchParams = useSearchParams()
    const tabParam = searchParams.get("tab")

    const refreshData = async () => {
        // We only refresh if we're on the overview tab to save resources, 
        // OR we can refresh always to keep all tabs in sync.
        // Let's refresh always for a 'fast and efficient' experience.
        const [
            { data: newInvoices },
            { data: newPayments }
        ] = await Promise.all([
            supabase
                .from("invoices")
                .select(`
                    *,
                    students (
                        first_name,
                        last_name,
                        student_id,
                        student_enrollments (
                            is_active,
                            class:classes (name)
                        )
                    )
                `)
                .is("deleted_at", null)
                .order("created_at", { ascending: false })
                .limit(200),
            supabase
                .from("payments")
                .select(`
                    *,
                    payment_allocations (
                        amount,
                        students (
                            first_name,
                            last_name
                        )
                    )
                `)
                .order("payment_date", { ascending: false })
                .limit(100)
        ])

        if (newInvoices) setInvoices(newInvoices)
        if (newPayments) setPayments(newPayments)
    }

    useEffect(() => {
        if (tabParam) {
            setActiveTab(tabParam)
        }
    }, [tabParam])

    useEffect(() => {
        // Subscribe to real-time changes
        const paymentsChannel = supabase
            .channel('finance-payments-all')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => refreshData())
            .subscribe()

        const invoicesChannel = supabase
            .channel('finance-invoices-all')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => refreshData())
            .subscribe()

        return () => {
            supabase.removeChannel(paymentsChannel)
            supabase.removeChannel(invoicesChannel)
        }
    }, [])

    const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<string | null>(null)
    const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<string | null>(null)
    const [studentsDebtorsOnly, setStudentsDebtorsOnly] = useState(false)

    // Calculate stats for Overview (Filtering for SUCCESSFUL payments)
    const completedPayments = payments.filter(p => p.status?.toLowerCase() === 'completed' || p.status?.toLowerCase() === 'success')

    const totalCollected = completedPayments.reduce((sum, p) => sum + Number.parseFloat(p.amount || 0), 0) || 0
    const totalPending = invoices.reduce((sum, i) => sum + Number.parseFloat(i.balance || 0), 0) || 0
    const paidInvoicesCount = invoices.filter((i) => i.status?.toLowerCase() === "paid").length || 0
    const collectionRate = invoices.length ? Math.round((paidInvoicesCount / invoices.length) * 100) : 0

    // Get today's date in YYYY-MM-DD format based on local time
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    const todayInvoices = invoices.filter((i) => i.created_at?.startsWith(todayStr)).length || 0
    const todayRevenue = completedPayments
        .filter((p) => (p.payment_date || p.created_at)?.startsWith(todayStr))
        .reduce((sum, p) => sum + Number.parseFloat(p.amount || 0), 0) || 0

    // Daily Revenue Chart Data (Last 7 Days)
    const dailyRevenueData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        const dStr = d.toISOString().split("T")[0]
        const amount = completedPayments
            .filter(p => (p.payment_date || p.created_at)?.startsWith(dStr))
            .reduce((sum, p) => sum + Number.parseFloat(p.amount || 0), 0)

        return {
            date: d.toLocaleDateString("en-GB", { day: 'numeric', month: 'short' }),
            amount
        }
    })

    // Payment Method Distribution
    const methods = ["cash", "pos", "transfer", "online"]
    const methodData = methods.map(method => {
        const total = completedPayments
            .filter(p => p.payment_method?.toLowerCase() === method)
            .reduce((sum, p) => sum + Number.parseFloat(p.amount || 0), 0)
        return { name: method.charAt(0).toUpperCase() + method.slice(1), value: total }
    }).filter(d => d.value > 0)

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6']

    const handleCollectPayment = (studentId: string, invoiceId?: string) => {
        setSelectedStudentForPayment(studentId)
        setSelectedInvoiceForPayment(invoiceId || null)
        setActiveTab("collect")
    }

    const getPaymentMethodIcon = (method: string) => {
        switch (method?.toLowerCase()) {
            case "cash": return <Wallet className="h-3 w-3" />
            case "pos": return <Smartphone className="h-3 w-3" />
            case "transfer": return <Building2 className="h-3 w-3" />
            default: return <CreditCard className="h-3 w-3" />
        }
    }

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="sticky top-16 z-40 w-full py-3 bg-background/80 backdrop-blur-md border-b -mx-4 px-4 sm:mx-0 sm:px-0">
                <TabsList className="w-full h-auto flex flex-nowrap overflow-x-auto justify-start lg:grid lg:grid-cols-8 gap-1 p-1 bg-muted/50 no-scrollbar">
                    <TabsTrigger value="overview" className="flex-shrink-0 text-xs px-3 py-1.5 lg:px-2">Overview</TabsTrigger>
                    <TabsTrigger value="fees" className="flex-shrink-0 text-xs px-3 py-1.5 lg:px-2">Fees</TabsTrigger>
                    <TabsTrigger value="invoices" className="flex-shrink-0 text-xs px-3 py-1.5 lg:px-2">Invoices</TabsTrigger>
                    <TabsTrigger value="collect" className="flex-shrink-0 text-xs px-3 py-1.5 lg:px-2">Collect payment</TabsTrigger>
                    <TabsTrigger value="students" className="flex-shrink-0 text-xs px-3 py-1.5 lg:px-2">Students</TabsTrigger>
                    <TabsTrigger value="payments" className="flex-shrink-0 text-xs px-3 py-1.5 lg:px-2">Payments</TabsTrigger>
                    <TabsTrigger value="reversals" className="flex-shrink-0 text-xs px-3 py-1.5 lg:px-2">Reversals</TabsTrigger>
                    <TabsTrigger value="report" className="flex-shrink-0 text-xs px-3 py-1.5 lg:px-2">Report</TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-6 pt-4">
                {/* KPI Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border shadow-none gap-2">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Collected Today</CardTitle>
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₦{todayRevenue.toLocaleString()}</div>
                            <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1 font-medium">
                                <ArrowUpRight className="h-3 w-3" />
                                +12.5% from yesterday
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border shadow-none gap-2">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Balance</CardTitle>
                            <Clock className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₦{totalPending.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">Across all unpaid invoices</p>
                        </CardContent>
                    </Card>

                    <Card className="border shadow-none gap-2">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Collection Rate</CardTitle>
                            <BadgePercent className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{collectionRate}%</div>
                            <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
                                <div
                                    className="bg-blue-600 h-full transition-all duration-500"
                                    style={{ width: `${collectionRate}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border shadow-none gap-2">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Invoices</CardTitle>
                            <FileText className="h-4 w-4 text-indigo-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{todayInvoices}</div>
                            <p className="text-xs text-indigo-600 font-medium mt-1">Status: Active</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Chart */}
                    <Card className="lg:col-span-2 border shadow-none">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
                            <CardDescription className="text-xs">Last 7 days of verified collections</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px] pt-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dailyRevenueData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                        tickFormatter={(val) => `₦${val / 1000}k`}
                                    />
                                    <RechartsTooltip
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-background border border-border p-2.5 rounded-lg shadow-xl text-[11px] min-w-[100px]">
                                                        <p className="text-muted-foreground mb-1 font-medium">{label}</p>
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="text-emerald-600 font-bold">Revenue</span>
                                                            <span className="font-bold">₦{payload[0].value.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="amount"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                        activeDot={{ r: 4, strokeWidth: 0 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Method Distribution */}
                    <Card className="border shadow-none">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Revenue by Method</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="h-[200px] w-full mt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={methodData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {methodData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-background border border-border p-2 rounded-lg shadow-xl text-[11px]">
                                                            <p className="font-bold" style={{ color: payload[0].payload.fill }}>
                                                                {payload[0].name}: ₦{payload[0].value.toLocaleString()}
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-2 mt-4">
                                {methodData.map((item, index) => (
                                    <div key={item.name} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                            <span className="text-muted-foreground">{item.name}</span>
                                        </div>
                                        <span className="font-semibold">₦{item.value.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Recent Activities - COMPACT VERSION */}
                    <Card className="border shadow-none overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">Recent Collections</CardTitle>
                                <CardDescription className="text-xs">Latest receipts from parents</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 font-medium" onClick={() => setActiveTab("payments")}>
                                View all
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {completedPayments.length === 0 ? (
                                <div className="p-12 text-center text-muted-foreground text-sm">No recent payments</div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {completedPayments.slice(0, 5).map((payment: any) => {
                                        const studentName = payment.payment_allocations?.[0]?.students
                                            ? `${payment.payment_allocations[0].students.first_name} ${payment.payment_allocations[0].students.last_name}`
                                            : "Direct Collection";

                                        return (
                                            <div key={payment.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/40 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-7 w-7 border">
                                                        <AvatarFallback className="text-[10px] bg-slate-50 text-slate-600 font-bold">
                                                            {studentName.split(' ').map(n => n[0]).join('')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold truncate max-w-[140px] text-zinc-900">{studentName}</p>
                                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                                                            <span className="flex items-center gap-0.5">
                                                                {getPaymentMethodIcon(payment.payment_method)}
                                                                {payment.payment_method}
                                                            </span>
                                                            <span className="h-0.5 w-0.5 rounded-full bg-slate-300" />
                                                            <span>{new Date(payment.payment_date || payment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end">
                                                    <p className="text-xs font-bold text-emerald-600">₦{Number.parseFloat(payment.amount).toLocaleString()}</p>
                                                    <Badge
                                                        variant="outline"
                                                        className={`h-3 text-[8px] px-1 font-bold capitalize ${payment.status?.toLowerCase() === 'completed' || payment.status?.toLowerCase() === 'success'
                                                            ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                                                            : 'border-yellow-200 text-yellow-700 bg-yellow-50'
                                                            }`}
                                                    >
                                                        {payment.status || 'SUCCESS'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Due Invoices */}
                    <Card className="border shadow-none overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">Priority Follow-up</CardTitle>
                                <CardDescription className="text-xs">Top overdue invoices needing attention</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-orange-600 font-medium" onClick={() => {
                                setStudentsDebtorsOnly(true)
                                setActiveTab("students")
                            }}>
                                View aging
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {invoices?.filter((i: any) => i.status === "Pending" && new Date(i.due_date) < new Date()).length === 0 ? (
                                <div className="p-12 text-center text-muted-foreground text-sm">No priority invoices</div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {invoices
                                        ?.filter((i: any) => i.status === "Pending" && new Date(i.due_date) < new Date())
                                        .slice(0, 5)
                                        .map((invoice: any) => (
                                            <div key={invoice.id} className="group flex items-center justify-between px-4 py-2.5 hover:bg-muted/40 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-7 w-7 rounded-full bg-orange-50 flex items-center justify-center border border-orange-100">
                                                        <Receipt className="h-3 w-3 text-orange-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold truncate max-w-[140px]">
                                                            {invoice.students ? `${invoice.students.first_name} ${invoice.students.last_name}` : `Invoice ${invoice.invoice_number}`}
                                                        </p>
                                                        <p className="text-[10px] text-orange-600 font-bold mt-0.5">
                                                            OVERDUE SINCE {new Date(invoice.due_date).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex items-center gap-2">
                                                    <p className="text-xs font-bold">₦{Number.parseFloat(invoice.balance).toLocaleString()}</p>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600"
                                                        onClick={() => handleCollectPayment(invoice.student_id, invoice.id)}
                                                    >
                                                        <ArrowRightCircle className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="fees">
                <FeesTab />
            </TabsContent>

            <TabsContent value="invoices">
                <InvoicesTab
                    userRole={userRole}
                    onCollectPayment={handleCollectPayment}
                />
            </TabsContent>

            <TabsContent value="collect">
                <CollectPayment
                    userRole={userRole}
                    preSelectedStudentId={selectedStudentForPayment}
                    preSelectedInvoiceId={selectedInvoiceForPayment}
                />
            </TabsContent>

            <TabsContent value="students">
                <StudentsTab
                    onCollectPayment={handleCollectPayment}
                    initialDebtorsOnly={studentsDebtorsOnly}
                />
            </TabsContent>

            <TabsContent value="payments">
                <PaymentsTab userRole={userRole} />
            </TabsContent>

            <TabsContent value="reversals">
                <ReversalsTab userRole={userRole} />
            </TabsContent>

            <TabsContent value="report">
                <ReportsTab
                    invoices={invoices}
                    payments={payments}
                />
            </TabsContent>
        </Tabs>
    )
}
