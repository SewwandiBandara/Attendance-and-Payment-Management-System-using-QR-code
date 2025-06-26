const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const PDFDocument = require('pdfkit');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Secret Key for JWT
const JWT_SECRET = 'sew2002';

// Database Connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "wismin_db"
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    }
    console.log('MySQL Database Connected...');
});

// Test Route
app.get('/', (req, res) => {
    return res.json("From EduSpark backend side");
});

// Login Route
// In the login route (/login), add parent case:
app.post('/login', (req, res) => {
    const { email, password, userType } = req.body;

    if (!email || !password || !userType) {
        return res.status(400).json({ message: "Please provide email, password, and user type." });
    }

    if (userType === 'admin') {
        if (email !== 'Admin123@gmail.com' || password !== 'admin123') {
            const insertFailedLoginSql = "INSERT INTO user_login (email, login_time, status, user_type) VALUES (?, NOW(), 'failed', ?)";
            db.query(insertFailedLoginSql, [email, userType], (err) => {
                if (err) console.error("Error recording failed login:", err);
            });
            return res.status(401).json({ message: "Invalid admin credentials" });
        }
    } else if (userType === 'staff') {
        if (email !== 'Staffuser@gmail.com' || password !== 'staff123') {
            const insertFailedLoginSql = "INSERT INTO user_login (email, login_time, status, user_type) VALUES (?, NOW(), 'failed', ?)";
            db.query(insertFailedLoginSql, [email, userType], (err) => {
                if (err) console.error("Error recording failed login:", err);
            });
            return res.status(401).json({ message: "Invalid staff credentials" });
        }
    } else if (userType === 'student' || userType === 'parent') {
        // Both students and parents use the same credentials from students table
        const sql = "SELECT * FROM students WHERE email = ?";
        db.query(sql, [email], (err, results) => {
            if (err) {
                console.error("Error querying student:", err);
                return res.status(500).json({ message: "Database error" });
            }
            
            if (results.length === 0) {
                // Record failed login attempt
                const insertFailedLoginSql = "INSERT INTO user_login (email, login_time, status, user_type) VALUES (?, NOW(), 'failed', ?)";
                db.query(insertFailedLoginSql, [email, userType], (err) => {
                    if (err) console.error("Error recording failed login:", err);
                });
                return res.status(401).json({ message: "Invalid credentials" });
            }
            
            const student = results[0];
            
            // Compare passwords (assuming plain text comparison for now)
            if (student.password !== password) {
                // Record failed login attempt
                const insertFailedLoginSql = "INSERT INTO user_login (email, login_time, status, user_type) VALUES (?, NOW(), 'failed', ?)";
                db.query(insertFailedLoginSql, [email, userType], (err) => {
                    if (err) console.error("Error recording failed login:", err);
                });
                return res.status(401).json({ message: "Invalid credentials" });
            }
            
            // If we get here, login is successful
            const mockUser = {
                id: student.student_id,
                email: student.email,
                name: `${student.first_name} ${student.last_name}`,
                user_type: userType
            };

            const insertLoginSql = "INSERT INTO user_login (user_id, email, login_time, status, user_type) VALUES (?, ?, NOW(), 'success', ?)";
            db.query(insertLoginSql, [mockUser.id, email, userType], (loginErr) => {
                if (loginErr) {
                    console.error("Error recording login:", loginErr);
                }

                const payload = {
                    user: {
                        id: mockUser.id,
                        email: mockUser.email,
                        name: mockUser.name,
                        userType: mockUser.user_type
                    }
                };

                jwt.sign(
                    payload,
                    JWT_SECRET,
                    { expiresIn: '1h' },
                    (err, token) => {
                        if (err) {
                            console.error("Error signing JWT:", err);
                            return res.status(500).json({ message: "Error generating session token." });
                        }
                        res.json({
                            message: "Login successful!",
                            token: token,
                            user: payload.user
                        });
                    }
                );
            });
        });
        return; // Important to return here since we're handling student login asynchronously
    }

    // For admin and staff (mock users)
    const mockUser = {
        id: userType === 'admin' ? 1 : 2,
        email: email,
        name: userType === 'admin' ? 'Admin User' : 'Staff User',
        user_type: userType
    };

    const insertLoginSql = "INSERT INTO user_login (user_id, email, login_time, status, user_type) VALUES (?, ?, NOW(), 'success', ?)";
    db.query(insertLoginSql, [mockUser.id, email, userType], (loginErr) => {
        if (loginErr) {
            console.error("Error recording login:", loginErr);
        }

        const payload = {
            user: {
                id: mockUser.id,
                email: mockUser.email,
                name: mockUser.name,
                userType: mockUser.user_type
            }
        };

        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) {
                    console.error("Error signing JWT:", err);
                    return res.status(500).json({ message: "Error generating session token." });
                }
                res.json({
                    message: "Login successful!",
                    token: token,
                    user: payload.user
                });
            }
        );
    });
});
// Grade Management Routes
app.get('/grades', (req, res) => {
    const sql = "SELECT * FROM grades";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching grades:", err);
            return res.status(500).json({ message: "Error fetching grades" });
        }
        res.json(results);
    });
});

