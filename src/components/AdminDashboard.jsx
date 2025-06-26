import React, { useState, useEffect , useRef} from 'react';
import { HiOutlineUserAdd } from "react-icons/hi";
import { BsFiles } from "react-icons/bs";
import { FaRegCalendarAlt } from "react-icons/fa";
import { RiMoneyDollarCircleLine } from "react-icons/ri";
import { TbReportSearch } from "react-icons/tb";
import { MdOutlineAccountBalance } from "react-icons/md";
import { IoLogOutOutline } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import { getGrades, addGrade, updateGrade, deleteGrade } from '../services/api';
import { getSubjects, addSubject, updateSubject, deleteSubject } from '../services/api';
import { getClasses, addClass, updateClass, deleteClass } from '../services/api';
import {  getCourses, addCourse, updateCourse, deleteCourse } from '../services/api';
import { registerStudent,getNextStudentIdForGrade} from '../services/api';
import {generateStudentQRCode,getStudentById ,getStudentQRImage, uploadStudentQRImage} from '../services/api';
import {QRCodeCanvas} from 'qrcode.react';
//import html2canvas from 'html2canvas';
import { getStudents, deleteStudent , updateStudent} from '../services/api';
///report
import { FiCalendar, FiDollarSign, FiDownload } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getAttendanceRecords } from '../services/api';
import {getPaymentRecords} from '../services/api';



