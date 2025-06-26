import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getClasses } from '../services/api'; 

const Subjects = () => {
  const [searchParams] = useSearchParams();
  const grade = searchParams.get('grade');
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Color configuration
  const subjectColors = {
    Mathematics: {
      theory: 'bg-blue-100 border-blue-200',
      paper: 'bg-blue-200 border-blue-300'
    },
    Science: {
      theory: 'bg-green-100 border-green-200',
      paper: 'bg-green-200 border-green-300'
    },
    ICT: {
      theory: 'bg-purple-100 border-purple-200',
      paper: 'bg-purple-200 border-purple-300'
    },
    English: {
      theory: 'bg-orange-100 border-orange-200',
      paper: 'bg-orange-200 border-orange-300'
    },
    Art: {
      theory: 'bg-yellow-100 border-yellow-200',
      paper: 'bg-yellow-200 border-yellow-300'
    },
    Civic: {
      theory: 'bg-pink-100 border-pink-200',
      paper: 'bg-pink-200 border-pink-300'
    },
    Commerce: {
      theory: 'bg-cyan-100 border-cyan-200',
      paper: 'bg-cyan-200 border-cyan-300'
    },
    Dancing: {
      theory: 'bg-lime-100 border-lime-200',
      paper: 'bg-lime-200 border-lime-300'
    },
    Drama: {
      theory: 'bg-gray-100 border-gray-200',
      paper: 'bg-gray-200 border-gray-300'
    },
    EnglishLiterature: {
      theory: 'bg-rose-100 border-rose-200',
      paper: 'bg-rose-200 border-rose-300'
    },
    Geography: {
      theory: 'bg-emarald-100 border-emarald-200',
      paper: 'bg-emarald-200 border-emarald-300'
    },
    History: {
      theory: 'bg-violet-100 border-violet-200',
      paper: 'bg-violet-200 border-violet-300'
    },
    Music: {
      theory: 'bg-indigo-100 border-indigo-200',
      paper: 'bg-indigo-200 border-indigo-300'
    },
   Sinhala : {
      theory: 'bg-fuchsia-100 border-fuchsia-200',
      paper: 'bg-fuchsia-200 border-fuchsia-300'
    },
    SinhalaLiterature: {
      theory: 'bg-teal-100 border-teal-200',
      paper: 'bg-teal-200 border-teal-300'
    },
    Tamil : {
      theory: 'bg-red-100 border-red-200',
      paper: 'bg-red-200 border-red-300'
    }
  };

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const classes = await getClasses();
        // Filter classes for the current grade and transform them to match our structure
        const gradeClasses = classes.filter(cls => cls.grade_id === `GR${grade.padStart(2, '0')}`);
        
        const transformedSubjects = gradeClasses.map(cls => ({
          subject: cls.subject_name || cls.subject_id,
          type: cls.mode === 'Online' ? 'theory' : 'paper',
          name: cls.subject_name || cls.subject_id,
          teacher: cls.lecturer,
          day: cls.day,
          time: cls.time,
          medium: cls.medium || 'Sinhala', // Add medium
          period: cls.period || 'Not specified', // Add duration
          mode: cls.mode || 'Physical' // Add mode
        }));
        
        setSubjects(transformedSubjects);
      } catch (error) {
        console.error("Failed to fetch subjects:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (grade) {
      fetchSubjects();
    }
  }, [grade]);

  // Format schedule display
  const formatSchedule = (day, time) => {
    if (!day && !time) return 'Schedule not set';
    const formattedTime = time ? new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', 
      { hour: 'numeric', minute: '2-digit', hour12: true }) : '';
    
    return `${day || 'Day not set'} ${formattedTime}`.trim();
  };

  // Get color classes for subject card
  const getSubjectColor = (subjectName, type) => {
    const baseSubject = subjectName.replace(/ .*/, '');
    return subjectColors[baseSubject]?.[type] || 'bg-gray-100 border-gray-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-xl font-semibold">Loading subjects...</div>
      </div>
    );
  }

  return (
    <div>
      <Navbar active={"/subjects"} />
   
      <div className="min-h-screen bg-blue-50 py-16 px-4">
        <div className="container mx-auto h-full flex flex-col">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-gray-800">
            Grade {grade} Subjects
          </h2>
    
          {subjects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-lg text-gray-600">No subjects found for this grade.</p>
              <p className="text-gray-500">Please add subjects in the management section.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-grow">
              {subjects.map((subject, index) => {
                const colorClasses = getSubjectColor(subject.name, subject.type);
                return (
                  <div
                    key={index}
                    className={`${colorClasses} rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-6 border-l-4`}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex-grow">
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold text-gray-800">{subject.name}</h3>
                          <p className="text-gray-600">
                            <span className="font-medium">Teacher:</span> {subject.teacher || 'Not specified'}
                          </p>
                          <div className="mt-3 p-2 bg-white bg-opacity-50 rounded-lg space-y-2">
                            <p className="text-sm font-medium text-gray-700">
                              <svg className="inline-block w-4 h-4 mr-2 -mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatSchedule(subject.day, subject.time)}
                            </p>
                            <p className="text-sm font-medium text-gray-700">
                              <svg className="inline-block w-4 h-4 mr-2 -mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Duration: {subject.period}
                            </p>
                            <p className="text-sm font-medium text-gray-700">
                              <svg className="inline-block w-4 h-4 mr-2 -mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              Medium: {subject.medium}
                            </p>
                            <p className="text-sm font-medium text-gray-700">
                              <svg className="inline-block w-4 h-4 mr-2 -mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              Mode: {subject.mode}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
                      
          <button
            onClick={() => navigate(-1)}
            className="mt-8 bg-green-100 hover:bg-green-200 text-green-700 px-6 py-3 rounded-lg transition-colors duration-300 font-semibold flex items-center justify-center w-full md:w-auto self-end"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Grades
          </button>
        </div>
      </div>
    </div>
  );
};

export default Subjects;