"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    BarChart3,
    Download,
    FileText,
    TrendingUp,
    PieChart as PieChartIcon,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Target,
    Wallet,
    AlertCircle,
    Printer,
    FileSpreadsheet
} from "lucide-react"
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie,
    Legend
} from "recharts"
import { Badge } from "@/components/ui/badge"

interface ReportsTabProps {
    invoices: any[]
    payments: any[]
}

export function ReportsTab({ invoices = [], payments = [] }: ReportsTabProps) {
    const [timeRange, setTimeRange] = useState("term")

    // Calculations for Reports
    const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)
    const totalCollected = payments.reduce((sum, pay) => sum + Number(pay.amount || 0), 0)
    const totalPending = invoices.reduce((sum, inv) => sum + Number(inv.balance || 0), 0)

    const collectionEfficiency = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0

    // Aging Debt (Overdue Invoices)
    const today = new Date()
    const overdueInvoices = invoices.filter(inv => inv.status === "Pending" && new Date(inv.due_date) < today)
    const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + Number(inv.balance || 0), 0)

    // Payment Method Breakdown
    const methods = ["cash", "pos", "transfer", "online"]
    const methodData = methods.map(method => {
        const total = payments
            .filter(p => p.payment_method?.toLowerCase() === method)
            .reduce((sum, p) => sum + Number(p.amount || 0), 0)
        return { name: method.toUpperCase(), value: total }
    }).filter(d => d.value > 0)

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6']

    // Class-Wise Heatmap Logic
    const classStatsMap = invoices.reduce((acc: any, inv) => {
        // Extract class name from the new structure (students -> student_enrollments -> classes)
        const className = inv.students?.student_enrollments?.[0]?.class?.name || "Unassigned"

        if (!acc[className]) {
            acc[className] = { name: className, invoiced: 0, collected: 0, count: 0 }
        }

        acc[className].invoiced += Number(inv.total_amount || 0)
        acc[className].collected += (Number(inv.total_amount || 0) - Number(inv.balance || 0))
        acc[className].count += 1
        return acc
    }, {})

    const heatmapData = Object.values(classStatsMap)
        .sort((a: any, b: any) => b.invoiced - a.invoiced)
        .map((c: any) => ({
            ...c,
            efficiency: c.invoiced > 0 ? (c.collected / c.invoiced) * 100 : 0
        }))

    // Color mapper for heatmap
    const getEfficiencyColor = (eff: number) => {
        if (eff >= 90) return 'bg-emerald-500 text-emerald-950 dark:text-emerald-50'
        if (eff >= 70) return 'bg-emerald-400/80 text-emerald-950 dark:text-emerald-50'
        if (eff >= 50) return 'bg-orange-400 text-orange-950 dark:text-orange-50'
        if (eff >= 30) return 'bg-orange-500 text-orange-950 dark:text-orange-50'
        return 'bg-red-500 text-red-50'
    }

    // Monthly Trends (Mock for visualization)
    const trendData = [
        { month: 'Sep', invoiced: 450000, collected: 320000 },
        { month: 'Oct', invoiced: 520000, collected: 410000 },
        { month: 'Nov', invoiced: 480000, collected: 450000 },
        { month: 'Dec', invoiced: 300000, collected: 280000 },
        { month: 'Jan', invoiced: 600000, collected: 510000 },
    ]

    return (
        <div className="space-y-6 pt-4">
            {/* Strategic KPI Row - SLIM STYLE */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="gap-0 py-3 border shadow-none group hover:border-emerald-500/20 transition-all">
                    <CardHeader className="px-4 flex flex-row items-center justify-between pb-1">
                        <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Collection Efficiency</CardTitle>
                        <Target className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent className="px-4">
                        <div className="text-2xl font-bold">{collectionEfficiency.toFixed(1)}%</div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full mt-3 overflow-hidden">
                            <div
                                className="bg-emerald-500 h-full transition-all duration-1000"
                                style={{ width: `${collectionEfficiency}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="gap-0 py-3 border shadow-none group hover:border-blue-500/20 transition-all">
                    <CardHeader className="px-4 flex flex-row items-center justify-between pb-1">
                        <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Projected Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent className="px-4">
                        <div className="text-2xl font-bold">₦{totalInvoiced.toLocaleString()}</div>
                        <p className="text-[10px] text-muted-foreground mt-2 font-medium">Total expected this term</p>
                    </CardContent>
                </Card>

                <Card className="gap-0 py-3 border shadow-none group hover:border-orange-500/20 transition-all">
                    <CardHeader className="px-4 flex flex-row items-center justify-between pb-1">
                        <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Liquidity (Actual)</CardTitle>
                        <Wallet className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent className="px-4">
                        <div className="text-2xl font-bold text-emerald-600 font-mono">₦{totalCollected.toLocaleString()}</div>
                        <p className="text-[10px] text-muted-foreground mt-2 font-medium">Verified cash/bank inflow</p>
                    </CardContent>
                </Card>

                <Card className="gap-0 py-3 border shadow-none group hover:border-red-500/20 transition-all">
                    <CardHeader className="px-4 flex flex-row items-center justify-between pb-1">
                        <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Outstanding Debt</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent className="px-4">
                        <div className="text-2xl font-bold text-red-600">₦{totalPending.toLocaleString()}</div>
                        <div className="flex items-center gap-1 mt-2">
                            <span className="text-[10px] font-bold text-red-700 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded uppercase">
                                ₦{totalOverdue.toLocaleString()} Overdue
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Revenue Gap Analysis Chart */}
                <Card className="lg:col-span-2 border shadow-none overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                        <div>
                            <CardTitle className="text-sm font-bold">Financial performance trend</CardTitle>
                            <CardDescription className="text-xs">Comparison between Invoiced vs. Collected amounts</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" className="h-8 text-xs font-bold gap-2 border-slate-200 shadow-none">
                            <Calendar className="h-3 w-3" />
                            Current Term
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-6 h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorInvoiced" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200 dark:stroke-slate-800" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, className: "fill-slate-500 dark:fill-slate-400", fontWeight: 'bold' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, className: "fill-slate-500 dark:fill-slate-400" }}
                                    tickFormatter={(val) => `₦${val / 1000}k`}
                                />
                                <RechartsTooltip
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                        backgroundColor: 'hsl(var(--background))',
                                    }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                    labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: 'hsl(var(--foreground))' }}
                                />
                                <Legend verticalAlign="top" height={36} align="right" iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                                <Area
                                    type="monotone"
                                    dataKey="invoiced"
                                    name="Invoiced"
                                    stroke="#3b82f6"
                                    fillOpacity={1}
                                    fill="url(#colorInvoiced)"
                                    strokeWidth={2}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="collected"
                                    name="Collected"
                                    stroke="#10b981"
                                    fillOpacity={1}
                                    fill="url(#colorCollected)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Method Distribution */}
                <Card className="border shadow-none overflow-hidden">
                    <CardHeader className="pb-2 border-b">
                        <CardTitle className="text-sm font-bold">Payment channel mix</CardTitle>
                        <CardDescription className="text-xs">Where your revenue is coming from</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[220px] w-full">
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
                                        contentStyle={{
                                            borderRadius: '8px',
                                            border: 'none',
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                            backgroundColor: 'hsl(var(--background))',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-3 mt-6">
                            {methodData.map((item, index) => (
                                <div key={item.name} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        <span className="font-bold text-muted-foreground uppercase">{item.name}</span>
                                    </div>
                                    <span className="font-mono font-bold">₦{item.value.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Class-Wise Profitability Heatmap */}
            <Card className="border shadow-none overflow-hidden">
                <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-sm font-bold">Class-Wise Collection Heatmap</CardTitle>
                        <CardDescription className="text-xs">Financial health by class level (Color = Collection Rate, Label = Class Name)</CardDescription>
                    </div>
                    <div className="flex gap-2 text-[10px] font-bold">
                        <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-emerald-500" /> 90%+</div>
                        <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-orange-500" /> 50%</div>
                        <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-red-500" /> &lt;30%</div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {heatmapData.map((item: any) => (
                            <div
                                key={item.name}
                                className={`
                                    relative aspect-square rounded-xl p-3 flex flex-col justify-between 
                                    transition-transform hover:scale-[1.03] cursor-default group
                                    ${getEfficiencyColor(item.efficiency)}
                                `}
                            >
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black uppercase opacity-70 tracking-tighter truncate">{item.name}</p>
                                    <h5 className="text-base font-black leading-none">{item.efficiency.toFixed(0)}%</h5>
                                </div>

                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-bold opacity-80 truncate">₦{(item.collected / 1000).toFixed(1)}k / ₦{(item.invoiced / 1000).toFixed(1)}k</p>
                                    <div className="w-full bg-black/10 h-1 rounded-full overflow-hidden">
                                        <div className="bg-black/20 h-full" style={{ width: `${item.efficiency}%` }} />
                                    </div>
                                </div>

                                {/* Hover details */}
                                <div className="absolute inset-0 bg-black/90 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-center text-[10px] space-y-1">
                                    <p className="font-bold border-b border-white/20 pb-1 mb-1">{item.name}</p>
                                    <div className="flex justify-between"><span>Students:</span> <span className="font-mono">{item.count}</span></div>
                                    <div className="flex justify-between"><span>Target:</span> <span className="font-mono">₦{item.invoiced.toLocaleString()}</span></div>
                                    <div className="flex justify-between"><span>Gap:</span> <span className="font-mono text-red-400">₦{(item.invoiced - item.collected).toLocaleString()}</span></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Report Export Vault */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border shadow-none bg-slate-50/50 dark:bg-slate-900/20 border-dashed border-2">
                    <CardContent className="p-6">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                            <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                        </div>
                        <h4 className="font-bold text-sm mb-1 uppercase tracking-tight">Financial Summary</h4>
                        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">Download a comprehensive Excel breakdown of all income and liabilities for this term.</p>
                        <Button size="sm" className="w-full bg-slate-900 hover:bg-black font-bold h-9">
                            <Download className="h-3.5 w-3.5 mr-2" />
                            EXPORT SUMMARY
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border shadow-none bg-slate-50/50 dark:bg-slate-900/20 border-dashed border-2">
                    <CardContent className="p-6">
                        <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4">
                            <Printer className="h-5 w-5 text-orange-600" />
                        </div>
                        <h4 className="font-bold text-sm mb-1 uppercase tracking-tight">Daily Reconciliation</h4>
                        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">Print-ready PDF report of today's collections for physical vault matching.</p>
                        <Button variant="outline" size="sm" className="w-full border-slate-300 font-bold h-9 shadow-none">
                            <Printer className="h-3.5 w-3.5 mr-2" />
                            PRINT RECONCILIATION
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border shadow-none bg-slate-50/50 dark:bg-slate-900/20 border-dashed border-2">
                    <CardContent className="p-6">
                        <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                            <FileText className="h-5 w-5 text-red-600" />
                        </div>
                        <h4 className="font-bold text-sm mb-1 uppercase tracking-tight">Aged Debtor's List</h4>
                        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">Generate a list of students with outstanding balances past their due dates.</p>
                        <Button variant="outline" size="sm" className="w-full border-red-200 text-red-600 hover:bg-red-50 font-bold h-9 shadow-none">
                            <Download className="h-3.5 w-3.5 mr-2" />
                            GET DEBTOR LIST
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
