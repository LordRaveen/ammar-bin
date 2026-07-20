import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Export a single report card element as an image.
 */
export async function exportReportCardAsImage(pageNode: HTMLElement, filename: string) {
  try {
    const canvas = await html2canvas(pageNode, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#ffffff",
    });
    
    const image = canvas.toDataURL("image/png");
    
    // Create a temporary link element to trigger the download
    const link = document.createElement('a');
    link.href = image;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error("Error generating image:", error);
    return false;
  }
}

/**
 * Export multiple report cards sequentially as images.
 */
export async function exportReportCardsAsImages(pageNodes: HTMLElement[], filenames: string[]) {
  for (let i = 0; i < pageNodes.length; i++) {
    const node = pageNodes[i];
    const filename = filenames[i] || `Report_Card_${i + 1}.png`;
    await exportReportCardAsImage(node, filename);
  }
}

/**
 * Export multiple report cards as a single multi-page PDF.
 */
export async function exportReportCardsAsPDF(pageNodes: HTMLElement[], filename: string) {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    for (let i = 0; i < pageNodes.length; i++) {
      const node = pageNodes[i];
      const canvas = await html2canvas(node, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      // A4 dimensions: 210 x 297 mm
      if (i > 0) {
        pdf.addPage();
      }
      
      pdf.setPage(i + 1);
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
    }
    
    pdf.save(filename);
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return false;
  }
}