app.post('/grades', (req, res) => {
    const { grade_id, name } = req.body;
    if (!grade_id || !name) {
        return res.status(400).json({ message: "Grade ID and name are required" });
    }
    
    const sql = "INSERT INTO grades (grade_id, name) VALUES (?, ?)";
    db.query(sql, [grade_id, name], (err, result) => {
        if (err) {
            console.error("Error adding grade:", err);
            return res.status(500).json({ message: "Error adding grade" });
        }
        res.status(201).json({ message: "Grade added successfully", grade_id });
    });
});

app.put('/grades/:id', (req, res) => {
    const grade_id = req.params.id;
    const { name } = req.body;
    
    if (!name) {
        return res.status(400).json({ message: "Grade name is required" });
    }
    
    const sql = "UPDATE grades SET name = ? WHERE grade_id = ?";
    db.query(sql, [name, grade_id], (err, result) => {
        if (err) {
            console.error("Error updating grade:", err);
            return res.status(500).json({ message: "Error updating grade" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Grade not found" });
        }
        res.json({ message: "Grade updated successfully" });
    });
});

app.delete('/grades/:id', (req, res) => {
    const grade_id = req.params.id;
    
    const sql = "DELETE FROM grades WHERE grade_id = ?";
    db.query(sql, [grade_id], (err, result) => {
        if (err) {
            console.error("Error deleting grade:", err);
            return res.status(500).json({ message: "Error deleting grade" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Grade not found" });
        }
        res.json({ message: "Grade deleted successfully" });
    });
});

// Subject Management Routes
app.get('/subjects', (req, res) => {
    const sql = "SELECT * FROM subjects";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching subjects:", err);
            return res.status(500).json({ message: "Error fetching subjects" });
        }
        res.json(results);
    });
});

app.post('/subjects', (req, res) => {
    const { subject_id, name, fee, lecturer } = req.body;
    if (!subject_id || !name || fee === undefined || !lecturer) {
        return res.status(400).json({ message: "Subject ID, name, fee, and lecturer are required" });
    }
    
    const sql = "INSERT INTO subjects (subject_id, name, fee, lecturer) VALUES (?, ?, ?, ?)";
    db.query(sql, [subject_id, name, fee, lecturer], (err, result) => {
        if (err) {
            console.error("Error adding subject:", err);
            return res.status(500).json({ message: "Error adding subject" });
        }
        res.status(201).json({ message: "Subject added successfully", subject_id });
    });
});

app.put('/subjects/:id', (req, res) => {
    const subject_id = req.params.id;
    const { name, fee, lecturer } = req.body;
    
    if (!name || fee === undefined || !lecturer) {
        return res.status(400).json({ message: "Subject name, fee, and lecturer are required" });
    }
    
    const sql = "UPDATE subjects SET name = ?, fee = ?, lecturer = ? WHERE subject_id = ?";
    db.query(sql, [name, fee, lecturer, subject_id], (err, result) => {
        if (err) {
            console.error("Error updating subject:", err);
            return res.status(500).json({ message: "Error updating subject" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Subject not found" });
        }
        res.json({ message: "Subject updated successfully" });
    });
});

app.get('/lecturers', (req, res) => {
    const sql = "SELECT DISTINCT lecturer FROM subjects WHERE lecturer IS NOT NULL";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching lecturers:", err);
            return res.status(500).json({ message: "Error fetching lecturers" });
        }
        res.json(results.map(item => item.lecturer));
    });
});

