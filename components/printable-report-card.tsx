"use client"

import React from "react"

export interface PrintableReportCardProps {
  student: any
  session: any
  term: any
  result: any
  subjectScores: Record<string, any>
  school: any
  skills?: any[]
}

const DEFAULT_AFFECTIVE_SKILLS = [
  "Attentiveness",
  "Emotional Stability",
  "Honesty",
  "Neatness",
  "Perseverance",
  "Politeness",
  "Punctuality",
  "Relationship with Peers",
  "Response to Home Work",
]

const DEFAULT_PSYCHOMOTOR_SKILLS = [
  "Ablution",
  "Handwriting",
  "Prayer (Salat)",
  "Verbal Fluency",
]

const mapRatingToLetter = (rating: any) => {
  if (rating === 5 || rating === '5') return 'A'
  if (rating === 4 || rating === '4') return 'B'
  if (rating === 3 || rating === '3') return 'C'
  if (rating === 2 || rating === '2') return 'D'
  if (rating === 1 || rating === '1') return 'E'
  return rating || '—'
}

const getGradeFromScore = (score: number) => {
  if (score >= 95) return "A+"
  if (score >= 90) return "A"
  if (score >= 85) return "B+"
  if (score >= 80) return "B"
  if (score >= 75) return "C+"
  if (score >= 70) return "C"
  if (score >= 65) return "D+"
  if (score >= 60) return "D"
  if (score >= 50) return "E"
  return "F"
}

const getRemarkFromScore = (score: number) => {
  if (score >= 95) return "Outstanding"
  if (score >= 90) return "Excellent"
  if (score >= 85) return "Very Good"
  if (score >= 80) return "Good"
  if (score >= 75) return "Above Average"
  if (score >= 70) return "Average"
  if (score >= 65) return "Fair"
  if (score >= 60) return "Pass"
  if (score >= 50) return "Below Average"
  return "Fail"
}

