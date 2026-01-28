"use client"

import { FileText, MapPin, Phone, Mail, Clock, ShieldCheck } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface OfficialInvoiceProps {
    data: {
        invoice_number: string
        issue_date: string
        due_date: string
        student_name: string
        student_id: string
        class_name: string
        parent_name?: string
        parent_phone?: string
        items: any[]
        total_amount: number
        balance: number
        status: string
        term?: string
    }
}

export function OfficialInvoice({ data }: OfficialInvoiceProps) {
    const schoolInfo = {
        name: "AMMAR BIN YASIR INSTITUTE",
        nameArabic: "معهد عمار بن ياسر",
        address: "123 School Street, Abuja, Nigeria",
        phone: "+234 800 000 0000",
        email: "info@ammarbinyasir.com"
    }

    const isOverdue = new Date(data.due_date) < new Date() && data.status !== 'Paid'

    return (
        <div className="bg-white p-10 max-w-[850px] mx-auto text-zinc-900 print:p-0">
            {/* Header */}
            <div className="flex justify-between items-start mb-12">
                <div className="space-y-4">
                    <div className="h-16 w-16 bg-blue-900 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-900/20">ABY</div>
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase">{schoolInfo.name}</h1>
                        <p className="text-xs text-zinc-400 mt-1">{schoolInfo.address}</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-5xl font-black text-zinc-100 uppercase tracking-tighter mb-4">Invoice</h2>
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Invoice Number</p>
                        <p className="text-lg font-mono font-black">{data.invoice_number}</p>
                    </div>
                </div>
            </div>

            {/* Bill To & Dates */}
            <div className="grid grid-cols-2 gap-12 mb-12">
                <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <p className="text-[10px] uppercase font-black text-zinc-400 tracking-widest mb-4">Responsible Party</p>
                    <h3 className="text-xl font-black text-blue-900 mb-1">{data.parent_name || 'Guardian'}</h3>
                    <p className="text-sm text-zinc-600 mb-4">{data.parent_phone || 'N/A'}</p>
                    <div className="pt-4 border-t border-zinc-200">
                        <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">On behalf of student</p>
                        <p className="text-sm font-bold">{data.student_name} ({data.class_name})</p>
                        <p className="text-[10px] font-medium text-zinc-400 tracking-tighter">{data.student_id}</p>
                    </div>
                </div>

                <div className="flex flex-col justify-between py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] uppercase font-black text-zinc-400 tracking-widest mb-1">Date Issued</p>
                            <p className="text-sm font-bold">{new Date(data.issue_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-black text-zinc-400 tracking-widest mb-1">Due Date</p>
                            <p className={`text-sm font-black ${isOverdue ? 'text-red-600 underline decoration-2 underline-offset-4' : 'text-zinc-900'}`}>{new Date(data.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                    </div>

                    <div className={`mt-8 p-4 rounded-xl flex items-center justify-between border-2 ${data.status === 'Paid' ? 'bg-green-50 border-green-200 text-green-700' :
                        data.status === 'Partial' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                            'bg-orange-50 border-orange-200 text-orange-700'
                        }`}>
                        <div className="flex items-center gap-2">
                            {data.status === 'Paid' ? <ShieldCheck className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                            <span className="text-[10px] uppercase font-black tracking-widest">Payment Status</span>
                        </div>
                        <span className="text-sm font-black uppercase text-right">{data.status}</span>
                    </div>
                </div>
            </div>

            {/* Item Table */}
            <table className="w-full mb-12">
                <thead>
                    <tr className="border-b-2 border-zinc-900">
                        <th className="text-left py-4 text-[10px] uppercase font-black text-zinc-400 tracking-widest">Item Description</th>
                        <th className="text-right py-4 text-[10px] uppercase font-black text-zinc-400 tracking-widest w-[120px]">Qty</th>
                        <th className="text-right py-4 text-[10px] uppercase font-black text-zinc-400 tracking-widest w-[150px]">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                    {data.items?.map((item, idx) => (
                        <tr key={idx}>
                            <td className="py-5">
                                <p className="font-bold text-zinc-800">{item.fee_categories?.name || item.description}</p>
                                <p className="text-[10px] text-zinc-400">School Fees • {data.term || 'Current Term'}</p>
                            </td>
                            <td className="py-5 text-right text-sm font-mono font-bold text-zinc-400">1.00</td>
                            <td className="py-5 text-right text-sm font-mono font-bold">₦{Number(item.amount).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Summary */}
            <div className="flex justify-end mb-12">
                <div className="w-[300px] space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-500 font-medium">Subtotal</span>
                        <span className="font-bold">₦{data.total_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-500 font-medium">Applied Discounts</span>
                        <span className="font-bold text-green-600">- ₦0.00</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center pt-2">
                        <span className="text-lg font-black uppercase tracking-tighter">Total Due</span>
                        <span className="text-2xl font-black text-blue-900">₦{data.balance.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Banking Instructions */}
            <div className="bg-zinc-900 text-white p-8 rounded-2xl flex justify-between items-center group">
                <div>
                    <p className="text-[10px] uppercase font-black text-blue-300 tracking-[0.2em] mb-3">Bank Transfer Details</p>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                        <div>
                            <p className="text-[8px] uppercase font-bold opacity-50">Bank Name</p>
                            <p className="text-sm font-bold">Zenith Bank PLC</p>
                        </div>
                        <div>
                            <p className="text-[8px] uppercase font-bold opacity-50">Account Number</p>
                            <p className="text-sm font-mono font-bold tracking-widest text-blue-200">101 2233 445</p>
                        </div>
                        <div>
                            <p className="text-[8px] uppercase font-bold opacity-50">Account Holder</p>
                            <p className="text-sm font-bold">Ammar Bin Yasir School</p>
                        </div>
                    </div>
                </div>
                <div className="text-center">
                    <div className="h-12 w-12 border-4 border-blue-400 bg-blue-400/10 rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <ShieldCheck className="h-6 w-6 text-blue-400" />
                    </div>
                    <p className="text-[8px] uppercase font-black tracking-widest">Secure Billing</p>
                </div>
            </div>

            <div className="mt-8 text-center text-[10px] text-zinc-400 font-medium">
                Payments made after the due date may attract late processing fees. Please include the student ID in transfer remarks.
            </div>
        </div>
    )
}