app.delete('/subjects/:id', (req, res) => {
    const subject_id = req.params.id;
    
    const sql = "DELETE FROM subjects WHERE subject_id = ?";
    db.query(sql, [subject_id], (err, result) => {
        if (err) {
            console.error("Error deleting subject:", err);
            return res.status(500).json({ message: "Error deleting subject" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Subject not found" });
        }
        res.json({ message: "Subject deleted successfully" });
    });
});

// Class Management Routes
app.get('/classes', (req, res) => {
    const sql = `
        SELECT c.*, g.name as grade_name, s.name as subject_name 
        FROM classes c
        JOIN grades g ON c.grade_id = g.grade_id
        JOIN subjects s ON c.subject_id = s.subject_id
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching classes:", err);
            return res.status(500).json({ message: "Error fetching classes" });
        }
        res.json(results);
    });
});

app.post('/classes', (req, res) => {
    const { grade_id, subject_id, time, day, lecturer, mode, fee } = req.body;
    
    if (!grade_id || !subject_id || !time || !day || !lecturer || !mode || fee === undefined) {
        return res.status(400).json({ message: "All class details are required" });
    }
    
    const sql = `
        INSERT INTO classes 
        (grade_id, subject_id, time, day, lecturer, mode, fee) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [grade_id, subject_id, time, day, lecturer, mode, fee];
    
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error adding class:", err);
            return res.status(500).json({ message: "Error adding class" });
        }
        res.status(201).json({ 
            message: "Class added successfully", 
            class_id: result.insertId 
        });
    });
});

app.put('/classes/:id', (req, res) => {
    const class_id = req.params.id;
    const { grade_id, subject_id, time, day, lecturer, mode, fee } = req.body;
    
    if (!grade_id || !subject_id || !time || !day || !lecturer || !mode || fee === undefined) {
        return res.status(400).json({ message: "All class details are required" });
    }
    
    const sql = `
        UPDATE classes 
        SET grade_id = ?, subject_id = ?, time = ?, day = ?, 
            lecturer = ?, mode = ?, fee = ?
        WHERE class_id = ?
    `;
    const values = [grade_id, subject_id, time, day, lecturer, mode, fee, class_id];
    
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error updating class:", err);
            return res.status(500).json({ message: "Error updating class" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Class not found" });
        }
        res.json({ message: "Class updated successfully" });
    });
});

app.delete('/classes/:id', (req, res) => {
    const class_id = req.params.id;
    
    const sql = "DELETE FROM classes WHERE class_id = ?";
    db.query(sql, [class_id], (err, result) => {
        if (err) {
            console.error("Error deleting class:", err);
            return res.status(500).json({ message: "Error deleting class" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Class not found" });
        }
        res.json({ message: "Class deleted successfully" });
    });
});

// Course Management Routes
app.get('/courses', (req, res) => {
    const sql = "SELECT * FROM courses";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching courses:", err);
            return res.status(500).json({ message: "Error fetching courses" });
        }
        res.json(results);
    });
});

