import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaUserGraduate, FaCalendarAlt, FaMoneyBillWave } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { 
  getStudentById, 
  getStudentCourses, 
  getStudentSubjects,
  getAttendanceRecords,
  getPaymentRecords
} from '../services/api';

const Student = () => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Memoize user object to prevent re-creation on every render
  const user = useMemo(() => {
    return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
  }, []);

  // Memoized fetch functions
  const fetchStudentDetails = useCallback(async () => {
    try {
      const studentData = await getStudentById(user.id);
      setStudent(studentData);
    } catch (err) {
      setError('Error fetching student details');
      console.error(err);
    }
  }, [user.id]);

  const fetchClassesData = useCallback(async () => {
    try {
      setError('');
      const [subjectsData, coursesData] = await Promise.all([
        getStudentSubjects(user.id),
        getStudentCourses(user.id)
      ]);
      setSubjects(subjectsData || []);
      setCourses(coursesData || []);
    } catch (err) {
      setError('Error fetching classes data');
      console.error(err);
    }
  }, [user.id]);

  const fetchAttendanceData = useCallback(async () => {
    try {
      setError('');
      const records = await getAttendanceRecords();
      const studentRecords = (records || []).filter(record => record.studentId === user.id);
      setAttendanceRecords(studentRecords);
    } catch (err) {
      setError('Error fetching attendance data');
      console.error(err);
    }
  }, [user.id]);

  const fetchPaymentData = useCallback(async () => {
    try {
      setError('');
      const records = await getPaymentRecords();
      const studentRecords = (records || []).filter(record => record.student_id === user.id);
      setPaymentRecords(studentRecords);
    } catch (err) {
      setError('Error fetching payment data');
      console.error(err);
    }
  }, [user.id]);

  // Initial load - fetch student details
  useEffect(() => {
    if (!user || user.userType !== 'student') {
      navigate('/');
      return;
    }
    fetchStudentDetails();
  }, [user, navigate, fetchStudentDetails]);

  // Fetch data when tab changes
  useEffect(() => {
    if (!user || !selectedCard) return;

    switch(selectedCard) {
      case 'Classes':
        fetchClassesData();
        break;
      case 'Attendance':
        fetchAttendanceData();
        break;
      case 'Payment':
        fetchPaymentData();
        break;
      default:
        break;
    }
  }, [selectedCard, user, fetchClassesData, fetchAttendanceData, fetchPaymentData]);

  const handleCardClick = (title) => {
    setSelectedCard(title);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
    navigate('/');
  };

  const renderContent = () => {
    switch(selectedCard) {
      case 'Classes':
        if (error) {
          return <div className="text-red-500 text-center mt-4">{error}</div>;
        }
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Registered Subjects</h2>
            {subjects.length > 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjects.map(subject => (
                    <div key={subject.subject_id} className="bg-white border border-green-100 rounded-lg p-4 shadow-sm">
                      <p className="font-medium text-green-800">{subject.name || 'N/A'}</p>
                      <p className="text-sm text-gray-600">Lecturer: {subject.lecturer || 'N/A'}</p>
                      <p className="text-sm text-gray-600">Fee: RS {(subject.fee || 0).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 bg-white rounded-lg shadow-md p-6">No subjects registered.</p>
            )}

            <h2 className="text-xl font-semibold mb-4">Registered Courses</h2>
            {courses.length > 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.map(course => (
                    <div key={course.course_id} className="bg-white border border-blue-100 rounded-lg p-4 shadow-sm">
                      <p className="font-medium text-blue-800">{course.name || 'N/A'}</p>
                      <p className="text-sm text-gray-600">Lecturer: {course.lecturer || 'N/A'}</p>
                      <p className="text-sm text-gray-600">Day: {course.day || 'N/A'}</p>
                      <p className="text-sm text-gray-600">Time: {course.time || 'N/A'}</p>
                      <p className="text-sm text-gray-600">Fee: RS {(course.fee || 0).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 bg-white rounded-lg shadow-md p-6">No courses registered.</p>
            )}
          </div>
        );
      case 'Payment':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Payment History</h2>
            {error ? (
              <div className="text-red-500 text-center mt-4">{error}</div>
            ) : paymentRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentRecords.map(record => (
                      <tr key={record.invoice_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.invoice_id || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.class_name || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{record.class_type || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.date || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">RS {(record.amount || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            record.status === 'paid' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {record.status || 'N/A'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No payment records found</h3>
                <p className="mt-1 text-gray-500">Your payment history will appear here</p>
              </div>
            )}
          </div>
        );
      case 'Attendance':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Attendance Records</h2>
            {error ? (
              <div className="text-red-500 text-center mt-4">{error}</div>
            ) : attendanceRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendanceRecords.map(record => (
                      <tr key={record.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.className || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{record.classType || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.date || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            record.status === 'present' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {record.status || 'N/A'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0114 0z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No attendance records found</h3>
                <p className="mt-1 text-gray-500">Your attendance records will appear here</p>
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Welcome to Student Dashboard</h2>
            <p className="text-gray-500">Select a menu item to begin</p>
          </div>
        );
    }
  };

  if (!student) {
    return <div className="flex justify-center items-center h-screen">Loading student data...</div>;
  }

  // Calculate stats for the cards
  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const totalPaymentAmount = paymentRecords
    .filter(r => r.status === 'paid')
    .reduce((sum, record) => sum + (record.amount || 0), 0, 0);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-sky-400 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Student Dashboard</h1>
          <button 
            onClick={handleLogout}
            className="bg-white text-sky-800 px-4 py-2 rounded-md font-medium hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        {/* Student Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Student Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-600">Student ID:</p>
              <p className="font-medium">{student.studentId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-600">Name:</p>
              <p className="font-medium">{student.firstName || ''} {student.lastName || ''}</p>
            </div>
            <div>
              <p className="text-gray-600">Grade:</p>
              <p className="font-medium">{student.grade || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-600">Email:</p>
              <p className="font-medium">{student.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-600">Mobile:</p>
              <p className="font-medium">{student.mobile || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div 
            className={`bg-white rounded-lg shadow-md p-4 flex items-center cursor-pointer ${selectedCard === 'Classes' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => handleCardClick('Classes')}
          >
            <div className="bg-sky-100 p-3 rounded-full mr-4">
              <FaUserGraduate className="text-blue-500 text-xl" />
            </div>
            <div>
              <p className="text-gray-600">Registered Subjects</p>
              <p className="text-lg font-semibold">{subjects.length || 0}</p>
            </div>
          </div>

          <div 
            className={`bg-white rounded-lg shadow-md p-4 flex items-center cursor-pointer ${selectedCard === 'Attendance' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => handleCardClick('Attendance')}
          >
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <FaCalendarAlt className="text-green-500 text-xl" />
            </div>
            <div>
              <p className="text-gray-600">Attendance</p>
              <p className="text-lg font-semibold">{presentCount}/{attendanceRecords.length}</p>
            </div>
          </div>

          <div 
            className={`bg-white rounded-lg shadow-md p-4 flex items-center cursor-pointer ${selectedCard === 'Payment' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => handleCardClick('Payment')}
          >
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <FaMoneyBillWave className="text-purple-600 text-xl" />
            </div>
            <div>
              <p className="text-gray-600">Total Payments</p>
              <p className="text-lg font-semibold">RS {(totalPaymentAmount || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        {renderContent()}
      </main>
    </div>
  );
};

export default Student;