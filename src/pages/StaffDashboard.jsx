import React, { useState, useEffect, useRef} from 'react';
import { HiOutlineUserAdd } from "react-icons/hi";
import { FaRegCalendarAlt } from "react-icons/fa";
import { RiMoneyDollarCircleLine } from "react-icons/ri";
import { IoLogOutOutline } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import {QRCodeCanvas} from 'qrcode.react';
import { registerStudent,getNextStudentIdForGrade} from '../services/api';
import {getStudentById ,getStudentQRImage, uploadStudentQRImage} from '../services/api';
import {getGrades,getClasses , getSubjects, getCourses} from '../services/api';
import QrScanner from 'qr-scanner';
// import Webcam from "react-webcam";
 import {  getStudentSubjects ,getStudentCourses} from '../services/api';
// //import QrReader from 'react-qr-reader';
import jsQR from 'jsqr';
import {  addPaymentRecord, updatePaymentRecord, deletePaymentRecord, getPaymentRecords } from '../services/api';
import { saveAttendanceRecords, getAttendanceRecords ,deleteAttendanceRecordById } from '../services/api';
import PayHereCheckout from './PayHereCheckout';
// import { generateInvoicePDF } from '../utils/pdfGenerator';


//////////////////+++++++++++++++++++++++++++++++++  register students  ++++++++++++++++++++++++++++++//////////////////
const StudentRegistrationForm = () => {

  const navigate = useNavigate(); 

//generate random password
const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};


  // State for the Registration Form
  const [formData, setFormData] = useState({
    id: '',
    firstName: '',
    lastName: '',
    grade: '',
    subjects: [],
    courses: [],
    password: generateRandomPassword(), // Auto-generated password
    mobile: '',
    email: ''
  });

  // State for QR Code Generation Form (still kept to allow manual input if needed, but no generate button)
  const [qrFormData, setQrFormData] = useState({
    studentId: '',
    mobile: '',
    password: ''
  });

  // State for fetched data and UI control
  const [gradesData, setGradesData] = useState([]);
  const [subjectsData, setSubjectsData] = useState([]);
  const [coursesData, setCoursesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGeneratingId, setIsGeneratingId] = useState(false);

  // State for QR Code
  const [qrData, setQrData] = useState('');
  const qrCodeRef = useRef(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [grades, subjects, courses] = await Promise.all([
          getGrades(),
          getSubjects(),
          getCourses()
        ]);
        setGradesData(grades);
        setSubjectsData(subjects);
        setCoursesData(courses);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Handlers for Registration Form ---
  const handleChange = async (e) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData, [name]: value };
  
    if (name === 'grade') {
      const selectedGradeId = value;
      if (selectedGradeId) {
        setIsGeneratingId(true);
        setFormData({ ...updatedFormData, id: '', password: generateRandomPassword() });
        try {
          const nextId = await getNextStudentIdForGrade(selectedGradeId);
          if (nextId) {
            setFormData(prev => ({
              ...prev,
              id: nextId,
              password: generateRandomPassword() // Regenerate password with new ID
            }));
          }
        } catch (err) {
          console.error("Failed to generate student ID:", err);
          setFormData({ ...updatedFormData, id: '' });
        } finally {
          setIsGeneratingId(false);
        }
      }
    } else {
      setFormData(updatedFormData);
    }
  };

  const handleSubjectChange = (e) => {
    const { options } = e.target;
    const selectedSubjects = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedSubjects.push(options[i].value);
      }
    }
    setFormData({ ...formData, subjects: selectedSubjects });
  };

  const handleCourseChange = (e) => {
    const { options } = e.target;
    const selectedCourses = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedCourses.push(options[i].value);
      }
    }
    setFormData({ ...formData, courses: selectedCourses });
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id || !formData.firstName || !formData.lastName || !formData.grade ||
        formData.subjects.length === 0 || !formData.password || !formData.mobile || !formData.email) {
      if (isGeneratingId) {
        alert('Please wait for the Student ID to be generated.');
        return;
      }
       // Check if ID is expected but missing after generation attempt
       const gradeSelectedButIdMissing = formData.grade && !formData.id && !isGeneratingId;
       if (gradeSelectedButIdMissing) {
          alert('Failed to generate Student ID. Please try re-selecting the grade or contact support.');
          return;
       }
      alert('Please fill in all required fields and select at least one subject.');
      return;
    }

    try {
      const studentData = {
        student_id: formData.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        grade_id: formData.grade,
        subjects: formData.subjects,
        courses: formData.courses,
        password: formData.password,
        mobile: formData.mobile,
        email: formData.email
      };

      await registerStudent(studentData);

      // Auto-populate QR code form with student data
      setQrFormData({
          studentId: formData.id,
          mobile: formData.mobile,
          password: formData.password
      });
      
     // Generate QR code with just the student ID
    const qrContent = formData.id;
    setQrData(qrContent);
      
      // Store QR code in database
      try {
        await generateStudentQRCode(formData.id);
      } catch (err) {
        console.error("Failed to store QR code:", err);
      }
      
      alert('Registration Successful! QR code has been generated.');

      // Reset registration form (optional, depending on desired workflow)
      // If you want to keep the form filled after registration, comment this out.
      setFormData({
        id: '',
        firstName: '',
        lastName: '',
        grade: '',
        subjects: [],
        courses: [],
        password: generateRandomPassword(),
        mobile: '',
        email: ''
      });

    } catch (error) {
      console.error('Registration failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Please try again.';
      alert(`Registration failed: ${errorMessage}`);
    }
  };

  const handleCancel = () => {
    setFormData({
      id: '',
      firstName: '',
      lastName: '',
      grade: '',
      subjects: [],
      courses: [],
      password: '',
      mobile: '',
      email: ''
    });
    // Optionally clear QR data as well if registration is cancelled
    setQrFormData({ studentId: '', mobile: '', password: '' });
    setQrData('');
  };

  // --- Handlers for QR Code Section ---
  
   // the QR code will primarily be generated automatically after successful registration.
   // The QR form fields remain for display or potential manual use if needed,
  const handleQrFormChange = (e) => {
    const { name, value } = e.target;
    const newQrFormData = { ...qrFormData, [name]: value };
    setQrFormData(newQrFormData);

    // Optional: Auto-generate QR code as fields are typed
    // Uncomment the following lines if you want the QR code to update live
    // as the user types in the QR form fields.
    const { studentId, mobile, password } = newQrFormData;
    if (studentId && mobile && password) {
       setQrData(`${studentId}|${mobile}|${password}`);
    } else {
       setQrData(''); // Clear QR if fields are incomplete
    }

  };

  const handleQrFormReset = () => {
    setQrFormData({ studentId: '', mobile: '', password: '' });
    setQrData('');
  };

  const downloadQRCode = () => {
    if (!qrCodeRef.current) {
        alert("QR Code element reference not found.");
        return;
    }
    if (!qrData) {
        alert("No QR code generated to download.");
        return;
    }

    // Find the actual QR code canvas element within the ref
    const qrCanvas = qrCodeRef.current.querySelector('canvas');
     if (!qrCanvas) {
         alert("QR Code canvas element not found.");
         return;
     }


    // Use the canvas directly if html2canvas is not strictly needed for styling/padding issues
    // If html2canvas is needed to capture the padding/border etc. use the original logic below
    const link = document.createElement('a');
    link.download = `student_${qrFormData.studentId || 'qrcode'}.png`;
    link.href = qrCanvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  };



  ///------upload image---///
const [uploading, setUploading] = useState(false);

