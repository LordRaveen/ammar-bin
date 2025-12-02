"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IconEdit, IconPlus } from "@tabler/icons-react"

export function GradingSystemTab({ gradingSchemes }: { gradingSchemes: any[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Grading Scheme</CardTitle>
            <CardDescription>Define grade ranges and their corresponding letter grades</CardDescription>
          </div>
          <Button size="sm">
            <IconPlus className="h-4 w-4 mr-1" />
            Add Grade
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {gradingSchemes.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No grading scheme defined. Add grades to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Grade</TableHead>
                <TableHead>Score Range</TableHead>
                <TableHead>Remark</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gradingSchemes.map((scheme) => (
                <TableRow key={scheme.id}>
                  <TableCell>
                    <Badge className="text-lg">{scheme.grade}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {scheme.min_score} - {scheme.max_score}%
                  </TableCell>
                  <TableCell className="text-muted-foreground">{scheme.remark}</TableCell>
                  <TableCell>
                    {scheme.is_active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <IconEdit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
