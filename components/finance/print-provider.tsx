"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { OfficialReceipt } from "./print/official-receipt"
import { OfficialInvoice } from "./print/official-invoice"
import { StudentResultTerminal } from "./print/student-result"
import { Button } from "@/components/ui/button"
import { Printer, X, Download } from "lucide-react"

type PrintTemplate = "receipt" | "invoice" | "result"

interface PrintContextType {
    print: (template: PrintTemplate, data: any) => void
}

const PrintContext = createContext<PrintContextType | undefined>(undefined)

export function PrintProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    const [template, setTemplate] = useState<PrintTemplate | null>(null)
    const [printData, setPrintData] = useState<any>(null)

    const print = (template: PrintTemplate, data: any) => {
        setTemplate(template)
        setPrintData(data)
        setIsOpen(true)
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <PrintContext.Provider value={{ print }}>
            {children}

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-[950px] max-h-[90vh] overflow-y-auto p-0 border-none bg-zinc-100 rounded-3xl overflow-hidden shadow-2xl">
                    {/* Internal Toolbar (Floating in Preview, hidden in print) */}
                    <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between print:hidden">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-blue-900 rounded-lg flex items-center justify-center text-white">
                                <Printer className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-zinc-900 uppercase tracking-tighter">Document Preview</h3>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-none">Template: {template}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="h-9 gap-2 rounded-xl font-bold bg-white" onClick={() => setIsOpen(false)}>
                                <X className="h-4 w-4" /> Close
                            </Button>
                            <Button size="sm" className="h-9 gap-2 rounded-xl font-bold bg-blue-900 hover:bg-blue-800" onClick={handlePrint}>
                                <Printer className="h-4 w-4" /> Print Document
                            </Button>
                        </div>
                    </div>

                    {/* Document Content Area */}
                    <div className="p-8 sm:p-12 print:p-0 bg-white min-h-[1000px] shadow-sm m-4 sm:m-8 rounded-2xl print:m-0 print:rounded-none">
                        {template === "receipt" && printData && <OfficialReceipt data={printData} />}
                        {template === "invoice" && printData && <OfficialInvoice data={printData} />}
                        {template === "result" && printData && <StudentResultTerminal data={printData} />}
                    </div>

                    {/* Global Print Styles */}
                    <style jsx global>{`
            @media print {
              body * {
                visibility: hidden;
              }
              .no-print {
                display: none !important;
              }
              #print-root, #print-root * {
                visibility: visible;
              }
              /* Hide everything EXCEPT the modal content */
              div[role="dialog"] {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 0;
                border: none !important;
                background: white !important;
                transform: none !important;
                max-height: none !important;
                visibility: visible !important;
              }
              div[role="dialog"] > button[type="button"] {
                 display: none !important; /* hide default close button */
              }
              .DialogContent {
                 box-shadow: none !important;
              }
            }
          `}</style>
                </DialogContent>
            </Dialog>
        </PrintContext.Provider>
    )
}

export function usePrint() {
    const context = useContext(PrintContext)
    if (!context) {
        throw new Error("usePrint must be used within a PrintProvider")
    }
    return context
}
