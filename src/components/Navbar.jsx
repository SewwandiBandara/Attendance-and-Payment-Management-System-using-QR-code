import React, { useState } from 'react';
import { BsList } from "react-icons/bs";
import { FaGraduationCap } from "react-icons/fa";
import { Link } from 'react-router-dom';


const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
    setIsMenuOpen(false); // Close mobile menu after click
  };

  return (
    <div className='fixed w-full bg-sky-400 py-3 z-50 shadow-sm'>
      <div className='container mx-auto flex justify-between items-center px-5'>
        {/* Logo and Mobile Menu Button */}
        <div className='flex items-center'>
          <div className='flex items-center mr-50'>
            <FaGraduationCap className='mr-2 ml-8 text-blue-900' size={40} />
            <span className='font-bold text-3xl bg-gradient-to-r from-blue-800 to-blue-600 text-transparent bg-clip-text font-sans'>Wismin</span>
          </div>
          
          {/* Mobile Menu Button */}
          <button
            className='md:hidden ml-4 text-slate-700'
            onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <BsList className='h-6 w-6' />
          </button>
        </div>

        {/* Desktop Navigation */}
        <div className='hidden md:flex items-center space-x-20 text-white font-semibold '>
          <button 
            onClick={() => scrollToSection('home')}
            className="hover:text-black hover:font-bold  transition-all duration-300 hover:-translate-y-1 hover:underline">
            Home
          </button>
          <button
            onClick={() => scrollToSection('courses')}
            className="hover:text-black hover:font-bold transition-all duration-300 hover:-translate-y-1 hover:underline">
            Classes
          </button>
          <button
            onClick={() => scrollToSection('contact')}
            className="hover:text-black hover:font-bold transition-all duration-300 hover:-translate-y-1 hover:underline">
            Contact us
          </button>
        </div>

        {/* Login Button */}
        <div className='hidden md:flex items-center ml-8'>
          <Link to="/login">
            <button 
              className="border hover:bg-white hover:text-black text-white py-1 px-6 rounded-lg  bg-gradient-to-r from-blue-200 to-blue-500  transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              Login
            </button>
          </Link>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'} bg-slate-800 absolute w-full top-full left-0`}>
        <div className='flex flex-col items-center py-4 space-y-4'>
          <button 
            onClick={() => scrollToSection('home')}
            className="w-full text-center py-2 text-white hover:bg-emerald-600">
            Home
          </button>
          <button
            onClick={() => scrollToSection('courses')}
            className="w-full text-center py-2 text-white hover:bg-emerald-600">
            Classes
          </button>
          <button
            onClick={() => scrollToSection('contact')}
            className="w-full text-center py-2 text-white hover:bg-emerald-600">
            Contact us
          </button>
          <Link to="/login" className="w-full text-center">
            <button 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-1 w-full mx-4"
              onClick={() => setIsMenuOpen(false)}>
              Login
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Navbar;