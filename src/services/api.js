import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081';

// Login function
export const login = async (email, password, userType) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/login`, {
            email,
            password,
            userType
        });
        return response.data;
    } catch (error) {
        console.error("Login error:", error);
        throw error.response?.data || error.message;
    }
};

// Grade functions
export const getGrades = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/grades`);
        return response.data;
    } catch (error) {
        console.error("Error fetching grades:", error);
        throw error;
    }
};

export const addGrade = async (grade) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/grades`, grade);
        return response.data;
    } catch (error) {
        console.error("Error adding grade:", error);
        throw error;
    }
};

export const updateGrade = async (gradeId, gradeData) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/grades/${gradeId}`, gradeData);
        return response.data;
    } catch (error) {
        console.error("Error updating grade:", error);
        throw error;
    }
};

export const deleteGrade = async (gradeId) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/grades/${gradeId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting grade:", error);
        throw error.response?.data || error.message;
    }
};

// Subject functions
export const getSubjects = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/subjects`);
        return response.data;
    } catch (error) {
        console.error("Error fetching subjects:", error);
        throw error;
    }
};

export const addSubject = async (subject) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/subjects`, subject);
        return response.data;
    } catch (error) {
        console.error("Error adding subject:", error);
        throw error;
    }
};

export const updateSubject = async (subjectId, subjectData) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/subjects/${subjectId}`, subjectData);
        return response.data;
    } catch (error) {
        console.error("Error updating subject:", error);
        throw error;
    }
};

export const deleteSubject = async (subjectId) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/subjects/${subjectId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting subject:", error);
        throw error;
    }
};

// Class functions
export const getClasses = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/classes`);
        return response.data;
    } catch (error) {
        console.error("Error fetching classes:", error);
        throw error;
    }
};

export const addClass = async (classData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/classes`, classData);
        return response.data;
    } catch (error) {
        console.error("Error adding class:", error);
        throw error;
    }
};

export const updateClass = async (classId, classData) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/classes/${classId}`, classData);
        return response.data;
    } catch (error) {
        console.error("Error updating class:", error);
        throw error;
    }
};

export const deleteClass = async (classId) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/classes/${classId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting class:", error);
        throw error;
    }
};

// Course functions
export const getCourses = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/courses`);
        return response.data;
    } catch (error) {
        console.error("Error fetching courses:", error);
        throw error;
    }
};

export const addCourse = async (courseData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/courses`, courseData);
        return response.data;
    } catch (error) {
        console.error("Error adding course:", error);
        throw error;
    }
};

export const updateCourse = async (courseId, courseData) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/courses/${courseId}`, courseData);
        return response.data;
    } catch (error) {
        console.error("Error updating course:", error);
        throw error;
    }
};

export const deleteCourse = async (courseId) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/courses/${courseId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting course:", error);
        throw error;
    }
};

// Student registration
export const registerStudent = async (studentData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/students`, studentData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error registering student:", error);
        throw error.response?.data || error.message;
    }
};

export const getNextStudentIdForGrade = async (gradeId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/students/next-id/${gradeId}`);
        return response.data.nextStudentId;
    } catch (error) {
        console.error("Error fetching next student ID:", error);
        throw error.response?.data || error.message;
    }
};

// Generate student QR code
export const generateStudentQRCode = async (studentId) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/students/${studentId}/generate-qr`);
        return response.data;
    } catch (error) {
        console.error("Error generating QR code:", error);
        throw error.response?.data || error.message;
    }
};

export const getStudentQRCode = async (studentId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/students/${studentId}/qrcode`);
        return response.data;
    } catch (error) {
        console.error("Error fetching QR code:", error);
        throw error.response?.data || error.message;
    }
};

export const getStudentById = async (studentId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/students/${studentId}`);
      if (response.data) {
        return response.data;
      }
      throw new Error('Student not found');
    } catch (error) {
      console.error("Error fetching student:", error);
      throw error.response?.data || error.message;
    }
};

