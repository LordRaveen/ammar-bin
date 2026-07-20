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
  "Punctuality",
  "Politeness",
  "Neatness",
  "Honesty",
  "Leadership skill",
  "Cooperation",
  "Attentiveness",
  "Perseverance",
  "Attitude to work",
]

const DEFAULT_PSYCHOMOTOR_SKILLS = [
  "Handwriting",
  "Verbal fluency",
  "Sports",
  "Handling tools",
  "Drawing & painting",
]

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

  let studentAge = "—"
  if (student?.date_of_birth) {
    const dob = new Date(student.date_of_birth)
    const diffMs = Date.now() - dob.getTime()
    const ageDate = new Date(diffMs)
    studentAge = `${Math.abs(ageDate.getUTCFullYear() - 1970)} Yrs`
  }

  const resumptionDate = term?.resumption_date || term?.next_term_resumption_date
    ? new Date(term.resumption_date || term.next_term_resumption_date).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })
    : term?.end_date
      ? new Date(term.end_date).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })
      : "—"

  const totalDaysInTerm = result?.total_school_days || term?.total_school_days || 100
  const daysPresent = result?.attendance_present !== undefined && result?.attendance_present !== null ? result.attendance_present : "—"
  const daysAbsent = typeof daysPresent === 'number' && typeof totalDaysInTerm === 'number' ? Math.max(0, totalDaysInTerm - daysPresent) : "—"

  const totalSubjects = Object.keys(subjectScores || {}).length
  const totalPossibleScore = totalSubjects * 100
  const totalScore = result?.total_score || Object.values(subjectScores || {}).reduce((sum: number, s: any) => sum + (s.total || 0), 0)
  const averageScore = result?.average_score !== undefined && result?.average_score !== null 
    ? result.average_score 
    : (totalPossibleScore > 0 ? (totalScore / totalPossibleScore) * 100 : 0)

  const overallGrade = averageScore >= 80 ? 'A' : averageScore >= 60 ? 'B' : averageScore >= 55 ? 'C' : averageScore >= 45 ? 'D' : 'F'

  const teacherRemarkText = result?.teacher_remark || result?.teacher_comment || "—"
  const principalRemarkText = result?.principal_remark || result?.principal_comment || "—"

  const schoolPhone = school?.phone_primary || school?.phone || school?.primary_phone || "—"
  const schoolPhoneSecondary = school?.phone_secondary

  const getSkillRating = (category: string, name: string) => {
    const found = skills?.find(
      (s) => s.skill_category === category && s.skill_name?.toLowerCase() === name.toLowerCase()
    )
    return found && found.rating !== null && found.rating !== undefined ? found.rating : "—"
  }

  return (
    <div className="report-card-wrapper">
      <style>{`
        .report-card-wrapper {
          background: #e5e5e5;
          font-family: 'Georgia', 'Times New Roman', serif;
          color: #111;
          display: flex;
          justify-content: center;
        }

        .report-card-wrapper * { box-sizing: border-box; }
        
        .report-card-page {
          width: 210mm;
          height: 297mm;
          margin: 10mm auto;
          padding: 8mm 9mm;
          background: #fff;
          border: 3px solid #000;
          display: flex;
          flex-direction: column;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }

        @page {
          size: A4 portrait;
          margin: 0;
        }

        @media print {
          html, html.dark, body, body.dark, [data-theme] {
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .report-card-wrapper {
            background: #ffffff !important;
            background-color: #ffffff !important;
            display: block !important;
            width: 100% !important;
          }
          .report-card-page {
            margin: 0 auto !important;
            border: 2px solid #000 !important;
            box-shadow: none !important;
            width: 210mm !important;
            height: 297mm !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
          }
          .report-card-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }

        .rc-footer-block {
          margin-top: auto;
        }

        .rc-header {
          display: grid;
          grid-template-columns: 90px 1fr 90px;
          align-items: center;
          gap: 10px;
          border-bottom: 2px solid #000;
          padding-bottom: 8px;
        }
        .rc-crest { width: 84px; height: 84px; }
        .rc-school-name {
          text-align: center;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin: 0 0 2px;
        }
        .rc-school-line {
          text-align: center;
          font-size: 11px;
          margin: 2px 0;
        }
        .rc-school-line.italic { font-style: italic; }
        .rc-report-title {
          text-align: center;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1px;
          margin-top: 4px;
        }
        .rc-photo-block { text-align: center; }
        .rc-photo {
          width: 68px;
          height: 78px;
          border: 1px solid #000;
          background: #eee;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          overflow: hidden;
          margin: 0 auto;
        }
        .rc-photo svg { width: 50px; height: 60px; fill: #111; }
        .rc-term-badge {
          text-align: center;
          font-size: 13px;
          font-weight: 700;
          margin-top: 4px;
        }

        .rc-student-name {
          text-align: center;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin: 10px 0 2px;
        }
        .rc-student-meta {
          text-align: center;
          font-size: 12px;
          margin-bottom: 10px;
        }
        .rc-student-meta span { margin: 0 6px; }

        .rc-info-strip {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
          font-size: 11.5px;
          padding: 6px 0;
          margin-bottom: 10px;
        }
        .rc-info-strip .col {
          padding: 0 10px;
          border-left: 1px solid #000;
          line-height: 1.7;
        }
        .rc-info-strip .col:first-child { border-left: none; }
        .rc-info-strip b { font-weight: 700; }

        .rc-main-grid {
          display: grid;
          grid-template-columns: 1fr 200px;
          gap: 10px;
        }

        table.rc-subjects {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        table.rc-subjects th, table.rc-subjects td {
          border: 1px solid #000;
          padding: 4px 5px;
          text-align: center;
        }
        table.rc-subjects thead th {
          font-size: 10px;
          font-weight: 700;
          height: 92px;
          vertical-align: bottom;
          padding-bottom: 6px;
        }
        table.rc-subjects thead th.rot span {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          white-space: nowrap;
          display: inline-block;
        }
        table.rc-subjects thead th.subj-head { text-align: left; vertical-align: middle; font-size: 12px; }
        table.rc-subjects tbody td.subj-name { text-align: left; }

        .rc-sidebar-title {
          font-size: 11px;
          font-weight: 700;
          margin: 0 0 3px;
        }
        table.rc-skills {
          width: 100%;
          border-collapse: collapse;
          font-size: 10.5px;
          margin-bottom: 10px;
        }
        table.rc-skills td {
          border: 1px solid #000;
          padding: 3px 5px;
        }
        table.rc-skills td.score { width: 26px; text-align: center; }

        table.rc-grading {
          width: 100%;
          border-collapse: collapse;
          font-size: 10.5px;
          margin-bottom: 10px;
        }
        table.rc-grading td {
          border: 1px solid #000;
          padding: 3px 6px;
        }
        table.rc-grading td.grade { width: 24px; text-align: center; font-weight: 700; }

        .rc-signature-box {
          font-size: 10.5px;
          font-weight: 700;
          margin-top: 4px;
        }
        .rc-signature-line {
          margin-top: 34px;
          border-top: 1px solid #000;
        }

        .rc-summary-title {
          font-size: 12px;
          font-weight: 700;
          margin: 12px 0 4px;
        }
        table.rc-summary {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          margin-bottom: 10px;
        }
        table.rc-summary td {
          border: 1px solid #000;
          padding: 6px 8px;
        }
        table.rc-summary td.label { font-weight: 700; width: 1%; white-space: nowrap; }
        table.rc-summary td.value { width: 1%; white-space: nowrap; font-weight: 700; }

        .rc-remarks { font-size: 12.5px; margin: 6px 0; }
        .rc-remarks b { margin-right: 6px; }
        .rc-remarks { font-size: 12.5px; margin: 6px 0; }
        .rc-remarks b { margin-right: 6px; }
        .rc-remark-text {
          font-weight: 700;
          border-bottom: 1px solid #000;
          padding-bottom: 1px;
        }

        .rc-info-parents {
          border-top: 1px solid #000;
          margin-top: 10px;
          padding-top: 8px;
          text-align: center;
          font-size: 11px;
          line-height: 1.6;
        }
        .rc-info-parents b { font-weight: 700; }
      `}</style>

      <div className="report-card-page">
        {/* HEADER */}
        <div className="rc-header">
          {school?.logo_url ? (
            <img src={school.logo_url} alt="Logo" className="rc-crest" style={{ objectFit: 'contain' }} />
          ) : (
            <svg className="rc-crest" viewBox="0 0 100 100">
              <path d="M50 5 L90 15 V45 C90 70 72 90 50 98 C28 90 10 70 10 45 V15 Z" fill="#0a3b6b" stroke="#000" strokeWidth="1.5"/>
              <path d="M50 5 L90 15 V45 C90 70 72 90 50 98 Z" fill="#153a86"/>
              <path d="M50 5 L10 15 V45 C10 70 28 90 50 98 Z" fill="#8c1c1c" opacity="0.85"/>
              <circle cx="50" cy="48" r="20" fill="#fff" opacity="0.9"/>
              <text x="50" y="55" textAnchor="middle" fontSize="20" fontFamily="Georgia, serif" fill="#0a3b6b" fontWeight="700">S</text>
            </svg>
          )}

          <div>
            <p className="rc-school-name">{school?.school_name || "SCHOOL NAME"}</p>
            <p className="rc-school-line italic">{school?.address || "School Address, City"}</p>
            <p className="rc-school-line">TEL: {schoolPhone}{schoolPhoneSecondary ? ` / ${schoolPhoneSecondary}` : ""}, EMAIL: {school?.email || "info@school.ng"}</p>
            <p className="rc-report-title">STUDENTS ACADEMIC REPORT CARD</p>
          </div>

          <div className="rc-photo-block">
            <div className="rc-photo">
              {student?.photo_url ? (
                <img src={student.photo_url} alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="5"/><path d="M4 22c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>
              )}
            </div>
            <p className="rc-term-badge">{term?.name || "2nd Term"}</p>
          </div>
        </div>

        {/* STUDENT NAME */}
        <p className="rc-student-name">{studentFullName}</p>
        <p className="rc-student-meta">
          <span>Gender: <b>{student?.gender || "—"}</b></span> | <span>Admission Number: <b>{student?.student_id || "—"}</b></span> | <span>Age: <b>{studentAge}</b></span>
        </p>

        {/* INFO STRIP */}
        <div className="rc-info-strip">
          <div className="col">
            Term: <b>{term?.name || "—"}</b><br/>
            Session: <b>{session?.name || "—"}</b><br/>
            Resumption: <b>{resumptionDate}</b>
          </div>
          <div className="col">
            Class: <b>{student?.classes?.name || "—"}</b><br/>
            Students in Class: <b>{result?.total_students || "—"}</b><br/>
            Class Teacher: <b>{student?.classes?.class_teacher || "—"}</b>
          </div>
          <div className="col">
            Total Days In Term: <b>{totalDaysInTerm}</b><br/>
            Total Days Present: <b>{daysPresent}</b><br/>
            Total Days Absent: <b>{daysAbsent}</b>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="rc-main-grid">

          {/* SUBJECTS TABLE */}
          <table className="rc-subjects">
            <thead>
              <tr>
                <th className="subj-head">SUBJECTS</th>
                <th className="rot"><span>1st CA (20)</span></th>
                <th className="rot"><span>2nd CA (20)</span></th>
                <th className="rot"><span>EXAM (60)</span></th>
                <th className="rot"><span>TOTAL (100)</span></th>
                <th className="rot"><span>GRADE</span></th>
                <th className="rot"><span>SUBJECT POSITION</span></th>
                <th className="rot"><span>SUBJECT HIGHEST</span></th>
                <th className="rot"><span>SUBJECT LOWEST</span></th>
                <th className="rot"><span>SUBJECT AVERAGE</span></th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(subjectScores || {}).map(([subjName, data]: [string, any]) => (
                <tr key={subjName}>
                  <td className="subj-name">{subjName}</td>
                  <td>{data?.ca1 !== undefined && data?.ca1 !== null ? data.ca1 : "—"}</td>
                  <td>{data?.ca2 !== undefined && data?.ca2 !== null ? data.ca2 : "—"}</td>
                  <td>{data?.exam !== undefined && data?.exam !== null ? data.exam : "—"}</td>
                  <td style={{ fontWeight: 700 }}>{data?.total !== undefined && data?.total !== null ? data.total : "—"}</td>
                  <td style={{ fontWeight: 700 }}>{data?.grade || "—"}</td>
                  <td>{data?.subject_position ?? "—"}</td>
                  <td>{data?.subject_highest ?? "—"}</td>
                  <td>{data?.subject_lowest ?? "—"}</td>
                  <td>{data?.subject_average ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* SIDEBAR */}
          <div>
            <p className="rc-sidebar-title">AFFECTIVE SKILLS</p>
            <table className="rc-skills">
              <tbody>
                {DEFAULT_AFFECTIVE_SKILLS.map((skill) => (
                  <tr key={skill}>
                    <td>{skill}</td>
                    <td className="score">{getSkillRating("Affective", skill)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="rc-sidebar-title">PSYCHOMOTOR SKILLS</p>
            <table className="rc-skills">
              <tbody>
                {DEFAULT_PSYCHOMOTOR_SKILLS.map((skill) => (
                  <tr key={skill}>
                    <td>{skill}</td>
                    <td className="score">{getSkillRating("Psychomotor", skill)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="rc-sidebar-title">GRADING SYSTEM</p>
            <table className="rc-grading">
              <tbody>
                <tr><td className="grade">A</td><td>80–100</td></tr>
                <tr><td className="grade">B</td><td>60–79</td></tr>
                <tr><td className="grade">C</td><td>55–59</td></tr>
                <tr><td className="grade">D</td><td>45–54</td></tr>
                <tr><td className="grade">F</td><td>0–44</td></tr>
              </tbody>
            </table>

            <p className="rc-sidebar-title">SIGNATURE / STAMP</p>
            <div className="rc-signature-line"></div>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', textAlign: 'center', marginTop: '4px', fontWeight: 700 }}>
              {school?.principal_name || ""} (School Head)
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="rc-footer-block">
          <p className="rc-summary-title">SUMMARY</p>
          <table className="rc-summary">
            <tbody>
              <tr>
                <td className="label">TOTAL SCORE:</td><td className="value">{totalScore.toFixed(0)} / {totalPossibleScore}</td>
                <td className="label">AVG. SCORE:</td><td className="value">{averageScore.toFixed(1)} %</td>
                <td className="label">GRADE:</td><td className="value">{overallGrade}</td>
              </tr>
            </tbody>
          </table>

          <p className="rc-remarks"><b>CLASS TEACHER REMARKS:</b> <span className="rc-remark-text">{teacherRemarkText}</span></p>
          <p className="rc-remarks"><b>SCHOOL HEAD REMARKS:</b> <span className="rc-remark-text">{principalRemarkText}</span></p>
          <p style={{ fontSize: '10.5px', marginTop: '2px', fontStyle: 'italic', fontWeight: 600 }}>
            Head Teacher / Principal: <span style={{ fontStyle: 'normal' }}>{school?.principal_name || "Mallam Jaafar"}</span>
          </p>

          <div className="rc-info-parents">
            <b>INFO TO PARENTS:</b> {school?.parent_info || "Please note resumption date and settle all school fees prior to resumption."}
          </div>
        </div>

      </div>
    </div>
  )
}
