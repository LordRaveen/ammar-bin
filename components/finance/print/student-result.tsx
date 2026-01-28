"use client"

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, PieChart, Pie } from 'recharts'
import { Badge } from "@/components/ui/badge"
import { Award, User, BookOpen, Star, TrendingUp } from "lucide-react"

interface StudentResultTerminalProps {
    data: {
        studentName: string
        studentId: string
        className: string
        term: string
        session: string
        average: number
        totalScore: number
        position: string
        subjects: any[]
        grading: any[]
        teacherRemark?: string
        principalRemark?: string
    }
}

export function StudentResultTerminal({ data }: StudentResultTerminalProps) {
    const chartData = data.subjects.map(s => ({
        name: s.name.substring(0, 5),
        score: s.total,
        fullSubject: s.name
    }))

    const COLORS = ['#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd']

    return (
        <div className="bg-white p-10 max-w-[1000px] mx-auto text-zinc-900 print:p-0">
            {/* Result Header */}
            <div className="text-center mb-10 pb-6 border-b-4 border-double border-zinc-200">
                <h1 className="text-3xl font-black text-blue-900 tracking-tighter mb-1">AMMAR BIN YASIR INSTITUTE</h1>
                <p className="text-sm font-medium text-zinc-500 uppercase tracking-[0.3em]">Progress Report Card</p>
                <div className="mt-4 flex justify-center gap-4">
                    <Badge variant="secondary" className="px-4 py-1 text-sm font-bold bg-blue-50 text-blue-800 border-none">{data.session}</Badge>
                    <Badge variant="secondary" className="px-4 py-1 text-sm font-bold bg-zinc-100 text-zinc-800 border-none">{data.term}</Badge>
                </div>
            </div>

            {/* Student Passport and Info */}
            <div className="grid grid-cols-3 gap-8 mb-10">
                <div className="flex flex-col items-center justify-center p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
                    <div className="h-32 w-32 rounded-xl bg-zinc-200 border-4 border-white shadow-xl flex items-center justify-center mb-3 overflow-hidden">
                        <User className="h-16 w-16 text-zinc-400" />
                    </div>
                    <p className="font-black text-blue-900 tracking-tight">{data.studentName}</p>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{data.studentId}</p>
                </div>

                <div className="col-span-2 grid grid-cols-2 gap-4">
                    {[
                        { label: 'Class/Section', value: data.className, icon: <BookOpen className="h-4 w-4" /> },
                        { label: 'Termly Average', value: `${data.average.toFixed(1)}%`, icon: <TrendingUp className="h-4 w-4" /> },
                        { label: 'Total Score', value: data.totalScore.toFixed(1), icon: <Star className="h-4 w-4" /> },
                        { label: 'Class Position', value: data.position, icon: <Award className="h-4 w-4" /> },
                    ].map((item, i) => (
                        <div key={i} className="p-4 rounded-xl border border-zinc-100 bg-white/50 flex flex-col justify-between shadow-sm">
                            <div className="flex items-center gap-2 text-zinc-400">
                                {item.icon}
                                <span className="text-[10px] uppercase font-bold tracking-wider">{item.label}</span>
                            </div>
                            <p className="text-xl font-black text-zinc-800 mt-1">{item.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-8 mb-10">
                {/* Performance Chart */}
                <div className="col-span-2 h-[250px] p-4 bg-zinc-50 rounded-2xl border border-zinc-100 shadow-inner">
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4">Subject Performance Analysis</p>
                    <ResponsiveContainer width="100%" height="80%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                            <YAxis hide domain={[0, 100]} />
                            <Tooltip cursor={{ fill: 'transparent' }} content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-zinc-900 text-white px-2 py-1 rounded text-[10px] font-bold">
                                            {payload[0].payload.fullSubject}: {payload[0].value}%
                                        </div>
                                    )
                                }
                                return null
                            }} />
                            <Bar dataKey="score" radius={[4, 4, 0, 0]} barSize={20}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Grade Distribution */}
                <div className="h-[250px] p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 text-center">Outcome summary</p>
                    <div className="flex flex-col gap-2">
                        {data.grading.slice(0, 5).map((g, i) => (
                            <div key={i} className="flex items-center justify-between text-xs p-2 bg-white rounded-lg border border-zinc-100">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <span className="font-bold">{g.grade}</span>
                                </div>
                                <span className="text-zinc-500 font-medium">{g.min_score}-{g.max_score}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Scores Table */}
            <table className="w-full mb-10 border-collapse">
                <thead>
                    <tr className="bg-zinc-900 text-white">
                        <th className="text-left py-3 px-4 text-[10px] uppercase font-black rounded-tl-xl tracking-widest">Subject</th>
                        <th className="text-center py-3 px-2 text-[10px] uppercase font-black tracking-widest">CA (40)</th>
                        <th className="text-center py-3 px-2 text-[10px] uppercase font-black tracking-widest">EXAM (60)</th>
                        <th className="text-center py-3 px-2 text-[10px] uppercase font-black tracking-widest">TOTAL</th>
                        <th className="text-center py-3 px-4 text-[10px] uppercase font-black rounded-tr-xl tracking-widest">GRADE</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                    {data.subjects.map((s, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/50'}>
                            <td className="py-3 px-4 text-sm font-bold text-zinc-700">{s.name}</td>
                            <td className="py-3 px-4 text-center text-sm font-mono text-zinc-500">{s.ca.toFixed(1)}</td>
                            <td className="py-3 px-4 text-center text-sm font-mono text-zinc-500">{s.exam.toFixed(1)}</td>
                            <td className="py-3 px-4 text-center text-sm font-mono font-black text-blue-900 border-x border-zinc-100">{s.total.toFixed(1)}</td>
                            <td className="py-3 px-4 text-center">
                                <span className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-black ${s.grade === 'A' ? 'bg-green-100 text-green-700' :
                                        s.grade === 'F' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                    }`}>{s.grade}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Remarks and Authentication */}
            <div className="grid grid-cols-2 gap-10">
                <div className="space-y-4">
                    <div className="p-4 bg-zinc-50 border-l-4 border-blue-900 rounded-r-xl">
                        <p className="text-[10px] font-black uppercase text-blue-900 mb-1">Teacher's Remark</p>
                        <p className="text-xs italic text-zinc-600">"{data.teacherRemark || 'Hardworking student, keep it up.'}"</p>
                    </div>
                    <div className="p-4 bg-zinc-50 border-l-4 border-zinc-400 rounded-r-xl">
                        <p className="text-[10px] font-black uppercase text-zinc-400 mb-1">Principal's Remark</p>
                        <p className="text-xs italic text-zinc-600">"{data.principalRemark || 'Satisfactory performance.'}"</p>
                    </div>
                </div>

                <div className="flex flex-col justify-end items-center gap-6 pb-4">
                    <div className="text-center w-full max-w-[200px]">
                        <div className="h-[40px] flex items-center justify-center grayscale opacity-30 mb-2">
                            {/* Placeholder for stamp/seal */}
                            <div className="border-4 border-red-900 p-2 rounded-full font-black text-red-900/40 transform rotate-12 text-[10px] uppercase">Official Seal</div>
                        </div>
                        <p className="text-[10px] uppercase font-black text-zinc-400 border-t border-zinc-200 pt-2 tracking-widest">School Authority</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