export const storeStudentQRImage = async (studentId, qrImageData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/students/${studentId}/qrcode`, { 
            qrImageData 
        });
        return response.data;
    } catch (error) {
        console.error("Error storing QR code image:", error);
        throw error.response?.data || error.message;
    }
};

export const getStudentQRImage = async (studentId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/students/${studentId}/qrcode-image`);
        return response.data;
    } catch (error) {
        console.error("Error fetching QR code image:", error);
        throw error.response?.data || error.message;
    }
};

export const uploadStudentQRImage = async (studentId, qrImage) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/students/${studentId}/upload-qr`, { 
            qrImage 
        });
        return response.data;
    } catch (error) {
        console.error("Error uploading QR code image:", error);
        throw error.response?.data || error.message;
    }
};

// Manage student data
export const getStudents = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/students`);
      return response.data;
    } catch (error) {
      console.error("Error fetching students:", error);
      throw error.response?.data || error.message;
    }
};

export const deleteStudent = async (studentId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/students/${studentId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting student:", error);
      throw error.response?.data || error.message;
    }
};

export const updateStudent = async (studentId, studentData) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/students/${studentId}`, studentData);
        return response.data;
    } catch (error) {
        console.error("Error updating student:", error);
        throw error.response?.data || error.message;
    }
};

// Manage attendance
export const getStudentSubjects = async (studentId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/students/${studentId}/subjects`);
        // Include fee in the response
        const subjectsWithFee = response.data.map(subject => ({
            ...subject,
            fee: subject.fee || 0  // Default to 0 if fee is not provided
        }));
        return subjectsWithFee;
    } catch (error) {
        console.error("Error fetching subjects:", error);
        return [];
    }
};

export const getStudentCourses = async (studentId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/students/${studentId}/courses`);
        return response.data;
    } catch (error) {
        console.error("Error fetching courses:", error);
        return [];
    }
};

export const getStudentClasses = async (studentId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/students/${studentId}/classes`);
        return response.data;
    } catch (error) {
        console.error("Error fetching classes:", error);
        return [];
    }
};

// New attendance functions
export const getAttendanceRecords = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/attendance_records`);
        return response.data;
    } catch (error) {
        console.error("Error fetching attendance records:", error);
        throw error.response?.data || error.message;
    }
};

export const saveAttendanceRecords = async (records) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/attendance_records`, records);
        return response.data;
    } catch (error) {
        console.error("Error saving attendance records:", error);
        throw error.response?.data || error.message;
    }
};

export const deleteAttendanceRecordById = async (recordId) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/attendance_records/${recordId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting attendance record:", error);
        throw error.response?.data || error.message;
    }
};

export const updateAttendanceRecord = async (record) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/attendance_records/${record.id}`, record);
        return response.data;
    } catch (error) {
        console.error("Error updating attendance record:", error);
        throw error.response?.data || error.message;
    }
};

// Payment functions
export const addPaymentRecord = async (invoiceData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/payment_records`, invoiceData);
    return response.data;
  } catch (error) {
    console.error("Error adding payment record:", error);
    throw error;
  }
};

export const updatePaymentRecord = async (invoiceId, updatedData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/payment_records/${invoiceId}`, updatedData);
    return response.data;
  } catch (error) {
    console.error("Error updating payment record:", error);
    throw error;
  }
};

export const deletePaymentRecord = async (invoiceId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/payment_records/${invoiceId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting payment record:", error);
    throw error;
  }
};

export const getPaymentRecords = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/payment_records`);
    return response.data;
  } catch (error) {
    console.error("Error fetching payment records:", error);
    throw error.response?.data || error.message;
  }
};


// Report functions
export const getAttendanceSummary = async (groupBy, timeRange) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/attendance_records/summary`, {
      params: { groupBy, timeRange }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching attendance summary:", error);
    throw error.response?.data || error.message;
  }
};

export const getPaymentSummary = async (groupBy, timeRange) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/payment_records/summary`, {
      params: { groupBy, timeRange }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching payment summary:", error);
    throw error.response?.data || error.message;
  }
};