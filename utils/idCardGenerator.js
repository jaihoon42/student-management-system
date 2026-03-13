const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const generateIDCardStream = (student, res) => {
  const doc = new PDFDocument({ size: [350, 220], margin: 0 });
  
  // Pipe to response
  doc.pipe(res);

  // --- Design ---
  // Outer Border
  doc.rect(5, 5, 340, 210).lineWidth(2).stroke("#007bff");

  // Header
  doc.rect(5, 5, 340, 40).fill("#007bff");
  doc.fillColor("#fff").fontSize(16).text("NIET STUDENT ID CARD", 0, 18, { align: "center", width: 350 });

  // Photo handling
  let photoPath = null;
  if (student.photo) {
    photoPath = path.join(__dirname, "../public", student.photo);
  }

  if (photoPath && fs.existsSync(photoPath)) {
    doc.image(photoPath, 20, 60, { width: 80, height: 100 });
    doc.rect(20, 60, 80, 100).lineWidth(1).stroke("#ccc");
  } else {
    doc.rect(20, 60, 80, 100).lineWidth(1).stroke("#ccc");
    doc.fillColor("#999").fontSize(10).text("NO PHOTO", 35, 105);
  }

  // Student Details
  const detailsX = 120;
  doc.fillColor("#000").fontSize(11);
  doc.font("Helvetica-Bold").text("Name:", detailsX, 70);
  doc.font("Helvetica").text(student.name, detailsX + 60, 70);
  doc.font("Helvetica-Bold").text("Roll No:", detailsX, 90);
  doc.font("Helvetica").text(student.rollNumber, detailsX + 60, 90);
  doc.font("Helvetica-Bold").text("Class:", detailsX, 110);
  doc.font("Helvetica").text(student.class, detailsX + 60, 110);
  doc.font("Helvetica-Bold").text("Section:", detailsX, 130);
  doc.font("Helvetica").text(student.section, detailsX + 60, 130);
  doc.font("Helvetica-Bold").text("DOB:", detailsX, 150);
  doc.font("Helvetica").text(new Date(student.dob).toLocaleDateString(), detailsX + 60, 150);

  // Footer
  doc.rect(5, 185, 340, 30).fill("#f8f9fa");
  doc.fillColor("#007bff").fontSize(9).text("NIET - Nurturing Excellence", 0, 195, { align: "center", width: 350 });

  doc.end();
};

const generateIDCard = (student, outputPath = `public/idCards/${student.rollNumber}.pdf`) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: [350, 220], margin: 0 });
      if (!fs.existsSync("public/idCards")) fs.mkdirSync("public/idCards", { recursive: true });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);
      
      // ... (Rest of same design logic - keeping it for background tasks if any)
      doc.rect(5, 5, 340, 210).lineWidth(2).stroke("#007bff");
      doc.rect(5, 5, 340, 40).fill("#007bff");
      doc.fillColor("#fff").fontSize(16).text("NIET STUDENT ID CARD", 0, 18, { align: "center", width: 350 });
      let photoPath = student.photo ? path.join(__dirname, "../public", student.photo) : null;
      if (photoPath && fs.existsSync(photoPath)) {
        doc.image(photoPath, 20, 60, { width: 80, height: 100 });
      } else {
        doc.rect(20, 60, 80, 100).stroke();
      }
      const detailsX = 120;
      doc.fillColor("#000").fontSize(11);
      doc.font("Helvetica-Bold").text("Name:", detailsX, 70);
      doc.font("Helvetica").text(student.name, detailsX + 60, 70);
      doc.font("Helvetica-Bold").text("Roll No:", detailsX, 90);
      doc.font("Helvetica").text(student.rollNumber, detailsX + 60, 90);
      doc.end();

      stream.on("finish", () => resolve(outputPath));
      stream.on("error", reject);
    } catch (err) { reject(err); }
  });
};

module.exports = { generateIDCard, generateIDCardStream };