// Add this function to handle file upload
const handleUploadQRImage = async () => {
    if (!qrCodeRef.current || !qrData) {
        alert("No QR code generated to upload");
        return;
    }

    try {
        setUploading(true);
        
        // Get the canvas element
        const qrCanvas = qrCodeRef.current.querySelector('canvas');
        if (!qrCanvas) {
            throw new Error("QR Code canvas not found");
        }

        // Convert canvas to base64 image
        const qrImageData = qrCanvas.toDataURL('image/png');

        // Upload to backend
        await uploadStudentQRImage(qrFormData.studentId, qrImageData);
        
        alert('QR code image uploaded successfully!');
    } catch (error) {
        console.error("Error uploading QR image:", error);
        alert(`Error uploading QR code: ${error.message || 'Please try again.'}`);
    } finally {
        setUploading(false);
    }
};





  const [retrievedQRData] = useState(null);


//for QR code retrieval
// const handleRetrieveQRCode = async () => {
//   if (!qrFormData.studentId) {
//     alert("Please enter a Student ID");
//     return;
//   }

//   try {
//     const response = await getStudentQRCode(qrFormData.studentId);
//     setQrData(response.qrData);
//     setRetrievedQRData(response.qrData);
//     alert("QR code retrieved successfully!");
//   } catch (error) {
//     console.error("Error retrieving QR code:", error);
//     alert(`Error retrieving QR code: ${error.message || 'Please try again.'}`);
//   }
// };


const handleFetchStudent = async () => {
  if (!qrFormData.studentId) {
      alert("Please enter a Student ID");
      return;
  }

  try {
      const student = await getStudentById(qrFormData.studentId);
      setQrFormData({
          studentId: student.studentId,
          mobile: student.mobile,
          password: student.password
      });
      alert(`Student found: ${student.firstName} ${student.lastName}, Grade: ${student.grade}`);
  } catch (error) {
      console.error("Error fetching student:", error);
      alert(`Error fetching student: ${error.message || 'Student not found.'}`);
  }
};



// Update the share function
const handleShareQRCode = async () => {
  if (!qrCodeRef.current || !qrData) {
    alert("No QR code generated to share.");
    return;
  }

  try {
    const qrCanvas = qrCodeRef.current.querySelector('canvas');
    if (!qrCanvas) {
      throw new Error("QR Code canvas not found");
    }

    const qrImageData = qrCanvas.toDataURL('image/png');
    const studentId = qrFormData.studentId;

    if (navigator.share) {
      // For mobile devices with share API
      await navigator.share({
        title: `Student QR Code - ${studentId}`,
        text: `QR Code for student ${studentId}`,
        files: [await (await fetch(qrImageData)).blob()]
      });
    } else {
      // Fallback for desktop browsers
      const emailSubject = `Student QR Code - ${studentId}`;
      const emailBody = `Please find attached the QR code for student ${studentId}.`;
      window.location.href = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    }
  } catch (error) {
    console.error("Error sharing QR code:", error);
    if (error.name !== 'AbortError') {
      alert("Couldn't share QR code. You can download it instead.");
    }
  }
};


  if (loading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error: </strong> {error}
        </div>
      </div>
    );
  }



