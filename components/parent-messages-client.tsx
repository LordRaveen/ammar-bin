"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Mail, Send, Inbox, MessageSquare, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

interface Student {
  id: string
  student_id: string
  name: string
  class: {
    id: string
    name: string
    class_teacher_id: string
    teachers: {
      id: string
      first_name: string
      last_name: string
      user_id: string
    }
  }
}

interface Message {
  id: string
  sender_id: string
  recipient_id: string
  subject: string
  message: string
  parent_message_id: string | null
  student_id: string | null
  is_read: boolean
  created_at: string
  sender: { email: string }
  recipient: { email: string }
  students: { first_name: string; last_name: string } | null
}

interface Props {
  guardianUserId: string
  students: Student[]
  initialMessages: Message[]
  unreadCount: number
}

export default function ParentMessagesClient({ guardianUserId, students, initialMessages, unreadCount }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [unread, setUnread] = useState(unreadCount)
  const [view, setView] = useState<"inbox" | "compose" | "thread">("inbox")
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)

  // Compose form state
  const [selectedStudent, setSelectedStudent] = useState("")
  const [subject, setSubject] = useState("")
  const [messageBody, setMessageBody] = useState("")
  const [isSending, setIsSending] = useState(false)

  const inboxMessages = messages.filter((m) => m.recipient_id === guardianUserId)
  const sentMessages = messages.filter((m) => m.sender_id === guardianUserId)

  const handleComposeMessage = async () => {
    if (!selectedStudent || !subject || !messageBody) {
      toast.error("Please fill all fields")
      return
    }

    setIsSending(true)

    const student = students.find((s) => s.id === selectedStudent)
    if (!student) {
      toast.error("Student not found")
      setIsSending(false)
      return
    }

    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_id: student.class.teachers.user_id,
          subject,
          message: messageBody,
          student_id: selectedStudent,
        }),
      })

      if (!response.ok) throw new Error("Failed to send message")

      toast.success("Message sent successfully")
      setSelectedStudent("")
      setSubject("")
      setMessageBody("")
      setView("inbox")

      // Refresh messages
      window.location.reload()
    } catch (error) {
      toast.error("Failed to send message")
    } finally {
      setIsSending(false)
    }
  }

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await fetch("/api/messages/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_id: messageId }),
      })

      setMessages(messages.map((m) => (m.id === messageId ? { ...m, is_read: true } : m)))
      setUnread(Math.max(0, unread - 1))
    } catch (error) {
      console.error("Failed to mark as read")
    }
  }

  const handleReply = (message: Message) => {
    setSelectedMessage(message)
    setSelectedStudent(message.student_id || "")
    setSubject(`Re: ${message.subject}`)
    setView("compose")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground">Communicate with your children's teachers</p>
        </div>
        {view !== "compose" && (
          <Button onClick={() => setView("compose")}>
            <Send className="h-4 w-4 mr-2" />
            New Message
          </Button>
        )}
      </div>

      {view === "compose" ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Compose Message</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setView("inbox")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Inbox
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Child</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select which child this is about" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} ({student.class.name}) - Teacher: {student.class.teachers.first_name}{" "}
                      {student.class.teachers.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Input placeholder="Enter message subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Type your message here..."
                rows={8}
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
              />
            </div>

            <Button onClick={handleComposeMessage} disabled={isSending} className="w-full">
              {isSending ? "Sending..." : "Send Message"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="inbox">
          <TabsList>
            <TabsTrigger value="inbox">
              <Inbox className="h-4 w-4 mr-2" />
              Inbox {unread > 0 && <Badge className="ml-2">{unread}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="sent">
              <Send className="h-4 w-4 mr-2" />
              Sent
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="space-y-2">
            {inboxMessages.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No messages in your inbox</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              inboxMessages.map((message) => (
                <Card
                  key={message.id}
                  className={`cursor-pointer hover:bg-muted/50 ${!message.is_read ? "border-l-4 border-l-primary" : ""}`}
                  onClick={() => {
                    setSelectedMessage(message)
                    setView("thread")
                    if (!message.is_read) {
                      handleMarkAsRead(message.id)
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-medium ${!message.is_read ? "font-bold" : ""}`}>{message.subject}</h4>
                          {!message.is_read && <Badge variant="default">New</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          From: {message.sender.email}
                          {message.students && ` - About: ${message.students.first_name} ${message.students.last_name}`}
                        </p>
                        <p className="text-sm mt-1 line-clamp-1">{message.message}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-2">
            {sentMessages.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>You haven't sent any messages yet</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              sentMessages.map((message) => (
                <Card key={message.id} className="cursor-pointer hover:bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{message.subject}</h4>
                        <p className="text-sm text-muted-foreground">
                          To: {message.recipient.email}
                          {message.students && ` - About: ${message.students.first_name} ${message.students.last_name}`}
                        </p>
                        <p className="text-sm mt-1 line-clamp-1">{message.message}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      {view === "thread" && selectedMessage && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedMessage.subject}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setView("inbox")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Inbox
              </Button>
            </div>
            <CardDescription>
              From: {selectedMessage.sender.email} - {new Date(selectedMessage.created_at).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="whitespace-pre-wrap">{selectedMessage.message}</div>
            <Button onClick={() => handleReply(selectedMessage)}>
              <Send className="h-4 w-4 mr-2" />
              Reply
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
