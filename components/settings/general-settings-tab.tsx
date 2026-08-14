"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { updateSchoolSettings } from "@/app/(dashboard)/settings/school/actions"
import { useFormStatus } from "react-dom"
import { UploadCloud, Image as ImageIcon, X, Link as LinkIcon, Loader2, PenTool } from "lucide-react"
import { toast } from "sonner"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="font-bold">
      {pending ? "Saving Changes..." : "Save Changes"}
    </Button>
  )
}

export function GeneralSettingsTab({ settings }: { settings: any }) {
  const [logoUrl, setLogoUrl] = useState<string>(settings?.logo_url || "")
  const [signatureUrl, setSignatureUrl] = useState<string>(settings?.principal_signature_url || "")
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isUploadingSig, setIsUploadingSig] = useState(false)
  const [isDraggingSig, setIsDraggingSig] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sigFileInputRef = useRef<HTMLInputElement>(null)

  const compressImage = (file: File, maxWidth: number, maxHeight: number, quality: number = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.src = e.target?.result as string
        img.onload = () => {
          let width = img.width
          let height = img.height

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }

          const canvas = document.createElement("canvas")
          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext("2d")
          if (!ctx) {
            resolve(e.target?.result as string)
            return
          }

          ctx.drawImage(img, 0, 0, width, height)
          const mimeType = file.type === "image/png" || file.type === "image/svg+xml" ? "image/png" : "image/jpeg"
          resolve(canvas.toDataURL(mimeType, quality))
        }
        img.onerror = (err) => reject(err)
      }
      reader.onerror = (err) => reject(err)
      reader.readAsDataURL(file)
    })
  }

  const handleSignatureFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid File", { description: "Please upload an image file (PNG, JPG, SVG, WebP)." })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File Too Large", { description: "Signature image must be under 10MB." })
      return
    }
    setIsUploadingSig(true)
    try {
      const compressed = await compressImage(file, 600, 300, 0.85)
      setSignatureUrl(compressed)
      toast.success("Signature Uploaded!", { description: "Remember to click 'Save Changes' to update." })
    } catch {
      toast.error("Upload Failed", { description: "Could not process signature image." })
    } finally {
      setIsUploadingSig(false)
    }
  }

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid File", { description: "Please upload an image file (PNG, JPG, SVG, WebP)." })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File Too Large", { description: "Logo image must be under 10MB." })
      return
    }

    setIsUploading(true)
    try {
      const compressed = await compressImage(file, 600, 600, 0.85)
      setLogoUrl(compressed)
      toast.success("Logo Uploaded!", { description: "Remember to click 'Save Changes' to update." })
    } catch {
      toast.error("Upload Failed", { description: "Could not process logo image." })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleFormSubmit = async (formData: FormData) => {
    try {
      const result = await updateSchoolSettings(formData)
      if (result && result.success === false) {
        toast.error("Save Failed", { description: result.error || "Failed to update school settings." })
      } else {
        toast.success("Settings Saved!", { description: "School settings have been updated successfully." })
      }
    } catch (err: any) {
      toast.error("Error Saving Settings", { description: err?.message || "An unexpected error occurred." })
    }
  }

  return (
    <Card className="border-0 shadow-xs">
      <CardHeader>
        <CardTitle>School Information & Branding</CardTitle>
        <CardDescription>Update your school crest logo, basic details, and contact information</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleFormSubmit} className="space-y-6">
          <input type="hidden" name="id" value={settings?.id || ""} />
          <input type="hidden" name="logo_url" value={logoUrl} />
          <input type="hidden" name="principal_signature_url" value={signatureUrl} />

          {/* Section 1: Logo & Basic Info */}
          <div className="grid gap-6 md:grid-cols-12 items-start">
            {/* Logo Drag & Drop Box (5 cols) */}
            <div className="md:col-span-5 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">School Logo Crest</Label>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  <LinkIcon className="h-3 w-3" />
                  {showUrlInput ? "Use File Upload" : "Paste URL Link"}
                </button>
              </div>

              {showUrlInput ? (
                <div className="space-y-2">
                  <Input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="text-xs"
                  />
                  {logoUrl && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                      <img src={logoUrl} alt="Logo Preview" className="h-12 w-12 object-contain rounded" />
                      <span className="text-xs text-muted-foreground truncate flex-1">{logoUrl}</span>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setLogoUrl("")}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer text-center min-h-[160px] ${
                    isDragging
                      ? "border-primary bg-primary/5 scale-[1.01]"
                      : logoUrl
                      ? "border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30"
                      : "border-zinc-300 dark:border-zinc-800 hover:border-primary/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFile(e.target.files[0])
                      }
                    }}
                  />

                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-xs text-muted-foreground font-medium">Processing logo image...</p>
                    </div>
                  ) : logoUrl ? (
                    <div className="flex flex-col items-center gap-3 py-2">
                      <div className="relative group">
                        <img src={logoUrl} alt="School Logo" className="h-20 w-20 object-contain rounded-md shadow-xs bg-white p-1 border" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setLogoUrl("")
                          }}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground p-1 rounded-full shadow-md hover:scale-110 transition-transform"
                          title="Remove Logo"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-xs font-semibold text-primary">Click or drag image here to replace logo</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-3">
                      <div className="p-3 rounded-full bg-primary/10 text-primary">
                        <UploadCloud className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Drag & drop school logo here</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">or click to browse from device (PNG, JPG, SVG)</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* School Name (English & Arabic) (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="school_name">School Name (English)</Label>
                <Input id="school_name" name="school_name" defaultValue={settings?.school_name} required className="font-medium" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="school_name_arabic">School Name (Arabic)</Label>
                <Input
                  id="school_name_arabic"
                  name="school_name_arabic"
                  defaultValue={settings?.school_name_arabic}
                  dir="rtl"
                  className="font-medium text-right"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Section 1b: Principal Information & Signature Upload */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Principal Information & Signature</h4>
            <div className="grid gap-6 md:grid-cols-12 items-start">
              <div className="md:col-span-5 space-y-2">
                <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Signature Image</Label>
                <div
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDraggingSig(false)
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleSignatureFile(e.dataTransfer.files[0])
                    }
                  }}
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingSig(true) }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDraggingSig(false) }}
                  onClick={() => sigFileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer text-center min-h-[120px] ${
                    isDraggingSig
                      ? "border-primary bg-primary/5 scale-[1.01]"
                      : signatureUrl
                      ? "border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30"
                      : "border-zinc-300 dark:border-zinc-800 hover:border-primary/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  }`}
                >
                  <input
                    ref={sigFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleSignatureFile(e.target.files[0])
                      }
                    }}
                  />

                  {isUploadingSig ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-xs text-muted-foreground font-medium">Processing signature image...</p>
                    </div>
                  ) : signatureUrl ? (
                    <div className="flex flex-col items-center gap-3 py-2">
                      <div className="relative group">
                        <img src={signatureUrl} alt="Principal Signature" className="h-16 w-auto max-w-[200px] object-contain rounded-md shadow-xs bg-white p-1 border" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSignatureUrl("")
                          }}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground p-1 rounded-full shadow-md hover:scale-110 transition-transform"
                          title="Remove Signature"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-xs font-semibold text-primary">Click or drag to replace signature</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-3">
                      <div className="p-3 rounded-full bg-primary/10 text-primary">
                        <PenTool className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Upload principal&apos;s signature</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Drag &amp; drop or click to browse (PNG, JPG)</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-7 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="principal_name">Principal / School Head Name</Label>
                  <Input
                    id="principal_name"
                    name="principal_name"
                    defaultValue={settings?.principal_name || ""}
                    placeholder="e.g. Dr. Ammar Bin Yasir"
                    className="font-medium"
                  />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Upload an image of the principal&apos;s signature. This will appear on the printed result sheet below the principal&apos;s remark.
                  For best results, use a transparent PNG with a clear signature on white background.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Section 2: Contact Information */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Contact Information</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" defaultValue={settings?.address} />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="phone_primary">Primary Phone</Label>
                  <Input id="phone_primary" name="phone_primary" defaultValue={settings?.phone_primary} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_secondary">Secondary Phone</Label>
                  <Input id="phone_secondary" name="phone_secondary" defaultValue={settings?.phone_secondary} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={settings?.email} />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Section 3: System Configuration */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">System Configuration</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="student_id_prefix">Student ID Prefix</Label>
                <Input
                  id="student_id_prefix"
                  name="student_id_prefix"
                  defaultValue={settings?.student_id_prefix}
                  placeholder="ISM"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff_id_prefix">Staff ID Prefix</Label>
                <Input
                  id="staff_id_prefix"
                  name="staff_id_prefix"
                  defaultValue={settings?.staff_id_prefix}
                  placeholder="STAFF"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="number_of_terms">Number of Terms</Label>
                <Input
                  id="number_of_terms"
                  name="number_of_terms"
                  type="number"
                  min="1"
                  max="3"
                  defaultValue={settings?.number_of_terms}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <SubmitButton />
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
