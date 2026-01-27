"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
	Users,
	GraduationCap,
	UserCheck,
	DollarSign,
	TrendingUp,
	Calendar,
	ArrowUpRight,
	ArrowDownRight,
	Search,
	PlusCircle,
	Bell,
	ChevronRight,
	Activity,
	BookOpen,
	Sparkles
} from "lucide-react"
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	BarChart,
	Bar,
	Cell,
	PieChart,
	Pie
} from "recharts"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { RegisterStudentModal } from "@/components/register-student-modal"

interface AdminDashboardClientProps {
	stats: {
		totalStudents: number
		totalTeachers: number
		totalGuardians: number
		todayRevenue: number
		revenueTrend: number
		totalOutstanding: number
		collectionRate: string
	}
	activeSession: any
	activeTerm: any
	sectionStats: any[]
	recentRegistrations: any[]
	enrollmentTrend: any[]
	user: any
	guardians: any[]
	upcomingEvents: any[]
}

export function AdminDashboardClient({
	stats,
	activeSession,
	activeTerm,
	sectionStats,
	recentRegistrations,
	enrollmentTrend,
	user,
	guardians,
	upcomingEvents
}: AdminDashboardClientProps) {

	const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
	const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']

	// Calculate term progress percentage based on dates
	const calculateProgress = () => {
		if (!activeTerm?.start_date || !activeTerm?.end_date) return 64;
		const start = new Date(activeTerm.start_date).getTime();
		const end = new Date(activeTerm.end_date).getTime();
		const now = new Date().getTime();
		if (now <= start) return 0;
		if (now >= end) return 100;
		return Math.round(((now - start) / (end - start)) * 100);
	};

	const termProgress = calculateProgress();

	return (
		<div className="space-y-8 pt-2 pb-8">
			{/* Modals */}
			<div className="hidden">
				<RegisterStudentModal guardians={guardians} />
				{/* 
					We anchor the RegisterStudentModal trigger manually to avoid UI duplication 
					But the component itself is needed for the dialog content
				*/}
			</div>

			{/* Header section with Greeting and Search */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<h1 className="text-2xl font-bold tracking-tight font-mono">Command Center</h1>
					</div>
					<p className="text-muted-foreground flex items-center gap-2 font-mono">
						Welcome back, <span className="text-foreground font-semibold">{user.role === "super_admin" ? "Super Admin" : "Principal Admin"}</span>
						<span className="h-1 w-1 rounded-full bg-slate-300" />
						{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
					</p>
				</div>

				<div className="flex items-center gap-2">
					{/* Custom Trigger for RegisterStudentModal */}
					<RegisterStudentModal guardians={guardians} />

					<Button variant="outline" size="sm" className="hidden sm:flex gap-2 h-9 border-dashed" asChild>
						<Link href="/finance?tab=collect">
							<DollarSign className="h-4 w-4" />
							Collect Payment
						</Link>
					</Button>
					<Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border bg-background" asChild>
						<Link href="/calendar">
							<Calendar className="h-4 w-4 text-muted-foreground" />
						</Link>
					</Button>
				</div>
			</div>

			{/* Academic Status Bar */}
			{activeSession && activeTerm && (
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<Card className="md:col-span-3 border shadow-none bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 border-slate-800 text-white overflow-hidden relative">
						<div className="absolute top-0 right-0 p-8 opacity-4">
							<GraduationCap className="h-32 w-32" />
						</div>
						<CardContent className="p-6 relative">
							<div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
								<div className="space-y-4">
									<div className="flex items-center gap-2">
										<Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold">CURRENT SESSION</Badge>
										<div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
									</div>
									<div>
										<h2 className="text-3xl font-extrabold">{activeSession.name}</h2>
										<p className="text-slate-400 font-medium text-lg mt-1">{activeTerm.name}</p>
									</div>
								</div>

								<div className="grid grid-cols-2 md:flex items-center gap-8 text-right">
									<div className="space-y-1">
										<p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Session Ends</p>
										<p className="text-lg font-bold">{new Date(activeTerm.end_date || activeSession.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
									</div>
									<div className="space-y-1 border-l border-slate-700 pl-8">
										<p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Term Progress</p>
										<div className="flex items-center gap-3">
											<span className="text-lg font-bold">{termProgress}%</span>
											<div className="w-24 bg-slate-600 h-1.5 rounded-full overflow-hidden">
												<div
													className="bg-emerald-500 h-full transition-all duration-1000"
													style={{ width: `${termProgress}%` }}
												/>
											</div>
										</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* KPI Row - REVERTED TO PREVIOUS LARGER STYLE */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card className="border shadow-none group hover:border-primary/20 transition-all duration-300">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Students</CardTitle>
						<div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600">
							<Users className="h-4 w-4" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.totalStudents || 0}</div>
						<div className="flex items-center gap-1.5 mt-2">
							<div className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">
								<ArrowUpRight className="h-3 w-3" />
								+4.2%
							</div>
							<span className="text-[10px] text-muted-foreground font-medium">vs last term</span>
						</div>
					</CardContent>
				</Card>

				<Card className="border shadow-none group hover:border-primary/20 transition-all duration-300">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Staff Count</CardTitle>
						<div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-600">
							<GraduationCap className="h-4 w-4" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.totalTeachers || 0}</div>
						<div className="text-[10px] text-muted-foreground font-medium mt-3">Active teaching staff</div>
					</CardContent>
				</Card>

				<Card className="border shadow-none group hover:border-primary/20 transition-all duration-300">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Guardians</CardTitle>
						<div className="h-8 w-8 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-orange-600">
							<UserCheck className="h-4 w-4" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.totalGuardians || 0}</div>
						<div className="text-[10px] text-muted-foreground font-medium mt-3">Registered family units</div>
					</CardContent>
				</Card>

				<Card className="border shadow-none group hover:border-primary/20 transition-all duration-300">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Monthly Revenue</CardTitle>
						<div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600">
							<DollarSign className="h-4 w-4" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">₦{stats.todayRevenue.toLocaleString()}</div>
						<div className="flex items-center gap-1.5 mt-2">
							<div className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded ${stats.revenueTrend >= 0 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' : 'text-red-600 bg-red-50 dark:bg-red-950/30'}`}>
								{stats.revenueTrend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
								{Math.abs(stats.revenueTrend)}%
							</div>
							<span className="text-[10px] text-muted-foreground font-medium">vs yesterday</span>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Visual Section */}
			<div className="grid gap-6 lg:grid-cols-3">
				{/* Growth Chart */}
				<Card className="lg:col-span-2 border shadow-none relative overflow-hidden">
					<CardHeader className="pb-2">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-base font-bold">Enrollment Growth</CardTitle>
								<CardDescription className="text-xs font-medium">New student intake over the last 6 months</CardDescription>
							</div>
							<div className="flex items-center gap-1 text-[10px] font-bold bg-slate-50 dark:bg-slate-900 border px-2 py-1 rounded-full uppercase tracking-tighter">
								<Activity className="h-3 w-3 text-primary animate-pulse" />
								Real-time Insights
							</div>
						</div>
					</CardHeader>
					<CardContent className="h-[320px] pt-4">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={enrollmentTrend}>
								<defs>
									<linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
										<stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
								<XAxis
									dataKey="month"
									axisLine={false}
									tickLine={false}
									tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
									dy={10}
								/>
								<YAxis
									axisLine={false}
									tickLine={false}
									tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
								/>
								<Tooltip
									content={({ active, payload, label }) => {
										if (active && payload && payload.length) {
											return (
												<div className="bg-background/95 backdrop-blur-sm border border-border p-3 rounded-xl shadow-2xl text-[11px] min-w-[120px]">
													<p className="text-muted-foreground mb-1.5 font-bold uppercase tracking-wider">{label}</p>
													<div className="flex items-center justify-between gap-4">
														<span className="text-blue-500 font-bold">New Students</span>
														<span className="font-extrabold text-lg">{payload[0].value}</span>
													</div>
												</div>
											);
										}
										return null;
									}}
								/>
								<Area
									type="monotone"
									dataKey="count"
									stroke="#3b82f6"
									strokeWidth={3}
									fillOpacity={1}
									fill="url(#colorStudents)"
									activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
								/>
							</AreaChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				{/* Section Distribution */}
				<Card className="border shadow-none flex flex-col">
					<CardHeader className="pb-2">
						<CardTitle className="text-base font-bold">Population Mix</CardTitle>
						<CardDescription className="text-xs font-medium">By school section</CardDescription>
					</CardHeader>
					<CardContent className="flex-1 flex flex-col justify-center">
						<div className="h-[220px] w-full relative">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={sectionStats}
										innerRadius={65}
										outerRadius={85}
										paddingAngle={4}
										dataKey="count"
										nameKey="section"
										stroke="none"
									>
										{sectionStats.map((entry, index) => (
											<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
										))}
									</Pie>
									<Tooltip
										content={({ active, payload }) => {
											if (active && payload && payload.length) {
												return (
													<div className="bg-background border border-border px-3 py-2 rounded-lg shadow-xl text-[11px]">
														<p className="font-bold whitespace-nowrap" style={{ color: payload[0].payload.fill }}>
															{payload[0].name}: {payload[0].value} Students
														</p>
													</div>
												);
											}
											return null;
										}}
									/>
								</PieChart>
							</ResponsiveContainer>
							<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
								<span className="text-3xl font-black">{stats.totalStudents}</span>
								<span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Total</span>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-6">
							{sectionStats.map((stat, index) => (
								<div key={stat.section} className="flex items-center gap-2">
									<div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
									<div className="min-w-0">
										<p className="text-[10px] text-muted-foreground font-bold truncate uppercase">{stat.section}</p>
										<p className="text-xs font-black">{stat.count}</p>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Bottom Metrics Row */}
			<div className="grid gap-6 lg:grid-cols-3">
				{/* Upcoming Events */}
				<Card className="border shadow-none overflow-hidden flex flex-col">
					<CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 dark:bg-slate-900/30 px-6 py-4">
						<div className="space-y-1">
							<CardTitle className="text-base font-bold">Upcoming Events</CardTitle>
							<CardDescription className="text-xs font-medium">Nearest school activities</CardDescription>
						</div>
						<Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider" asChild>
							<Link href="/calendar">Full Calendar</Link>
						</Button>
					</CardHeader>
					<CardContent className="p-0 flex-1">
						{upcomingEvents && upcomingEvents.length > 0 ? (
							<div className="divide-y divide-border">
								{upcomingEvents.map((event) => {
									const eventDate = new Date(event.start_date)
									const isToday = new Date().toDateString() === eventDate.toDateString()

									const categoryColors: Record<string, string> = {
										academic: "bg-blue-500",
										finance: "bg-emerald-500",
										admin: "bg-purple-500",
										holiday: "bg-red-500",
										class: "bg-orange-500",
									}

									return (
										<div key={event.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors group cursor-pointer">
											<div className="flex flex-col items-center justify-center min-w-[48px] h-[48px] bg-slate-100 dark:bg-slate-800 rounded-xl border shadow-sm group-hover:border-primary/30 transition-colors">
												<span className="text-[10px] font-bold text-muted-foreground uppercase">{eventDate.toLocaleDateString('en-GB', { month: 'short' })}</span>
												<span className="text-lg font-black leading-none">{eventDate.getDate()}</span>
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{event.title}</p>
												<div className="flex items-center gap-2 mt-1">
													<div className={`h-1.5 w-1.5 rounded-full ${categoryColors[event.category] || 'bg-slate-400'}`} />
													<span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
														{isToday ? "Today" : event.category} • {eventDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
													</span>
												</div>
											</div>
										</div>
									)
								})}
							</div>
						) : (
							<div className="flex flex-col items-center justify-center p-12 text-center h-full">
								<Calendar className="h-10 w-10 text-muted/30 mb-3" />
								<p className="text-sm text-muted-foreground font-medium">No upcoming events</p>
							</div>
						)}
					</CardContent>
				</Card>

				<Card className="border shadow-none overflow-hidden">
					<CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 dark:bg-slate-900/30 px-6 py-4">
						<div className="space-y-1">
							<CardTitle className="text-base font-bold">Recent Onboarding</CardTitle>
							<CardDescription className="text-xs font-medium">Latest potential students</CardDescription>
						</div>
						<Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider" asChild>
							<Link href="/students">View Directory</Link>
						</Button>
					</CardHeader>
					<CardContent className="p-0">
						{recentRegistrations && recentRegistrations.length > 0 ? (
							<div className="divide-y divide-border">
								{recentRegistrations.map((student) => (
									<div key={student.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group">
										<div className="flex items-center gap-4">
											<Avatar className="h-10 w-10 border-2 border-background ring-2 ring-slate-100 dark:ring-slate-900 group-hover:scale-110 transition-transform">
												<AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-xs font-bold">
													{student.first_name[0]}{student.last_name[0]}
												</AvatarFallback>
											</Avatar>
											<div className="space-y-0.5">
												<p className="text-sm font-bold truncate max-w-[160px]">{student.first_name} {student.last_name}</p>
												<div className="flex items-center gap-2">
													<Badge variant="secondary" className="h-4 text-[9px] px-1 font-black bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-none uppercase tracking-tighter">
														{student.student_id || 'ID PENDING'}
													</Badge>
													<span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
														<Calendar className="h-2.5 w-2.5" />
														{new Date(student.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
													</span>
												</div>
											</div>
										</div>
										<Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
											<ChevronRight className="h-4 w-4" />
										</Button>
									</div>
								))}
							</div>
						) : (
							<div className="flex flex-col items-center justify-center p-12 text-center">
								<Users className="h-10 w-10 text-muted/30 mb-3" />
								<p className="text-sm text-muted-foreground font-medium">No registrations yet</p>
							</div>
						)}
					</CardContent>
				</Card>

				<Card className="border shadow-none">
					<CardHeader className="pb-4">
						<CardTitle className="text-base font-bold">Financial Health Snapshot</CardTitle>
						<CardDescription className="text-xs font-medium">Term collection performance</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="space-y-2">
							<div className="flex items-center justify-between text-xs">
								<span className="font-bold uppercase tracking-wider text-muted-foreground">Collection Progress</span>
								<span className="font-black text-emerald-600 dark:text-emerald-500">{stats.collectionRate}%</span>
							</div>
							<div className="h-3 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border p-0.5">
								<div
									className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full shadow-sm"
									style={{ width: `${stats.collectionRate}%` }}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="p-4 rounded-xl border bg-slate-50/50 dark:bg-slate-950/20 space-y-1">
								<p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Revenue Goals</p>
								<p className="text-sm font-black">₦{(stats.todayRevenue * 12).toLocaleString()}</p>
							</div>
							<div className="p-4 rounded-xl border bg-orange-50/50 dark:bg-orange-950/10 space-y-1">
								<p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Receivables</p>
								<p className="text-sm font-black text-orange-700 dark:text-orange-400">₦{stats.totalOutstanding.toLocaleString()}</p>
							</div>
						</div>

						<div className="border-t pt-4">
							<Button className="w-full gap-2 font-bold group" variant="outline" asChild>
								<Link href="/finance">
									Strategic Finance Report
									<ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
