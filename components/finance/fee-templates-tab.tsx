"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Plus, Search, Edit2, Copy, Trash2, MoreVertical, FileText, Loader2, Save, X } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface TemplateItem {
    id?: string
    fee_category_id: string
    amount: number
    fee_categories?: {
        name: string
    }
}

interface Template {
    id: string
    name: string
    description: string
    is_active: boolean
    fee_template_items: TemplateItem[]
    updated_at: string
}

interface FeeCategory {
    id: string
    name: string
}

export function FeeTemplatesTab() {
    const [templates, setTemplates] = useState<Template[]>([])
    const [categories, setCategories] = useState<FeeCategory[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    // Create/Edit Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [currentTemplate, setCurrentTemplate] = useState<Partial<Template> | null>(null)
    const [templateItems, setTemplateItems] = useState<{ fee_category_id: string, amount: number }[]>([])

    // Apply Templates State
    const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false)
    const [sessions, setSessions] = useState<any[]>([])
    const [terms, setTerms] = useState<any[]>([])
    const [classes, setClasses] = useState<any[]>([])
    const [applyConfig, setApplyConfig] = useState({ sessionId: "", termId: "", classId: "" })
    const [isApplying, setIsApplying] = useState(false)

    const supabase = createClient()

    const fetchTemplates = useCallback(async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from("fee_templates")
                .select(`
                    *,
                    fee_template_items (
                        id,
                        fee_category_id,
                        amount,
                        fee_categories (
                            name
                        )
                    )
                `)
                .order("name")

            if (error) throw error
            setTemplates(data || [])
        } catch (error: any) {
            toast.error("Failed to fetch templates: " + error.message)
        } finally {
            setIsLoading(false)
        }
    }, [supabase])

    const fetchCategories = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from("fee_categories")
                .select("id, name")
                .eq("is_active", true)
                .order("name")

            if (error) throw error
            setCategories(data || [])
        } catch (error: any) {
            console.error(error)
        }
    }, [supabase])

    const fetchConfigData = useCallback(async () => {
        try {
            const [sRes, cRes] = await Promise.all([
                supabase.from("sessions").select("*").order("name", { ascending: false }),
                supabase.from("classes").select("*, section:section_id(name)").eq("is_active", true).order("name")
            ])
            setSessions(sRes.data || [])
            setClasses(cRes.data || [])
        } catch (error) {
            console.error(error)
        }
    }, [supabase])

    const fetchTermsForSession = async (sessionId: string) => {
        const { data } = await supabase.from("terms").select("*").eq("session_id", sessionId).order("term_number")
        setTerms(data || [])
    }

    useEffect(() => {
        fetchTemplates()
        fetchCategories()
        fetchConfigData()
    }, [fetchTemplates, fetchCategories, fetchConfigData])

    const handleCreateNew = () => {
        setCurrentTemplate({ name: "", description: "" })
        setTemplateItems([])
        setIsDialogOpen(true)
    }

    const handleEdit = (template: Template) => {
        setCurrentTemplate(template)
        setTemplateItems(template.fee_template_items.map(item => ({
            fee_category_id: item.fee_category_id,
            amount: item.amount
        })))
        setIsDialogOpen(true)
    }

    const handleApplyClick = (template: Template) => {
        setCurrentTemplate(template)
        setIsApplyDialogOpen(true)
    }

    const handleApplySubmit = async () => {
        if (!applyConfig.sessionId || !applyConfig.termId || !applyConfig.classId || !currentTemplate) {
            toast.error("Please select session, term, and class")
            return
        }

        setIsApplying(true)
        try {
            const items = (currentTemplate as Template).fee_template_items.map(item => ({
                session_id: applyConfig.sessionId,
                term_id: applyConfig.termId,
                class_id: applyConfig.classId,
                fee_category_id: item.fee_category_id,
                amount: item.amount,
                active: true,
                gender_specific: "Both"
            }))

            const { error } = await supabase.from("fee_structures").insert(items)
            if (error) throw error

            toast.success("Template applied to class successfully")
            setIsApplyDialogOpen(false)
        } catch (error: any) {
            toast.error("Application failed: " + error.message)
        } finally {
            setIsApplying(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this template?")) return

        try {
            const { error } = await supabase.from("fee_templates").delete().eq("id", id)
            if (error) throw error
            toast.success("Template deleted")
            fetchTemplates()
        } catch (error: any) {
            toast.error("Delete failed: " + error.message)
        }
    }

    const addItemRow = () => {
        setTemplateItems([...templateItems, { fee_category_id: "", amount: 0 }])
    }

    const removeItemRow = (index: number) => {
        setTemplateItems(templateItems.filter((_, i) => i !== index))
    }

    const updateItemRow = (index: number, field: string, value: any) => {
        const newItems = [...templateItems]
        newItems[index] = { ...newItems[index], [field]: value }
        setTemplateItems(newItems)
    }

    const handleSubmit = async () => {
        if (!currentTemplate?.name) {
            toast.error("Template name is required")
            return
        }

        if (templateItems.length === 0) {
            toast.error("Add at least one fee item")
            return
        }

        setIsSubmitting(true)
        try {
            let templateId = currentTemplate.id

            if (templateId) {
                // Update Template
                const { error: tError } = await supabase
                    .from("fee_templates")
                    .update({
                        name: currentTemplate.name,
                        description: currentTemplate.description,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", templateId)

                if (tError) throw tError

                // Clear and recreate items (simple approach)
                await supabase.from("fee_template_items").delete().eq("template_id", templateId)
            } else {
                // Create Template
                const { data, error: tError } = await supabase
                    .from("fee_templates")
                    .insert({
                        name: currentTemplate.name,
                        description: currentTemplate.description
                    })
                    .select()
                    .single()

                if (tError) throw tError
                templateId = data.id
            }

            // Insert Items
            const itemsToInsert = templateItems.map(item => ({
                template_id: templateId,
                fee_category_id: item.fee_category_id,
                amount: item.amount
            }))

            const { error: iError } = await supabase
                .from("fee_template_items")
                .insert(itemsToInsert)

            if (iError) throw iError

            toast.success(currentTemplate.id ? "Template updated" : "Template created")
            setIsDialogOpen(false)
            fetchTemplates()
        } catch (error: any) {
            toast.error("Save failed: " + error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6 pt-4">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="relative w-full sm:w-[350px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search templates..."
                        className="pl-9 bg-white dark:bg-slate-950 border shadow-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button onClick={handleCreateNew} className="gap-2 bg-slate-900 border-none hover:bg-black font-bold">
                    <Plus className="h-4 w-4" />
                    Create Template
                </Button>
            </div>

            {/* Templates Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.map((template) => {
                        const total = template.fee_template_items.reduce((sum, item) => sum + Number(item.amount), 0)
                        return (
                            <Card key={template.id} className="gap-0 group border border-zinc-200/80 dark:border-zinc-800/80 shadow-none hover:border-zinc-400 dark:hover:border-zinc-700 transition-all cursor-default bg-white dark:bg-zinc-950 overflow-hidden relative rounded-2xl">
                                <div className="absolute top-0 left-0 w-1 h-full bg-zinc-200 group-hover:bg-zinc-900 dark:bg-zinc-850 dark:group-hover:bg-zinc-100 transition-colors" />
                                <CardHeader className="pb-3 px-5">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <CardTitle className="text-base font-bold dark:text-slate-200 tracking-tight">{template.name}</CardTitle>
                                            <CardDescription className="line-clamp-1 text-[11px] font-medium italic">
                                                {template.description || "No description provided"}
                                            </CardDescription>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2 text-muted-foreground hover:text-foreground">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40 font-bold">
                                                <DropdownMenuItem onClick={() => handleEdit(template)} className="text-xs uppercase cursor-pointer">
                                                    <Edit2 className="h-3.5 w-3.5 mr-2" />
                                                    Edit Template
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleApplyClick(template)} className="text-xs uppercase cursor-pointer text-emerald-600">
                                                    <Copy className="h-3.5 w-3.5 mr-2" />
                                                    Apply to Class
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(template.id)} className="text-xs uppercase text-red-600 cursor-pointer">
                                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-0 px-5">
                                    <div className="space-y-2 mb-5 h-[80px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                                        {template.fee_template_items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-[10px] font-semibold">
                                                <span className="text-muted-foreground uppercase">{item.fee_categories?.name}</span>
                                                <span className="font-mono bg-zinc-50 dark:bg-zinc-900 px-1.5 py-0.5 rounded">₦{Number(item.amount).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 py-2 mt-0">
                                        <div className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                                            ₦{total.toLocaleString()}
                                        </div>
                                        <Badge variant="outline" className="text-[9px] font-bold uppercase py-0 px-2 tracking-widest border-zinc-200 dark:border-zinc-850 h-5">
                                            {template.fee_template_items.length} Component{template.fee_template_items.length !== 1 ? 's' : ''}
                                        </Badge>
                                    </div>
                                </CardContent>
                                <CardFooter className="py-2.5 px-5 bg-zinc-50/50 dark:bg-zinc-900/40 text-[9px] text-muted-foreground uppercase font-bold tracking-widest border-t border-zinc-200/50 dark:border-zinc-800/50">
                                    Last Updated: {new Date(template.updated_at).toLocaleDateString()}
                                </CardFooter>
                            </Card>
                        )
                    })}

                    <button
                        onClick={handleCreateNew}
                        className="flex flex-col items-center justify-center h-full min-h-[220px] border-2 border-dashed rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30 hover:border-slate-400 dark:hover:border-slate-700 hover:bg-slate-100/50 dark:hover:bg-slate-900/50 transition-all gap-3 group"
                    >
                        <div className="h-12 w-12 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus className="h-6 w-6 text-slate-500" />
                        </div>
                        <div className="text-center">
                            <span className="block font-black text-xs uppercase tracking-widest text-slate-500">Add New</span>
                            <span className="text-[10px] font-medium text-slate-400 italic">Predefined Fee Bundle</span>
                        </div>
                    </button>
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px] border dark:border-slate-800 dark:bg-slate-950">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                            {currentTemplate?.id ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                            {currentTemplate?.id ? "Edit Template" : "New Fee Template"}
                        </DialogTitle>
                        <DialogDescription className="text-xs font-medium italic">
                            Define a reusable bundle of fees that can be applied to students or classes.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest">Template Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Standard Primary 1 Fees"
                                className="h-10 text-sm font-semibold dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                value={currentTemplate?.name || ""}
                                onChange={(e) => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-xs font-bold uppercase tracking-widest">Description (Optional)</Label>
                            <Input
                                id="description"
                                placeholder="What is this bundle for?"
                                className="h-10 text-sm font-semibold dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                value={currentTemplate?.description || ""}
                                onChange={(e) => setCurrentTemplate({ ...currentTemplate, description: e.target.value })}
                            />
                        </div>

                        <div className="pt-4 border-t dark:border-slate-800">
                            <div className="flex justify-between items-center mb-4">
                                <Label className="text-xs font-black uppercase tracking-widest border-l-4 border-slate-900 dark:border-slate-400 pl-2">Fee Components</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addItemRow}
                                    className="h-7 text-[10px] font-bold uppercase border-slate-200 dark:border-slate-800"
                                >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add Fee
                                </Button>
                            </div>

                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                {templateItems.map((item, index) => (
                                    <div key={index} className="flex gap-2 items-end group">
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-[9px] font-bold text-muted-foreground uppercase ml-1">Category</Label>
                                            <Select
                                                value={item.fee_category_id}
                                                onValueChange={(val) => updateItemRow(index, 'fee_category_id', val)}
                                            >
                                                <SelectTrigger className="h-9 text-xs font-semibold dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                                                    <SelectValue placeholder="Select Fee" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map((cat) => (
                                                        <SelectItem key={cat.id} value={cat.id} className="text-xs">
                                                            {cat.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-[120px] space-y-1">
                                            <Label className="text-[9px] font-bold text-muted-foreground uppercase ml-1">Amount (₦)</Label>
                                            <Input
                                                type="number"
                                                className="h-9 text-xs font-mono font-bold dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                                                value={item.amount}
                                                onChange={(e) => updateItemRow(index, 'amount', Number(e.target.value))}
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeItemRow(index)}
                                            className="h-9 w-9 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {templateItems.length === 0 && (
                                    <div className="text-center py-8 border-2 border-dashed rounded-lg dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">No items added yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center px-1 pt-4 border-t dark:border-slate-800">
                        <div className="text-sm font-black font-mono text-emerald-600">
                            Total: ₦{templateItems.reduce((s, i) => s + (i.amount || 0), 0).toLocaleString()}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-9 text-xs font-bold uppercase px-6 border-slate-200 dark:border-slate-800">
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="h-9 text-xs font-bold uppercase px-6 bg-slate-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-slate-200"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-3 w-3 mr-2" />
                                        Save Template
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Apply Template Dialog */}
            <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
                <DialogContent className="sm:max-w-[400px] border dark:border-slate-800 dark:bg-slate-950">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-emerald-600">
                            <Copy className="h-5 w-5" />
                            Apply Template
                        </DialogTitle>
                        <DialogDescription className="text-xs font-medium italic">
                            Select the target class and period for <strong>{currentTemplate?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest">Target Session</Label>
                            <Select
                                value={applyConfig.sessionId}
                                onValueChange={(val) => {
                                    setApplyConfig({ ...applyConfig, sessionId: val, termId: "" });
                                    fetchTermsForSession(val);
                                }}
                            >
                                <SelectTrigger className="h-10 text-xs font-semibold dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                    <SelectValue placeholder="Select Session" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest">Target Term</Label>
                            <Select
                                value={applyConfig.termId}
                                onValueChange={(val) => setApplyConfig({ ...applyConfig, termId: val })}
                                disabled={!applyConfig.sessionId}
                            >
                                <SelectTrigger className="h-10 text-xs font-semibold dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                    <SelectValue placeholder="Select Term" />
                                </SelectTrigger>
                                <SelectContent>
                                    {terms.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest">Target Class</Label>
                            <Select
                                value={applyConfig.classId}
                                onValueChange={(val) => setApplyConfig({ ...applyConfig, classId: val })}
                            >
                                <SelectTrigger className="h-10 text-xs font-semibold dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                    <SelectValue placeholder="Select Class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name} {c.section?.name ? `- ${c.section.name}` : ''}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="border-t dark:border-slate-800 pt-4 mt-2">
                        <Button variant="outline" onClick={() => setIsApplyDialogOpen(false)} className="h-9 text-xs font-bold uppercase border-slate-200 dark:border-slate-800">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleApplySubmit}
                            disabled={isApplying}
                            className="h-9 text-xs font-bold uppercase bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {isApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Apply"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
