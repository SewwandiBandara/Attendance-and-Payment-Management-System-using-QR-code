import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateInvoicePDF = async (invoice) => {
  const doc = new jsPDF();
  
  // Add logo
  // const logoData = await getLogoData(); // You can implement this if you have a logo
  // if (logoData) {
  //   doc.addImage(logoData, 'JPEG', 15, 10, 30, 15);
  // }
  
  // Invoice title
  doc.setFontSize(20);
  doc.text('INVOICE', 105, 20, { align: 'center' });
  
  // Invoice details
  doc.setFontSize(10);
  doc.text(`Invoice #: ${invoice.invoice_id}`, 15, 30);
  doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, 15, 35);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 15, 40);
  
  // Student details
  doc.text(`Student: ${invoice.fullName}`, 15, 50);
  doc.text(`Student ID: ${invoice.student_id}`, 15, 55);
  doc.text(`Grade: ${invoice.grade}`, 15, 60);
  
  // Line separator
  doc.line(15, 65, 195, 65);
  
  // Class details
  doc.text(`Class: ${invoice.class_name} (${invoice.class_type})`, 15, 75);
  
  // Payment details
  doc.autoTable({
    startY: 85,
    head: [['Description', 'Amount (RS)']],
    body: [
      ['Class Fee', invoice.amount],
      ['Total', invoice.amount]
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
    columnStyles: { 
      0: { cellWidth: 'auto' },
      1: { cellWidth: 'auto' }
    }
  });
  
  // Footer
  doc.setFontSize(8);
  doc.text('Thank you for your payment!', 105, doc.lastAutoTable.finalY + 15, { align: 'center' });
  doc.text('For any inquiries, please contact our support team.', 105, doc.lastAutoTable.finalY + 20, { align: 'center' });
  
  // Save the PDF
  doc.save(`invoice_${invoice.invoice_id}.pdf`);
};

// Helper function to get logo as base64 (optional)
// async function getLogoData() {
//   try {
//     const response = await fetch('/path/to/logo.jpg');
//     const blob = await response.blob();
//     return new Promise((resolve) => {
//       const reader = new FileReader();
//       reader.onloadend = () => resolve(reader.result);
//       reader.readAsDataURL(blob);
//     });
//   } catch (error) {
//     console.error('Error loading logo:', error);
//     return null;
//   }
// }