app.post('/courses', (req, res) => {
    const { course_id, name, description, time, day, lecturer, fee } = req.body;
    
    if (!course_id || !name || !time || !day || !lecturer || fee === undefined) {
        return res.status(400).json({ message: "All required course details must be provided" });
    }
    
    const sql = `
        INSERT INTO courses 
        (course_id, name, description, time, day, lecturer, fee) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [course_id, name, description, time, day, lecturer, fee];
    
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error adding course:", err);
            return res.status(500).json({ message: "Error adding course" });
        }
        res.status(201).json({ 
            message: "Course added successfully", 
            course_id 
        });
    });
});

app.put('/courses/:id', (req, res) => {
    const course_id = req.params.id;
    const { name, description, time, day, lecturer, fee } = req.body;
    
    if (!name || !time || !day || !lecturer || fee === undefined) {
        return res.status(400).json({ message: "All required course details must be provided" });
    }
    
    const sql = `
        UPDATE courses 
        SET name = ?, description = ?, time = ?, day = ?, 
            lecturer = ?, fee = ?
        WHERE course_id = ?
    `;
    const values = [name, description, time, day, lecturer, fee, course_id];
    
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error updating course:", err);
            return res.status(500).json({ message: "Error updating course" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Course not found" });
        }
        res.json({ message: "Course updated successfully" });
    });
});

app.delete('/courses/:id', (req, res) => {
    const course_id = req.params.id;
    
    const sql = "DELETE FROM courses WHERE course_id = ?";
    db.query(sql, [course_id], (err, result) => {
        if (err) {
            console.error("Error deleting course:", err);
            return res.status(500).json({ message: "Error deleting course" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Course not found" });
        }
        res.json({ message: "Course deleted successfully" });
    });
});

// Student Registration Routes
app.get('/students/next-id/:gradeId', (req, res) => {
    const gradeId = req.params.gradeId;
    
    const sql = "SELECT MAX(student_id) as maxId FROM students WHERE student_id LIKE ?";
    const prefix = `St${gradeId}`;
    
    db.query(sql, [`${prefix}%`], (err, results) => {
        if (err) {
            console.error("Error fetching next student ID:", err);
            return res.status(500).json({ message: "Error generating student ID" });
        }
        
        let nextId;
        if (results[0].maxId) {
            const lastNum = parseInt(results[0].maxId.replace(prefix, '')) || 0;
            nextId = `${prefix}${String(lastNum + 1).padStart(3, '0')}`;
        } else {
            nextId = `${prefix}001`;
        }
        
        res.json({ nextStudentId: nextId });
    });
});

app.post('/students', (req, res) => {
    const {
        student_id,
        first_name,
        last_name,
        grade_id,
        subjects,
        courses,
        password,
        mobile,
        email
    } = req.body;

    if (!student_id || !first_name || !last_name || !grade_id || 
        !Array.isArray(subjects) || !password || !mobile || !email) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    db.beginTransaction(async (err) => {
        if (err) {
            console.error("Transaction error:", err);
            return res.status(500).json({ message: "Database error" });
        }

        try {
            const insertStudentSql = `
                INSERT INTO students 
                (student_id, first_name, last_name, grade_id, password, mobile, email) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            const studentValues = [student_id, first_name, last_name, grade_id, password, mobile, email];
            
            await new Promise((resolve, reject) => {
                db.query(insertStudentSql, studentValues, (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            });

            if (subjects.length > 0) {
                const subjectSql = `
                    INSERT INTO student_subjects 
                    (student_id, subject_id) 
                    VALUES ?
                `;
                const subjectValues = subjects.map(subject_id => [student_id, subject_id]);
                
                await new Promise((resolve, reject) => {
                    db.query(subjectSql, [subjectValues], (err, result) => {
                        if (err) return reject(err);
                        resolve(result);
                    });
                });
            }

            if (courses && courses.length > 0) {
                const courseSql = `
                    INSERT INTO student_courses 
                    (student_id, course_id) 
                    VALUES ?
                `;
                const courseValues = courses.map(course_id => [student_id, course_id]);
                
                await new Promise((resolve, reject) => {
                    db.query(courseSql, [courseValues], (err, result) => {
                        if (err) return reject(err);
                        resolve(result);
                    });
                });
            }

            db.commit((err) => {
                if (err) {
                    console.error("Commit error:", err);
                    return db.rollback(() => {
                        res.status(500).json({ message: "Error saving student data" });
                    });
                }
                res.status(201).json({ 
                    message: "Student registered successfully",
                    studentId: student_id
                });
            });
        } catch (error) {
            db.rollback(() => {
                console.error("Registration error:", error);
                if (error.code === 'ER_DUP_ENTRY') {
                    res.status(409).json({ message: "Student ID already exists" });
                } else {
                    res.status(500).json({ message: "Error registering student" });
                }
            });
        }
    });
});

// Generate Student QR Code Routes
app.get('/students/:id', (req, res) => {
    const studentId = req.params.id;
    
    const sql = `
        SELECT s.student_id, s.first_name, s.last_name, s.mobile, s.password, s.email,
               g.name as grade_name
        FROM students s
        JOIN grades g ON s.grade_id = g.grade_id
        WHERE s.student_id = ?
    `;
    
    db.query(sql, [studentId], (err, results) => {
        if (err) {
            console.error("Error fetching student:", err);
            return res.status(500).json({ message: "Error fetching student data" });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: "Student not found" });
        }
        
        const student = results[0];
        res.json({
            studentId: student.student_id,
            firstName: student.first_name,
            lastName: student.last_name,
            mobile: student.mobile,
            password: student.password,
            email: student.email,
            grade: student.grade_name
        });
    });
});

app.post('/students/:id/generate-qr', (req, res) => {
    const studentId = req.params.id;
    
    const qrData = JSON.stringify({ studentId });
    
    const sql = "UPDATE students SET qr_code_data = ? WHERE student_id = ?";
    db.query(sql, [qrData, studentId], (err, result) => {
        if (err) {
            console.error("Error storing QR code:", err);
            return res.status(500).json({ message: "Error storing QR code" });
        }
        res.json({ qrData });
    });
});

app.get('/students/:id/qrcode', (req, res) => {
    const studentId = req.params.id;
    
    const sql = "SELECT qr_code_data FROM students WHERE student_id = ?";
    db.query(sql, [studentId], (err, results) => {
        if (err) {
            console.error("Error fetching QR code:", err);
            return res.status(500).json({ message: "Error fetching QR code" });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: "Student not found" });
        }
        if (!results[0].qr_code_data) {
            return res.status(404).json({ message: "QR code not generated for this student" });
        }
        
        res.json({ qrData: results[0].qr_code_data });
    });
});

