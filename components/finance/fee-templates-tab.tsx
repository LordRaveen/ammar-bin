"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit2, Copy, Trash2, MoreVertical, FileText } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock data for now
const mockTemplates = [
    {
        id: "1",
        name: "Standard Primary Fees",
        description: "Default structure for Primary 1-6",
        totalAmount: 125000,
        items: 4,
        tags: ["Primary", "Standard"],
        updatedAt: "2 days ago"
    },
    {
        id: "2",
        name: "Tahfeez Scholarship",
        description: "Discounted structure for Tahfeez program",
        totalAmount: 45000,
        items: 3,
        tags: ["Tahfeez", "Scholarship"],
        updatedAt: "1 week ago"
    },
    {
        id: "3",
        name: "New Recruit Starter",
        description: "Includes admission, uniform, and books",
        totalAmount: 180000,
        items: 6,
        tags: ["New Students"],
        updatedAt: "1 day ago"
    }
]

export function FeeTemplatesTab() {
    const [searchTerm, setSearchTerm] = useState("")

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="relative w-full sm:w-[300px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search templates..."
                        className="pl-9 bg-background"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Template
                </Button>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockTemplates.map((template) => (
                    <Card key={template.id} className="group hover:border-primary/50 transition-all cursor-pointer">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg">{template.name}</CardTitle>
                                    <CardDescription className="line-clamp-1">{template.description}</CardDescription>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>
                                            <Edit2 className="h-4 w-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Copy className="h-4 w-4 mr-2" />
                                            Duplicate
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent className="pb-3">
                            <div className="flex items-center gap-2 mb-4">
                                {template.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs font-normal bg-muted">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                            <div className="flex items-baseline justify-between">
                                <div className="text-2xl font-bold font-mono">
                                    ₦{template.totalAmount.toLocaleString()}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    {template.items} items
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-0 text-xs text-muted-foreground">
                            Updated {template.updatedAt}
                        </CardFooter>
                    </Card>
                ))}

                {/* Empty State / Add New Card */}
                <button className="flex flex-col items-center justify-center h-full min-h-[180px] border-2 border-dashed rounded-xl border-muted hover:border-primary/50 hover:bg-muted/50 transition-colors gap-2 text-muted-foreground hover:text-foreground">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Plus className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-sm">Create New Template</span>
                </button>
            </div>
        </div>
    )
}
