import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateFeeReceiptPDF = (receiptData) => {
  const {
    receipt = {},
    student = {},
    parent = {},
    fee = {},
    school = {}
  } = receiptData;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Colors
  const primaryColor = [79, 70, 229]; // Indigo #4F46E5
  const secondaryColor = [245, 158, 11]; // Amber #F59E0B
  const textColor = [31, 41, 55]; // Gray-800
  const lightBg = [249, 250, 251]; // Gray-50

  // 1. Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 36, 'F');

  // Accent Line
  doc.setFillColor(...secondaryColor);
  doc.rect(0, 36, 210, 3, 'F');

  // School Name & Tagline
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(school.name || 'APNA SCHOOL KINDERGARTEN', 105, 15, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(school.tagline || 'Nurturing Little Minds with Love, Care & Excellence', 105, 22, { align: 'center' });
  doc.setFontSize(8);
  doc.text(`${school.address || 'Knowledge Park, City Center'} | Phone: ${school.phone || '+91 98765-43210'} | Reg: ${school.registrationNo || 'REG/2026/089'}`, 105, 29, { align: 'center' });

  // 2. Receipt Title & Badge
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('OFFICIAL FEE PAYMENT RECEIPT', 14, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Receipt generated on: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, 14, 55);

  // Status Badge
  const isPaid = fee.status === 'paid' || (fee.balanceAmount === 0);
  doc.setFillColor(isPaid ? 220 : 254, isPaid ? 252 : 243, isPaid ? 231 : 199);
  doc.roundedRect(155, 43, 40, 10, 2, 2, 'F');
  doc.setTextColor(isPaid ? 22 : 180, isPaid ? 101 : 83, isPaid ? 52 : 9);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(isPaid ? 'PAID IN FULL' : 'PARTIAL PAID', 175, 49.5, { align: 'center' });

  // 3. Info Boxes (Receipt Details & Student Details)
  // Left Box: Student Details
  doc.setFillColor(...lightBg);
  doc.roundedRect(14, 62, 88, 38, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 62, 88, 38, 2, 2, 'S');

  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('STUDENT INFORMATION', 18, 68);

  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Student Name:', 18, 75);
  doc.setFont('helvetica', 'normal');
  doc.text(student.name || 'N/A', 48, 75);

  doc.setFont('helvetica', 'bold');
  doc.text('Student ID:', 18, 81);
  doc.setFont('helvetica', 'normal');
  doc.text(student.studentId || 'STD-2026', 48, 81);

  doc.setFont('helvetica', 'bold');
  doc.text('Class / Section:', 18, 87);
  doc.setFont('helvetica', 'normal');
  doc.text(student.class || 'N/A', 48, 87);

  doc.setFont('helvetica', 'bold');
  doc.text('Guardian Name:', 18, 93);
  doc.setFont('helvetica', 'normal');
  doc.text(student.fatherName || parent.name || 'Parent/Guardian', 48, 93);

  // Right Box: Transaction Details
  doc.setFillColor(...lightBg);
  doc.roundedRect(108, 62, 88, 38, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(108, 62, 88, 38, 2, 2, 'S');

  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('PAYMENT DETAILS', 112, 68);

  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Receipt No:', 112, 75);
  doc.setFont('helvetica', 'normal');
  doc.text(receipt.receiptNumber || `REC-${Date.now()}`, 142, 75);

  doc.setFont('helvetica', 'bold');
  doc.text('Payment Date:', 112, 81);
  doc.setFont('helvetica', 'normal');
  const pDate = receipt.paymentDate ? new Date(receipt.paymentDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
  doc.text(pDate, 142, 81);

  doc.setFont('helvetica', 'bold');
  doc.text('Payment Mode:', 112, 87);
  doc.setFont('helvetica', 'normal');
  doc.text(receipt.paymentMethod || 'Online Gateway', 142, 87);

  doc.setFont('helvetica', 'bold');
  doc.text('Transaction Ref:', 112, 93);
  doc.setFont('helvetica', 'normal');
  doc.text(receipt.transactionId || 'TXN-DIRECT', 142, 93);

  // 4. Fee Components Table
  const grossAmt = Number(fee.amount || receipt.amountDue || receipt.amountPaid || 0);
  const discountAmt = Number(fee.discountAmount || receipt.discount || 0);
  const fineAmt = Number(fee.fineAmount || receipt.fine || 0);
  const paidAmt = Number(receipt.amountPaid || fee.paidAmount || 0);
  const prevDue = Number(fee.previousDue || 0);
  const remainingDue = Number(receipt.remainingAmount !== undefined ? receipt.remainingAmount : (fee.remainingAmount || 0));

  const tableData = [
    [
      '1',
      fee.term || (receipt.month ? `${receipt.month} Fee Component` : 'Tuition & Academic Component'),
      `Rs. ${grossAmt.toLocaleString('en-IN')}`,
      discountAmt > 0 ? `- Rs. ${discountAmt.toLocaleString('en-IN')}` : 'Rs. 0',
      fineAmt > 0 ? `+ Rs. ${fineAmt.toLocaleString('en-IN')}` : 'Rs. 0',
      `Rs. ${paidAmt.toLocaleString('en-IN')}`
    ]
  ];

  // If discount or fine reason exists, add sub-row
  if (fee.discountReason || receipt.remarks) {
    tableData.push([
      '',
      `Notes: ${fee.discountReason || receipt.remarks || 'Standard Fee Schedule'}`,
      '',
      '',
      '',
      ''
    ]);
  }

  doc.autoTable({
    startY: 108,
    head: [['#', 'Fee Particulars / Month', 'Gross Due', 'Discount', 'Late Fine', 'Amount Paid']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: textColor
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 70 },
      2: { cellWidth: 26, halign: 'right' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 26, halign: 'right' },
      5: { cellWidth: 32, halign: 'right' }
    }
  });

  // 5. Total Calculations Box
  const finalY = doc.lastAutoTable.finalY + 8;
  doc.setFillColor(...lightBg);
  doc.roundedRect(110, finalY, 86, 42, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(110, finalY, 86, 42, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...textColor);

  doc.text('Previous Due Carried:', 114, finalY + 8);
  doc.text(`Rs. ${prevDue.toLocaleString('en-IN')}`, 192, finalY + 8, { align: 'right' });

  doc.text('Total Paid This Receipt:', 114, finalY + 16);
  doc.setTextColor(22, 101, 52);
  doc.text(`Rs. ${paidAmt.toLocaleString('en-IN')}`, 192, finalY + 16, { align: 'right' });

  doc.setTextColor(...textColor);
  doc.text('Remaining Balance Due:', 114, finalY + 24);
  doc.setTextColor(remainingDue > 0 ? 220 : 16, remainingDue > 0 ? 38 : 185, remainingDue > 0 ? 38 : 129);
  doc.text(`Rs. ${remainingDue.toLocaleString('en-IN')}`, 192, finalY + 24, { align: 'right' });

  doc.setTextColor(...textColor);
  doc.text('Clearance Status:', 114, finalY + 32);
  doc.text(remainingDue <= 0 ? 'Fully Cleared' : 'Partial / Balance Due', 192, finalY + 32, { align: 'right' });

  // 6. Terms & Signature Area
  const termsY = finalY + 52;
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('TERMS & NOTES:', 14, termsY);
  doc.setFont('helvetica', 'normal');
  doc.text('1. Fees once deposited are non-refundable & non-transferable under all circumstances.', 14, termsY + 5);
  doc.text('2. Please retain this receipt securely for all administrative inquiries and tax filings.', 14, termsY + 9);
  doc.text('3. This is an authenticated computer-generated receipt with a digital signature seal.', 14, termsY + 13);

  // Signature Block
  doc.setDrawColor(203, 213, 225);
  doc.line(140, termsY + 15, 192, termsY + 15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.setFontSize(9);
  doc.text('Authorized Accounts Officer', 166, termsY + 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Apna School Accounts Branch', 166, termsY + 24, { align: 'center' });

  // 7. Footer Decorative Bar
  doc.setFillColor(...primaryColor);
  doc.rect(0, 290, 210, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text('Thank you for trusting Apna School with your child\'s early learning journey.', 105, 294.5, { align: 'center' });

  // Save / Trigger Download
  const filename = `Receipt_${receipt.receiptNumber || 'Official'}_${(student.name || 'Student').replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
};

export const generateOfficialFeeReceiptPDF = (receipt, student = {}, fee = {}, parent = {}, school = {}) => {
  if (receipt && receipt.receipt) {
    return generateFeeReceiptPDF(receipt);
  }
  return generateFeeReceiptPDF({
    receipt: receipt || {},
    student: student || {},
    fee: fee || {},
    parent: parent || {},
    school: school || {}
  });
};