app.post('/students/:id/upload-qr', (req, res) => {
    const studentId = req.params.id;
    const { qrImage } = req.body;
    
    if (!qrImage) {
        return res.status(400).json({ message: "QR image data is required" });
    }
    
    const sql = "UPDATE students SET qr_code_image = ? WHERE student_id = ?";
    db.query(sql, [qrImage, studentId], (err, result) => {
        if (err) {
            console.error("Error storing QR code image:", err);
            return res.status(500).json({ message: "Error storing QR code image" });
        }
        res.json({ message: "QR code image uploaded successfully" });
    });
});

app.get('/students/:id/qrcode-image', (req, res) => {
    const studentId = req.params.id;
    
    const sql = "SELECT qr_code_image FROM students WHERE student_id = ?";
    db.query(sql, [studentId], (err, results) => {
        if (err) {
            console.error("Error fetching QR code image:", err);
            return res.status(500).json({ message: "Error fetching QR code image" });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: "Student not found" });
        }
        if (!results[0].qr_code_image) {
            return res.status(404).json({ message: "QR code image not generated for this student" });
        }
        
        res.json({ qrImage: results[0].qr_code_image });
    });
});

// Manage Student Data Routes
app.get('/students', (req, res) => {
    const sql = `
      SELECT s.*, g.name as grade_name 
      FROM students s
      LEFT JOIN grades g ON s.grade_id = g.grade_id
    `;
    
    db.query(sql, (err, results) => {
      if (err) {
        console.error("Error fetching students:", err);
        return res.status(500).json({ message: "Error fetching students" });
      }
      res.json(results);
    });
});

