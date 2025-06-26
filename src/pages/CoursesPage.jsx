import React, { useEffect, useState } from 'react';
import { getCourses } from '../services/api';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Colors for different course types
  const courseColors = {
    'Default': 'bg-indigo-100 border-blue-200'
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesData = await getCourses();
        setCourses(coursesData);
      } catch (error) {
        console.error("Failed to load courses:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourses();
  }, []);

  // Format schedule display
  const formatSchedule = (day, time) => {
    if (!day && !time) return 'Schedule not set';
    const formattedTime = time ? new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', 
      { hour: 'numeric', minute: '2-digit', hour12: true }) : '';
    
    return `${day || 'Day not set'} ${formattedTime}`.trim();
  };

  // Get color classes for course card
  const getCourseColor = (courseName) => {
    const baseCourse = courseName.split(' ')[0]; // Get first word of course name
    return courseColors[baseCourse] || courseColors['Default'];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-xl font-semibold">Loading courses...</div>
      </div>
    );
  }

  return (
    <div>
      <Navbar active={"/courses"} />
      
      <div className="min-h-screen bg-blue-50 py-20 px-4">
        <div className="container mx-auto h-full flex flex-col">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-gray-800">
            Our Courses
          </h2>
          <p className="text-xl text-blue-600 text-center mb-8">Discover the learning opportunities we offer</p>

          {courses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-lg text-gray-600">No courses found.</p>
              <p className="text-gray-500">Please add courses in the management section.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-grow">
              {courses.map((course, index) => {
                const colorClasses = getCourseColor(course.name);
                return (
                  <div
                    key={index}
                    className={`${colorClasses} rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-6 border-l-4`}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex-grow">
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold text-gray-800">{course.name}</h3>
                          <p className="text-gray-600">
                            <span className="font-medium">Lecturer:</span> {course.lecturer || 'Not specified'}
                          </p>
                          {course.description && (
                            <p className="text-gray-600 text-sm">
                              {course.description}
                            </p>
                          )}
                          <div className="mt-3 p-2 bg-white bg-opacity-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700">
                              <svg className="inline-block w-4 h-4 mr-2 -mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatSchedule(course.day, course.time)}
                            </p>
                            <p className="text-sm font-medium text-gray-700 mt-1">
                              <svg className="inline-block w-4 h-4 mr-2 -mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Fee: Rs. {course.fee?.toFixed(2) || '0.00'}
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
            className="mt-8 bg-green-100 hover:bg-green-200 text-green-700 px-6 py-3 rounded-lg transition-colors duration-300 font-semibold flex items-center justify-center w-full md:w-auto self-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;