//print qr code
const handlePrintQRCode = () => {
  if (!qrCodeRef.current || !qrData) {
    alert("No QR code generated to print.");
    return;
  }

  const qrCanvas = qrCodeRef.current.querySelector('canvas');
  if (!qrCanvas) {
    alert("QR Code canvas element not found for printing.");
    return;
  }

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Print QR Code</title>
        <style>
          body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
          .qr-container { text-align: center; }
          .qr-title { font-size: 18px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="qr-container">
          <div class="qr-title">Student QR Code - ID: ${qrFormData.studentId}</div>
          <img src="${qrCanvas.toDataURL('image/png')}" />
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  
  // Wait for the image to load before printing
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
};


  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Section 1: Student Registration */}
      <div className="bg-green-100 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Student Registration</h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Student ID */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Student ID</label>
              <input
                type="text" name="id" value={isGeneratingId ? 'Generating...' : formData.id} readOnly
                className="w-full p-2 border rounded-md bg-gray-100 text-gray-700"
                placeholder="Select grade to generate ID" required aria-busy={isGeneratingId}
              />
              {isGeneratingId && <div className="text-xs text-blue-500 mt-1">Fetching next ID...</div>}
            </div>

            {/* First Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">First Name</label>
              <input
                type="text" name="firstName" value={formData.firstName} onChange={handleChange}
                className="w-full p-2 border rounded-md" required
              />
            </div>

            {/* Last Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <input
                type="text" name="lastName" value={formData.lastName} onChange={handleChange}
                className="w-full p-2 border rounded-md" required
              />
            </div>

            {/* Grade */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Grade</label>
              <select
                name="grade" value={formData.grade} onChange={handleChange}
                className="w-full p-2 border rounded-md" required disabled={isGeneratingId}
              >
                <option value="">Select Grade</option>
                {gradesData.map(grade => (
                  <option key={grade.grade_id} value={grade.grade_id}>{grade.name}</option>
                ))}
              </select>
            </div>

            {/* Subjects */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Subjects (Select multiple)</label>
              <select
                name="subjects" multiple value={formData.subjects} onChange={handleSubjectChange}
                className="w-full p-2 border rounded-md h-auto min-h-[100px]" required
              >
                {subjectsData.map(subject => (
                  <option key={subject.subject_id} value={subject.subject_id}>
                    {subject.name} (Rs. {subject.fee})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>

            {/* Courses */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Courses (Optional)</label>
              <select
                name="courses" multiple value={formData.courses} onChange={handleCourseChange}
                className="w-full p-2 border rounded-md h-auto min-h-[100px]"
              >
                {coursesData.map(course => (
                  <option key={course.course_id} value={course.course_id}>
                    {course.name} (Rs. {course.fee})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password" name="password" value={formData.password} onChange={handleChange}
                className="w-full p-2 border rounded-md" required
              />
            </div>

            {/* Mobile No */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Mobile No</label>
              <input
                type="tel" name="mobile" value={formData.mobile} onChange={handleChange}
                className="w-full p-2 border rounded-md" required
              />
            </div>

            {/* Email */}
            <div className="mb-4 md:col-span-2">
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email" name="email" value={formData.email} onChange={handleChange}
                className="w-full p-2 border rounded-md" required
              />
            </div>
          </div>

          {/* Registration Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded"
              disabled={isGeneratingId}
            >
              Register
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: QR Code Generation */}
      <div className="bg-purple-100 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Student QR Code</h2> {/* Changed heading slightly */}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* QR Code Form (Inputs remain but no generate button) */}
          <div className="lg:w-1/2">
             <p className="text-gray-700 mb-4">
                 The QR Code below is automatically generated based on the Student ID
                 of the last successfully registered student.
            </p>
            <div className="grid grid-cols-1 gap-4">
                {/* Student ID */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Student ID</label>
                  <input
                    type="text" name="studentId" value={qrFormData.studentId} onChange={handleQrFormChange}
                    className="w-full p-2 border rounded-md bg-gray-100" readOnly // Made readOnly as auto-generated from registration
                  />
                </div>

                {/* Mobile No */}
                {/* <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Mobile No</label>
                  <input
                    type="tel" name="mobile" value={qrFormData.mobile} onChange={handleQrFormChange}
                    className="w-full p-2 border rounded-md bg-gray-100" readOnly // Made readOnly as auto-generated from registration
                  />
                </div> */}

                {/* Password */}
                {/* <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input
                    type="password" name="password" value={qrFormData.password} onChange={handleQrFormChange}
                    className="w-full p-2 border rounded-md bg-gray-100" readOnly // Made readOnly as auto-generated from registration
                  />
                </div> */}
             </div>

             <div className="mt-6">
                 <button
                    type="button"
                    onClick={handleQrFormReset}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded"
                 >
                    Clear QR Details
                 </button>
             </div>
          </div>

          {/* QR Code Display */}
          <div className="lg:w-1/2">
            <div className="bg-white p-6 rounded-lg shadow-inner h-full border border-gray-200 flex flex-col items-center justify-center">
              <h3 className="text-lg font-medium mb-4 text-center">Student QR Code</h3>
              
              {/* Student ID display */}
              {qrData && (
                <div className="mb-4 text-center">
                  <p className="font-semibold">Student ID:</p>
                  <p className="text-lg">{qrFormData.studentId}</p>
                </div>
              )}

              {/* QR Code Retrieval Controls */}
              <div className="flex gap-2 mb-4 w-full justify-center">
                <button
                  onClick={handleFetchStudent}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                >
                  Fetch Student
                </button>
                {/* <button
                  onClick={handleRetrieveQRCode}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm"
                >
                  Retrieve QR Code
                </button> */}
              </div>

              {/* QR Code Display */}
              <div ref={qrCodeRef} className="border-2 border-dashed border-gray-300 rounded-lg aspect-square flex items-center justify-center p-4 max-w-xs w-full">
                {qrData ? (
                  <>
                    <QRCodeCanvas
                      value={qrData}
                      size={256}
                      level="H"
                      includeMargin={false}
                    />
                    {retrievedQRData && (
                      <p className="text-xs text-green-600 mt-2">
                        Retrieved from database
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 text-center">
                    QR code will appear here after a student is registered or retrieved.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              {qrData && (
                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={downloadQRCode}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm"
                  >
                    Download
                  </button>
                  <button
                    onClick={handlePrintQRCode}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm"
                  >
                    Print
                  </button>
                  <button
                    onClick={handleUploadQRImage}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded text-sm"
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                  <button
                    onClick={handleShareQRCode}
                    className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-2 rounded text-sm"
                  >
                    Share
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



///////////////+++++++++++++++++++++++++++++++++++ manage attendance ++++++++++++++++++++++++++++////////////////////
const AttendanceManagement = () => {
  // QR Scanner State
  const [scanResult, setScanResult] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [scanMode, setScanMode] = useState('upload');
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Attendance State
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentData, setStudentData] = useState({
    studentId: '',
    firstName: '',
    lastName: '',
    grade: '',
    mobile: '',
    email: '',
    classes: []
  });
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [studentSubjects, setStudentSubjects] = useState([]);
  const [studentCourses, setStudentCourses] = useState([]);

  // Clean up webcam stream when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  // Fetch attendance records on mount
  useEffect(() => {
    const fetchAttendanceRecords = async () => {
      try {
        const records = await getAttendanceRecords();
        setAttendanceRecords(records);
      } catch (error) {
        setErrorMessage('Error fetching attendance records: ' + error);
      }
    };
    fetchAttendanceRecords();
  }, []);

  // Fetch subjects and courses when studentId changes
  useEffect(() => {
    const fetchStudentClasses = async () => {
      if (studentData.studentId) {
        try {
          const subjects = await getStudentSubjects(studentData.studentId);
          const courses = await getStudentCourses(studentData.studentId);
          setStudentSubjects(subjects || []);
          setStudentCourses(courses || []);
          setStudentData(prev => ({
            ...prev,
            classes: [
              ...(subjects || []).map(s => ({ id: s.subject_id, name: s.name, type: 'subject', selected: true })),
              ...(courses || []).map(c => ({ id: c.course_id, name: c.name, type: 'course', selected: true }))
            ]
          }));
        } catch (error) {
          setErrorMessage('Error fetching classes: ' + error);
          setStudentSubjects([]);
          setStudentCourses([]);
          setStudentData(prev => ({ ...prev, classes: [] }));
        }
      }
    };
    fetchStudentClasses();
  }, [studentData.studentId]);

  // Handle QR code file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setErrorMessage('');
    
    if (!file) return;
    
    if (!file.type.match('image.*')) {
      setErrorMessage('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => processImage(img);
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Process QR code data and populate student form
  const processQRData = async (qrData) => {
    try {
      let studentInfo;
      try {
        studentInfo = JSON.parse(qrData);
        if (!studentInfo.studentId) {
          throw new Error('Student ID missing in QR data');
        }
        setStudentData({
          studentId: studentInfo.studentId || '',
          firstName: studentInfo.firstName || '',
          lastName: studentInfo.lastName || '',
          grade: studentInfo.grade || '',
          mobile: studentInfo.mobile || '',
          email: studentInfo.email || '',
          classes: []
        });
        setScanResult(`Student: ${studentInfo.firstName} ${studentInfo.lastName}`);
        setErrorMessage('');
        setIsReadOnly(true);
      } catch (e) {
        const studentId = qrData;
        try {
          const student = await getStudentById(studentId);
          if (student) {
            setStudentData({
              studentId: student.studentId || '',
              firstName: student.firstName || '',
              lastName: student.lastName || '',
              grade: student.grade || '',
              mobile: student.mobile || '',
              email: student.email || '',
              classes: []
            });
            setScanResult(`Student: ${student.firstName} ${student.lastName}`);
            setErrorMessage('');
            setIsReadOnly(true);
          } else {
            throw new Error('Student not found');
          }
        } catch (error) {
          setErrorMessage('Error fetching student data: ' + error);
          setScanResult('');
          setStudentData({
            studentId: '',
            firstName: '',
            lastName: '',
            grade: '',
            mobile: '',
            email: '',
            classes: []
          });
          setIsReadOnly(false);
          setStudentSubjects([]);
          setStudentCourses([]);
        }
      }
    } catch (e) {
      setErrorMessage('Invalid QR code data');
      setScanResult('');
      setIsReadOnly(false);
    }
  };

  // Process image to find QR code
  const processImage = (img) => {
    const canvas = canvasRef.current;
    canvas.width = img.width;
    canvas.height = img.height;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    
    if (code) {
      setScanResult(code.data);
      setErrorMessage('');
      processQRData(code.data);
    } else {
      setErrorMessage('No QR code found in the image');
      setScanResult('');
      setIsReadOnly(false);
    }
  };

  // Start webcam scanning
  const startWebcamScan = async () => {
    try {
      setErrorMessage('');
      setIsScanning(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }
      });
      
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      
      requestAnimationFrame(scanVideoFrame);
    } catch (error) {
      setIsScanning(false);
      setErrorMessage(`Cannot access camera: ${error.message}`);
    }
  };

  // Stop webcam scanning
  const stopWebcamScan = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  // Process video frames to find QR code
  const scanVideoFrame = () => {
    if (!isScanning) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        setScanResult(code.data);
        processQRData(code.data);
        stopWebcamScan();
        return;
      }
    }
    
    requestAnimationFrame(scanVideoFrame);
  };

  // Switch between scanning modes
  const switchScanMode = (mode) => {
    if (mode === scanMode) return;
    
    if (scanMode === 'webcam' && isScanning) {
      stopWebcamScan();
    }
    
    setScanMode(mode);
    setScanResult('');
    setErrorMessage('');
    setIsReadOnly(false);
    
    if (mode === 'webcam') {
      startWebcamScan();
    }
  };

  // Filter records based on search term
  const filteredRecords = attendanceRecords.filter(record =>
    record.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle checkbox changes
  const handleCheckboxChange = (classId) => {
    setStudentData(prev => ({
      ...prev,
      classes: prev.classes.map(cls => 
        cls.id === classId ? { ...cls, selected: !cls.selected } : cls
      )
    }));
  };

  // Format date with time
  const getCurrentDateTime = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const time = now.toTimeString().split(' ')[0]; // HH:MM:SS
    return `${date} ${time}`;
  };

  // Mark attendance and save to backend
  const markAttendance = async () => {
    if (!studentData.studentId) {
      alert('Please scan a QR code to select a student.');
      return;
    }

    const dateTime = getCurrentDateTime();
    
    const newRecords = studentData.classes
      .filter(cls => cls.selected)
      .map(cls => ({
        studentId: studentData.studentId,
        classId: cls.id,
        classType: cls.type,
        className: cls.name,
        date: dateTime,
        status: 'present',
        fullName: `${studentData.firstName} ${studentData.lastName}`,
        grade: studentData.grade
      }));

    if (newRecords.length === 0) {
      alert('Please select at least one class to mark attendance.');
      return;
    }

    try {
      const response = await saveAttendanceRecords(newRecords);
      setAttendanceRecords(prev => {
        const updatedRecords = prev.filter(record => 
          !newRecords.some(newRec => 
            newRec.studentId === record.studentId && 
            newRec.classId === record.classId && 
            newRec.date.split(' ')[0] === record.date.split(' ')[0]
          )
        );
        return [...updatedRecords, ...newRecords.map((rec, index) => ({
          ...rec,
          id: response.inserted > 0 ? prev.length + index + 1 : rec.id
        }))];
      });
      alert(`Attendance marked successfully! (${response.inserted} inserted, ${response.updated} updated)`);
    } catch (error) {
      setErrorMessage('Error saving attendance: ' + error);
      alert('Failed to save attendance records.');
    }
  };

  // Delete attendance record
  const deleteAttendanceRecord = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) {
      return;
    }
    
    try {
      await deleteAttendanceRecordById(recordId);
      setAttendanceRecords(prev => prev.filter(record => record.id !== recordId));
      alert('Attendance record deleted successfully!');
    } catch (error) {
      setErrorMessage('Error deleting attendance record: ' + error);
      alert('Failed to delete attendance record.');
    }
  };

  // Cancel attendance record
  const cancelAttendanceRecord = async (recordId) => {
    if (!window.confirm('Are you sure you want to mark this attendance as absent?')) {
      return;
    }
    
    try {
      const record = attendanceRecords.find(r => r.id === recordId);
      if (!record) return;
      
      const updatedRecord = { ...record, status: 'absent' };
      await updateAttendanceRecord(updatedRecord);
      setAttendanceRecords(prev => prev.map(r => 
        r.id === recordId ? updatedRecord : r
      ));
      alert('Attendance record marked as absent!');
    } catch (error) {
      setErrorMessage('Error cancelling attendance: ' + error);
      alert('Failed to cancel attendance record.');
    }
  };

  const handleInputChange = (e) => {
    if (isReadOnly) return;
    const { name, value } = e.target;
    setStudentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Format date for display
  const formatDisplayDate = (dateTime) => {
    if (!dateTime) return '';
    const [date, time] = dateTime.split(' ');
    return `${date} ${time ? time.substring(0, 5) : ''}`; // Show date and time (HH:MM)
  };

  return (
    <div className="bg-blue-50 p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Attendance Management</h2>
      </div>

      {/* QR Code Scanner Section */}
      <div className="mb-8 bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Scan Student QR Code</h3>
        
        <div className="flex mb-6 border-b">
          <button
            onClick={() => switchScanMode('upload')}
            className={`py-2 px-4 ${scanMode === 'upload'
              ? 'border-b-2 border-blue-500 text-blue-500 font-medium'
              : 'text-gray-500'}`}
          >
            Upload QR Image
          </button>
          <button
            onClick={() => switchScanMode('webcam')}
            className={`py-2 px-4 ${scanMode === 'webcam'
              ? 'border-b-2 border-blue-500 text-blue-500 font-medium'
              : 'text-gray-500'}`}
          >
            Use Webcam
          </button>
        </div>
        
        {scanMode === 'upload' && (
          <div className="mb-6">
            <div className="flex items-center justify-center">
              <label className="flex flex-col items-center px-4 py-6 bg-white text-blue-500 rounded-lg shadow-lg tracking-wide uppercase border border-blue-500 cursor-pointer hover:bg-blue-500 hover:text-white">
                <span className="mt-2 text-base leading-normal">Select QR Image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                />
              </label>
            </div>
          </div>
        )}
        
        {scanMode === 'webcam' && (
          <div className="mb-6">
            <div className="relative flex justify-center">
              <div className="w-64 h-64 bg-black overflow-hidden rounded-lg">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
              </div>
              <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
                <div className="w-64 h-64 border-2 border-blue-500 border-dashed rounded-lg"></div>
              </div>
            </div>
            <div className="mt-4 text-center">
              {isScanning ? (
                <p className="text-sm text-gray-600">Scanning for QR Code...</p>
              ) : (
                <button
                  onClick={startWebcamScan}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Start Scanning
                </button>
              )}
            </div>
          </div>
        )}
        
        <canvas ref={canvasRef} className="hidden"></canvas>
        
        {errorMessage && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {errorMessage}
          </div>
        )}
        
        {scanResult && (
          <div className="mt-4 p-3 bg-green-100 text-green-800 rounded">
            <p>{scanResult}</p>
            <p className="text-sm mt-1">Student data has been auto-filled below from QR code.</p>
          </div>
        )}
      </div>

      {/* Mark Attendance Section */}
      <div className="mb-8 bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Mark Attendance</h3>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
          <h4 className="font-semibold text-lg mb-4">Student Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
              <input
                type="text"
                name="studentId"
                value={studentData.studentId}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                placeholder="Scan QR code to fill"
                readOnly={isReadOnly}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                name="firstName"
                value={studentData.firstName}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                placeholder="Scan QR code to fill"
                readOnly={isReadOnly}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={studentData.lastName}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                placeholder="Scan QR code to fill"
                readOnly={isReadOnly}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
              <input
                type="text"
                name="grade"
                value={studentData.grade}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                placeholder="Scan QR code to fill"
                readOnly={isReadOnly}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
              <input
                type="text"
                name="mobile"
                value={studentData.mobile}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                placeholder="Scan QR code to fill"
                readOnly={isReadOnly}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={studentData.email}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                placeholder="Scan QR code to fill"
                readOnly={isReadOnly}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Registered Classes</label>
              <div className="space-y-2">
                {studentData.classes.length > 0 ? (
                  studentData.classes.map(cls => (
                    <div key={cls.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={cls.id}
                        checked={cls.selected}
                        onChange={() => handleCheckboxChange(cls.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={cls.id} className="ml-2 block text-sm text-gray-700">
                        {cls.name} ({cls.type})
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No registered classes found</p>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={() => {
                setStudentData({
                  studentId: '',
                  firstName: '',
                  lastName: '',
                  grade: '',
                  mobile: '',
                  email: '',
                  classes: []
                });
                setStudentSubjects([]);
                setStudentCourses([]);
                setScanResult('');
                setErrorMessage('');
                setIsReadOnly(false);
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Clear
            </button>
            <button
              onClick={markAttendance}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              disabled={!studentData.studentId}
            >
              Mark Attendance
            </button>
          </div>
        </div>
      </div>

      {/* View Attendance Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">View Attendance Records</h3>
        
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by Student ID or Name..."
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-3 top-3.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto mb-6">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b text-left">Student ID</th>
                <th className="py-2 px-4 border-b text-left">Full Name</th>
                <th className="py-2 px-4 border-b text-left">Grade</th>
                <th className="py-2 px-4 border-b text-left">Subject</th>
                <th className="py-2 px-4 border-b text-left">Date & Time</th>
                <th className="py-2 px-4 border-b text-left">Status</th>
                <th className="py-2 px-4 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{record.studentId}</td>
                  <td className="py-2 px-4 border-b">{record.fullName}</td>
                  <td className="py-2 px-4 border-b">{record.grade}</td>
                  <td className="py-2 px-4 border-b">{record.className}</td>
                  <td className="py-2 px-4 border-b">{formatDisplayDate(record.date)}</td>
                  <td className="py-2 px-4 border-b">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      record.status === 'present' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b whitespace-nowrap">
                    <button
                      onClick={() => deleteAttendanceRecord(record.id)}
                      className="text-red-500 hover:text-white hover:bg-red-500 px-3 py-1 border border-red-500 rounded mr-2 text-sm"
                      title="Delete Record"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => cancelAttendanceRecord(record.id)}
                      className="text-yellow-500 hover:text-white hover:bg-yellow-500 px-3 py-1 border border-yellow-500 rounded text-sm"
                      title="Cancel Record"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};



///////++++++++++++++++++++++++++++++++++++++  payment management  ++++++++++++++++++++//////////////////////////
const PaymentManagement = () => {
  // QR Scanner State
  const [scanResult, setScanResult] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [scanMode, setScanMode] = useState('upload');
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paidInvoice, setPaidInvoice] = useState(null);

  // Payment State
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentData, setStudentData] = useState({
    studentId: '',
    firstName: '',
    lastName: '',
    grade: '',
    mobile: '',
    email: '',
    classes: []
  });
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [studentSubjects, setStudentSubjects] = useState([]);
  const [studentCourses, setStudentCourses] = useState([]);
  const [selectedClass, setSelectedClass] = useState({ id: '', type: '', name: '', fee: 0 });
  const [invoiceData, setInvoiceData] = useState(null);
  const [allClasses, setAllClasses] = useState([]);

  // Email state
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailFormData, setEmailFormData] = useState({
    to: '',
    subject: '',
    message: '',
    isSending: false,
    sendError: null,
    sendSuccess: false
  });

  // Fetch payment records and all classes on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [records, classes] = await Promise.all([
          getPaymentRecords(),
          getClasses()
        ]);
        setPaymentRecords(records);
        setAllClasses(classes);
      } catch (error) {
        setErrorMessage('Error fetching initial data: ' + error);
      }
    };
    fetchInitialData();
  }, []);

  // Clean up webcam stream when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  // Fetch subjects and courses when studentId changes
  useEffect(() => {
    const fetchStudentClasses = async () => {
      if (studentData.studentId) {
        try {
          const [subjects, courses] = await Promise.all([
            getStudentSubjects(studentData.studentId),
            getStudentCourses(studentData.studentId)
          ]);

          const enhancedSubjects = (subjects || []).map(subject => {
            const classInfo = allClasses.find(c => 
              c.subject_id === subject.subject_id && 
              c.grade_id === `GR${studentData.grade.padStart(2, '0')}`
            );
            return {
              ...subject,
              fee: classInfo?.fee || subject.fee || 0
            };
          });

          setStudentSubjects(enhancedSubjects);
          setStudentCourses(courses || []);
          setStudentData(prev => ({
            ...prev,
            classes: [
              ...enhancedSubjects.map(s => ({ 
                id: s.subject_id, 
                name: s.name, 
                type: 'subject', 
                fee: s.fee 
              })),
              ...(courses || []).map(c => ({ 
                id: c.course_id, 
                name: c.name, 
                type: 'course', 
                fee: c.fee || 0 
              }))
            ]
          }));
        } catch (error) {
          setErrorMessage('Error fetching classes: ' + error);
          setStudentSubjects([]);
          setStudentCourses([]);
          setStudentData(prev => ({ ...prev, classes: [] }));
        }
      }
    };
    fetchStudentClasses();
  }, [studentData.studentId, studentData.grade, allClasses]);

  // Handle QR code file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setErrorMessage('');
    
    if (!file) return;
    
    if (!file.type.match('image.*')) {
      setErrorMessage('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => processImage(img);
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Process QR code data and populate student form
  const processQRData = async (qrData) => {
    try {
      let studentInfo;
      try {
        studentInfo = JSON.parse(qrData);
        if (!studentInfo.studentId) {
          throw new Error('Student ID missing in QR data');
        }
        setStudentData({
          studentId: studentInfo.studentId || '',
          firstName: studentInfo.firstName || '',
          lastName: studentInfo.lastName || '',
          grade: studentInfo.grade || '',
          mobile: studentInfo.mobile || '',
          email: studentInfo.email || '',
          classes: []
        });
        setScanResult(`Student: ${studentInfo.firstName} ${studentInfo.lastName}`);
        setErrorMessage('');
        setIsReadOnly(true);
      } catch (e) {
        const studentId = qrData;
        try {
          const student = await getStudentById(studentId);
          if (student) {
            setStudentData({
              studentId: student.studentId || '',
              firstName: student.firstName || '',
              lastName: student.lastName || '',
              grade: student.grade || '',
              mobile: student.mobile || '',
              email: student.email || '',
              classes: []
            });
            setScanResult(`Student: ${student.firstName} ${student.lastName}`);
            setErrorMessage('');
            setIsReadOnly(true);
          } else {
            throw new Error('Student not found');
          }
        } catch (error) {
          setErrorMessage('Error fetching student data: ' + error);
          setScanResult('');
          setStudentData({
            studentId: '',
            firstName: '',
            lastName: '',
            grade: '',
            mobile: '',
            email: '',
            classes: []
          });
          setIsReadOnly(false);
          setStudentSubjects([]);
          setStudentCourses([]);
        }
      }
    } catch (e) {
      setErrorMessage('Invalid QR code data');
      setScanResult('');
      setIsReadOnly(false);
    }
  };

  // Process image to find QR code
  const processImage = (img) => {
    const canvas = canvasRef.current;
    canvas.width = img.width;
    canvas.height = img.height;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    
    if (code) {
      setScanResult(code.data);
      setErrorMessage('');
      processQRData(code.data);
    } else {
      setErrorMessage('No QR code found in the image');
      setScanResult('');
      setIsReadOnly(false);
    }
  };

  // Start webcam scanning
  const startWebcamScan = async () => {
    try {
      setErrorMessage('');
      setIsScanning(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        const video = videoRef.current;
        const aspectRatio = video.videoWidth / video.videoHeight;
        let width, height;
        
        if (aspectRatio > 1) {
          height = Math.min(video.videoHeight, 400);
          width = height;
        } else {
          width = Math.min(video.videoWidth, 400);
          height = width;
        }
        
        setVideoDimensions({ width, height });
      };
      videoRef.current.play();
      
      requestAnimationFrame(scanVideoFrame);
    } catch (error) {
      setIsScanning(false);
      setErrorMessage(`Cannot access camera: ${error.message}`);
    }
  };

  // Stop webcam scanning
  const stopWebcamScan = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  // Process video frames to find QR code
  const scanVideoFrame = () => {
    if (!isScanning) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        setScanResult(code.data);
        processQRData(code.data);
        stopWebcamScan();
        return;
      }
    }
    
    requestAnimationFrame(scanVideoFrame);
  };

  // Switch between scanning modes
  const switchScanMode = (mode) => {
    if (mode === scanMode) return;
    
    if (scanMode === 'webcam' && isScanning) {
      stopWebcamScan();
    }
    
    setScanMode(mode);
    setScanResult('');
    setErrorMessage('');
    setIsReadOnly(false);
    
    if (mode === 'webcam') {
      startWebcamScan();
    }
  };

  // Generate invoice and proceed to payment page
  const proceedpayment = () => {
    if (!studentData.studentId || !selectedClass.id) {
      setErrorMessage('Please select a student and a class');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const invoiceId = `INV${Math.floor(1000 + Math.random() * 9000)}`;

    const newInvoice = {
      student_id: studentData.studentId,
      invoice_id: invoiceId,
      class_id: selectedClass.id,
      class_type: selectedClass.type,
      amount: selectedClass.fee,
      date: today,
      status: 'pending'
    };

    setInvoiceData(newInvoice);
    setShowCheckout(true);
  };

  // Handle payment completion
  const handlePaymentComplete = async (success) => {
    setShowCheckout(false);
    if (success) {
      await confirmPayment();
    }
  };

  // Confirm payment
  const confirmPayment = async () => {
    if (!invoiceData) return;

    try {
      const updatedInvoice = {
        ...invoiceData,
        status: 'paid',
        payment_date: new Date().toISOString()
      };

      const response = await addPaymentRecord(updatedInvoice);
      
      if (!response) {
        throw new Error('No response from server');
      }

      const newRecord = {
        ...response,
        fullName: `${studentData.firstName} ${studentData.lastName}`,
        grade: studentData.grade,
        class_name: selectedClass.name
      };

      setPaymentRecords(prev => [...prev, newRecord]);
      setPaidInvoice(newRecord);
      setInvoiceData(null);
      resetForm();
    } catch (error) {
      console.error('Payment confirmation error:', error);
      setErrorMessage('Error confirming payment: ' + (error.message || 'Unknown error'));
    }
  };

  const resetForm = () => {
    setStudentData({
      studentId: '',
      firstName: '',
      lastName: '',
      grade: '',
      mobile: '',
      email: '',
      classes: []
    });
    setStudentSubjects([]);
    setStudentCourses([]);
    setSelectedClass({ id: '', type: '', name: '', fee: 0 });
    setScanResult('');
    setIsReadOnly(false);
  };

  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setStudentData({
      studentId: record.student_id,
      firstName: record.fullName.split(' ')[0],
      lastName: record.fullName.split(' ')[1] || '',
      grade: record.grade,
      mobile: '',
      email: '',
      classes: []
    });
    setSelectedClass({
      id: record.class_id,
      type: record.class_type,
      name: record.class_name,
      fee: record.amount
    });
    setIsReadOnly(true);
  };

  const handleUpdateRecord = async () => {
    if (!editingRecord) return;

    try {
      const updatedData = {
        class_id: selectedClass.id,
        class_type: selectedClass.type,
        amount: selectedClass.fee,
        status: 'paid'
      };

      const updatedRecord = await updatePaymentRecord(editingRecord.invoice_id, updatedData);
      
      setPaymentRecords(prev => 
        prev.map(record => 
          record.invoice_id === updatedRecord.invoice_id ? updatedRecord : record
        )
      );
      
      setEditingRecord(null);
      resetForm();
      alert('Record updated successfully!');
    } catch (error) {
      setErrorMessage('Error updating record: ' + error);
    }
  };

  const handleDeleteRecord = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to delete this payment record?')) return;

    try {
      await deletePaymentRecord(invoiceId);
      setPaymentRecords(prev => prev.filter(record => record.invoice_id !== invoiceId));
      alert('Record deleted successfully!');
    } catch (error) {
      setErrorMessage('Error deleting record: ' + error);
    }
  };

  const cancelEdit = () => {
    setEditingRecord(null);
    resetForm();
  };

  // Generate invoice as HTML
  const generateInvoiceHTML = (invoice) => {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px;">
          <div style="font-size: 24px; font-weight: bold; color: #2c3e50;">INVOICE</div>
          <div>${invoice.invoice_id}</div>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div style="width: 48%;">
            <h3>From:</h3>
            <p>Wismin Academy</p>
            <p>96/1 Education street</p>
            <p>Kany Road, Kurunegala</p>
            <p>Phone: +94 223458762</p>
            <p>Email: support@wismin.com</p>
          </div>
          
          <div style="width: 48%;">
            <h3>To:</h3>
            <p>${invoice.fullName}</p>
            <p>Student ID: ${invoice.student_id}</p>
            <p>Grade: ${invoice.grade}</p>
            <p>Date: ${new Date(invoice.payment_date || invoice.date).toLocaleString()}</p>
          </div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: left; background-color: #f2f2f2;">Description</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: left; background-color: #f2f2f2;">Class Type</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: left; background-color: #f2f2f2;">Amount (LKR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ddd; padding: 10px; text-align: left;">${invoice.class_name}</td>
              <td style="border: 1px solid #ddd; padding: 10px; text-align: left;">${invoice.class_type}</td>
              <td style="border: 1px solid #ddd; padding: 10px; text-align: left;">${invoice.amount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        
        <div style="text-align: right; font-weight: bold; font-size: 18px;">
          Total: LKR ${invoice.amount.toFixed(2)}
        </div>
        
        <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #777; border-top: 2px solid #eee; padding-top: 20px;">
          <p>Thank you for your payment!</p>
          <p>This is an automated invoice. No signature required.</p>
        </div>
      </div>
    `;
  };

  // Generate invoice as HTML file
  const generateInvoicePDF = async (invoice) => {
    const invoiceHTML = generateInvoiceHTML(invoice);
    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${invoice.invoice_id}.html`;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  // Download invoice as PDF
  const downloadInvoice = async () => {
    if (!paidInvoice) return;
    
    setIsGeneratingPDF(true);
    try {
      await generateInvoicePDF(paidInvoice);
    } catch (error) {
      setErrorMessage('Error generating PDF: ' + error.message);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Share invoice
  const shareInvoice = () => {
    if (!paidInvoice) return;
    setEmailFormData({
      to: studentData.email || '',
      subject: `Payment Receipt - Invoice ${paidInvoice.invoice_id}`,
      message: `Dear ${paidInvoice.fullName},\n\nPlease find your payment details attached.\n\nThank you for your payment!`,
      isSending: false,
      sendError: null,
      sendSuccess: false
    });
    setShowEmailForm(true);
  };

  // Handle sending email
  const handleSendEmail = async () => {
    if (!paidInvoice) return;
    
    setEmailFormData(prev => ({ ...prev, isSending: true, sendError: null }));
    
    try {
      // Create a mock PDF file for the invoice
      const invoiceHTML = generateInvoiceHTML(paidInvoice);
      const blob = new Blob([invoiceHTML], { type: 'text/html' });
      
      // Create FormData to simulate file upload
      const formData = new FormData();
      formData.append('to', emailFormData.to);
      formData.append('subject', emailFormData.subject);
      formData.append('message', emailFormData.message);
      formData.append('invoice', blob, `invoice_${paidInvoice.invoice_id}.html`);
      
      // Simulate API call (replace with your actual API endpoint)
      const response = await fetch('/api/send-invoice-email', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to send email');
      }
      
      setEmailFormData(prev => ({ 
        ...prev, 
        isSending: false, 
        sendSuccess: true 
      }));
      
      // Close the email form after 2 seconds
      setTimeout(() => {
        setShowEmailForm(false);
        setEmailFormData({
          to: '',
          subject: '',
          message: '',
          isSending: false,
          sendError: null,
          sendSuccess: false
        });
      }, 2000);
    } catch (error) {
      setEmailFormData(prev => ({
        ...prev,
        isSending: false,
        sendError: error.message || 'Failed to send email'
      }));
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name !== 'studentId' && isReadOnly) return;
    setStudentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Filter payment records
  const filteredRecords = paymentRecords.filter(record =>
    record.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showCheckout) {
    return (
      <PayHereCheckout
        invoiceData={invoiceData}
        studentData={studentData}
        selectedClass={selectedClass}
        onComplete={handlePaymentComplete}
        onCancel={() => setShowCheckout(false)}
      />
    );
  }

  return (
    <div className="bg-blue-50 p-6 rounded-lg shadow-md">
      {/* Email sending modal */}
      {showEmailForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Email Invoice</h3>
            
            {emailFormData.sendSuccess ? (
              <div className="text-center py-4">
                <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <p className="mt-2 text-green-600">Email sent successfully!</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <input
                    type="email"
                    value={emailFormData.to}
                    onChange={(e) => setEmailFormData(prev => ({ ...prev, to: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Recipient email"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={emailFormData.subject}
                    onChange={(e) => setEmailFormData(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Email subject"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    value={emailFormData.message}
                    onChange={(e) => setEmailFormData(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md h-24"
                    placeholder="Email message"
                    required
                  />
                </div>
                
                {emailFormData.sendError && (
                  <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">
                    {emailFormData.sendError}
                  </div>
                )}
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowEmailForm(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                    disabled={emailFormData.isSending}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendEmail}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
                    disabled={emailFormData.isSending}
                  >
                    {emailFormData.isSending ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : 'Send Email'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Success Payment Modal */}
      {paidInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="text-center mb-6">
              <svg className="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <h3 className="text-xl font-bold mt-4">Payment Successful!</h3>
              <p className="text-gray-600 mt-2">Invoice #{paidInvoice.invoice_id} has been paid successfully.</p>
              <p className="text-sm text-gray-500 mt-1">
                Paid on: {new Date(paidInvoice.payment_date).toLocaleString()}
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold">LKR {paidInvoice.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Student:</span>
                <span className="font-semibold">{paidInvoice.fullName}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Student ID:</span>
                <span className="font-semibold">{paidInvoice.student_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Class:</span>
                <span className="font-semibold">{paidInvoice.class_name} ({paidInvoice.class_type})</span>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3">
              <button
                onClick={downloadInvoice}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center justify-center"
                disabled={isGeneratingPDF}
              >
                {isGeneratingPDF ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                    Download Invoice
                  </>
                )}
              </button>
              
              <button
                onClick={shareInvoice}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                Email Invoice
              </button>
              
              <button
                onClick={() => setPaidInvoice(null)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Payment Management</h2>
      </div>

      {/* QR Code Scanner Section */}
      <div className="mb-8 bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Scan Student QR Code</h3>
        
        <div className="flex mb-6 border-b">
          <button
            onClick={() => switchScanMode('upload')}
            className={`py-2 px-4 ${scanMode === 'upload'
              ? 'border-b-2 border-blue-500 text-blue-500 font-medium'
              : 'text-gray-500'}`}
          >
            Upload QR Image
          </button>
          <button
            onClick={() => switchScanMode('webcam')}
            className={`py-2 px-4 ${scanMode === 'webcam'
              ? 'border-b-2 border-blue-500 text-blue-500 font-medium'
              : 'text-gray-500'}`}
          >
            Use Webcam
          </button>
        </div>
        
        {scanMode === 'upload' && (
          <div className="mb-6">
            <div className="flex items-center justify-center">
              <label className="flex flex-col items-center px-4 py-6 bg-white text-blue-500 rounded-lg shadow-lg tracking-wide uppercase border border-blue-500 cursor-pointer hover:bg-blue-500 hover:text-white">
                <svg className="w-8 h-8" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4-4-4 4h3v3h2v-3z" />
                </svg>
                <span className="mt-2 text-base leading-normal">Select QR Image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                />
              </label>
            </div>
          </div>
        )}
        
        {scanMode === 'webcam' && (
          <div className="mb-6">
            <div className="relative flex justify-center">
              <div className="relative" style={{ width: videoDimensions.width, height: videoDimensions.height }}>
                <video
                  ref={videoRef}
                  className="w-full h-full bg-black object-cover"
                  muted
                  playsInline
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <div className="absolute inset-0 border-4 border-blue-500 rounded-lg pointer-events-none"></div>
              </div>
            </div>
            <div className="mt-4 text-center">
              {isScanning ? (
                <p className="text-sm text-gray-600">Scanning for QR Code...</p>
              ) : (
                <button
                  onClick={startWebcamScan}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Start Scanning
                </button>
              )}
            </div>
          </div>
        )}
        
        <canvas ref={canvasRef} className="hidden"></canvas>
        
        {errorMessage && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {errorMessage}
          </div>
        )}
        
        {scanResult && (
          <div className="mt-4 p-3 bg-green-100 text-green-800 rounded">
            <p>{scanResult}</p>
            <p className="text-sm mt-1">Student data has been auto-filled below from QR code.</p>
          </div>
        )}
      </div>

      {/* Process Payment Section */}
      <div className="mb-8 bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Process Payment</h3>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
          <h4 className="font-semibold text-lg mb-4">Student Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
              <input
                type="text"
                name="studentId"
                value={studentData.studentId}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Enter student ID or scan QR code"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                name="firstName"
                value={studentData.firstName}
                onChange={handleInputChange}
                className={`w-full p-2 border border-gray-300 rounded-md ${isReadOnly ? 'bg-gray-100' : ''}`}
                placeholder="Scan QR code to fill"
                readOnly={isReadOnly}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={studentData.lastName}
                onChange={handleInputChange}
                className={`w-full p-2 border border-gray-300 rounded-md ${isReadOnly ? 'bg-gray-100' : ''}`}
                placeholder="Scan QR code to fill"
                readOnly={isReadOnly}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
              <input
                type="text"
                name="grade"
                value={studentData.grade}
                onChange={handleInputChange}
                className={`w-full p-2 border border-gray-300 rounded-md ${isReadOnly ? 'bg-gray-100' : ''}`}
                placeholder="Scan QR code to fill"
                readOnly={isReadOnly}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
              <input
                type="text"
                name="mobile"
                value={studentData.mobile}
                onChange={handleInputChange}
                className={`w-full p-2 border border-gray-300 rounded-md ${isReadOnly ? 'bg-gray-100' : ''}`}
                placeholder="Scan QR code to fill"
                readOnly={isReadOnly}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={studentData.email}
                onChange={handleInputChange}
                className={`w-full p-2 border border-gray-300 rounded-md ${isReadOnly ? 'bg-gray-100' : ''}`}
                placeholder="Scan QR code to fill"
                readOnly={isReadOnly}
              />
            </div>
            <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select subject for Payment</label>
            <select
              value={selectedClass.id ? `${selectedClass.id}|${selectedClass.type}` : ''}
              onChange={(e) => {
                const [id, type] = e.target.value.split('|');
                const classData = type === 'subject'
                  ? studentSubjects.find(s => s.subject_id === id)
                  : studentCourses.find(c => c.course_id === id);
                setSelectedClass({
                  id,
                  type,
                  name: classData?.name || '',
                  fee: classData?.fee || 0
                });
              }}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select a subject</option>
              {studentSubjects.map(subject => (
                <option key={subject.subject_id} value={`${subject.subject_id}|subject`}>
                  {subject.name} 
                </option>
              ))}
              {studentCourses.map(course => (
                <option key={course.course_id} value={`${course.course_id}|course`}>
                  {course.name} (Fee: RS: {course.fee || 0})
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Class Fee (RS)</label>
            <input
              type="number"
              value={selectedClass.fee || ''}
              readOnly
              className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
              placeholder="Fee amount"
            />
          </div>
          </div>
          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={() => {
                setStudentData({
                  studentId: '',
                  firstName: '',
                  lastName: '',
                  grade: '',
                  mobile: '',
                  email: '',
                  classes: []
                });
                setStudentSubjects([]);
                setStudentCourses([]);
                setSelectedClass({ id: '', type: '', name: '', fee: 0 });
                setScanResult('');
                setErrorMessage('');
                setInvoiceData(null);
                setIsReadOnly(false);
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Clear
            </button>
            <button
              onClick={proceedpayment}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              disabled={!studentData.studentId || !selectedClass.id}
            >
              Payment
            </button>
          </div>
        </div>

        {/* Invoice Preview */}
       {invoiceData && (
  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow mt-4">
          <h4 className="font-semibold text-gray-800 mb-4 text-center">INVOICE</h4>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm"><span className="font-medium">Invoice ID:</span> {invoiceData.invoice_id}</p>
              <p className="text-sm"><span className="font-medium">Date:</span> {invoiceData.date}</p>
            </div>
            <div className="text-right">
              <p className="text-sm"><span className="font-medium">Status:</span>
                <span className="ml-2 px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                  {invoiceData.status}
                </span>
              </p>
            </div>
          </div>
          <div className="border-t border-b border-gray-200 py-4 mb-4">
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <p className="font-medium">Student Details:</p>
                <p>{studentData.firstName} {studentData.lastName}</p>
                <p>ID: {invoiceData.student_id}</p>
                <p>Grade: {studentData.grade}</p>
                <p>Subject: {selectedClass.name} ({invoiceData.class_type})</p>
              </div>
              <div className="text-right">
                <p className="font-medium">Payment Details:</p>
                <p>Amount: RS:{invoiceData.amount}</p>
                <p>Due Date: {invoiceData.date}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add loading spinner */}
      {isGeneratingPDF && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Processing document...</span>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* View Payment Records Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">View Payment Records</h3>
        
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by Student ID or Name..."
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-3 top-3.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto mb-6">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b text-left">Invoice ID</th>
                <th className="py-2 px-4 border-b text-left">Student ID</th>
                <th className="py-2 px-4 border-b text-left">Full Name</th>
                <th className="py-2 px-4 border-b text-left">Grade</th>
                <th className="py-2 px-4 border-b text-left">Class</th>
                <th className="py-2 px-4 border-b text-left">Date</th>
                <th className="py-2 px-4 border-b text-left">Amount</th>
                <th className="py-2 px-4 border-b text-left">Status</th>
                <th className="py-2 px-4 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
            {filteredRecords.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">{record.invoice_id}</td>
                <td className="py-2 px-4 border-b">{record.student_id}</td>
                <td className="py-2 px-4 border-b">{record.fullName}</td>
                <td className="py-2 px-4 border-b">{record.grade}</td>
                <td className="py-2 px-4 border-b">{record.class_name} ({record.class_type})</td>
                <td className="py-2 px-4 border-b">{record.date}</td>
                <td className="py-2 px-4 border-b">RS{record.amount}</td>
                <td className="py-2 px-4 border-b">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    record.status === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {record.status}
                  </span>
                </td>
                <td className="py-2 px-4 border-b">
                 <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditRecord(record)}
                    className="text-yellow-500 hover:text-white hover:bg-amber-400 px-2 py-1 border border-yellow-500 rounded"
                    title="Edit Record"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRecord(record.invoice_id)}
                    className="text-red-500 hover:text-white hover:bg-red-500 px-2 py-1 border border-red-500 rounded"
                    title="Delete Record"
                  >
                    Delete
                  </button>
                </div>
                </td>
              </tr>
            ))}
          </tbody>
            
          </table>
        </div>
      </div>
      {editingRecord && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
          <h3 className="text-xl font-bold mb-4">Edit Payment Record</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              value={selectedClass.id ? `${selectedClass.id}|${selectedClass.type}` : ''}
              onChange={(e) => {
                const [id, type] = e.target.value.split('|');
                const classData = type === 'subject'
                  ? studentSubjects.find(s => s.subject_id === id)
                  : studentCourses.find(c => c.course_id === id);
                setSelectedClass({
                  id,
                  type,
                  name: classData?.name || '',
                  fee: classData?.fee || 0
                });
              }}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select a class</option>
              {studentSubjects.map(subject => (
                <option key={subject.subject_id} value={`${subject.subject_id}|subject`}>
                  {subject.name} (RS{subject.fee || 0})
                </option>
              ))}
              {studentCourses.map(course => (
                <option key={course.course_id} value={`${course.course_id}|course`}>
                  {course.name} (RS{course.fee || 0})
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (RS)</label>
            <input
              type="number"
              value={selectedClass.fee || ''}
              onChange={(e) => setSelectedClass(prev => ({
                ...prev,
                fee: parseFloat(e.target.value) || 0
              }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={cancelEdit}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateRecord}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Update Record
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};





const StaffDashboard = () => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const navigate = useNavigate(); // Initialize useNavigate

  const handleCardClick = (title) => {
    setSelectedCard(title);
    setActiveCard(title);
    if (title === 'Logout') {
      // Redirect to the home page when Logout is clicked
      navigate('/'); // Assuming '/' is your home page route
    }
  };




  const renderContent = () => {
    switch(selectedCard) {
      case 'Register Students':
        return <StudentRegistrationForm />;
      case 'Manage Attendance':
        return <AttendanceManagement/>;
      case 'Manage Payment':
        return <PaymentManagement/>;
      case 'Logout':
        return null; // Return null to remove the right side panel content
      default:
        return <div className="text-gray-500 text-center mt-20">Select a menu item to begin</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-sky-400 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold">Staff Dashboard</h1>
      </header>

      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-1/4 bg-indigo-100 min-h-screen p-4 border-r border-gray-200">
          {/* Welcome Section */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Welcome Staff!</h2>
            <p className="text-gray-600 text-sm">Manage your daily tasks</p>
          </div>

          {/* Navigation Cards */}
          <div className="space-y-4">
            <DashboardCard
              title="Register Students"
              icon={<HiOutlineUserAdd className="w-8 h-8"/>}
              color="green"
              isActive={activeCard === 'Register Students'}
              onClick={() => handleCardClick('Register Students')}
            />
            <DashboardCard
              title="Manage Attendance"
              icon={<FaRegCalendarAlt className="w-8 h-8"/>}
              color="purple"
              isActive={activeCard === 'Manage Attendance'}
              onClick={() => handleCardClick('Manage Attendance')}
            />
            <DashboardCard
              title="Manage Payment"
              icon={<RiMoneyDollarCircleLine className="w-8 h-8"/>}
              color="blue"
              isActive={activeCard === 'Manage Payment'}
              onClick={() => handleCardClick('Manage Payment')}
            />
            <DashboardCard
              title="Logout"
              icon={<IoLogOutOutline className="w-8 h-8"/>}
              color="gray"
              isActive={activeCard === 'Logout'}
              onClick={() => handleCardClick('Logout')}
            />
          </div>
        </div>

        {/* Right Content Area */}
        <div className="w-3/4 p-8 min-h-screen bg-white">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// Dashboard Card Component
const DashboardCard = ({ title, icon, color, isActive, onClick }) => {
  const colorVariants = {
    green: {
      border: 'border-green-500',
      text: 'text-green-500',
      bg: 'bg-green-100'
    },
    blue: {
      border: 'border-blue-500',
      text: 'text-blue-500',
      bg: 'bg-blue-100'
    },
    purple: {
      border: 'border-purple-500',
      text: 'text-purple-500',
      bg: 'bg-purple-100'
    },
    gray: {
      border: 'border-pink-500',
      text: 'text-pink-500',
      bg: 'bg-pink-100'
    }
  };

  return (
    <div
      className={`flex items-center p-4 rounded-lg cursor-pointer transition-all
        ${isActive ? `${colorVariants[color].bg} border-l-4 ${colorVariants[color].border}` : 'hover:bg-gray-50'}`}
      onClick={onClick}
    >
      <div className={`w-8 h-8 mr-3 ${isActive ? colorVariants[color].text : 'text-gray-600'}`}>
        {icon}
      </div>
      <span className={`font-medium ${isActive ? 'text-gray-800' : 'text-gray-700'}`}>
        {title}
      </span>
    </div>
  );
};
export default StaffDashboard;