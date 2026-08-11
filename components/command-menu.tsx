"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    Smile,
    User,
    Users,
    Search,
    Plus,
    Home,
    DollarSign,
    GraduationCap,
    Bell,
    CheckCircle2,
    FileText
} from "lucide-react"

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"

import { globalSearch } from "@/app/(dashboard)/search-actions"
import { useDebounce } from "@/hooks/use-debounce" // Assuming this exists or I'll implement it

export function CommandMenu() {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState("")
    const [results, setResults] = React.useState<{ students: any[], guardians: any[] }>({ students: [], guardians: [] })
    const [isLoading, setIsLoading] = React.useState(false)
    const debouncedQuery = useDebounce(query, 300)
    const router = useRouter()

    React.useEffect(() => {
        if (!debouncedQuery || debouncedQuery.length < 2) {
            setResults({ students: [], guardians: [] })
            return
        }

        const fetchResults = async () => {
            setIsLoading(true)
            try {
                const data = await globalSearch(debouncedQuery)
                setResults(data)
            } finally {
                setIsLoading(false)
            }
        }

        fetchResults()
    }, [debouncedQuery])

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false)
        command()
    }, [])

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 sm:h-9 sm:w-auto sm:px-3 rounded-lg border bg-background/50 text-muted-foreground sm:border-0 sm:justify-start md:w-40 lg:w-64"
                onClick={() => setOpen(true)}
            >
                <Search className="h-4 w-4 flex-shrink-0" />
                <span className="hidden md:inline-flex text-xs ml-2 font-normal">Search actions...</span>
                <span className="hidden sm:inline-flex md:hidden text-xs ml-2 font-normal">Search...</span>
                <kbd className="pointer-events-none absolute font-mono right-[0.3rem] top-[0.5rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[9px] font-medium opacity-100 md:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>
            <CommandDialog open={open} onOpenChange={(val) => {
                setOpen(val)
                if (!val) setQuery("")
            }}>
                <CommandInput
                    placeholder="Type a command or search..."
                    value={query}
                    onValueChange={setQuery}
                />
                <CommandList>
                    <CommandEmpty>No results found for "{query}".</CommandEmpty>

                    {debouncedQuery.length >= 2 && (
                        <>
                            {isLoading && (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                    Searching...
                                </div>
                            )}

                            {results.students.length > 0 && (
                                <CommandGroup heading="Students Found">
                                    {results.students.map((student) => (
                                        <CommandItem
                                            key={student.id}
                                            onSelect={() => runCommand(() => router.push(`/students/${student.id}`))}
                                        >
                                            <User className="mr-2 h-4 w-4" />
                                            <span>{student.first_name} {student.last_name}</span>
                                            <CommandShortcut>{student.student_id}</CommandShortcut>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            {results.guardians.length > 0 && (
                                <CommandGroup heading="Guardians Found">
                                    {results.guardians.map((guardian) => (
                                        <CommandItem
                                            key={guardian.id}
                                            onSelect={() => runCommand(() => router.push(`/guardians/${guardian.id}`))}
                                        >
                                            <Users className="mr-2 h-4 w-4" />
                                            <span>{guardian.first_name} {guardian.last_name}</span>
                                            <CommandShortcut>{guardian.phone}</CommandShortcut>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            <CommandSeparator />
                        </>
                    )}

                    {!debouncedQuery && (
                        <>
                            <CommandGroup heading="Suggestions">
                                <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
                                    <Home className="mr-2 h-4 w-4" />
                                    <span>Dashboard</span>
                                </CommandItem>
                                <CommandItem onSelect={() => runCommand(() => router.push("/calendar"))}>
                                    <Calendar className="mr-2 h-4 w-4" />
                                    <span>Calendar</span>
                                </CommandItem>
                                <CommandItem onSelect={() => runCommand(() => router.push("/finance"))}>
                                    <DollarSign className="mr-2 h-4 w-4" />
                                    <span>Finance Center</span>
                                </CommandItem>
                            </CommandGroup>
                            <CommandSeparator />
                            <CommandGroup heading="Actions">
                                <CommandItem onSelect={() => runCommand(() => router.push("/students"))}>
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Register Student</span>
                                </CommandItem>
                                <CommandItem onSelect={() => runCommand(() => router.push("/finance?tab=collect"))}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    <span>Collect Payment</span>
                                </CommandItem>
                            </CommandGroup>
                        </>
                    )}

                    <CommandGroup heading="Academic">
                        <CommandItem onSelect={() => runCommand(() => router.push("/students"))}>
                            <Users className="mr-2 h-4 w-4" />
                            <span>View Students</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/teachers"))}>
                            <GraduationCap className="mr-2 h-4 w-4" />
                            <span>Manage Teachers</span>
                        </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Settings">
                        <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Profile Settings</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    )
}
