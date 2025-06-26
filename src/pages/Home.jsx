import React from 'react';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { MdLocalPhone, MdEmail, MdLocationOn } from 'react-icons/md';
import { FaFacebookF } from 'react-icons/fa';
import homeimg2 from '../assets/homeimg2.jpg'; 

const Home = () => {
  // Array of grades from 6 to 11
  const grades = Array.from({ length: 6 }, (_, index) => 6 + index);
  const navigate = useNavigate();

  // Color variations for grade cards
  const cardColors = [
    'bg-blue-100 hover:bg-blue-200', 
    'bg-green-100 hover:bg-green-200',
    'bg-purple-100 hover:bg-purple-200',
    'bg-orange-100 hover:bg-orange-200',
    'bg-pink-100 hover:bg-pink-200',
    'bg-indigo-100 hover:bg-indigo-200'
  ];

  return (
    <div>
      <Navbar active={"/"}/>

      <div id='home' className='py-4'>
        {/* --- Hero Section with Background Image --- */}
        <div 
          className="min-h-screen flex items-center justify-center px-7 py-10 relative"
          style={{
            backgroundImage: `url(${homeimg2})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Semi-transparent overlay */}
          <div className="absolute inset-0  bg-opacity-40"></div>
          
          {/* Content container with white background and shadow */}
          <div className="w-full max-w-4xl bg-transparent bg-opacity-90 rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-shadow duration-300 relative z-10">
            <div className="space-y-6 text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
                Welcome to Wismin Academy
              </h1>
              <p className="text-lg md:text-xl text-blue-600 font-semibold italic">
                Where Learning Takes Flight! ✨
              </p>
              
              <ul className="list-none space-y-3 text-gray-700 text-lg text-left max-w-3xl mx-auto">
                <li className="flex items-start">
                  📚 <strong className="ml-2">Spark Your Curiosity:</strong> Dive into playful lessons for Grades 6–11
                </li>
                <li className="flex items-start">
                  🚀 <strong className="ml-2">Grow with Genius Guides:</strong> Learn from passionate mentors
                </li>
                <li className="flex items-start">
                  💡 <strong className="ml-2">Brainy Buddies Club:</strong> Team up, create, and share ideas
                </li>
                <li className="flex items-start">
                  🎓 <strong className="ml-2">Future-Ready Fun:</strong> Build skills that shine beyond the classroom through online classes
                </li>
              </ul>
              
              <div className='py-5'>
                <button 
                  onClick={() => navigate('/courses')}
                  className="bg-sky-500 hover:bg-blue-500 text-white px-8 py-3 rounded-lg 
                            text-lg font-semibold transition-all duration-300 transform 
                            hover:scale-105 shadow-md hover:shadow-lg mx-auto">
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Section has grades */}
        <div id="courses" className="py-16 px-4 bg-white">
          <div className="container mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-gray-800">
              Available Grades
            </h2>
            <p className="text-lg text-center text-gray-600 mb-12">
              Select your grade to access relevant classes
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {grades.map((grade, index) => (
                <div 
                  key={grade}
                  className={`${cardColors[index % cardColors.length]} rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-6`}>
                  <div className="text-center">
                    <div className="mb-4">
                      <span className="text-6xl font-bold text-gray-800">{grade}</span>
                      <span className="text-2xl text-gray-600 ml-2">Grade</span>
                    </div>
                    <p className="text-gray-600 mb-4">
                      See time schedule and teacher for {grade}th grade students
                    </p>
                    <button 
                      onClick={() => navigate(`/subjects?grade=${grade}`)} 
                      className="bg-white hover:bg-amber-300 text-gray-800 px-6 py-2 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 transform focus:outline-none focus:ring-2 focus:ring-blue-300">
                      View Subjects →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div id="contact" className="bg-gray-900 text-white py-16 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">Contact Us</h2>
            <p className="text-lg text-center text-gray-400 mb-12 max-w-2xl mx-auto">
              Get in touch with us for any inquiries or support. We're here to help you with your educational journey.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Phone */}
              <div className="text-center p-6 bg-gray-800 rounded-lg hover:bg-gray-700 hover:-translate-y-1 transition-colors duration-300">
                <div className="flex justify-center mb-4">
                  <MdLocalPhone className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Phone</h3>
                <p className="text-gray-400">+94-702017051</p>
              </div>

              {/* Email */}
              <div className="text-center p-6 bg-gray-800 rounded-lg hover:bg-gray-700 hover:-translate-y-1 transition-colors duration-300">
                <div className="flex justify-center mb-4">
                  <MdEmail className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Email</h3>
                <a href="mailto:support@eduspark.com" className="text-blue-400 hover:text-blue-300">
                  support@wismin.com
                </a>
              </div>

              {/* Facebook */}
              <div className="text-center p-6 bg-gray-800 rounded-lg hover:bg-gray-700 hover:-translate-y-1 transition-colors duration-300">
                <div className="flex justify-center mb-4">
                  <FaFacebookF className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Facebook</h3>
                <a
                  href="https://facebook.com/wismin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300"
                >
                  facebook.com/wismin
                </a>
              </div>

              {/* Address */}
              <div className="text-center p-6 bg-gray-800 rounded-lg hover:bg-gray-700 hover:-translate-y-1 transition-colors duration-300">
                <div className="flex justify-center mb-4">
                  <MdLocationOn className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Address</h3>
                <p className="text-gray-400">
                  96/1 Education Street
                  <br />
                  Kandy road, Kurunegala
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home;