export function PrintableReportCard({
  student,
  session,
  term,
  result,
  subjectScores,
  school,
  skills = [],
}: PrintableReportCardProps) {
  const studentFullName = `${student?.first_name || ""} ${student?.middle_name ? student.middle_name + " " : ""}${student?.last_name || ""}`.trim().toUpperCase()

  // Format Term Ends & Next Term Begins
  const termEndDate = term?.end_date
    ? new Date(term.end_date).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })
    : "—"

  const nextTermBegins = term?.resumption_date || term?.next_term_resumption_date
    ? new Date(term.resumption_date || term.next_term_resumption_date).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })
    : "—"

  // Process and group subjects if they contain a colon ':'
  interface GroupedSubject {
    subjName: string
    isGrouped: boolean
    subRows: {
      subName: string
      ca1: number | null
      ca2: number | null
      exam: number | null
      total: number
    }[]
    total: number
    grade: string
    classMin: number | null
    classMax: number | null
    classAvg: number | null
    remark: string
  }

  const groupedSubjects: Record<string, GroupedSubject> = {}

  Object.entries(subjectScores || {}).forEach(([fullSubjName, data]: [string, any]) => {
    let parentName = fullSubjName
    let subName = ""
    let hasSeparator = false

    if (fullSubjName.includes(":")) {
      const parts = fullSubjName.split(":")
      parentName = parts[0].trim()
      subName = parts[1].trim()
      hasSeparator = true
    }

    const caVal = data?.ca1 !== undefined && data?.ca1 !== null ? data.ca1 : null
    const ca2Val = data?.ca2 !== undefined && data?.ca2 !== null ? data.ca2 : null
    const examVal = data?.exam !== undefined && data?.exam !== null ? data.exam : null
    const totalVal = data?.total !== undefined ? data.total : ((caVal || 0) + (ca2Val || 0) + (examVal || 0))

    if (hasSeparator) {
      if (!groupedSubjects[parentName]) {
        groupedSubjects[parentName] = {
          subjName: parentName,
          isGrouped: true,
          subRows: [],
          total: 0,
          grade: "",
          classMin: 0,
          classMax: 0,
          classAvg: 0,
          remark: ""
        }
      }
      groupedSubjects[parentName].subRows.push({
        subName,
        ca1: caVal,
        ca2: ca2Val,
        exam: examVal,
        total: totalVal
      })
      groupedSubjects[parentName].total += totalVal
      groupedSubjects[parentName].classMin = data?.classMin !== undefined && data?.classMin !== null ? data.classMin : null
      groupedSubjects[parentName].classMax = data?.classMax !== undefined && data?.classMax !== null ? data.classMax : null
      groupedSubjects[parentName].classAvg = data?.classAvg !== undefined && data?.classAvg !== null ? data.classAvg : null
    } else {
      groupedSubjects[fullSubjName] = {
        subjName: fullSubjName,
        isGrouped: false,
        subRows: [
          {
            subName: "",
            ca1: caVal,
            ca2: ca2Val,
            exam: examVal,
            total: totalVal
          }
        ],
        total: totalVal,
        grade: data?.grade || "",
        classMin: data?.classMin !== undefined ? data.classMin : null,
        classMax: data?.classMax !== undefined ? data.classMax : null,
        classAvg: data?.classAvg !== undefined ? data.classAvg : null,
        remark: data?.remark || data?.remarks || ""
      }
    }
  })

  // Finalize parent fields for grouped subjects
  Object.values(groupedSubjects).forEach((subj) => {
    if (subj.isGrouped) {
      subj.grade = getGradeFromScore(subj.total)
      subj.remark = getRemarkFromScore(subj.total)
    } else {
      if (!subj.grade) {
        subj.grade = getGradeFromScore(subj.total)
      }
      if (!subj.remark) {
        subj.remark = getRemarkFromScore(subj.total)
      }
    }
  })

  // Dynamic Skills Splitting
  const getSkillRating = (category: string, name: string) => {
    const found = skills?.find(
      (s) => s.skill_category === category && s.skill_name?.toLowerCase() === name.toLowerCase()
    )
    const val = found && found.rating !== null && found.rating !== undefined ? found.rating : "—"
    return mapRatingToLetter(val)
  }

  const affectiveCol1 = DEFAULT_AFFECTIVE_SKILLS.slice(0, 5)
  const affectiveCol2 = DEFAULT_AFFECTIVE_SKILLS.slice(5)
  const psychomotorListToUse = DEFAULT_PSYCHOMOTOR_SKILLS

  // Summary Metrics
  const scoredSubjects = Object.values(groupedSubjects).filter((s) => s.total !== null)
  const totalScore = scoredSubjects.reduce((sum, s) => sum + s.total, 0)
  const totalSubjects = scoredSubjects.length
  const totalPossibleScore = totalSubjects * 100
  const averageScore = totalPossibleScore > 0 ? (totalScore / totalPossibleScore) * 100 : 0
  const overallGrade = getGradeFromScore(averageScore)

  const teacherRemarkText = result?.teacher_remark || result?.teacher_comment || "—"
  const principalRemarkText = result?.principal_remark || result?.principal_comment || "—"

  return (
    <div className="report-card-wrapper">
      <style>{`
        .report-card-wrapper {
          background: #f3f4f6;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #111827;
          display: flex;
          justify-content: center;
          padding: 15px 0;
        }

        .report-card-wrapper * { box-sizing: border-box; }

        .report-card-page {
          width: 297mm;
          height: 210mm;
          margin: 0 auto;
          background: #fff;
          border: 1px solid #e2e4e9;
          border-radius: 14px;
          padding: 8mm 12mm;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }

        /* ===== Header row ===== */
        .header-row {
          display: grid;
          grid-template-columns: 190px 1fr 190px;
          align-items: center;
          gap: 14px;
          flex-shrink: 0;
        }
        .header-left { display:flex; align-items:center; justify-content: flex-start; }
        .logo {
          width: 58px;
          height: 58px;
          border: 2px solid #333;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
          color: #333;
          flex-shrink: 0;
        }
        .header-text-block { text-align: center; width: 100%; }
        .arabic-name {
          font-size: 15px;
          font-weight: 600;
          margin: 0;
          color: #111827;
          text-align: center;
        }
        .school-name {
          font-size: 21px;
          font-weight: 800;
          color: #2563eb;
          margin: 2px 0;
          letter-spacing: 0.2px;
          text-align: center;
        }
        .tagline {
          font-weight: 500;
          font-size: 10.5px;
          margin: 1px 0;
          color: #6b7280;
          text-align: center;
        }
        .address, .contact {
          font-size: 9px;
          margin: 1px 0;
          color: #6b7280;
          text-align: center;
        }

        /* Single Term Dates Card */
        .term-dates-card {
          border: 1px solid #e2e4e9;
          border-radius: 10px;
          overflow: hidden;
          width: 100%;
          background: #fff;
        }
        .term-date-item {
          padding: 6px 12px;
        }
        .term-date-item + .term-date-item {
          border-top: 1px solid #e2e4e9;
        }
        .term-date-item .t-label {
          font-size: 9px;
          color: #6b7280;
          font-weight: 500;
          display: block;
          margin-bottom: 2px;
        }
        .term-date-item .t-val {
          font-size: 12px;
          font-weight: 700;
          color: #111827;
          display: block;
        }

        /* ===== Info bar ===== */
        .info-bar {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          border: 1px solid #e2e4e9;
          border-radius: 10px;
          margin-top: 10px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .info-col {
          padding: 8px 14px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .info-col + .info-col { 
          border-left: 1px solid #e2e4e9; 
        }
        
        /* 3-Row Student Info Layout */
        .info-left { 
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 3px;
        }
        .student-name-row {
          font-size: 13.5px;
          font-weight: 800;
          color: #111827;
          letter-spacing: 0.2px;
          line-height: 1.2;
        }
        .student-meta-row {
          font-size: 9.5px;
          color: #111827;
          line-height: 1.3;
        }
        .student-meta-row b {
          color: #6b7280;
          font-weight: 600;
        }

        .info-center { 
          text-align: center; 
        }
        .report-title {
          color: #111827;
          font-size: 15.5px;
          font-weight: 800;
          letter-spacing: 0.2px;
          margin: 0 0 3px 0;
        }
        .session-line { font-size: 11px; font-weight: 600; color: #6b7280; }
        .session-line span { color: #111827; }

        /* Center-aligned Score Section */
        .info-right {
          display: flex !important;
          flex-direction: row !important;
          align-items: center;
          justify-content: space-between;
          padding: 8px 10px !important;
        }
        .score-block { 
          flex: 1; 
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 0 10px; 
        }
        .score-block + .score-block::before { 
          content: "";
          position: absolute;
          left: 0;
          top: 15%;
          height: 70%;
          width: 1px;
          background-color: #e2e4e9;
        }
        .score-block .s-label { 
          font-size: 8.5px; 
          color: #6b7280; 
          font-weight: 700; 
          text-transform: uppercase; 
          letter-spacing: 0.4px; 
          margin-bottom: 2px;
          white-space: nowrap;
        }
        .score-block .s-val { 
          font-size: 20px; 
          font-weight: 800; 
          color: #111827; 
          line-height: 1;
        }
        .score-block .s-val.grade { 
          color: #16a34a;
        }

        /* ===== Main table ===== */
        .main-table-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          margin: 16px 0;
        }
        table.main-table {
          width: 100%;
          height: 100%;
          border-collapse: separate;
          border-spacing: 0;
          font-size: 10px;
          border: 2px solid #6b7280;
          border-radius: 10px;
          overflow: hidden;
        }
        table.main-table tr {
          height: 1%;
        }
        table.main-table th, table.main-table td {
          border-bottom: 1px solid #e2e4e9;
          border-right: 1px solid #e2e4e9;
          padding: 4px 8px;
          text-align: center;
          color: #111827;
          vertical-align: middle;
        }
        table.main-table th:last-child, table.main-table td.comment-cell {
          border-right: none;
        }
        table.main-table tr:last-child td {
          border-bottom: none;
        }
        .sub-row-cell {
          padding: 2px 8px !important;
        }

        table.main-table th {
          background: #fafafa;
          font-weight: 800;
          font-size: 10.5px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: #111827;
          text-align: center;
          padding: 8px;
          white-space: nowrap;
          height: 32px;
        }

        table.main-table th.th-left {
          text-align: left !important;
        }

        .subject-name {
          text-align: left !important;
          font-weight: 700;
          color: #111827;
        }
        .sub-row-label {
          text-align: left !important;
          font-weight: 500;
          color: #111827;
        }
        .single-row td.subject-name {
          font-weight: 700;
        }

        .grade-text {
          font-weight: 700;
          font-size: 10.5px;
          color: #111827;
        }
        
        .comment-cell { 
          color: #111827; 
          font-weight: 600; 
          text-align: left !important; 
          padding-left: 10px !important;
        }

        /* ===== Domains Section ===== */
        .domains {
          display: flex;
          justify-content: space-between;
          margin-top: 0;
          gap: 12px;
          flex-shrink: 0;
        }
        .psychomotor-block {
          flex: 1.2;
          border: 1px solid #e2e4e9;
          border-radius: 10px;
          padding: 8px 12px;
        }

        .affective-block {
          flex: 2.2;
          border: 1px solid #e2e4e9;
          border-radius: 10px;
          padding: 8px 12px;
        }
        .domain-title {
          color: #2563eb;
          font-weight: 700;
          font-size: 9.5px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          margin-bottom: 6px;
        }
        .affective-grid {
          display: flex;
          gap: 12px;
        }
        .affective-col {
          flex: 1;
        }
        .affective-col + .affective-col {
          border-left: 1px solid #e2e4e9;
          padding-left: 12px;
        }

        .domain-row {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          padding: 3px 0;
          border-bottom: 1px solid #e2e4e9;
        }
        .domain-row:last-child { border-bottom: none; }
        .domain-row .d-label { color: #111827; }
        .domain-row .d-val { color: #111827; font-weight: 700; }

        .scale-box {
          flex: 1.5;
          border: 1px solid #e2e4e9;
          border-radius: 10px;
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
        }
        .scale-title {
          color: #2563eb;
          font-weight: 700;
          font-size: 9.5px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          margin-bottom: 6px;
        }
        .scale-grid {
          display: flex;
          gap: 12px;
        }
        .scale-col {
          flex: 1;
        }
        .scale-col + .scale-col {
          border-left: 1px solid #e2e4e9;
          padding-left: 12px;
        }
        .scale-row {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          padding: 3.5px 0;
          border-bottom: 1px solid #e2e4e9;
        }
        .scale-row:last-child { border-bottom: none; }
        .scale-row .s-label { color: #111827; font-weight: 700; }
        .scale-row .s-val { color: #6b7280; font-weight: 600; }

        /* ===== Comments ===== */
        .comments {
          margin-top: 10px;
          font-size: 10.5px;
          line-height: 1.5;
          border-radius: 10px;
          padding: 9px 12px;
          background: #f5f6f8;
          color: #111827;
          flex-shrink: 0;
        }
        .comments strong { font-weight: 700; color: #111827; }
        .comments div + div { margin-top: 3px; }

        @page {
          size: A4 landscape;
          margin: 6mm;
        }

        @media print {
          html, body, .report-card-wrapper, [class*="print:block"] {
            background: #fff !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: 100% !important;
            display: block !important;
          }
          .report-card-page {
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            width: 100% !important;
            height: 194mm !important;
            margin: 0 !important;
            padding: 2mm 2mm !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            display: flex !important;
            flex-direction: column !important;
          }
          .report-card-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
      `}</style>

      <div className="report-card-page">
        {/* HEADER */}
        <div className="header-row">
          <div className="header-left">
            {school?.logo_url ? (
              <img src={school.logo_url} alt="Logo" className="logo" style={{ objectFit: 'contain', border: 'none', borderRadius: '0' }} />
            ) : (
              <div className="logo">LOGO</div>
            )}
          </div>
          <div className="header-text-block">
            <p className="arabic-name">{school?.school_name_arabic || "مدرسة الأمة الإبداعية الدولية"}</p>
            <p className="school-name">{school?.school_name || "CREATIVE UMMAH INTERNATIONAL SCHOOLS"}</p>
            <p className="tagline">{school?.tagline || "...Learning, Attitude and Creativity"}</p>
            <p className="address">{school?.address || "No. 10 Mai Unguwa Wada Road, off Kuriga Road, keke-A Millenium City Kaduna."}</p>
            <p className="contact">
              Tel: {school?.phone_primary || "08135582113"}{school?.phone_secondary ? `, ${school.phone_secondary}` : ""}{school?.email ? ` | Email: ${school.email}` : ""}
            </p>
          </div>
          <div className="term-dates-card">
            <div className="term-date-item">
              <span className="t-label">Term Ends</span>
              <span className="t-val">{termEndDate}</span>
            </div>
            <div className="term-date-item">
              <span className="t-label">Next Term Begins</span>
              <span className="t-val">{nextTermBegins}</span>
            </div>
          </div>
        </div>

        {/* INFO BAR */}
        <div className="info-bar">
          <div className="info-col info-left">
            <div className="student-name-row">{studentFullName}</div>
            <div className="student-meta-row"><b>ADM. NO:</b> {student?.student_id || "—"}</div>
            <div className="student-meta-row">
              <b>CLASS:</b> {student?.classes?.name || "—"} &nbsp;&nbsp;·&nbsp;&nbsp; <b>Class Size:</b> {result?.total_students || "—"}
            </div>
          </div>
          <div className="info-col info-center">
            <p className="report-title">TERMINAL REPORT SHEET</p>
            <div className="session-line"><span>{session?.name || "—"}</span> &nbsp;&nbsp; <span>{term?.name || "—"}</span></div>
          </div>
          <div className="info-col info-right">
            <div className="score-block">
              <div className="s-label">Total Score</div>
              <div className="s-val">{totalScore.toFixed(0)}</div>
            </div>
            <div className="score-block">
              <div className="s-label">Average Score</div>
              <div className="s-val">{averageScore.toFixed(2)}%</div>
            </div>
            <div className="score-block">
              <div className="s-label">Grade</div>
              <div className="s-val grade">{overallGrade}</div>
            </div>
          </div>
        </div>

        {/* MAIN SUBJECTS TABLE */}
        <div className="main-table-wrapper">
          <table className="main-table">
            <thead>
              <tr>
                <th style={{ width: '22%', paddingLeft: '8px' }} className="th-left" colSpan={2}>Core Subjects</th>
                <th>C. A test</th>
                <th>Exams</th>
                <th>Total</th>
                <th>Grade</th>
                <th>Class Min</th>
                <th>Class Max</th>
                <th>Class Avg</th>
                <th style={{ width: '18%' }} className="th-left">Comment</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(groupedSubjects).map((subj) => {
                if (subj.isGrouped) {
                  return (
                    <React.Fragment key={subj.subjName}>
                      {subj.subRows.map((sub, index) => {
                        const caCombined = (sub.ca1 || 0) + (sub.ca2 || 0)
                        if (index === 0) {
                          return (
                            <tr key={sub.subName}>
                              <td className="subject-name" rowSpan={subj.subRows.length}>
                                {subj.subjName}
                              </td>
                              <td className="sub-row-label sub-row-cell">{sub.subName}</td>
                              <td className="sub-row-cell">{sub.ca1 !== null || sub.ca2 !== null ? caCombined : "—"}</td>
                              <td className="sub-row-cell">{sub.exam !== null ? sub.exam : "—"}</td>
                              <td rowSpan={subj.subRows.length}>{subj.total !== null ? subj.total : "—"}</td>
                              <td rowSpan={subj.subRows.length}>
                                <span className="grade-text">{subj.grade}</span>
                              </td>
                              <td rowSpan={subj.subRows.length}>
                                {subj.classMin !== null ? subj.classMin : "—"}
                              </td>
                              <td rowSpan={subj.subRows.length}>
                                {subj.classMax !== null ? subj.classMax : "—"}
                              </td>
                              <td rowSpan={subj.subRows.length}>
                                {subj.classAvg !== null ? subj.classAvg.toFixed(1) : "—"}
                              </td>
                              <td rowSpan={subj.subRows.length} className="comment-cell">
                                {subj.remark}
                              </td>
                            </tr>
                          )
                        } else {
                          return (
                            <tr key={sub.subName}>
                              <td className="sub-row-label sub-row-cell">{sub.subName}</td>
                              <td className="sub-row-cell">{sub.ca1 !== null || sub.ca2 !== null ? caCombined : "—"}</td>
                              <td className="sub-row-cell">{sub.exam !== null ? sub.exam : "—"}</td>
                            </tr>
                          )
                        }
                      })}
                    </React.Fragment>
                  )
                } else {
                  const sub = subj.subRows[0]
                  const caCombined = (sub.ca1 || 0) + (sub.ca2 || 0)
                  return (
                    <tr key={subj.subjName} className="single-row">
                      <td className="subject-name" colSpan={2}>
                        {subj.subjName}
                      </td>
                      <td>{sub.ca1 !== null || sub.ca2 !== null ? caCombined : "—"}</td>
                      <td>{sub.exam !== null ? sub.exam : "—"}</td>
                      <td style={{ fontWeight: 700 }}>{subj.total !== null ? subj.total : "—"}</td>
                      <td>
                        <span className="grade-text">{subj.grade}</span>
                      </td>
                      <td>{subj.classMin !== null ? subj.classMin : "—"}</td>
                      <td>{subj.classMax !== null ? subj.classMax : "—"}</td>
                      <td>{subj.classAvg !== null ? subj.classAvg.toFixed(1) : "—"}</td>
                      <td className="comment-cell">{subj.remark}</td>
                    </tr>
                  )
                }
              })}
            </tbody>
          </table>
        </div>

        {/* DOMAINS (SKILLS) & SCALE SECTION */}
        <div className="domains">
          {/* Psychomotor Domain */}
          <div className="psychomotor-block">
            <div className="domain-title">Psychomotor Domain</div>
            {psychomotorListToUse.map((skill) => (
              <div key={skill} className="domain-row">
                <span className="d-label">{skill}</span>
                <span className="d-val">{getSkillRating("Psychomotor", skill)}</span>
              </div>
            ))}
          </div>

          {/* Affective Domain */}
          <div className="affective-block">
            <div className="domain-title">Affective Domain</div>
            <div className="affective-grid">
              <div className="affective-col">
                {affectiveCol1.map((skill) => (
                  <div key={skill} className="domain-row">
                    <span className="d-label">{skill}</span>
                    <span className="d-val">{getSkillRating("Affective", skill)}</span>
                  </div>
                ))}
              </div>
              <div className="affective-col">
                {affectiveCol2.map((skill) => (
                  <div key={skill} className="domain-row">
                    <span className="d-label">{skill}</span>
                    <span className="d-val">{getSkillRating("Affective", skill)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scale Box */}
          <div className="scale-box">
            <div className="scale-title">Scale</div>
            <div className="scale-grid">
              <div className="scale-col">
                <div className="scale-row">
                  <span className="s-label">A+ (95–100)</span>
                  <span className="s-val">Outstanding</span>
                </div>
                <div className="scale-row">
                  <span className="s-grade s-label">A (90–94)</span>
                  <span className="s-val">Excellent</span>
                </div>
                <div className="scale-row">
                  <span className="s-grade s-label">B+ (85–89)</span>
                  <span className="s-val">Very Good</span>
                </div>
                <div className="scale-row">
                  <span className="s-grade s-label">B (80–84)</span>
                  <span className="s-val">Good</span>
                </div>
                <div className="scale-row">
                  <span className="s-grade s-label">C+ (75–79)</span>
                  <span className="s-val">Above Average</span>
                </div>
              </div>
              <div className="scale-col">
                <div className="scale-row">
                  <span className="s-grade s-label">C (70–74)</span>
                  <span className="s-val">Average</span>
                </div>
                <div className="scale-row">
                  <span className="s-grade s-label">D+ (65–69)</span>
                  <span className="s-val">Fair</span>
                </div>
                <div className="scale-row">
                  <span className="s-grade s-label">D (60–64)</span>
                  <span className="s-val">Pass</span>
                </div>
                <div className="scale-row">
                  <span className="s-grade s-label">E (50–59)</span>
                  <span className="s-val">Below Average</span>
                </div>
                <div className="scale-row">
                  <span className="s-grade s-label">F (0–49)</span>
                  <span className="s-val">Fail</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* REMARKS AND COMMENTS */}
        <div className="comments">
          <div><strong>Class teacher's comment:</strong> {teacherRemarkText}</div>
          <div><strong>Head teacher's comment:</strong> {principalRemarkText}</div>
        </div>

      </div>
    </div>
  )
}