app.delete('/students/:id', (req, res) => {
    const studentId = req.params.id;
    
    const sql = "DELETE FROM students WHERE student_id = ?";
    db.query(sql, [studentId], (err, result) => {
      if (err) {
        console.error("Error deleting student:", err);
        return res.status(500).json({ message: "Error deleting student" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json({ message: "Student deleted successfully" });
    });
});

app.put('/students/:id', (req, res) => {
    const studentId = req.params.id;
    const { first_name, last_name, grade_id, mobile, email } = req.body;
    
    if (!first_name || !last_name || !grade_id || !mobile || !email) {
        return res.status(400).json({ message: "All student details are required" });
    }
    
    const sql = `
        UPDATE students 
        SET first_name = ?, last_name = ?, grade_id = ?, 
            mobile = ?, email = ?
        WHERE student_id = ?
    `;
    const values = [first_name, last_name, grade_id, mobile, email, studentId];
    
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error updating student:", err);
            return res.status(500).json({ message: "Error updating student" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Student not found" });
        }
        
        const getSql = "SELECT * FROM students WHERE student_id = ?";
        db.query(getSql, [studentId], (err, results) => {
            if (err) {
                console.error("Error fetching updated student:", err);
                return res.json({ message: "Student updated successfully" });
            }
            res.json({ 
                message: "Student updated successfully",
                student: results[0]
            });
        });
    });
});

// Attendance Management Routes
app.get('/students/:id/subjects', (req, res) => {
    const studentId = req.params.id;
    
    const sql = `
        SELECT ss.subject_id, sub.name, sub.fee, sub.lecturer
        FROM student_subjects ss
        JOIN subjects sub ON ss.subject_id = sub.subject_id
        WHERE ss.student_id = ?
    `;
    
    db.query(sql, [studentId], (err, results) => {
        if (err) {
            console.error("Error fetching subjects:", err);
            return res.status(500).json({ message: "Error fetching subjects" });
        }
        res.json(results);
    });
});

app.get('/students/:id/courses', (req, res) => {
    const studentId = req.params.id;
    
    const sql = `
        SELECT sc.course_id, c.name, c.lecturer, c.day, c.time, c.fee
        FROM student_courses sc
        JOIN courses c ON sc.course_id = c.course_id
        WHERE sc.student_id = ?
    `;
    
    db.query(sql, [studentId], (err, results) => {
        if (err) {
            console.error("Error fetching courses:", err);
            return res.status(500).json({ message: "Error fetching courses" });
        }
        res.json(results);
    });
});

app.get('/students/:id/classes', (req, res) => {
    const studentId = req.params.id;
    
    const sql = `
        SELECT c.class_id, g.name as grade_name, s.name as subject_name,
               c.time, c.day, c.lecturer, c.mode, c.fee
        FROM classes c
        JOIN grades g ON c.grade_id = g.grade_id
        JOIN subjects s ON c.subject_id = s.subject_id
        JOIN student_subjects ss ON s.subject_id = ss.subject_id
        WHERE ss.student_id = ?
    `;
    
    db.query(sql, [studentId], (err, results) => {
        if (err) {
            console.error("Error fetching classes:", err);
            return res.status(500).json({ message: "Error fetching classes" });
        }
        res.json(results);
    });
});

app.get('/attendance_records', (req, res) => {
    const sql = `
        SELECT ar.*, s.first_name, s.last_name, g.name as grade_name
        FROM attendance_records ar
        JOIN students s ON ar.student_id = s.student_id
        JOIN grades g ON s.grade_id = g.grade_id
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching attendance records:", err);
            return res.status(500).json({ message: "Error fetching attendance records" });
        }
        res.json(results.map(record => ({
            id: record.id,
            studentId: record.student_id,
            classId: record.class_id,
            classType: record.class_type,
            className: record.class_name,
            date: record.date,
            status: record.status,
            fullName: `${record.first_name} ${record.last_name}`,
            grade: record.grade_name
        })));
    });
});

app.post('/attendance_records', (req, res) => {
    const records = req.body; // Expecting an array of attendance records
    if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ message: "Attendance records array is required" });
    }

    db.beginTransaction((err) => {
        if (err) {
            console.error("Transaction error:", err);
            return res.status(500).json({ message: "Database error" });
        }

        const sql = `
            INSERT INTO attendance_records 
            (student_id, class_id, class_type, class_name, date, status, full_name, grade)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                status = VALUES(status),
                full_name = VALUES(full_name),
                grade = VALUES(grade)
        `;
        
        let inserted = 0;
        let updated = 0;

        records.forEach(record => {
            const values = [
                record.studentId,
                record.classId,
                record.classType,
                record.className,
                record.date,
                record.status,
                record.fullName,
                record.grade
            ];

            db.query(sql, values, (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        console.error("Error saving attendance record:", err);
                        res.status(500).json({ message: "Error saving attendance record" });
                    });
                }
                if (result.insertId) {
                    inserted++;
                } else if (result.affectedRows > 0) {
                    updated++;
                }
            });
        });

        db.commit((err) => {
            if (err) {
                return db.rollback(() => {
                    console.error("Commit error:", err);
                    res.status(500).json({ message: "Error saving attendance records" });
                });
            }
            res.json({
                message: "Attendance records saved successfully",
                inserted,
                updated
            });
        });
    });
});

// Delete attendance record
app.delete('/attendance_records/:id', (req, res) => {
    const recordId = req.params.id;
    
    const sql = "DELETE FROM attendance_records WHERE id = ?";
    db.query(sql, [recordId], (err, result) => {
        if (err) {
            console.error("Error deleting attendance record:", err);
            return res.status(500).json({ message: "Error deleting attendance record" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Attendance record not found" });
        }
        res.json({ message: "Attendance record deleted successfully" });
    });
});

// Update attendance record (for cancel/mark as absent)
app.put('/attendance_records/:id', (req, res) => {
    const recordId = req.params.id;
    const { status } = req.body;
    
    if (!status) {
        return res.status(400).json({ message: "Status is required" });
    }
    
    const sql = "UPDATE attendance_records SET status = ? WHERE id = ?";
    db.query(sql, [status, recordId], (err, result) => {
        if (err) {
            console.error("Error updating attendance record:", err);
            return res.status(500).json({ message: "Error updating attendance record" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Attendance record not found" });
        }
        res.json({ message: "Attendance record updated successfully" });
    });
});

// Payment Management Routes
app.get('/payment_records', async (req, res) => {
    try {
        const sql = `
            SELECT pr.*, s.first_name, s.last_name, 
                   CASE 
                       WHEN pr.class_type = 'subject' THEN sub.name 
                       ELSE c.name 
                   END AS class_name,
                   s.grade_id AS grade
            FROM payment_records pr
            JOIN students s ON pr.student_id = s.student_id
            LEFT JOIN subjects sub ON pr.class_id = sub.subject_id AND pr.class_type = 'subject'
            LEFT JOIN courses c ON pr.class_id = c.course_id AND pr.class_type = 'course'
        `;
        
        db.query(sql, (err, results) => {
            if (err) {
                console.error('Error fetching payment records:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            
            // Format the results to match what the frontend expects
            const formattedResults = results.map(row => ({
                invoice_id: row.invoice_id,
                student_id: row.student_id,
                fullName: `${row.first_name} ${row.last_name}`,
                grade: row.grade,
                class_id: row.class_id,
                class_type: row.class_type,
                class_name: row.class_name,
                amount: row.amount,
                date: row.date,
                status: row.status,
                payment_date: row.payment_date
            }));
            
            res.json(formattedResults);
        });
    } catch (error) {
        console.error('Error fetching payment records:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/payment_records', async (req, res) => {
    const { student_id, invoice_id, class_id, class_type, amount, date, status } = req.body;
    
    if (!student_id || !invoice_id || !class_id || !class_type || !amount || !date) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    try {
        const sql = `
            INSERT INTO payment_records 
            (student_id, invoice_id, class_id, class_type, amount, date, status, payment_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const payment_date = status === 'paid' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;
        
        db.query(sql, [
            student_id,
            invoice_id,
            class_id,
            class_type,
            amount,
            date,
            status,
            payment_date
        ], (err, result) => {
            if (err) {
                console.error('Error adding payment record:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            
            // Return the complete record with student details
            const getSql = `
                SELECT pr.*, s.first_name, s.last_name
                FROM payment_records pr
                JOIN students s ON pr.student_id = s.student_id
                WHERE pr.invoice_id = ?
            `;
            
            db.query(getSql, [invoice_id], (err, results) => {
                if (err || results.length === 0) {
                    console.error('Error fetching new payment record:', err);
                    return res.json({
                        invoice_id,
                        student_id,
                        class_id,
                        class_type,
                        amount,
                        date,
                        status,
                        payment_date,
                        fullName: 'Unknown Student'
                    });
                }
                
                const record = results[0];
                res.json({
                    invoice_id: record.invoice_id,
                    student_id: record.student_id,
                    fullName: `${record.first_name} ${record.last_name}`,
                    grade: '', // You might need to add this
                    class_id: record.class_id,
                    class_type: record.class_type,
                    class_name: '', // You might need to add this
                    amount: record.amount,
                    date: record.date,
                    status: record.status,
                    payment_date: record.payment_date
                });
            });
        });
    } catch (error) {
        console.error('Error adding payment record:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update payment record
app.get('/payment_records/:invoiceId/invoice', (req, res) => {
    const invoiceId = req.params.invoiceId;
    
    // First get the invoice data
    const sql = `
        SELECT pr.*, s.first_name, s.last_name, s.grade_id as grade,
               CASE 
                   WHEN pr.class_type = 'subject' THEN sub.name 
                   ELSE c.name 
               END AS class_name,
               CASE 
                   WHEN pr.class_type = 'subject' THEN sub.fee 
                   ELSE c.fee 
               END AS class_fee
        FROM payment_records pr
        JOIN students s ON pr.student_id = s.student_id
        LEFT JOIN subjects sub ON pr.class_id = sub.subject_id AND pr.class_type = 'subject'
        LEFT JOIN courses c ON pr.class_id = c.course_id AND pr.class_type = 'course'
        WHERE pr.invoice_id = ?
    `;
    
    db.query(sql, [invoiceId], (err, results) => {
        if (err || results.length === 0) {
            console.error('Error fetching invoice:', err);
            return res.status(404).json({ error: 'Invoice not found' });
        }
        
        const invoice = results[0];
        
        // Create a PDF document
        const doc = new PDFDocument({ margin: 50 });
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice_${invoiceId}.pdf`);
        
        // Pipe the PDF to the response
        doc.pipe(res);
        
        // Add invoice content
        doc.fontSize(20).text('EDUSPARK ACADEMY', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text('INVOICE', { align: 'center' });
        doc.moveDown();
        
        // Invoice details
        doc.fontSize(12).text(`Invoice ID: ${invoice.invoice_id}`);
        doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`);
        doc.text(`Status: ${invoice.status.toUpperCase()}`);
        doc.moveDown();
        
        // Student details
        doc.fontSize(14).text('Student Details:', { underline: true });
        doc.fontSize(12).text(`Name: ${invoice.first_name} ${invoice.last_name}`);
        doc.text(`Student ID: ${invoice.student_id}`);
        doc.text(`Grade: ${invoice.grade}`);
        doc.moveDown();
        
        // Payment details
        doc.fontSize(14).text('Payment Details:', { underline: true });
        doc.fontSize(12).text(`Class: ${invoice.class_name} (${invoice.class_type})`);
        doc.text(`Amount: RS ${invoice.amount.toFixed(2)}`);
        doc.text(`Payment Date: ${invoice.payment_date ? new Date(invoice.payment_date).toLocaleDateString() : 'Pending'}`);
        doc.moveDown();
        
        // Terms and conditions
        doc.fontSize(10).text('Terms & Conditions:', { underline: true });
        doc.fontSize(10).text('1. This is a computer generated invoice and does not require a signature.');
        doc.text('2. Please keep this invoice for your records.');
        doc.text('3. For any queries, please contact the academy office.');
        doc.moveDown();
        
        // Footer
        doc.fontSize(10).text('Thank you for your payment!', { align: 'center' });
        doc.text('EDUSPARK ACADEMY', { align: 'center' });
        doc.text('123 Academy Street, Colombo, Sri Lanka', { align: 'center' });
        doc.text('Phone: +94 11 1234567 | Email: info@eduspark.lk', { align: 'center' });
        
        // Finalize the PDF
        doc.end();
    });
});

// Delete payment record
app.delete('/payment_records/:invoiceId', (req, res) => {
    const invoiceId = req.params.invoiceId;
    
    try {
        const sql = "DELETE FROM payment_records WHERE invoice_id = ?";
        
        db.query(sql, [invoiceId], (err, result) => {
            if (err) {
                console.error('Error deleting payment record:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Invoice not found' });
            }
            
            res.json({ success: true });
        });
    } catch (error) {
        console.error('Error deleting payment record:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



//reports functions
// Attendance Summary Report
app.get('/attendance_records/summary', (req, res) => {
  const { groupBy, timeRange } = req.query;
  
  let groupField;
  switch (groupBy) {
    case 'subject':
      groupField = 'ar.class_name';
      break;
    case 'grade':
      groupField = 'g.name';
      break;
    default:
      groupField = 'DATE_FORMAT(ar.date, "%Y-%m")';
  }

  let dateCondition = '';
  if (timeRange === 'month') {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    dateCondition = `WHERE MONTH(ar.date) = ${currentMonth} AND YEAR(ar.date) = ${currentYear}`;
  } else if (timeRange === 'year') {
    const currentYear = new Date().getFullYear();
    dateCondition = `WHERE YEAR(ar.date) = ${currentYear}`;
  }

  const sql = `
    SELECT 
      ${groupField} as name,
      SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as present,
      SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) as absent,
      COUNT(*) as total
    FROM attendance_records ar
    JOIN students s ON ar.student_id = s.student_id
    JOIN grades g ON s.grade_id = g.grade_id
    ${dateCondition}
    GROUP BY ${groupField}
    ORDER BY ${groupField}
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching attendance summary:", err);
      return res.status(500).json({ error: "Error fetching attendance summary" });
    }
    res.json(results);
  });
});

// Payment Summary Report
app.get('/payment_records/summary', (req, res) => {
  const { groupBy, timeRange } = req.query;
  
  let groupField;
  switch (groupBy) {
    case 'subject':
      groupField = 'CASE WHEN pr.class_type = "subject" THEN sub.name ELSE c.name END';
      break;
    case 'grade':
      groupField = 's.grade_id';
      break;
    default:
      groupField = 'DATE_FORMAT(pr.date, "%Y-%m")';
  }

  let dateCondition = '';
  if (timeRange === 'month') {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    dateCondition = `WHERE MONTH(pr.date) = ${currentMonth} AND YEAR(pr.date) = ${currentYear}`;
  } else if (timeRange === 'year') {
    const currentYear = new Date().getFullYear();
    dateCondition = `WHERE YEAR(pr.date) = ${currentYear}`;
  }

  const sql = `
    SELECT 
      ${groupField} as name,
      SUM(CASE WHEN pr.status = 'paid' THEN 1 ELSE 0 END) as paid,
      SUM(CASE WHEN pr.status = 'pending' THEN 1 ELSE 0 END) as pending,
      COUNT(*) as total,
      SUM(CASE WHEN pr.status = 'paid' THEN pr.amount ELSE 0 END) as amount
    FROM payment_records pr
    JOIN students s ON pr.student_id = s.student_id
    LEFT JOIN subjects sub ON pr.class_id = sub.subject_id AND pr.class_type = 'subject'
    LEFT JOIN courses c ON pr.class_id = c.course_id AND pr.class_type = 'course'
    ${dateCondition}
    GROUP BY ${groupField}
    ORDER BY ${groupField}
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching payment summary:", err);
      return res.status(500).json({ error: "Error fetching payment summary" });
    }
    res.json(results);
  });
});




// Start Server
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}...`);
});