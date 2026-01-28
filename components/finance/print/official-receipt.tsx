"use client"

import { Receipt, User, Calendar, CreditCard, Building2, MapPin, Phone, Mail } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface OfficialReceiptProps {
    data: {
        receipt_number: string
        payment_date: string
        student_name: string
        student_id: string
        class_name: string
        amount: number
        payment_method: string
        reference_number?: string
        received_by: string
        allocations: any[]
        metadata?: any
    }
}

export function OfficialReceipt({ data }: OfficialReceiptProps) {
    const schoolInfo = {
        name: "AMMAR BIN YASIR INSTITUTE",
        nameArabic: "معهد عمار بن ياسر",
        address: "123 School Street, Abuja, Nigeria",
        phone: "+234 800 000 0000",
        email: "info@ammarbinyasir.com",
    }

    return (
        <div className="bg-white p-8 max-w-[800px] mx-auto text-zinc-900 font-sans print:p-0">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-blue-900 tracking-tight">{schoolInfo.name}</h1>
                    <p className="text-xl font-arabic text-zinc-600 font-medium text-right lg:text-left">{schoolInfo.nameArabic}</p>
                    <div className="flex flex-col gap-1 text-xs text-zinc-500 mt-2">
                        <div className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3" />
                            <span>{schoolInfo.address}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3" />
                            <span>{schoolInfo.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Mail className="h-3 w-3" />
                            <span>{schoolInfo.email}</span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="bg-blue-900 text-white px-4 py-2 rounded-lg inline-block mb-2">
                        <p className="text-[10px] uppercase font-bold tracking-widest opacity-80 text-center">Receipt Number</p>
                        <p className="text-lg font-mono font-bold">{data.receipt_number}</p>
                    </div>
                    <p className="text-xs text-zinc-400 font-mono">{new Date(data.payment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
            </div>

            <div className="bg-zinc-100/50 rounded-xl p-6 border border-zinc-200 mb-8">
                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div>
                            <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">Payer Details</p>
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-zinc-400" />
                                <p className="font-bold text-zinc-900">{data.student_name}</p>
                            </div>
                            <p className="text-xs text-zinc-500 ml-6">ID: {data.student_id} • {data.class_name}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">Payment Method</p>
                            <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-zinc-400" />
                                <Badge variant="outline" className="capitalize text-zinc-700 font-bold border-zinc-300">
                                    {data.payment_method}
                                </Badge>
                            </div>
                            {data.reference_number && (
                                <p className="text-[10px] text-zinc-500 font-mono mt-1 ml-6 uppercase">REF: {data.reference_number}</p>
                            )}
                        </div>
                    </div>
                    <div className="text-right border-l border-zinc-200 pl-8">
                        <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-2">Total Amount Paid</p>
                        <p className="text-4xl font-black text-blue-900">₦{data.amount.toLocaleString()}</p>
                        <p className="text-[10px] text-zinc-500 italic mt-1 font-medium italic">
                            Words: {numberToWords(data.amount)} Naira Only
                        </p>
                    </div>
                </div>
            </div>

            {/* Breaking down allocations */}
            <table className="w-full mb-8">
                <thead>
                    <tr className="border-b-2 border-zinc-900">
                        <th className="text-left py-3 text-xs uppercase font-black tracking-widest text-zinc-400">Description</th>
                        <th className="text-right py-3 text-xs uppercase font-black tracking-widest text-zinc-400 w-[150px]">Amount Paid</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                    {data.allocations?.map((alloc, idx) => (
                        <tr key={idx}>
                            <td className="py-4">
                                <p className="text-sm font-bold text-zinc-800">
                                    {alloc.invoice_items?.fee_categories?.name || alloc.invoice_items?.description || "Tuition/Fee Payment"}
                                </p>
                                <p className="text-[10px] text-zinc-400">Student: {alloc.students?.first_name} {alloc.students?.last_name}</p>
                            </td>
                            <td className="py-4 text-right">
                                <p className="text-sm font-mono font-bold">₦{Number(alloc.amount).toLocaleString()}</p>
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="border-t-2 border-zinc-900 bg-zinc-50">
                        <td className="py-4 px-4 text-right text-xs uppercase font-bold">Grand Total</td>
                        <td className="py-4 text-right pr-4 text-lg font-black text-blue-900">₦{data.amount.toLocaleString()}</td>
                    </tr>
                </tfoot>
            </table>

            {/* Signatures */}
            <div className="mt-16 flex justify-between items-end">
                <div className="text-center w-[200px]">
                    <div className="border-b border-zinc-300 pb-2 mb-2 italic text-zinc-400 text-xs">
                        {data.received_by || "System Automated"}
                    </div>
                    <p className="text-[10px] uppercase font-black tracking-tighter text-zinc-400">School Accountant</p>
                </div>
                <div className="text-center w-[200px]">
                    <div className="border-b border-zinc-300 h-[30px] mb-2"></div>
                    <p className="text-[10px] uppercase font-black tracking-tighter text-zinc-400">Receiver's Signature</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <div className="h-16 w-16 border-2 border-blue-900/20 rounded-full flex items-center justify-center grayscale opacity-50">
                        <span className="text-[10px] font-black text-blue-900 border-2 border-blue-900 p-1 rounded transform -rotate-12 uppercase">School Stamp</span>
                    </div>
                </div>
            </div>

            <div className="mt-12 pt-8 border-t border-zinc-100 text-center">
                <p className="text-[10px] text-zinc-400 font-medium">Thank you for choosing Ammar Bin Yasir Institute. This is an official computer-generated receipt.</p>
                <p className="text-[10px] text-zinc-400 mt-1">Generated on {new Date().toLocaleString()}</p>
            </div>
        </div>
    )
}

function numberToWords(num: number): string {
    // Basic number to words for the receipt
    return num.toLocaleString() // Placeholder
}