////////////+++++++++++++++++++++++++++++++++++++++++++ Register students +++++++++++++++++++++++++++++++++++++++++//////////////
const StudentRegistrationForm = () => {

  const navigate = useNavigate(); // Add this at the top with other hooks

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
// Add this state to your component
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



//  the share function
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


///////////////++++++++++++++++++++++++++++++++++++++ Manage students data +++++++++++++++++++++++++++++++++++++++///////////////
const ManageStudentsData = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrImages, setQrImages] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
      first_name: '',
      last_name: '',
      grade_id: '',
      mobile: '',
      email: '',
      password: ''
  });
  const qrCodeRef = useRef(null);

  // Fetch students from API
  useEffect(() => {
      const fetchStudents = async () => {
          try {
              setLoading(true);
              const data = await getStudents();
              setStudents(data);
              setError(null);
              
              // Pre-fetch QR codes for all students
              const qrPromises = data.map(async student => {
                  try {
                      const response = await getStudentQRImage(student.student_id);
                      return { id: student.student_id, qrImage: response.qrImage };
                  } catch (err) {
                      console.error(`Error fetching QR for ${student.student_id}:`, err);
                      return { id: student.student_id, qrImage: null };
                  }
              });
              
              const qrResults = await Promise.all(qrPromises);
              const qrImageMap = qrResults.reduce((acc, curr) => {
                  acc[curr.id] = curr.qrImage;
                  return acc;
              }, {});
              
              setQrImages(qrImageMap);
          } catch (err) {
              console.error("Failed to fetch students:", err);
              setError("Failed to load student data. Please try again later.");
          } finally {
              setLoading(false);
          }
      };
      fetchStudents();
  }, []);

  const handleView = () => {
      if (selectedStudent) {
          console.log('View student:', selectedStudent);
          // Implement view logic here or navigate to view page
      }
  };

  const handleUpdate = async () => {
      if (!selectedStudent) return;

      try {
          // If not already in edit mode, switch to edit mode
          if (!isEditing) {
              setIsEditing(true);
              setFormData({
                  first_name: selectedStudent.first_name,
                  last_name: selectedStudent.last_name,
                  grade_id: selectedStudent.grade_id,
                  mobile: selectedStudent.mobile,
                  email: selectedStudent.email,
                  password: selectedStudent.password || ''
              });
              return;
          }

          // If in edit mode, submit the changes
          await updateStudent(selectedStudent.student_id, formData);
          
          // Refresh the student list
          const updatedStudents = await getStudents();
          setStudents(updatedStudents);
          
          // Find and set the updated student as selected
          const updatedStudent = updatedStudents.find(
              s => s.student_id === selectedStudent.student_id
          );
          setSelectedStudent(updatedStudent);
          
          setIsEditing(false);
          alert('Student updated successfully');
      } catch (error) {
          console.error('Error updating student:', error);
          alert(`Failed to update student: ${error.message || 'Please try again.'}`);
      }
  };

  const handleDelete = async () => {
      if (!selectedStudent) return;

      // Confirm before deleting
      if (!window.confirm(`Are you sure you want to delete ${selectedStudent.first_name} ${selectedStudent.last_name}?`)) {
          return;
      }

      try {
          await deleteStudent(selectedStudent.student_id);
          setStudents(students.filter(student => student.student_id !== selectedStudent.student_id));
          
          // Remove QR image from state
          setQrImages(prev => {
              const newQrImages = {...prev};
              delete newQrImages[selectedStudent.student_id];
              return newQrImages;
          });
          
          setSelectedStudent(null);
          alert('Student deleted successfully');
      } catch (error) {
          console.error('Error deleting student:', error);
          alert(`Failed to delete student: ${error.message || 'Please try again.'}`);
      }
  };

  const handleCancel = () => {
      setSelectedStudent(null);
      setIsEditing(false);
  };

  const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
          ...prev,
          [name]: value
      }));
  };

  const downloadQRCode = (studentId) => {
      const qrImage = qrImages[studentId];
      if (!qrImage) {
          alert("QR code not available for this student");
          return;
      }

      const link = document.createElement('a');
      link.download = `student_${studentId}_qrcode.png`;
      link.href = qrImage;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  if (loading) {
      return (
          <div className="container mx-auto p-4 flex items-center justify-center">
              <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-700">Loading student data...</p>
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

  return (
      <div className="bg-blue-50 p-6 rounded-lg shadow-md">
          <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Manage Students Data</h2>
          </div>

          {students.length === 0 ? (
              <div className="text-center py-8">
                  <p className="text-gray-600">No students found.</p>
              </div>
          ) : (
              <>
                  <div className="overflow-x-auto mb-6">
                      <table className="min-w-full bg-white border border-black">
                          <thead className="bg-green-100">
                              <tr>
                                  <th className="py-2 px-6 border-b min-w-[120px]">Student ID</th>
                                  <th className="py-2 px-6 border-b min-w-[150px]">First Name</th>
                                  <th className="py-2 px-6 border-b min-w-[150px]">Last Name</th>
                                  <th className="py-2 px-6 border-b min-w-[100px]">Grade</th>
                                  <th className="py-2 px-6 border-b min-w-[150px]">Mobile No</th>
                                  <th className="py-2 px-6 border-b min-w-[200px]">Email</th>
                                  <th className="py-2 px-6 border-b min-w-[200px]">Password</th>
                                  <th className="py-2 px-6 border-b min-w-[120px]">QR Code</th>
                                  <th className="py-2 px-6 border-b min-w-[120px]">Actions</th>
                              </tr>
                          </thead>
                          <tbody>
                              {students.map((student) => (
                                  <tr 
                                      key={student.student_id} 
                                      className={`hover:bg-yellow-50 ${selectedStudent?.student_id === student.student_id ? 'bg-blue-200' : ''}`}
                                  >
                                      <td className="py-2 px-6 border-b text-center">{student.student_id}</td>
                                      <td className="py-2 px-6 border-b text-center">{student.first_name}</td>
                                      <td className="py-2 px-6 border-b text-center">{student.last_name}</td>
                                      <td className="py-2 px-6 border-b text-center">{student.grade_id}</td>
                                      <td className="py-2 px-6 border-b text-center">{student.mobile}</td>
                                      <td className="py-2 px-6 border-b text-center">{student.email}</td>
                                      <td className="py-2 px-6 border-b text-center">{student.password}</td>
                                      <td className="py-2 px-6 border-b text-center">
                                          {qrImages[student.student_id] ? (
                                              <img 
                                                  src={qrImages[student.student_id]} 
                                                  alt="QR Code" 
                                                  className="w-12 h-12 mx-auto cursor-pointer"
                                                  onClick={() => downloadQRCode(student.student_id)}
                                              />
                                          ) : (
                                              <div className="w-10 h-10 mx-auto flex items-center justify-center">
                                                  <QRCodeCanvas
                                                      value={`${student.student_id}|${student.mobile}|${student.password}`}
                                                      size={80}
                                                      level="H"
                                                      includeMargin={false}
                                                      className="w-full h-full"
                                                  />
                                              </div>
                                          )}
                                      </td>
                                      <td className="py-2 px-6 border-b text-center">
                                          <button
                                              onClick={() => setSelectedStudent(student)}
                                              className="text-blue-500 hover:text-blue-700"
                                          >
                                              Select
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 items-center">
                          <select
                              className="flex-1 p-2 border rounded"
                              value={selectedStudent?.student_id || ''}
                              onChange={(e) => {
                                  const student = students.find(s => s.student_id === e.target.value);
                                  setSelectedStudent(student || null);
                              }}
                          >
                              <option value="">Select a student...</option>
                              {students.map((student) => (
                                  <option key={student.student_id} value={student.student_id}>
                                      {student.student_id} - {student.first_name} {student.last_name}
                                  </option>
                              ))}
                          </select>

                          <div className="flex space-x-2">
                              <button 
                                  onClick={handleView}
                                  disabled={!selectedStudent}
                                  className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2  rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
                              >
                                  View
                              </button>
                              <button 
                                  onClick={handleUpdate}
                                  disabled={!selectedStudent}
                                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
                              >
                                  {isEditing ? 'Save Changes' : 'Update'}
                              </button>
                              <button 
                                  onClick={handleDelete}
                                  disabled={!selectedStudent}
                                  className="bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
                              >
                                  Delete
                              </button>
                              <button 
                                  onClick={handleCancel}
                                  disabled={!selectedStudent}
                                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
                              >
                                  Cancel
                              </button>
                          </div>
                      </div>

                      {selectedStudent && (
                          <div className="mt-4 p-3 bg-white rounded border">
                              {isEditing ? (
                                  <div className="space-y-4">
                                      <h4 className="font-medium text-lg">Edit Student Details</h4>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div>
                                              <label className="block text-sm font-medium text-gray-700">First Name</label>
                                              <input
                                                  type="text"
                                                  name="first_name"
                                                  value={formData.first_name}
                                                  onChange={handleInputChange}
                                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                              />
                                          </div>
                                          <div>
                                              <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                              <input
                                                  type="text"
                                                  name="last_name"
                                                  value={formData.last_name}
                                                  onChange={handleInputChange}
                                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                              />
                                          </div>
                                          <div>
                                              <label className="block text-sm font-medium text-gray-700">Grade</label>
                                              <input
                                                  type="text"
                                                  name="grade_id"
                                                  value={formData.grade_id}
                                                  onChange={handleInputChange}
                                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                              />
                                          </div>
                                          <div>
                                              <label className="block text-sm font-medium text-gray-700">Mobile</label>
                                              <input
                                                  type="text"
                                                  name="mobile"
                                                  value={formData.mobile}
                                                  onChange={handleInputChange}
                                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                              />
                                          </div>
                                          <div className="md:col-span-2">
                                              <label className="block text-sm font-medium text-gray-700">Email</label>
                                              <input
                                                  type="email"
                                                  name="email"
                                                  value={formData.email}
                                                  onChange={handleInputChange}
                                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                              />
                                          </div>
                                          <div>
                                            <label className="block text-sm font-medium text-gray-700">Password</label>
                                            <input
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                                placeholder="Enter new password"
                                            />
                                        </div>
                                      </div>
                                  </div>
                              ) : (
                                  <div className="flex flex-col md:flex-row gap-4">
                                      <div className="flex-1">
                                          <h4 className="font-medium mb-2">Student Details:</h4>
                                          <p className="text-sm"><span className="font-medium">Name:</span> {selectedStudent.first_name} {selectedStudent.last_name}</p>
                                          <p className="text-sm"><span className="font-medium">ID:</span> {selectedStudent.student_id}</p>
                                          <p className="text-sm"><span className="font-medium">Grade:</span> {selectedStudent.grade_id}</p>
                                          <p className="text-sm"><span className="font-medium">Mobile:</span> {selectedStudent.mobile}</p>
                                          <p className="text-sm"><span className="font-medium">Email:</span> {selectedStudent.email}</p>
                                          <p className="text-sm"><span className="font-medium">Password:</span> {selectedStudent.password}</p>
                                      </div>
                                      <div className="flex flex-col items-center">
                                          <h4 className="font-medium mb-2">QR Code:</h4>
                                          {qrImages[selectedStudent.student_id] ? (
                                              <img 
                                                  src={qrImages[selectedStudent.student_id]} 
                                                  alt="QR Code" 
                                                  className="w-32 h-32 border border-gray-300"
                                              />
                                          ) : (
                                              <div className="w-32 h-32 border border-gray-300 flex items-center justify-center">
                                                  <QRCodeCanvas
                                                      value={`${selectedStudent.student_id}|${selectedStudent.mobile}|${selectedStudent.password}`}
                                                      size={128}
                                                      level="H"
                                                      includeMargin={false}
                                                  />
                                              </div>
                                          )}
                                          <button
                                              onClick={() => downloadQRCode(selectedStudent.student_id)}
                                              className="mt-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                                          >
                                              Download QR
                                          </button>
                                      </div>
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
              </>
          )}
      </div>
  );
};


////////////////++++++++++++++++++++++++++++++++++++ View attendance ++++++++++++++++++++++++++++++++++++++++++///////////////////
const ViewAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    date: '',
    grade: '',
    status: '',
    classType: '',
    subject: ''
  });

  // Fetch attendance records on mount
  useEffect(() => {
    const fetchAttendanceRecords = async () => {
      try {
        setIsLoading(true);
        const records = await getAttendanceRecords();
        setAttendanceRecords(records);
        setError(null);
      } catch (error) {
        console.error('Error fetching attendance records:', error);
        setError('Failed to load attendance records');
        setAttendanceRecords([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAttendanceRecords();
  }, []);

  // Filter records based on search term and filters
  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = 
      record.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilters = 
      (filters.date === '' || record.date === filters.date) &&
      (filters.grade === '' || record.grade === filters.grade) &&
      (filters.status === '' || record.status === filters.status) &&
      (filters.classType === '' || record.classType === filters.classType) &&
      (filters.subject === '' || 
        record.className.toLowerCase().includes(filters.subject.toLowerCase()));
    
    return matchesSearch && matchesFilters;
  });

  const handleView = () => {
    console.log('Viewing selected records:', selectedRecords);
    // Implement view logic here
  };

  const handleDownload = async () => {
    try {
      let recordsToDownload = filteredRecords;
      if (selectedRecords.length > 0) {
        recordsToDownload = filteredRecords.filter(record => 
          selectedRecords.includes(record.id)
        );
      }
      
      // Create CSV content
      const headers = [
        'Student ID', 'Full Name', 'Grade', 'Class Name', 
        'Class Type', 'Date', 'Status'
      ].join(',');
      
      const rows = recordsToDownload.map(record => 
        [
          record.studentId,
          record.fullName,
          record.grade,
          record.className,
          record.classType,
          record.date,
          record.status
        ].map(field => `"${field}"`).join(',')
      );
      
      const csvContent = [headers, ...rows].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_records_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error downloading attendance data:', error);
      alert('Failed to download attendance data');
    }
  };

  const handleShare = async () => {
    try {
      let recordsToShare = filteredRecords;
      if (selectedRecords.length > 0) {
        recordsToShare = filteredRecords.filter(record => 
          selectedRecords.includes(record.id)
        );
      }
      
      // Create shareable text
      const shareText = recordsToShare.map(record => 
        `${record.fullName} (${record.studentId}) - ${record.className} (${record.classType}): ${record.status} on ${record.date}`
      ).join('\n\n');
      
      if (navigator.share) {
        await navigator.share({
          title: 'Attendance Records',
          text: shareText,
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        alert('Sharing not supported in this browser. Copying to clipboard instead.');
        await navigator.clipboard.writeText(shareText);
      }
    } catch (error) {
      console.error('Error sharing attendance data:', error);
    }
  };

  const toggleRecordSelection = (recordId) => {
    setSelectedRecords(prev =>
      prev.includes(recordId)
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId]
    );
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      date: '',
      grade: '',
      status: '',
      classType: '',
      subject: ''
    });
    setSearchTerm('');
  };

  // Get unique values for filter dropdowns
  const uniqueGrades = [...new Set(attendanceRecords.map(record => record.grade))];
  const uniqueClassTypes = [...new Set(attendanceRecords.map(record => record.classType))];
  const uniqueDates = [...new Set(attendanceRecords.map(record => record.date))];
  const uniqueSubjects = [...new Set(attendanceRecords.map(record => record.className).filter(Boolean))];

  return (
    <div className="bg-blue-50 p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">View Attendance</h2>
        <p className="text-gray-600">View and manage all attendance records</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <select
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">All Dates</option>
              {uniqueDates.map(date => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
            <select
              name="grade"
              value={filters.grade}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">All Grades</option>
              {uniqueGrades.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">All Statuses</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class Type</label>
            <select
              name="classType"
              value={filters.classType}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">All Types</option>
              {uniqueClassTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject/Class</label>
            <select
              name="subject"
              value={filters.subject}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">All Subjects/Classes</option>
              {uniqueSubjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={clearFilters}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="mb-6 bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Loading attendance records...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No records found</h3>
            <p className="mt-1 text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Select
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.map((record) => (
                    <tr 
                      key={record.id} 
                      className={`hover:bg-gray-50 ${selectedRecords.includes(record.id) ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={selectedRecords.includes(record.id)}
                          onChange={() => toggleRecordSelection(record.id)}
                          className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {record.fullName.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {record.fullName}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {record.studentId} | Grade: {record.grade}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{record.className}</div>
                        <div className="text-sm text-gray-500 capitalize">{record.classType}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.status === 'present' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            // Implement single record view/edit
                            console.log('View record:', record.id);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          View
                        </button>
                        <button
                          onClick={() => {
                            // Implement delete functionality
                            console.log('Delete record:', record.id);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between items-center">
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{filteredRecords.length}</span> records
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 items-center">
          <div className="flex-1">
            <p className="text-sm text-gray-600">
              {selectedRecords.length} record(s) selected
            </p>
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={handleView}
              disabled={selectedRecords.length === 0}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              View
            </button>
            <button 
              onClick={handleDownload}
              disabled={filteredRecords.length === 0}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Download {selectedRecords.length > 0 ? 'Selected' : 'All'}
            </button>
            <button 
              onClick={handleShare}
              disabled={selectedRecords.length === 0}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Share
            </button>
          </div>
        </div>

        {selectedRecords.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded border">
            <h4 className="font-medium mb-2">Selected Records Summary:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Selected</p>
                <p className="font-medium">{selectedRecords.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Present</p>
                <p className="font-medium text-green-600">
                  {selectedRecords.filter(id => {
                    const record = attendanceRecords.find(r => r.id === id);
                    return record?.status === 'present';
                  }).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Absent</p>
                <p className="font-medium text-red-600">
                  {selectedRecords.filter(id => {
                    const record = attendanceRecords.find(r => r.id === id);
                    return record?.status === 'absent';
                  }).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unique Students</p>
                <p className="font-medium">
                  {new Set(selectedRecords.map(id => {
                    const record = attendanceRecords.find(r => r.id === id);
                    return record?.studentId;
                  })).size}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};



///////////////+++++++++++++++++++++++++++++++++++++ View payment +++++++++++++++++++++++++++++++++++++++++++///////////////////////
const ViewPayment = () => {
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch payment records on mount
  useEffect(() => {
    const fetchPaymentRecords = async () => {
      try {
        setIsLoading(true);
        const records = await getPaymentRecords();
        setPaymentRecords(records);
        setError(null);
      } catch (err) {
        console.error("Error fetching payment records:", err);
        setError("Failed to load payment records. Please try again later.");
        setPaymentRecords([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentRecords();
  }, []);

  // Filter records based on search term
  const filteredRecords = paymentRecords.filter(record =>
    record.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleView = (record) => {
    // Implement view logic for a single record
    console.log('Viewing record:', record);
    // You could show a modal with detailed view here
  };

  const handleDownload = () => {
    if (selectedRecords.length === 0) return;
    
    // Prepare data for download
    const dataToDownload = paymentRecords.filter(record => 
      selectedRecords.includes(record.invoice_id)
    );
    
    // Convert to CSV
    const headers = [
      'Invoice ID', 'Student ID', 'Full Name', 'Grade', 
      'Class', 'Class Type', 'Date', 'Amount', 'Status'
    ];
    
    const csvRows = [
      headers.join(','),
      ...dataToDownload.map(record => 
        [
          `"${record.invoice_id}"`,
          `"${record.student_id}"`,
          `"${record.fullName}"`,
          `"${record.grade}"`,
          `"${record.class_name}"`,
          `"${record.class_type}"`,
          `"${record.date}"`,
          `"${record.amount}"`,
          `"${record.status}"`
        ].join(',')
      )
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `payment_records_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
  try {
    let recordsToShare = filteredRecords;
    if (selectedRecords.length > 0) {
      recordsToShare = filteredRecords.filter(record => 
        selectedRecords.includes(record.invoice_id)
      );
    }
    
    // Create shareable text
    const shareText = recordsToShare.map(record => 
      `${record.fullName} (${record.student_id}) - ${record.class_name} (${record.class_type}): RS${record.amount} ${record.status} on ${record.date}`
    ).join('\n\n');
    
    if (navigator.share) {
      await navigator.share({
        title: 'Payment Records',
        text: shareText,
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      alert('Sharing not supported in this browser. Copying to clipboard instead.');
      await navigator.clipboard.writeText(shareText);
    }
  } catch (error) {
    console.error('Error sharing payment data:', error);
  }
};

  const toggleRecordSelection = (recordId) => {
    setSelectedRecords(prev =>
      prev.includes(recordId)
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId]
    );
  };

  const selectAllRecords = (e) => {
    if (e.target.checked) {
      setSelectedRecords(filteredRecords.map(record => record.invoice_id));
    } else {
      setSelectedRecords([]);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-blue-50 p-6 rounded-lg shadow-md flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-8 w-8 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Loading payment records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-blue-50 p-6 rounded-lg shadow-md">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Payment Management</h2>
      </div>

      {/* View Payment Records Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">View Payment Records</h3>

        {/* Search Bar */}
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

        {/* Payment Records Table */}
        <div className="overflow-x-auto mb-6">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b text-center">
                  <input
                    type="checkbox"
                    checked={selectedRecords.length > 0 && 
                             selectedRecords.length === filteredRecords.length}
                    onChange={selectAllRecords}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                </th>
                <th className="py-2 px-4 border-b text-left">Invoice ID</th>
                <th className="py-2 px-4 border-b text-left">Student ID</th>
                <th className="py-2 px-4 border-b text-left">Full Name</th>
                <th className="py-2 px-4 border-b text-left">Grade</th>
                <th className="py-2 px-4 border-b text-left">Class</th>
                <th className="py-2 px-4 border-b text-left">Type</th>
                <th className="py-2 px-4 border-b text-left">Date</th>
                <th className="py-2 px-4 border-b text-left">Amount</th>
                <th className="py-2 px-4 border-b text-left">Status</th>
                <th className="py-2 px-4 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr
                    key={record.invoice_id}
                    className={`hover:bg-gray-50 ${selectedRecords.includes(record.invoice_id) ? 'bg-blue-50' : ''}`}
                  >
                    <td className="py-2 px-4 border-b text-center">
                      <input
                        type="checkbox"
                        checked={selectedRecords.includes(record.invoice_id)}
                        onChange={() => toggleRecordSelection(record.invoice_id)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                    </td>
                    <td className="py-2 px-4 border-b">{record.invoice_id}</td>
                    <td className="py-2 px-4 border-b">{record.student_id}</td>
                    <td className="py-2 px-4 border-b">{record.fullName}</td>
                    <td className="py-2 px-4 border-b">{record.grade}</td>
                    <td className="py-2 px-4 border-b">{record.class_name}</td>
                    <td className="py-2 px-4 border-b">{record.class_type}</td>
                    <td className="py-2 px-4 border-b">{record.date}</td>
                    <td className="py-2 px-4 border-b">RS:{record.amount}</td>
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
                      <button
                        onClick={() => handleView(record)}
                        className="text-blue-500 hover:text-white hover:bg-blue-500 px-2 py-1 border border-blue-500 rounded"
                        title="View Details"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="py-4 text-center text-gray-500">
                    {searchTerm ? 'No matching records found' : 'No payment records available'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">
                {selectedRecords.length} record(s) selected
              </p>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleDownload}
                disabled={selectedRecords.length === 0}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Download
              </button>
             <button 
                onClick={handleShare}
                disabled={filteredRecords.length === 0}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Share
              </button>
            </div>
          </div>

          {selectedRecords.length > 0 && (
            <div className="mt-4 p-3 bg-white rounded border">
              <h4 className="font-medium mb-2">Selected Records Summary:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium">Total Records:</p>
                  <p>{selectedRecords.length}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Total Amount:</p>
                  <p>
                    RS:{' '}
                    {paymentRecords
                      .filter(record => selectedRecords.includes(record.invoice_id))
                      .reduce((sum, record) => sum + (record.amount || 0), 0)
                      .toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Paid Records:</p>
                  <p>
                    {paymentRecords
                      .filter(record => 
                        selectedRecords.includes(record.invoice_id) && 
                        record.status === 'paid'
                      ).length}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



//////////////////////+++++++++++++++++++++++++++++ View reports +++++++++++++++++++++++++++++++++++++++++//////////////////////////
const ReportsView = () => {
  const [reportType, setReportType] = useState('attendance');
  const [groupBy, setGroupBy] = useState('subject');
  const [timeRange, setTimeRange] = useState('month');
  const [attendanceData, setAttendanceData] = useState([]);
  const [paymentData, setPaymentData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableGrades, setAvailableGrades] = useState([]);

  useEffect(() => {
    fetchData();
  }, [reportType, groupBy, timeRange, selectedSubject, selectedGrade]);

  useEffect(() => {
    // Extract unique subjects and grades when data loads
    if (attendanceData.length > 0 || paymentData.length > 0) {
      const subjects = new Set();
      const grades = new Set();
      
      const dataToUse = reportType === 'attendance' ? attendanceData : paymentData;
      
      dataToUse.forEach(record => {
        const subject = reportType === 'attendance' ? record.className : record.class_name;
        if (subject) subjects.add(subject);
        if (record.grade) grades.add(record.grade);
      });
      
      setAvailableSubjects(Array.from(subjects));
      setAvailableGrades(Array.from(grades));
      
      // Reset selections if they're no longer valid
      if (selectedSubject && !subjects.has(selectedSubject)) {
        setSelectedSubject(null);
      }
      if (selectedGrade && !grades.has(selectedGrade)) {
        setSelectedGrade(null);
      }
    }
  }, [attendanceData, paymentData, reportType]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (reportType === 'attendance') {
        const records = await getAttendanceRecords();
        setAttendanceData(records);
      } else {
        const records = await getPaymentRecords();
        setPaymentData(records);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load report data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const processAttendanceData = () => {
    if (!attendanceData.length) return [];

    let filteredData = [...attendanceData];

    // Apply subject filter if selected
    if (selectedSubject) {
      filteredData = filteredData.filter(record => record.className === selectedSubject);
    }

    // Apply grade filter if selected
    if (selectedGrade) {
      filteredData = filteredData.filter(record => record.grade === selectedGrade);
    }

    // Filter by time range
    if (timeRange === 'month') {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      filteredData = filteredData.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() + 1 === currentMonth && 
               recordDate.getFullYear() === currentYear;
      });
    } else if (timeRange === 'year') {
      const currentYear = now.getFullYear();
      filteredData = filteredData.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getFullYear() === currentYear;
      });
    }

    // Determine grouping based on report type and selections
    let groupKey;
    if (reportType === 'attendance') {
      if (selectedSubject) {
        groupKey = 'grade'; // When subject is selected, group by grade for attendance
      } else {
        groupKey = groupBy; // Otherwise use the selected groupBy
      }
    } else {
      if (selectedSubject && selectedGrade) {
        groupKey = 'date'; // When both subject and grade are selected, group by date for payments
      } else {
        groupKey = groupBy; // Otherwise use the selected groupBy
      }
    }

    // Group data
    const groupedData = {};
    filteredData.forEach(record => {
      let key;
      if (groupKey === 'subject') {
        key = record.className || 'Unknown Subject';
      } else if (groupKey === 'grade') {
        key = record.grade || 'Unknown Grade';
      } else {
        const date = new Date(record.date);
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          name: key,
          present: 0,
          absent: 0,
          total: 0
        };
      }

      if (record.status === 'present') {
        groupedData[key].present += 1;
      } else {
        groupedData[key].absent += 1;
      }
      groupedData[key].total += 1;
    });

    return Object.values(groupedData);
  };

  const processPaymentData = () => {
    if (!paymentData.length) return [];

    const now = new Date();
    let filteredData = [...paymentData];

    // Apply subject filter if selected
    if (selectedSubject) {
      filteredData = filteredData.filter(record => record.class_name === selectedSubject);
    }

    // Apply grade filter if selected
    if (selectedGrade) {
      filteredData = filteredData.filter(record => record.grade === selectedGrade);
    }

    // Filter by time range
    if (timeRange === 'month') {
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      filteredData = filteredData.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() + 1 === currentMonth && 
               recordDate.getFullYear() === currentYear;
      });
    } else if (timeRange === 'year') {
      const currentYear = now.getFullYear();
      filteredData = filteredData.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getFullYear() === currentYear;
      });
    }

    // Determine grouping based on selections
    let groupKey;
    if (selectedSubject && selectedGrade) {
      groupKey = 'date'; // When both subject and grade are selected, group by date
    } else {
      groupKey = groupBy; // Otherwise use the selected groupBy
    }

    // Group data
    const groupedData = {};
    filteredData.forEach(record => {
      let key;
      if (groupKey === 'subject') {
        key = record.class_name || 'Unknown Subject';
      } else if (groupKey === 'grade') {
        key = record.grade || 'Unknown Grade';
      } else {
        const date = new Date(record.date);
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          name: key,
          paid: 0,
          pending: 0,
          total: 0,
          amount: 0
        };
      }

      if (record.status === 'paid') {
        groupedData[key].paid += 1;
        groupedData[key].amount += parseFloat(record.amount) || 0;
      } else {
        groupedData[key].pending += 1;
      }
      groupedData[key].total += 1;
    });

    return Object.values(groupedData);
  };

  const handleDownload = () => {
    let data, headers, fileName;
    
    if (reportType === 'attendance') {
      data = processAttendanceData();
      headers = ['Category', 'Present', 'Absent', 'Total'];
      fileName = `attendance_report_${selectedSubject ? 'subject_' + selectedSubject : ''}_${selectedGrade ? 'grade_' + selectedGrade : ''}_${timeRange}_${new Date().toISOString().slice(0,10)}.csv`;
    } else {
      data = processPaymentData();
      headers = ['Category', 'Paid', 'Pending', 'Total', 'Amount Collected'];
      fileName = `payment_report_${selectedSubject ? 'subject_' + selectedSubject : ''}_${selectedGrade ? 'grade_' + selectedGrade : ''}_${timeRange}_${new Date().toISOString().slice(0,10)}.csv`;
    }

    const csvRows = [
      headers.join(','),
      ...data.map(item => 
        Object.values(item).map(val => `"${val}"`).join(',')
      )
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = reportType === 'attendance' ? processAttendanceData() : processPaymentData();

  return (
    <div className="bg-blue-50 p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Reports Dashboard</h2>
        <p className="text-gray-600">View and analyze system data in real-time</p>
      </div>

      {/* Report Controls */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value);
                setSelectedSubject(null);
                setSelectedGrade(null);
              }}
            >
              <option value="attendance">Attendance</option>
              <option value="payment">Payments</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={selectedSubject || ''}
              onChange={(e) => {
                setSelectedSubject(e.target.value || null);
                if (!e.target.value) setSelectedGrade(null);
              }}
            >
              <option value="">All Subjects</option>
              {availableSubjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={selectedGrade || ''}
              onChange={(e) => setSelectedGrade(e.target.value || null)}
              disabled={!selectedSubject && reportType === 'payment'}
            >
              <option value="">All Grades</option>
              {availableGrades.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <button
            onClick={fetchData}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </>
            ) : 'Refresh Data'}
          </button>
          
          <button
            onClick={handleDownload}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center"
            disabled={isLoading || chartData.length === 0}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Report
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Loading indicator */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        /* Chart Display */
        <div className="bg-white p-4 rounded-lg shadow">
          {chartData.length === 0 ? (
            <div className="text-center py-10">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No data available</h3>
              <p className="mt-1 text-sm text-gray-500">
                {reportType === 'attendance' 
                  ? 'No attendance records found for the selected criteria.'
                  : 'No payment records found for the selected criteria.'}
              </p>
              <div className="mt-6">
                <button
                  onClick={fetchData}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Refresh Data
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={70} 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'Amount (Rs)') {
                          return [`Rs. ${value.toLocaleString()}`, name];
                        }
                        return [value, name];
                      }}
                    />
                    <Legend />
                    {reportType === 'attendance' ? (
                      <>
                        <Bar dataKey="present" fill="#4CAF50" name="Present" />
                        <Bar dataKey="absent" fill="#F44336" name="Absent" />
                      </>
                    ) : (
                      <>
                        <Bar dataKey="paid" fill="#4CAF50" name="Paid" />
                        <Bar dataKey="pending" fill="#FFC107" name="Pending" />
                        <Bar dataKey="amount" fill="#2196F3" name="Amount (Rs)" />
                      </>
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Data Summary */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Summary Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {reportType === 'attendance' ? (
                    <>
                      <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                        <p className="text-sm text-gray-600">Total Present</p>
                        <p className="text-2xl font-bold text-green-600">
                          {chartData.reduce((sum, item) => sum + item.present, 0)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {chartData.length} {selectedSubject ? 'grades' : groupBy === 'date' ? 'months' : groupBy === 'grade' ? 'grades' : 'subjects'}
                        </p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                        <p className="text-sm text-gray-600">Total Absent</p>
                        <p className="text-2xl font-bold text-red-600">
                          {chartData.reduce((sum, item) => sum + item.absent, 0)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {((chartData.reduce((sum, item) => sum + item.absent, 0) / 
                            chartData.reduce((sum, item) => sum + item.total, 0) * 100 || 0).toFixed(1))}% absence rate
                        </p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <p className="text-sm text-gray-600">Total Records</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {chartData.reduce((sum, item) => sum + item.total, 0)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {timeRange === 'month' ? 'This month' : timeRange === 'year' ? 'This year' : 'All time'}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                        <p className="text-sm text-gray-600">Total Paid</p>
                        <p className="text-2xl font-bold text-green-600">
                          {chartData.reduce((sum, item) => sum + item.paid, 0)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {chartData.length} {selectedSubject && selectedGrade ? 'months' : groupBy === 'date' ? 'months' : groupBy === 'grade' ? 'grades' : 'subjects'}
                        </p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                        <p className="text-sm text-gray-600">Total Pending</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {chartData.reduce((sum, item) => sum + item.pending, 0)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {((chartData.reduce((sum, item) => sum + item.pending, 0) / 
                            chartData.reduce((sum, item) => sum + item.total, 0) * 100 || 0).toFixed(1))}% pending
                        </p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <p className="text-sm text-gray-600">Total Amount (Rs)</p>
                        <p className="text-2xl font-bold text-blue-600">
                          Rs. {chartData.reduce((sum, item) => sum + item.amount, 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {timeRange === 'month' ? 'This month' : timeRange === 'year' ? 'This year' : 'All time'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};



////////////////////++++++++++++++++++++++++++++++++ Manage classes, grades, and courses ++++++++++++++++++++++++////////////////////
const ManageClassesAndCourses = () => {
  const [gradesData, setGradesData] = useState([]);
  const [newGradeName, setNewGradeName] = useState('');
  const [editingGrade, setEditingGrade] = useState(null);

  const [subjectsData, setSubjectsData] = useState([]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectFee, setNewSubjectFee] = useState('');
  const [editingSubject, setEditingSubject] = useState(null);

  const [gradeSubjects, setGradeSubjects] = useState([]);
  const [newGradeSubjectGradeId, setNewGradeSubjectGradeId] = useState('');
  const [newGradeSubjectSubjectId, setNewGradeSubjectSubjectId] = useState('');
  const [newGradeSubjectTime, setNewGradeSubjectTime] = useState('');
  const [newGradeSubjectDay, setNewGradeSubjectDay] = useState('Monday');
  const [newGradeSubjectLecturer, setNewGradeSubjectLecturer] = useState('');
  const [newGradeSubjectMode, setNewGradeSubjectMode] = useState('Physical');
  const [newGradeSubjectFee, setNewGradeSubjectFee] = useState('');
  const [editingGradeSubject, setEditingGradeSubject] = useState(null);

  const [coursesData, setCoursesData] = useState([]);
  const [newCourseId, setNewCourseId] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDescription, setNewCourseDescription] = useState('');
  const [newCourseTime, setNewCourseTime] = useState('');
  const [newCourseDay, setNewCourseDay] = useState('Monday');
  const [newCourseLecturer, setNewCourseLecturer] = useState('');
  const [newCourseFee, setNewCourseFee] = useState('');
  const [editingCourse, setEditingCourse] = useState(null);


  //state for medium
  const [newGradeSubjectMedium, setNewGradeSubjectMedium] = useState('Sinhala');
  const [newGradeSubjectPeriod, setNewGradeSubjectPeriod] = useState('');
  
  // Add medium options
  const classMediums = ['Sinhala', 'English'];

  const [availableFees, setAvailableFees] = useState([]);


  // Helper functions for generating unique IDs on the frontend
  const generateUniqueId = () => Math.random().toString(36).substring(2, 15);

  //---------------- --- Grade Handlers -------------------------//

  // Load grades from backend on component mount
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const grades = await getGrades();
        setGradesData(grades);
      } catch (error) {
        console.error("Failed to load grades:", error);
        alert("Failed to load grades. Please try again.");
      }
    };
    
    fetchGrades();
  }, []);

  // ---  Grade Handlers ---
  const generateGradeId = (gradeName) => {
    const parts = gradeName.split(' ');
    if (parts.length === 2 && parts[0] === 'Grade' && !isNaN(parseInt(parts[1]))) {
      const gradeNumber = parseInt(parts[1]);
      return `GR${gradeNumber.toString().padStart(2, '0')}`;
    }
    return `GR${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
  };

  const handleAddGrade = async () => {
    if (!newGradeName) {
      alert('Please enter Grade Name.');
      return;
    }

    try {
      const newId = generateGradeId(newGradeName);
      await addGrade({ grade_id: newId, name: newGradeName });
      
      // Refresh the grades list
      const grades = await getGrades();
      setGradesData(grades);
      setNewGradeName('');
    } catch (error) {
      console.error("Failed to add grade:", error);
      alert("Failed to add grade. Please try again.");
    }
  };

  const handleDeleteGrade = async (gradeId) => {
    if (!window.confirm('Are you sure you want to delete this grade?')) return;
    
    try {
      await deleteGrade(gradeId);
      
      // Refresh the grades list
      const grades = await getGrades();
      setGradesData(grades);
      
      if (editingGrade?.grade_id === gradeId) {
        setEditingGrade(null);
        setNewGradeName('');
      }
    } catch (error) {
      console.error("Failed to delete grade:", error);
      alert("Failed to delete grade. Please try again.");
    }
  };

  const handleEditGrade = (grade) => {
    setEditingGrade(grade);
    setNewGradeName(grade.name);
  };

  const handleUpdateGrade = async () => {
    if (!editingGrade) return;
    if (!newGradeName) {
      alert('Please enter Grade Name.');
      return;
    }

    try {
      await updateGrade(editingGrade.grade_id, { name: newGradeName });
      
      // Refresh the grades list
      const grades = await getGrades();
      setGradesData(grades);
      
      setEditingGrade(null);
      setNewGradeName('');
    } catch (error) {
      console.error("Failed to update grade:", error);
      alert("Failed to update grade. Please try again.");
    }
  };


  // -------------------Subject Handlers -----------------------//


// Add this state for lecturer in subjects section
const [newSubjectLecturer, setNewSubjectLecturer] = useState('');

// Add this function to fetch lecturers
// const fetchLecturers = async () => {
//     try {
//         const response = await axios.get(`${API_BASE_URL}/lecturers`);
//         return response.data;
//     } catch (error) {
//         console.error("Error fetching lecturers:", error);
//         return [];
//     }
// };

// Add this state for lecturers list
// const [lecturers, setLecturers] = useState([]);

// Fetch lecturers on component mount
useEffect(() => {
    const loadLecturers = async () => {
        const lecturerList = await fetchLecturers();
        setLecturers(lecturerList);
    };
    loadLecturers();
}, []);


  // Load subjects from backend on component mount
  useEffect(() => {
    const fetchSubjects = async () => {
        try {
            const subjects = await getSubjects();
            setSubjectsData(subjects);
        } catch (error) {
            console.error("Failed to load subjects:", error);
            alert("Failed to load subjects. Please try again.");
        }
    };
    
    fetchSubjects();
}, []);

// --- Modified Subject Handlers ---
const generateSubjectId = (subjectName, existingSubjects) => {
    if (!subjectName) return '';
    
    // Get the first 3 letters of the subject name in lowercase
    const prefix = subjectName.substring(0, 3).toLowerCase();
    
    // Find all existing IDs with the same prefix
    const samePrefixSubjects = existingSubjects.filter(sub => 
        sub.subject_id.toLowerCase().startsWith(prefix)
    );
    
    // Determine the next available number
    let nextNumber = 1;
    if (samePrefixSubjects.length > 0) {
        // Extract numbers from existing IDs and find the highest
        const numbers = samePrefixSubjects.map(sub => {
            const numPart = sub.subject_id.substring(prefix.length);
            return parseInt(numPart) || 0;
        });
        const maxNumber = Math.max(...numbers);
        nextNumber = maxNumber + 1;
    }
    
    // Format the number with leading zero
    const numberPart = nextNumber.toString().padStart(2, '0');
    
    return `${prefix}${numberPart}`;
};

const handleAddSubject = async () => {
  if (!newSubjectName || !newSubjectFee || !newSubjectLecturer) {
      alert('Please enter Subject Name, Fee, and Lecturer.');
      return;
  }

  try {
      const newId = generateSubjectId(newSubjectName, subjectsData);
      await addSubject({ 
          subject_id: newId, 
          name: newSubjectName, 
          fee: parseFloat(newSubjectFee),
          lecturer: newSubjectLecturer
      });
      
      // Refresh the subjects list
      const subjects = await getSubjects();
      setSubjectsData(subjects);
      setNewSubjectName('');
      setNewSubjectFee('');
      setNewSubjectLecturer('');
  } catch (error) {
      console.error("Failed to add subject:", error);
      alert("Failed to add subject. Please try again.");
  }
};



const handleDeleteSubject = async (subjectId) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    
    try {
        await deleteSubject(subjectId);
        
        // Refresh the subjects list
        const subjects = await getSubjects();
        setSubjectsData(subjects);
        
        if (editingSubject?.subject_id === subjectId) {
            setEditingSubject(null);
            setNewSubjectName('');
            setNewSubjectFee('');
        }
    } catch (error) {
        console.error("Failed to delete subject:", error);
        alert("Failed to delete subject. Please try again.");
    }
};

const handleEditSubject = (subject) => {
  setEditingSubject(subject);
  setNewSubjectName(subject.name);
  setNewSubjectFee(subject.fee.toString());
  setNewSubjectLecturer(subject.lecturer || '');
};


const handleUpdateSubject = async () => {
  if (!editingSubject) return;
  if (!newSubjectName || !newSubjectFee || !newSubjectLecturer) {
      alert('Please enter Subject Name, Fee, and Lecturer.');
      return;
  }

  try {
      await updateSubject(editingSubject.subject_id, { 
          name: newSubjectName, 
          fee: parseFloat(newSubjectFee),
          lecturer: newSubjectLecturer
      });
      
      // Refresh the subjects list
      const subjects = await getSubjects();
      setSubjectsData(subjects);
      
      setEditingSubject(null);
      setNewSubjectName('');
      setNewSubjectFee('');
      setNewSubjectLecturer('');
  } catch (error) {
      console.error("Failed to update subject:", error);
      alert("Failed to update subject. Please try again.");
  }
};



// Add this useEffect to automatically set lecturer when subject is selected
useEffect(() => {
  if (newGradeSubjectSubjectId) {
      const selectedSubject = subjectsData.find(sub => sub.subject_id === newGradeSubjectSubjectId);
      if (selectedSubject) {
          setNewGradeSubjectFee(selectedSubject.fee.toString());
          setNewGradeSubjectLecturer(selectedSubject.lecturer || '');
      }
  }
}, [newGradeSubjectSubjectId, subjectsData]);







  // ----------------- Class (Grade Subject) Handlers -------------------//
  // Load classes from backend on component mount
  useEffect(() => {
    const fetchClasses = async () => {
        try {
            const classes = await getClasses();
            setGradeSubjects(classes);
        } catch (error) {
            console.error("Failed to load classes:", error);
            alert("Failed to load classes. Please try again.");
        }
    };
    
    fetchClasses();
}, []);


// update available fees when subject changes
useEffect(() => {
  if (newGradeSubjectSubjectId) {
    const selectedSubject = subjectsData.find(sub => sub.subject_id === newGradeSubjectSubjectId);
    if (selectedSubject) {
      setNewGradeSubjectFee(selectedSubject.fee.toString());
    }
  }
}, [newGradeSubjectSubjectId, subjectsData]);

// --- Modified Class (Grade Subject) Handlers ---
const handleAddGradeSubject = async () => {
    if (!newGradeSubjectGradeId || !newGradeSubjectSubjectId || !newGradeSubjectTime ||
        !newGradeSubjectDay || !newGradeSubjectLecturer || !newGradeSubjectMode || 
        !newGradeSubjectFee || !newGradeSubjectPeriod) {
        alert('Please fill in all grade subject details.');
        return;
    }

    try {
        await addClass({
            grade_id: newGradeSubjectGradeId,
            subject_id: newGradeSubjectSubjectId,
            time: newGradeSubjectTime,
            day: newGradeSubjectDay,
            lecturer: newGradeSubjectLecturer,
            mode: newGradeSubjectMode,
            medium: newGradeSubjectMedium,
            period: newGradeSubjectPeriod,
            fee: parseFloat(newGradeSubjectFee)
        });
        
        // [Rest of the function remains the same...]
    } catch (error) {
        console.error("Failed to add class:", error);
        alert("Failed to add class. Please try again.");
    }
  };

const handleDeleteGradeSubject = async (classId) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;
    
    try {
        await deleteClass(classId);
        
        // Refresh the classes list
        const classes = await getClasses();
        setGradeSubjects(classes);
        
        if (editingGradeSubject?.class_id === classId) {
            setEditingGradeSubject(null);
            setNewGradeSubjectGradeId('');
            setNewGradeSubjectSubjectId('');
            setNewGradeSubjectTime('');
            setNewGradeSubjectDay('Monday');
            setNewGradeSubjectLecturer('');
            setNewGradeSubjectMode('Physical');
            setNewGradeSubjectFee('');
        }
    } catch (error) {
        console.error("Failed to delete class:", error);
        alert("Failed to delete class. Please try again.");
    }
};

const handleEditGradeSubject = (gs) => {
  setEditingGradeSubject(gs);
  setNewGradeSubjectGradeId(gs.grade_id);
  setNewGradeSubjectSubjectId(gs.subject_id);
  setNewGradeSubjectTime(gs.time);
  setNewGradeSubjectDay(gs.day);
  setNewGradeSubjectLecturer(gs.lecturer);
  setNewGradeSubjectMode(gs.mode);
  setNewGradeSubjectMedium(gs.medium || 'Sinhala');
  setNewGradeSubjectPeriod(gs.period || '');
  setNewGradeSubjectFee(gs.fee.toString());
  
  // Set fee options based on the selected subject
  const selectedSubject = subjectsData.find(sub => sub.subject_id === gs.subject_id);
  if (selectedSubject) {
    setAvailableFees([selectedSubject.fee]);
  }
};

// Update the handleUpdateGradeSubject function
const handleUpdateGradeSubject = async () => {
  if (!editingGradeSubject) return;
  if (!newGradeSubjectGradeId || !newGradeSubjectSubjectId || !newGradeSubjectTime ||
      !newGradeSubjectDay || !newGradeSubjectLecturer || !newGradeSubjectMode || 
      !newGradeSubjectFee || !newGradeSubjectPeriod) {
      alert('Please fill in all grade subject details.');
      return;
  }

  try {
      await updateClass(editingGradeSubject.class_id, {
          grade_id: newGradeSubjectGradeId,
          subject_id: newGradeSubjectSubjectId,
          time: newGradeSubjectTime,
          day: newGradeSubjectDay,
          lecturer: newGradeSubjectLecturer,
          mode: newGradeSubjectMode,
          medium: newGradeSubjectMedium,
          period: newGradeSubjectPeriod,
          fee: parseFloat(newGradeSubjectFee)
      });
    } catch (error) {
      console.error("Failed to update class:", error);
      alert("Failed to update class. Please try again.");
    }
};


  // ---------------------- Course Handlers -----------------//
 // Load courses from backend on component mount
 useEffect(() => {
  const fetchCourses = async () => {
      try {
          const courses = await getCourses();
          setCoursesData(courses);
      } catch (error) {
          console.error("Failed to load courses:", error);
          alert("Failed to load courses. Please try again.");
      }
  };
  
  fetchCourses();
}, []);

// --- Modified Course Handlers ---
const handleAddCourse = async () => {
  if (!newCourseId || !newCourseName || !newCourseTime || 
      !newCourseDay || !newCourseLecturer || !newCourseFee) {
      alert('Please fill in all required course details.');
      return;
  }

  try {
      await addCourse({
          course_id: parseInt(newCourseId),
          name: newCourseName,
          description: newCourseDescription,
          time: newCourseTime,
          day: newCourseDay,
          lecturer: newCourseLecturer,
          fee: parseFloat(newCourseFee)
      });
      
      // Refresh the courses list
      const courses = await getCourses();
      setCoursesData(courses);

      // Reset form
      setNewCourseId('');
      setNewCourseName('');
      setNewCourseDescription('');
      setNewCourseTime('');
      setNewCourseDay('Monday');
      setNewCourseLecturer('');
      setNewCourseFee('');
  } catch (error) {
      console.error("Failed to add course:", error);
      alert("Failed to add course. Please try again.");
  }
};

const handleDeleteCourse = async (courseId) => {
  if (!window.confirm('Are you sure you want to delete this course?')) return;
  
  try {
      await deleteCourse(courseId);
      
      // Refresh the courses list
      const courses = await getCourses();
      setCoursesData(courses);
      
      if (editingCourse?.course_id === courseId) {
          setEditingCourse(null);
          setNewCourseId('');
          setNewCourseName('');
          setNewCourseDescription('');
          setNewCourseTime('');
          setNewCourseDay('Monday');
          setNewCourseLecturer('');
          setNewCourseFee('');
      }
  } catch (error) {
      console.error("Failed to delete course:", error);
      alert("Failed to delete course. Please try again.");
  }
};

const handleEditCourse = (course) => {
  setEditingCourse(course);
  setNewCourseId(course.course_id.toString());
  setNewCourseName(course.name);
  setNewCourseDescription(course.description || '');
  setNewCourseTime(course.time);
  setNewCourseDay(course.day);
  setNewCourseLecturer(course.lecturer);
  setNewCourseFee(course.fee.toString());
};

const handleUpdateCourse = async () => {
  if (!editingCourse) return;
  if (!newCourseId || !newCourseName || !newCourseTime || 
      !newCourseDay || !newCourseLecturer || !newCourseFee) {
      alert('Please fill in all required course details.');
      return;
  }

  try {
      await updateCourse(editingCourse.course_id, {
          name: newCourseName,
          description: newCourseDescription,
          time: newCourseTime,
          day: newCourseDay,
          lecturer: newCourseLecturer,
          fee: parseFloat(newCourseFee)
      });
      
      // Refresh the courses list
      const courses = await getCourses();
      setCoursesData(courses);

      // Reset form
      setEditingCourse(null);
      setNewCourseId('');
      setNewCourseName('');
      setNewCourseDescription('');
      setNewCourseTime('');
      setNewCourseDay('Monday');
      setNewCourseLecturer('');
      setNewCourseFee('');
  } catch (error) {
      console.error("Failed to update course:", error);
      alert("Failed to update course. Please try again.");
  }
};
  // Prepare dropdown options
  const grades = gradesData.map(grade => ({ value: grade.grade_id, label: grade.name }));
  const subjects = subjectsData.map(subject => ({ value: subject.subject_id, label: subject.name }));
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const classModes = ['Physical', 'Online', 'Both'];

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Section 1: Manage Grades */}
      <div className="bg-cyan-100 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Manage Grades</h2>
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-4 mb-2">
            <input
              type="text"
              placeholder="Grade Name"
              className="w-full p-2 border border-gray-300 rounded"
              value={newGradeName}
              onChange={(e) => setNewGradeName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Grade ID (Auto Generated)"
              className="w-full p-2 border border-gray-300 rounded"
              value={editingGrade ? editingGrade.grade_id : (newGradeName ? generateGradeId(newGradeName) : '')}
              readOnly
            />
          </div>
          <button
            onClick={editingGrade ? handleUpdateGrade : handleAddGrade}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            {editingGrade ? 'Update Grade' : 'Add Grade'}
          </button>
          {editingGrade && (
            <button
              onClick={() => { setEditingGrade(null); setNewGradeName(''); }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded ml-2"
            >
              Cancel
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Grade ID</th>
                <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Name</th>
                <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {gradesData.map(grade => (
                <tr key={grade.grade_id}>
                  <td className="py-2 px-4 border-b">{grade.grade_id}</td>
                  <td className="py-2 px-4 border-b">{grade.name}</td>
                  <td className="py-2 px-4 border-b">
                    <button
                      onClick={() => handleEditGrade(grade)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs mr-1"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => handleDeleteGrade(grade.grade_id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Manage Subjects */}
      <div className="bg-blue-100 p-6 rounded-lg shadow-md">
    <h2 className="text-2xl font-bold text-gray-800 mb-4">Manage Subjects</h2>
    <div className="mb-4">
        <div className="grid grid-cols-4 gap-4 mb-2">
            <input
                type="text"
                placeholder="Subject Name"
                className="w-full p-2 border border-gray-300 rounded"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
            />
            <input
                type="text"
                placeholder="Subject ID (Auto Generated)"
                className="w-full p-2 border border-gray-300 rounded"
                value={editingSubject ? editingSubject.subject_id : (newSubjectName ? generateSubjectId(newSubjectName, subjectsData) : '')}
                readOnly
            />
            <input
                type="number"
                placeholder="Fee"
                className="w-full p-2 border border-gray-300 rounded"
                value={newSubjectFee}
                onChange={(e) => setNewSubjectFee(e.target.value)}
            />
            <input
                type="text"
                placeholder="Lecturer's Name"
                className="w-full p-2 border border-gray-300 rounded"
                value={newSubjectLecturer}
                onChange={(e) => setNewSubjectLecturer(e.target.value)}
            />
        </div>
        <button
            onClick={editingSubject ? handleUpdateSubject : handleAddSubject}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
            {editingSubject ? 'Update Subject' : 'Add Subject'}
        </button>
        {editingSubject && (
            <button
                onClick={() => { 
                    setEditingSubject(null); 
                    setNewSubjectName(''); 
                    setNewSubjectFee('');
                    setNewSubjectLecturer('');
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded ml-2"
            >
                Cancel
            </button>
        )}
    </div>
    <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-100">
                <tr>
                    <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Subject ID</th>
                    <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Name</th>
                    <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Fee</th>
                    <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Lecturer</th>
                    <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody>
                {subjectsData.map(subject => (
                    <tr key={subject.subject_id}>
                        <td className="py-2 px-4 border-b">{subject.subject_id}</td>
                        <td className="py-2 px-4 border-b">{subject.name}</td>
                        <td className="py-2 px-4 border-b">{subject.fee}</td>
                        <td className="py-2 px-4 border-b">{subject.lecturer}</td>
                        <td className="py-2 px-4 border-b">
                            <button
                                onClick={() => handleEditSubject(subject)}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs mr-1"
                            >
                                Update
                            </button>
                            <button
                                onClick={() => handleDeleteSubject(subject.subject_id)}
                                className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                            >
                                Delete
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        </div>
      </div>

      {/* Section 3: Manage All Grades in Subjects (Classes) */}
      <div className="bg-green-100 p-6 rounded-lg shadow-md">
  <h2 className="text-2xl font-bold text-gray-800 mb-4">Manage All Grades in Subjects</h2>
  <div className="mb-4">
    <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-2">
      <select
        className="w-full p-2 border border-gray-300 rounded"
        value={newGradeSubjectGradeId}
        onChange={(e) => setNewGradeSubjectGradeId(e.target.value)}
      >
        <option value="">Select Grade</option>
        {grades.map(grade => (
          <option key={grade.value} value={grade.value}>{grade.label}</option>
        ))}
      </select>
      <select
        className="w-full p-2 border border-gray-300 rounded"
        value={newGradeSubjectSubjectId}
        onChange={(e) => setNewGradeSubjectSubjectId(e.target.value)}
      >
        <option value="">Select Subject</option>
        {subjects.map(subject => (
          <option key={subject.value} value={subject.value}>{subject.label}</option>
        ))}
      </select>
      <input
        type="time"
        placeholder="Time"
        className="w-full p-2 border border-gray-300 rounded"
        value={newGradeSubjectTime}
        onChange={(e) => setNewGradeSubjectTime(e.target.value)}
      />
      <select
        className="w-full p-2 border border-gray-300 rounded"
        value={newGradeSubjectDay}
        onChange={(e) => setNewGradeSubjectDay(e.target.value)}
      >
        {daysOfWeek.map(day => (
          <option key={day} value={day}>{day}</option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Lecturer's Name"
        className="w-full p-2 border border-gray-300 rounded"
        value={newGradeSubjectLecturer}
        onChange={(e) => setNewGradeSubjectLecturer(e.target.value)}
      />
      <select
        className="w-full p-2 border border-gray-300 rounded"
        value={newGradeSubjectMode}
        onChange={(e) => setNewGradeSubjectMode(e.target.value)}
      >
        {classModes.map(mode => (
          <option key={mode} value={mode}>{mode}</option>
        ))}
      </select>
      <select
        className="w-full p-2 border border-gray-300 rounded"
        value={newGradeSubjectFee}
        onChange={(e) => setNewGradeSubjectFee(e.target.value)}
        disabled={!newGradeSubjectSubjectId}
      >
        {newGradeSubjectSubjectId ? (
          subjectsData
            .filter(sub => sub.subject_id === newGradeSubjectSubjectId)
            .map(subject => (
              <option key={subject.subject_id} value={subject.fee}>
                Rs. {subject.fee}
              </option>
            ))
        ) : (
          <option value="">Select subject first</option>
        )}
      </select>
      <select
        className="w-full p-2 border border-gray-300 rounded"
        value={newGradeSubjectMedium}
        onChange={(e) => setNewGradeSubjectMedium(e.target.value)}
      >
        {classMediums.map(medium => (
          <option key={medium} value={medium}>{medium}</option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Class Period (e.g., 2 hours)"
        className="w-full p-2 border border-gray-300 rounded"
        value={newGradeSubjectPeriod}
        onChange={(e) => setNewGradeSubjectPeriod(e.target.value)}
      />
    </div>
    <button
      onClick={editingGradeSubject ? handleUpdateGradeSubject : handleAddGradeSubject}
      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
    >
      {editingGradeSubject ? 'Update Class' : 'Add Class'}
    </button>
    {editingGradeSubject && (
      <button
        onClick={() => {
          setEditingGradeSubject(null);
          setNewGradeSubjectGradeId('');
          setNewGradeSubjectSubjectId('');
          setNewGradeSubjectTime('');
          setNewGradeSubjectDay('Monday');
          setNewGradeSubjectLecturer('');
          setNewGradeSubjectMode('Physical');
          setNewGradeSubjectMedium('Sinhala');
          setNewGradeSubjectPeriod('');
          setNewGradeSubjectFee('');
        }}
        className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded ml-2"
      >
        Cancel
      </button>
    )}
  </div>
  <div className="overflow-x-auto">
    <table className="min-w-full bg-white border border-gray-200">
      <thead className="bg-gray-100">
        <tr>
          <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">ID</th>
          <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Grade</th>
          <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Subject</th>
          <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Time</th>
          <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Day</th>
          <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Lecturer</th>
          <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Mode</th>
          <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Medium</th>
          <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Period</th>
          <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Fee</th>
          <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody>
        {gradeSubjects.map(gs => (
          <tr key={gs.class_id}>
            <td className="py-2 px-4 border-b">{gs.class_id}</td>
            <td className="py-2 px-4 border-b">{grades.find(g => g.value === gs.grade_id)?.label}</td>
            <td className="py-2 px-4 border-b">{subjects.find(s => s.value === gs.subject_id)?.label}</td>
            <td className="py-2 px-4 border-b">{gs.time}</td>
            <td className="py-2 px-4 border-b">{gs.day}</td>
            <td className="py-2 px-4 border-b">{gs.lecturer}</td>
            <td className="py-2 px-4 border-b">{gs.mode}</td>
            <td className="py-2 px-4 border-b">{gs.medium || 'Sinhala'}</td>
            <td className="py-2 px-4 border-b">{gs.period || '-'}</td>
            <td className="py-2 px-4 border-b">{gs.fee}</td>
            <td className="py-2 px-4 border-b">
                    <button
                      onClick={() => handleEditGradeSubject(gs)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs mr-1"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => handleDeleteGradeSubject(gs.class_id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4: Manage Courses */}
      <div className="bg-purple-100 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Manage Courses</h2>
        <div className="mb-4">
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-2">
            <input
              type="number"
              placeholder="Course ID"
              className="w-full p-2 border border-gray-300 rounded"
              value={newCourseId}
              onChange={(e) => setNewCourseId(e.target.value)}
            />
            <input
              type="text"
              placeholder="Course Name"
              className="w-full p-2 border border-gray-300 rounded"
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Description"
              className="w-full p-2 border border-gray-300 rounded"
              value={newCourseDescription}
              onChange={(e) => setNewCourseDescription(e.target.value)}
            />
            <input
              type="time"
              placeholder="Time"
              className="w-full p-2 border border-gray-300 rounded"
              value={newCourseTime}
              onChange={(e) => setNewCourseTime(e.target.value)}
            />
            <select
              className="w-full p-2 border border-gray-300 rounded"
              value={newCourseDay}
              onChange={(e) => setNewCourseDay(e.target.value)}
            >
              {daysOfWeek.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Lecturer's Name"
              className="w-full p-2 border border-gray-300 rounded"
              value={newCourseLecturer}
              onChange={(e) => setNewCourseLecturer(e.target.value)}
            />
            <input
              type="number"
              placeholder="Fee"
              className="w-full p-2 border border-gray-300 rounded"
              value={newCourseFee}
              onChange={(e) => setNewCourseFee(e.target.value)}
            />
          </div>
          <button
            onClick={editingCourse ? handleUpdateCourse : handleAddCourse}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            {editingCourse ? 'Update Course' : 'Add Course'}
          </button>
          {editingCourse && (
            <button
              onClick={() => {
                setEditingCourse(null);
                setNewCourseId('');
                setNewCourseName('');
                setNewCourseDescription('');
                setNewCourseTime('');
                setNewCourseDay('Monday');
                setNewCourseLecturer('');
                setNewCourseFee('');
              }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded ml-2"
            >
              Cancel
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Course ID</th>
                <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Name</th>
                <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Description</th>
                <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Time</th>
                <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Day</th>
                <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Lecturer</th>
                <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Fee</th>
                <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coursesData.map(course => (
                <tr key={course.course_id}>
                  <td className="py-2 px-4 border-b">{course.course_id}</td>
                  <td className="py-2 px-4 border-b">{course.name}</td>
                  <td className="py-2 px-4 border-b">{course.description}</td>
                  <td className="py-2 px-4 border-b">{course.time}</td>
                  <td className="py-2 px-4 border-b">{course.day}</td>
                  <td className="py-2 px-4 border-b">{course.lecturer}</td>
                  <td className="py-2 px-4 border-b">{course.fee}</td>
                  <td className="py-2 px-4 border-b">
                    <button
                      onClick={() => handleEditCourse(course)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs mr-1"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.course_id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                    >
                      Delete
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



const AdminDasboard = () => {
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
      case 'Manage Student\'s Data':
        return <ManageStudentsData />;
      case 'View Attendance':
        return <ViewAttendance/>;
      case 'View Payment':
        return <ViewPayment/>;
      case 'View Reports':
        return <ReportsView />;
      case 'Manage Classes':
        return <ManageClassesAndCourses/>;
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
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </header>

      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-1/4 bg-indigo-100 min-h-screen p-4 border-r border-gray-200">
          {/* Welcome Section */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Welcome Admin!</h2>
            <p className="text-gray-600 text-sm">Manage your institution system</p>
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
              title="Manage Student's Data"
              icon={<BsFiles className="w-8 h-8"/>}
              color="blue"
              isActive={activeCard === 'Manage Student\'s Data'}
              onClick={() => handleCardClick('Manage Student\'s Data')}
            />
            <DashboardCard
              title="View Attendance"
              icon={<FaRegCalendarAlt className="w-8 h-8"/>}
              color="purple"
              isActive={activeCard === 'View Attendance'}
              onClick={() => handleCardClick('View Attendance')}
            />
            <DashboardCard
              title="View Payment"
              icon={<RiMoneyDollarCircleLine className="w-8 h-8"/>}
              color="yellow"
              isActive={activeCard === 'View Payment'}
              onClick={() => handleCardClick('View Payment')}
            />
            <DashboardCard
              title="View Reports"
              icon={<TbReportSearch className="w-8 h-8"/>}
              color="red"
              isActive={activeCard === 'View Reports'}
              onClick={() => handleCardClick('View Reports')}
            />
            <DashboardCard
              title="Manage Classes"
              icon={<MdOutlineAccountBalance className="w-8 h-8"/>}
              color="indigo"
              isActive={activeCard === 'Manage Classes'}
              onClick={() => handleCardClick('Manage Classes')}
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

// Updated Dashboard Card Component
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
    yellow: {
      border: 'border-yellow-500',
      text: 'text-yellow-500',
      bg: 'bg-yellow-100'
    },
    red: {
      border: 'border-red-500',
      text: 'text-red-500',
      bg: 'bg-red-100'
    },
    indigo: {
      border: 'border-indigo-500',
      text: 'text-indigo-500',
      bg: 'bg-indigo-100'
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



export default AdminDasboard